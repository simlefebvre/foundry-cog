import { SYSTEM } from "../config/system.mjs"
import { BaseValue } from "./schemas/base-value.mjs"
import { AbilityValue } from "./schemas/ability-value.mjs"
import ActorData from "./actor.mjs"
import Utils from "../helpers/utils.mjs"
import { PROFILE_FAMILY_ALIASES } from "../config/profile.mjs"
import CoChat from "../chat.mjs"

import DefaultConfiguration from "../config/configuration.mjs"
import { Modifier } from "./schemas/modifier.mjs"
export default class CharacterData extends ActorData {
  /** @override */
  static LOCALIZATION_PREFIXES = ["CO.Character"]

  static defineSchema() {
    const fields = foundry.data.fields
    const requiredInteger = { required: true, nullable: false, integer: true }
    const schema = {}

    schema.abilities = new fields.SchemaField(
      Object.values(SYSTEM.ABILITIES).reduce((obj, ability) => {
        obj[ability.id] = new fields.EmbeddedDataField(AbilityValue, { label: ability.label, nullable: false })
        return obj
      }, {}),
    )

    schema.attributes = new fields.SchemaField({
      movement: new fields.EmbeddedDataField(BaseValue, {
        label: "CO.label.long.movement",
        nullable: false,
        initial: { base: 10, unit: "m", bonuses: { sheet: 0, effects: 0 } },
      }),
      level: new fields.NumberField({ ...requiredInteger, initial: 1, min: 0 }),
      encumbrance: new fields.SchemaField({
        value: new fields.NumberField({ ...requiredInteger, initial: 0 }),
        encumbered: new fields.BooleanField({
          required: true,
          initial: false,
        }),
      }),
      hp: new fields.SchemaField(
        {
          base: new fields.NumberField({ ...requiredInteger, initial: 0 }),
          value: new fields.NumberField({ ...requiredInteger, initial: 0 }),
          temp: new fields.NumberField({
            required: true,
            nullable: true,
            initial: null,
            integer: true,
          }),
          max: new fields.NumberField({ ...requiredInteger, initial: 0 }),
          tempmax: new fields.NumberField({
            required: true,
            nullable: true,
            initial: null,
            integer: true,
          }),
          bonuses: new fields.SchemaField({
            sheet: new fields.NumberField({ ...requiredInteger, initial: 0 }),
            effects: new fields.NumberField({ ...requiredInteger, initial: 0 }),
          }),
          lvlGain: new fields.NumberField({ ...requiredInteger, initial: 0 }),
        },
        { label: "CO.label.long.hp", nullable: false },
      ),
      xp: new fields.SchemaField(
        {
          max: new fields.NumberField({ ...requiredInteger, initial: 0 }),
        },
        { label: "CO.label.long.xp", required: true, nullable: false },
      ),
      recovery: new fields.SchemaField({
        dice: new fields.StringField({ required: true, blank: true }),
      }),
      tempDm: new fields.NumberField({ ...requiredInteger, initial: 0, min: 0 }),
    })

    schema.combat = new fields.SchemaField(
      Object.values(SYSTEM.COMBAT).reduce((obj, combat) => {
        const initial = {
          base: 0,
          ability: combat.ability,
          bonuses: {
            sheet: 0,
            effects: 0,
          },
        }
        obj[combat.id] = new fields.EmbeddedDataField(BaseValue, { label: combat.label, nullable: false, initial: initial })
        return obj
      }, {}),
    )

    schema.resources = new fields.SchemaField(
      Object.values(SYSTEM.RESOURCES).reduce((obj, resource) => {
        const initial = {
          base: 0,
          ability: resource.ability,
          bonuses: {
            sheet: 0,
            effects: 0,
          },
        }
        obj[resource.id] = new fields.EmbeddedDataField(BaseValue, { label: resource.label, nullable: false, initial: initial })
        return obj
      }, {}),
    )

    schema.details = new fields.SchemaField({
      biography: new fields.SchemaField({
        private: new fields.HTMLField(),
        public: new fields.HTMLField(),
      }),
      appearance: new fields.SchemaField({
        private: new fields.HTMLField(),
        public: new fields.HTMLField(),
      }),
      notes: new fields.SchemaField({
        private: new fields.HTMLField(),
        public: new fields.HTMLField(),
      }),
      size: new fields.StringField({
        required: false,
        nullable: true,
        initial: "medium",
      }),
      livingStandard: new fields.StringField({
        required: true,
        choices: SYSTEM.LIVING_STANDARDS,
        initial: "modest",
      }),
      languages: new fields.ArrayField(new fields.StringField()),
    })

    // Currencies
    const currencyField = (label) => {
      const schema = {
        value: new fields.NumberField({ required: true, nullable: false, initial: 0, integer: true }),
      }
      return new fields.SchemaField(schema, { label })
    }

    schema.wealth = new fields.SchemaField(
      Object.values(SYSTEM.CURRENCY).reduce((obj, currency) => {
        obj[currency.id] = currencyField(currency.label)
        return obj
      }, {}),
    )

    // Permet de stocker l'ancienne distance de visibilité avant de passer en vision nocturne ou autre, de façon à revenir dessus si on l'enleve (cf fix#141)
    schema.oldDistanceView = new fields.NumberField({ required: true, nullable: false, initial: 0, integer: true, min: 0 })

    // Points de capacités dépensés ailleurs que dans les capacités : pour apprendre une langue, ou éventuel point orphelin
    schema.otherCapacitiesPointsSpent = new fields.NumberField({ required: true, nullable: false, initial: 0, integer: true, min: 0 })

    // UUID des Rencontres-Compagnons dont ce Personnage est le maitre
    schema.companions = new fields.ArrayField(new fields.DocumentUUIDField({ type: "Actor" }))

    return foundry.utils.mergeObject(super.defineSchema(), schema)
  }

  /** @inheritDoc */
  async _preCreate(data, options, user) {
    const allowed = await super._preCreate(data, options, user)
    if (allowed === false) return false

    const updates = {
      prototypeToken: {
        actorLink: true,
        disposition: CONST.TOKEN_DISPOSITIONS.FRIENDLY,
        sight: {
          enabled: true,
          visionMode: "basic",
        },
      },
    }

    const stats = this.parent._stats

    // Pour un acteur non dupliqué, non provenant d'un compendium et non exporté
    if (!stats.duplicateSource && !stats.compendiumSource && !stats.exportSource) {
      // Image par défaut
      if (!foundry.utils.hasProperty(data, "img")) {
        if (SYSTEM.ACTOR_ICONS[this.parent.type]) {
          const img = SYSTEM.ACTOR_ICONS[this.parent.type]
          if (img) updates.img = img
        }
      }

      const sizemodifier = SYSTEM.TOKEN_SIZE[this.details.size]
      // Configuration du prototype token : size et scale
      foundry.utils.mergeObject(updates.prototypeToken, {
        width: sizemodifier.size,
        height: sizemodifier.size,
        texture: {
          scaleX: sizemodifier.scale,
          scaleY: sizemodifier.scale,
        },
      })

      // Objets de départ déclarés par un module de contenu (game.system.CONST.baseItems).
      // Registre vide : aucun objet n'est ajouté, ce qui est le cas nominal d'un monde sans module.
      if (game.system.CONST.baseItems.length > 0) {
        const items = await Promise.all(game.system.CONST.baseItems.map((uuid) => fromUuid(uuid)))
        // The method updateSource will merge the arrays for embedded collections
        updates.items = items.filter((i) => i).map((i) => game.items.fromCompendium(i, { keepId: true, clearFolder: true }))
      }
    }

    this.parent.updateSource(updates)
  }

  /** @inheritDoc */
  async _preUpdate(changes, options, user) {
    if (foundry.utils.hasProperty(changes, "system.attributes.hp.value")) {
      // Cas des points de vie à 1 : statut affaibli
      if (changes.system.attributes.hp.value === 1 && !this.parent.statuses.has("weakened")) {
        if (this.parent.statuses.has("unconscious") && this.parent.getFlag("cog", "statuses.unconsciousFromZeroHP")) {
          await this.parent.toggleStatusEffect("unconscious", { active: false })
          await this.parent.unsetFlag("cog", "statuses.unconsciousFromZeroHP")
        }
        await this.parent.toggleStatusEffect("weakened", { active: true })
        await this.parent.setFlag("cog", "statuses.weakenedFromOneHP", true)
      }

      // Cas des points de vie > 1 : suppression des statuts affaibli et inconscient
      if (changes.system.attributes.hp.value > 1) {
        if (this.parent.statuses.has("weakened") && this.parent.getFlag("cog", "statuses.weakenedFromOneHP")) {
          await this.parent.toggleStatusEffect("weakened", { active: false })
          await this.parent.unsetFlag("cog", "statuses.weakenedFromOneHP")
        }
        if (this.parent.statuses.has("unconscious") && this.parent.getFlag("cog", "statuses.unconsciousFromZeroHP")) {
          await this.parent.toggleStatusEffect("unconscious", { active: false })
          await this.parent.unsetFlag("cog", "statuses.unconsciousFromZeroHP")
        }
      }

      // FIXME Ca ne marche pas
      // Cas des DM temporaires supérieurs au nombre de PV restant
      // PV mis à 0, et si c'est un PNJ c'est la mort
      if (this.isTempDmSuperiorToCurrentHp) {
        if (this.parent.type !== "character") await this.parent.toggleStatusEffect("dead", { active: true })
      }
    }
  }

  get fpFromFamily() {
    const familyId = this.profile?.system.family
    const family = PROFILE_FAMILY_ALIASES[familyId] ?? familyId
    return SYSTEM.FAMILIES[family]?.fp ?? 0
  }

  get currentLevel() {
    return this.attributes.level
  }

  /**
   * Retrieves the main profile item from the items array.
   *
   * @returns {Object|undefined} The main profile item if found, otherwise undefined.
   */
  get profile() {
    return this.parent.items.find((item) => item.type === SYSTEM.ITEM_TYPE.profile.id && item.system.mainProfile)
  }

  /**
   * Checks if the character's profile belongs to the "mage" family.
   *
   * @returns {boolean} Returns true if the profile exists and its system family is "mage"; otherwise, false.
   */
  get hasProfileReflexionFamily() {
    const profile = this.profile
    const family = PROFILE_FAMILY_ALIASES[profile?.system.family] ?? profile?.system.family
    return family === "reflexion"
  }

  /**
   * Returns the highest living standard granted by a cultural path, falling back to the actor's own value.
   * @returns {string} The effective living standard identifier.
   */
  get livingStandard() {
    const culturalPaths = this.parent.paths.filter((path) => path.system.subtype === SYSTEM.PATH_TYPES.culture.id)
    return culturalPaths.reduce((highest, path) => {
      const currentRank = SYSTEM.LIVING_STANDARD_RANK[path.system.livingStandard] ?? -1
      const highestRank = SYSTEM.LIVING_STANDARD_RANK[highest] ?? -1
      return currentRank > highestRank ? path.system.livingStandard : highest
    }, this.details.livingStandard)
  }

  prepareDerivedData() {
    super.prepareDerivedData()

    this._prepareAbilities()

    this._prepareHPMax()

    this._prepareMovement()

    // Préparation des données de combat : Attaque de contact, attaque à distance, attaque magique, initiative, défense
    for (const [key, skill] of Object.entries(this.combat)) {
      if (key === SYSTEM.COMBAT.crit.id || key === SYSTEM.COMBAT.dr.id) {
        continue
      }
      // Somme du bonus de la feuille et du bonus des actives effects
      const bonuses = Object.values(skill.bonuses).reduce((prev, curr) => prev + curr)
      const abilityBonus = this.abilities[skill.ability].value

      if ([SYSTEM.COMBAT.melee.id, SYSTEM.COMBAT.ranged.id, SYSTEM.COMBAT.magic.id].includes(key)) {
        this._prepareAttack(key, skill, abilityBonus, bonuses)
      }

      if (key === SYSTEM.COMBAT.init.id) {
        this._prepareInit(skill, abilityBonus, bonuses)
      }

      if (key === SYSTEM.COMBAT.def.id) {
        this._prepareDef(skill, abilityBonus, bonuses)
      }
    }

    this._prepareCrit()

    this._prepareDR()

    for (const [key, skill] of Object.entries(this.resources)) {
      // Somme du bonus de la feuille et du bonus des actives effects
      const bonuses = Object.values(skill.bonuses).reduce((prev, curr) => prev + curr)

      // Points de chance  - Fortune Points - FP
      if (key === SYSTEM.RESOURCES.fortune.id) {
        this._prepareFP(skill, bonuses)
      }
    }

    // XP dépensés dans les capacités des voies
    // Un personnage a 3 points de capacités au niveau 1, et 2 points de capacités par niveau supplémentaire
    // Un personnage avec un profil de la famille des mages a un point de capacité supplémentaire au niveau 1
    this.attributes.xp.max = 3 + 2 * (this.attributes.level - 1) + (this.hasProfileReflexionFamily ? 1 : 0)
    // His._prepareVision()
  }

  /**
   * Calcule la valeur et le mod des caractéristiques <br/>
   *              Valeur = base + bonus + modificateurs <br/>
   *              bonus est à la somme du bonus de la fiche et du champ dédié aux Active Effets <br/>
   *              modificateurs est la somme de tous les modificateurs modifiant la caractéristique, quelle que soit la source
   */
  _prepareAbilities() {
    for (const [key, ability] of Object.entries(this.abilities)) {
      // Somme du bonus de la feuille et du bonus des actives effects
      const bonuses = Object.values(ability.bonuses).reduce((prev, curr) => prev + curr)
      const abilityModifiers = this.computeTotalModifiersByTarget(this.abilityModifiers, key)

      // Prise en compte d'un modifier qui donne un dé bonus
      if (this.bonusDiceModifiers) {
        let bonusDice = this.bonusDiceModifiers.find((m) => m.target === key)
        if (bonusDice) {
          ability.superior = true
        }
      }

      ability.modifiers = abilityModifiers.total

      ability.value = ability.base + bonuses + ability.modifiers
      ability.tooltipValue = Utils.getTooltip(Utils.getAbilityName(key), ability.base).concat(abilityModifiers.tooltip, Utils.getTooltip("Bonus", bonuses))
    }

    // Cas particulier de l'agilité : la valeur maximum est définie par l'armure. La formule est : le max est 8 - DEF de l'armure
    let maxAgility = 8
    let armors = this.parent.equippedArmors
    if (armors) {
      // Défense de la première armure équipée
      const armor = armors[0]
      if (armor) {
        const defense = armor.system.defense
        maxAgility = 8 - defense
      }
      if (this.abilities.dex.value > maxAgility) {
        this.abilities.dex.value = Math.min(this.abilities.dex.value, maxAgility)
        this.abilities.dex.tooltipValue = this.abilities.dex.tooltipValue.concat(Utils.getTooltip("Max armure", maxAgility))
      }
    }
  }

  _prepareHPMax() {
    const hpMaxBonuses = Object.values(this.attributes.hp.bonuses).reduce((prev, curr) => prev + curr)
    const hpMaxModifiers = this.computeTotalModifiersByTarget(this.attributeModifiers, "hp")
    const nbProfiles = this.parent.items.filter((item) => item.type === SYSTEM.ITEM_TYPE.profile.id).length
    const constitutionBonus = this.attributes.level * Math.max(0, this.abilities.con.value)

    // Sans profil, les PV sont calculés à partir de la Constitution à chaque niveau.
    if (nbProfiles === 0) {
      this.attributes.hp.base = 0
      this.attributes.hp.max = this.attributes.hp.base + constitutionBonus + hpMaxBonuses + hpMaxModifiers.total

      this.attributes.hp.tooltip = Utils.getTooltip("Base ", this.attributes.hp.base).concat(
        Utils.getTooltip(Utils.getAbilityName("con"), constitutionBonus),
        hpMaxModifiers.tooltip,
        Utils.getTooltip("Bonus", hpMaxBonuses),
      )
    } else if (nbProfiles === 1) {
      // Le dé de vie est défini par la famille du profil (champ recoveryDice).
      // La valeur hp de la famille correspond à sa vigueur par niveau, utilisée par l'ancien calcul.
      const hitDie = this.hd
      const hitDieFaces = hitDie ? Number(hitDie.slice(1)) : 0

      // La base représente les PV du niveau 1 : Constitution + faces du dé de vie.
      // On la conserve ensuite ; les gains des niveaux suivants seront stockés dans lvlGain.
      if (this.attributes.level <= 1 || this.attributes.hp.base === 0) this.attributes.hp.base = this.abilities.con.value + hitDieFaces

      this.attributes.hp.max = this.attributes.hp.base + hpMaxBonuses + hpMaxModifiers.total + this.attributes.hp.lvlGain

      this.attributes.hp.tooltip = Utils.getTooltip("Base (CON niv. 1 + DV) ", this.attributes.hp.base).concat(
        hpMaxModifiers.tooltip,
        Utils.getTooltip("Bonus", hpMaxBonuses),
        Utils.getTooltip("Gain de niveau", this.attributes.hp.lvlGain),
      )
    } else {
      // TODO : rétablir le calcul des PV pour les personnages ayant plusieurs profils.
      /*
      const tooltipBase = Utils.getTooltip("Base", this.attributes.hp.base)

      this.attributes.hp.max = this.attributes.hp.base + constitutionBonus + hpMaxBonuses + hpMaxModifiers.total
      this.attributes.hp.tooltip = tooltipBase.concat(
        Utils.getTooltip(Utils.getAbilityName("con"), constitutionBonus),
        hpMaxModifiers.tooltip,
        Utils.getTooltip("Bonus", hpMaxBonuses),
      )
      */
    }

    // Les PV actuels ne peuvent pas dépasser le maximum calculé.
    if (this.attributes.hp.value > this.attributes.hp.max) this.attributes.hp.value = this.attributes.hp.max
  }

  _prepareMovement() {
    const movementModifiers = this.computeTotalModifiersByTarget(this.attributeModifiers, "mov")
    this.attributes.movement.value = this.attributes.movement.base + this.attributes.movement.bonuses.sheet + this.attributes.movement.bonuses.effects + movementModifiers.total
  }

  /**
   * Permet de savoir si le personnage a un modifier lui attribuant la vision dans le noir
   */
  get hasDarkVisionModifier() {
    let modifiersVision = this.stateModifiers.find((m) => m.target === "darkvision")
    return modifiersVision !== undefined && modifiersVision !== null
  }

  /**
   * Permet de savoir si le personnage a DarkVision activé
   */
  get hasDarkVisionActivated() {
    return this.parent.prototypeToken.sight?.visionMode === "darkvision"
  }

  /**
   * On regarde si un modifier modifie la vision et on l'active / désactive selon l'appuie sur le bouton toggle de la fiche de perso
   * @param {boolean} active Active (tue) ou désactive (false) la vision dans le noir
   */
  async toggleDarkVision(active) {
    const modifiers = this.stateModifiers
    if (!modifiers) return { total: 0, tooltip: "" }
    let currentactor = this.parent
    let modifiersVision = modifiers.find((m) => m.target === "darkvision")
    if (modifiersVision && !this.hasDarkVisionActivated && active) {
      // On stock l'ancinne valeur de distance (cf fix#141)
      this.oldDistanceView = this.parent.prototypeToken.sight.range
      this.parent?.update({ "system.oldDistanceView": this.oldDistanceView })
      const prototypeToken = {}
      Object.assign(prototypeToken, {
        sight: { enabled: true, visionMode: "darkvision", range: modifiersVision.value, saturation: -1 },
        actorLink: true,
        disposition: 1,
      })
      this.parent?.update({ prototypeToken: prototypeToken })
      let targets = this.parent.getActiveTokens(true, true)
      for (let i = 0; i < targets.length; i++) {
        let sight = {}
        Object.assign(sight, { enabled: true, visionMode: "darkvision", range: modifiersVision.value, saturation: -1 })
        targets[i].updateSource({ sight })
      }
    }

    // Inversement on le desactive
    if (!active && this.hasDarkVisionActivated) {
      // On le retire
      const prototypeToken = {}
      Object.assign(prototypeToken, {
        sight: { enabled: true, visionMode: "basic", range: this.oldDistanceView, saturation: 0 },
        actorLink: true,
        disposition: 1,
      })
      this.parent?.update({ prototypeToken: prototypeToken })
      let targets = this.parent.getActiveTokens(true, true)
      for (let i = 0; i < targets.length; i++) {
        let sight = {}
        Object.assign(sight, { enabled: true, visionMode: "basic", range: this.oldDistanceView, saturation: 0 })
        targets[i].updateSource({ sight })
      }
    }
  }

  /**
   * Calcul les scores de combat melee/distance/magique
   * @param {*} key clef dans la table des attributs : 'melee', 'ranged', 'magic'
   * @param {*} skill Element pour lequel on calcul la valeur et le tooltip (ex : combat.melee combat.ranged, combat.magic)
   * @param {*} abilityBonus Bonus accordé par l'attribut (ex : bonus d'agilité)
   * @param {*} bonuses Autres bonus (customeffect par ex)
   */
  _prepareAttack(key, skill, abilityBonus, bonuses) {
    const usesProgression = [SYSTEM.COMBAT.melee.id, SYSTEM.COMBAT.ranged.id].includes(key)
    const attackBase = usesProgression ? Math.max(0, Math.min(skill.base, 6)) : Math.min(this.attributes.level, 10)
    const combatModifiers = this.computeTotalModifiersByTarget(this.combatModifiers, key)

    skill.base = usesProgression ? attackBase : abilityBonus + attackBase
    const baseLabel = game.i18n.localize(usesProgression ? "CO.label.long.base" : "CO.label.long.level")
    skill.tooltipBase = Utils.getTooltip(baseLabel, attackBase).concat(Utils.getTooltip(Utils.getAbilityName(skill.ability), abilityBonus))

    skill.value = attackBase + abilityBonus + bonuses + combatModifiers.total
    skill.tooltipValue = skill.tooltipBase.concat(combatModifiers.tooltip, Utils.getTooltip("Bonus", bonuses))
  }

  /**
   * Dans COF : 10 + PER + Bonus Capacités
   * @param {*} skill
   * @param {*} abilityBonus
   * @param {*} bonuses
   */
  _prepareInit(skill, abilityBonus, bonuses) {
    const initModifiers = this.computeTotalModifiersByTarget(this.combatModifiers, SYSTEM.COMBAT.init.id)

    skill.base = DefaultConfiguration.baseInitiative()
    skill.tooltipBase = Utils.getTooltip("Base", skill.base)

    skill.base += abilityBonus
    skill.tooltipBase = skill.tooltipBase.concat(Utils.getTooltip(Utils.getAbilityName(skill.ability), abilityBonus))

    skill.value = skill.base + bonuses + initModifiers.total
    skill.tooltipValue = skill.tooltipBase.concat(initModifiers.tooltip, Utils.getTooltip("Bonus", bonuses))
  }

  /**
   * Calcule la défense
   * Dans COF : 10 + AGILITE + Modificateurs (Bonus Armure + Bonus Bouclier + Bonus Capacités)
   * @param {*} skill
   * @param {*} abilityBonus
   * @param {*} bonuses
   */
  _prepareDef(skill, abilityBonus, bonuses) {
    const defModifiers = this.computeTotalModifiersByTarget(this.combatModifiers, SYSTEM.COMBAT.def.id)

    skill.base = DefaultConfiguration.baseDefense()
    skill.tooltipBase = Utils.getTooltip("Base", skill.base)

    skill.base += abilityBonus
    skill.tooltipBase = skill.tooltipBase.concat(Utils.getTooltip(Utils.getAbilityName(skill.ability), abilityBonus))

    skill.value = skill.base

    // Ajout du bonus de l'armure
    const armorDef = this.parent.defenseFromArmor
    if (armorDef > 0) {
      skill.value += armorDef
      skill.tooltipBase = skill.tooltipBase.concat(Utils.getTooltip("Armure", armorDef))
    }

    // Ajout du bonus du bouclier
    const shieldDef = this.parent.defenseFromShield
    if (shieldDef > 0) {
      skill.value += shieldDef
      skill.tooltipBase = skill.tooltipBase.concat(Utils.getTooltip("Bouclier", shieldDef))
    }

    skill.value += bonuses + defModifiers.total
    skill.tooltipValue = skill.tooltipBase.concat(defModifiers.tooltip, Utils.getTooltip("Bonus", bonuses))
  }

  /**
   * Calcule la valeur du critique en ajoutant les bonus
   * Un bonus de 1 au critique donne une valeur de 19 au lieu de 20
   * La valeur minimum est 16
   */
  _prepareCrit() {
    this.combat.crit.base = SYSTEM.BASE_CRITICAL
    this.combat.crit.tooltipValue = Utils.getTooltip("Base", this.combat.crit.base)

    // Somme des bonus des modifiers
    const critModifiers = this.computeTotalModifiersByTarget(this.combatModifiers, SYSTEM.COMBAT.crit.id)

    if (critModifiers.total > 0) {
      this.combat.crit.value = Math.max(16, SYSTEM.BASE_CRITICAL - critModifiers.total)
      this.combat.crit.tooltipValue += Utils.getTooltip("Bonus", critModifiers.tooltip)
    } else {
      this.combat.crit.value = this.combat.crit.base
    }
  }

  /**
   * Calcule la valeur de la résistance aux dommages en ajoutant les bonus
   */
  _prepareDR() {
    this.combat.dr.base = 0
    this.combat.dr.tooltipBase = Utils.getTooltip("Base", 0)

    // Somme des bonus des modifiers
    const drModifiers = this.computeTotalModifiersByTarget(this.combatModifiers, SYSTEM.COMBAT.dr.id)

    // Somme du bonus de la feuille et du bonus des actives effects
    const bonuses = Object.values(this.combat.dr.bonuses).reduce((prev, curr) => prev + curr)
    this.combat.dr.value = this.combat.dr.base + bonuses + drModifiers.total
    this.combat.dr.tooltipValue = this.combat.dr.tooltipBase.concat(drModifiers.tooltip, Utils.getTooltip("Bonus", bonuses))
  }

  /**
   * Calcule les points de chance
   * Dans COF : 2 + CHARISME + Modificateurs
   * Prepares the FP (Fortune Points) for a given skill by calculating its base value,
   * applying bonuses, and computing resource modifiers.
   *
   * @param {Object} skill The skill object to prepare FP for.
   * @param {number} bonuses The additional bonuses to apply to the skill's FP.
   */
  _prepareFP(skill, bonuses) {
    const baseFP = this._computeBaseFP()
    skill.base = baseFP.value
    skill.tooltipBase = baseFP.tooltip

    const resourceModifiers = this.computeTotalModifiersByTarget(this.resourceModifiers, SYSTEM.MODIFIERS_TARGET.fp.id)
    skill.max = skill.base + bonuses + resourceModifiers.total
    skill.value = Math.min(skill.max, skill.value) // On ne depasse pas le max
    skill.tooltip = skill.tooltipBase.concat(resourceModifiers.tooltip, Utils.getTooltip("Bonus", bonuses))
  }

  /**
   * Computes the base FP (Force Points) for the character.
   *
   * The base FP is calculated as the sum of a base value (2), the character's charisma ability value,
   * and any additional FP from the character's family.
   * 2 + Charisma MOD + 1 (for the adventurer's family).
   *
   * @returns {Object} An object containing:
   *   - `value` {number}: The computed base FP value.
   *   - `tooltip` {string}: A tooltip string providing details on the components of the base FP.
   */
  _computeBaseFP() {
    const abilityBonus = this.abilities[this.resources.fortune.ability].value
    const baseFP = DefaultConfiguration.baseFortune()
    const value = baseFP + abilityBonus + this.fpFromFamily
    let tooltip = Utils.getTooltip("Base", baseFP)
    tooltip = tooltip.concat(Utils.getTooltip(Utils.getAbilityName(this.resources.fortune.ability), this.abilities.cha.value))
    if (this.fpFromFamily > 0) tooltip = tooltip.concat(Utils.getTooltip("Profil", this.fpFromFamily))
    return { value, tooltip }
  }

  // #region accesseurs

  /**
   * Retrieves a list of spell items from the character's inventory : item of type capacity with property spell at true
   *
   * @returns {Array} An array of items that are of type 'CAPACITY' and are spells.
   */
  get spells() {
    return this.parent.items.filter((item) => item.type === SYSTEM.ITEM_TYPE.capacity.id && item.system.isSpell && item.system.learned)
  }

  /**
   * Checks if the character has any spells.
   *
   * @returns {boolean} True if the character has spells, otherwise false.
   */
  get hasSpells() {
    return this.spells.length > 0
  }

  /**
   * Gets the number of spells : item of type capacity with property spell at true
   *
   * @returns {number} The number of spells.
   */
  get nbSpells() {
    return this.spells.length
  }

  /**
   * Gets the hit dice (hd) for the character : it's the recovery dice value from the character's profile
   *
   * @returns {number|undefined} The recovery dice value from the character's profile system, or undefined if not available.
   */
  get hd() {
    return this.profile?.system.recoveryDice ?? undefined
  }

  /**
   * Retourne Toutes les actions visibles des capacités et des équipements sous forme d'un tableau d'actions
   */
  async getVisibleActions() {
    let allActions = []
    for (const item of this.parent.items) {
      if ([SYSTEM.ITEM_TYPE.equipment.id, SYSTEM.ITEM_TYPE.capacity.id].includes(item.type) && item.actions.length > 0) {
        const itemActions = await item.getVisibleActions()
        allActions.push(...itemActions)
      }
    }
    return allActions
  }

  // #endregion

  /**
   * Construit la formule de soin d'un repos : un dé de vie lancé, la Constitution, le niveau et les modificateurs.
   *
   * @returns {string} La formule de soin (ex. "1d8 + 2 + 3").
   */
  getRecoveryHealFormula() {
    const hd = this.hd
    const constitution = this.abilities.con.value
    const level = this.attributes.level
    let formula = `${hd} + ${constitution} + ${level}`
    const recoveryModifiers = this.computeTotalModifiersByTarget(this.attributeModifiers, "recoveryFull", true)
    if (recoveryModifiers.total !== 0 && recoveryModifiers.total !== "") {
      formula = `${formula} + ${recoveryModifiers.total}`
    }
    return formula
  }

  /**
   * Point d'extension asynchrone de la récupération. Émet le hook `cog.preUseRecovery` et attend les
   * gardes enregistrées par d'éventuels modules (même mécanisme async que `cog.preActivateAction`).
   *
   * Un module qui souhaite **remplacer** le soin du repos (son propre dialogue, son soin, d'éventuelles
   * ressources propres) enregistre une garde — via `guard(promise)` —
   * dont la promesse résout sur `true` : le système saute alors son flux par défaut (repos + soin).
   * Toute autre valeur (ou aucune garde) laisse le repos standard s'exécuter.
   *
   * Pour seulement **ajouter** au soin, préférer le modificateur `recoveryFull` ;
   * pour **réagir après** la récupération, écouter le hook `cog.postUseRecovery`.
   * (Ex. de consommateur : le module cof2-compagnon, fenêtre de récupération PV/PE.)
   *
   * @returns {Promise<boolean>} true si un module a pris en charge la récupération à la place du système.
   */
  async _isRecoveryHandledByModule() {
    const guards = []
    Hooks.callAll("cog.preUseRecovery", this.parent, { isFullRest: true, guard: (p) => guards.push(Promise.resolve(p)) })
    if (guards.length === 0) return false
    return (await Promise.all(guards)).some((v) => v === true)
  }

  /**
   * Gère le repos d'un personnage et applique systématiquement la récupération complète.
   *
   * @returns {Promise<void>} Une promesse qui se résout lorsque le processus de récupération est terminé.
   */
  async useRecovery() {
    await this.recoverCapacityCharges()
    await this.parent.update({ "system.attributes.tempDm": 0 })

    if (await this._isRecoveryHandledByModule()) return

    const formula = this.getRecoveryHealFormula()
    await this.parent.rollHeal(null, {
      actionName: game.i18n.format("CO.ui.rest"),
      healFormula: formula,
      targetType: SYSTEM.RESOLVER_TARGET.self.id,
      targets: [this.parent],
    })

    Hooks.callAll("cog.postUseRecovery", this.parent, { isFullRest: true })
  }

  /**
   * Recharge les charges d'utilisation des capacités lors d'un repos.
   */
  async recoverCapacityCharges() {
    const capacities = this.parent.capacities
    if (capacities.length !== 0) {
      // TODO Optimiser pour faire un seul update à la fin
      for (const capacity of capacities) {
        if (capacity.system.frequency === SYSTEM.CAPACITY_FREQUENCY.daily.id) {
          capacity.system.charges.current = capacity.system.charges.max
          await capacity.update({ "system.charges.current": capacity.system.charges.current })
        }
        // Une fréquence de combat est rechargée à chaque récupération
        if (capacity.system.frequency === SYSTEM.CAPACITY_FREQUENCY.combat.id) {
          capacity.system.charges.current = capacity.system.charges.max
          await capacity.update({ "system.charges.current": capacity.system.charges.current })
        }
      }
    }
  }

  /**
   * Calculates the total experience points (XP) spent by the character.
   *
   * This function iterates through the character's paths and their associated capacities,
   * summing up the XP cost of each learned capacity. It also includes capacities that are
   * not associated with any paths.
   * It as the otherCapacitiesPointsSpent value
   *
   * @returns {Promise<number>} The total XP spent by the character.
   */
  async getSpentXP() {
    const paths = this.parent.paths
    let xp = 0

    // Capacités des voies
    for (const path of paths) {
      const capacities = path.system.capacities
      for (const [index, capacityUuid] of capacities.entries()) {
        const { id } = foundry.utils.parseUuid(capacityUuid)
        const capacity = this.parent.items.get(id)
        if (capacity && capacity.system.learned) xp += capacity.system.getXpCost()
      }
    }

    // Capacités hors voies
    const capacities = this.parent.capacitiesOffPaths
    for (const capacity of capacities) {
      if (capacity.system.learned) xp += capacity.system.getXpCost()
    }

    // Ajout des points de capacités dépensés ailleurs que dans les capacités
    xp += this.otherCapacitiesPointsSpent

    return xp
  }

  /**
   * Asynchronously calculates the available experience points (XP) for a character.
   *
   * @returns {Promise<number>} A promise that resolves to the available XP.
   */
  async getAvailableXP() {
    const spentXP = await this.getSpentXP()
    return this.attributes.xp.max - spentXP
  }

  // Parcourt toutes les actions de tous les items du personnage et met à jour la source des actions
  async updateAllActionsUuid() {
    const actorId = this.parent.id
    for (const item of this.parent.items) {
      // Equipements et capacités
      if ([SYSTEM.ITEM_TYPE.equipment.id, SYSTEM.ITEM_TYPE.capacity.id].includes(item.type) && item.actions.length > 0) {
        // Pour une capacité on met à jour le path
        if (item.type === SYSTEM.ITEM_TYPE.capacity.id && item.system.path) {
          const { primaryType, primaryId, type, id } = foundry.utils.parseUuid(item.system.path)
          const newPath = [primaryType, actorId, type, id].flat().filterJoin(".")
          await item.update({ "system.path": newPath })
        }
        const actions = item.toObject().system.actions
        for (const action of actions) {
          const { primaryType, primaryId, type, id } = foundry.utils.parseUuid(action.source)
          const newSource = [primaryType, actorId, type, id].flat().filterJoin(".")
          action.source = newSource
          if (action.modifiers.length > 0) {
            for (const modifier of action.modifiers) {
              modifier.source = newSource
            }
          }
        }
        await item.update({ "system.actions": actions })
      }
      // Profile et features
      else if ([SYSTEM.ITEM_TYPE.profile.id, SYSTEM.ITEM_TYPE.feature.id].includes(item.type)) {
        if (item.modifiers && item.modifiers.length > 0) {
          const modifiers = item.toObject().system.modifiers
          for (const modifier of modifiers) {
            const { primaryType, primaryId, type, id } = foundry.utils.parseUuid(modifier.source)
            const newSource = [primaryType, actorId, type, id].flat().filterJoin(".")
            modifier.source = newSource
          }
          await item.update({ "system.modifiers": modifiers })
        }
        const paths = item.system.paths
        const newPaths = paths.map((pathUuid) => {
          const { primaryType, primaryId, type, id } = foundry.utils.parseUuid(pathUuid)
          return [primaryType, actorId, type, id].flat().filterJoin(".")
        })
        await item.update({ "system.paths": newPaths })

        if (item.type === SYSTEM.ITEM_TYPE.feature.id) {
          const capacities = item.system.capacities
          const newCapacities = capacities.map((capacityUuid) => {
            const { primaryType, primaryId, type, id } = foundry.utils.parseUuid(capacityUuid)
            return [primaryType, actorId, type, id].flat().filterJoin(".")
          })
          await item.update({ "system.capacities": newCapacities })
        }
      }
      // Voie : on met à jour le tableau des capacités
      else if (item.type === SYSTEM.ITEM_TYPE.path.id) {
        const capacities = item.system.capacities
        const newCapacities = capacities.map((capacityUuid) => {
          const { primaryType, primaryId, type, id } = foundry.utils.parseUuid(capacityUuid)
          return [primaryType, actorId, type, id].flat().filterJoin(".")
        })
        await item.update({ "system.capacities": newCapacities })
      }
    }
  }

  /**
   * Rolls a fortune check for the character using a custom formula based on current fortune points.
   * Displays the result as a chat message with appropriate localization and flavor text.
   *
   * @async
   * @function
   * @returns {Promise<void>} Resolves when the roll message has been sent.
   */
  async rollFortune() {
    const currentFP = this.resources.fortune.value
    const formula = `1d6x + ${currentFP}`

    const roll = new Roll(formula)
    await roll.evaluate()
    const label = game.i18n.localize("CO.roll.fortune")
    const tooltip = await roll.getTooltip()

    const templateData = {
      actorId: this.parent.id,
      flavor: label,
      formula: formula,
      total: roll.total,
      tooltip: tooltip,
    }

    const content = await foundry.applications.handlebars.renderTemplate("systems/cog/templates/chat/fortune-roll-card.hbs", templateData)

    await ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor: this.parent }),
      content: content,
      rolls: [roll],
      flags: { co: { type: "fortune-roll" } },
    })
  }
}
