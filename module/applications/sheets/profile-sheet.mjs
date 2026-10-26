import CoBaseItemSheet from "./base-item-sheet.mjs"
import { SYSTEM } from "../../config/system.mjs"
import { PROFILE_FAMILY_ALIASES } from "../../config/profile.mjs"
import Utils from "../../helpers/utils.mjs"

export default class CoProfileSheet extends CoBaseItemSheet {
  /** @override */
  static DEFAULT_OPTIONS = {
    classes: ["profile"],
    position: {
      width: 600,
      height: 720,
    },
  }

  static PARTS = {
    header: { template: "systems/cog/templates/items/shared/header.hbs" },
    tabs: { template: "templates/generic/tab-navigation.hbs" },
    description: { template: "systems/cog/templates/items/shared/description.hbs" },
    details: { template: "systems/cog/templates/items/profile.hbs", scrollable: [""] },
  }

  static TABS = {
    primary: {
      tabs: [{ id: "description" }, { id: "details" }],
      initial: "description",
      labelPrefix: "CO.sheet.tabs.profile",
    },
  }

  /** @inheritDoc */
  async _onRender(context, options) {
    await super._onRender(context, options)
    this._filterInputDiceValue()
  }

  /** @override */
  async _prepareContext() {
    const context = await super._prepareContext()

    let infosPaths = []
    for (const path of this.item.system.paths) {
      let item = await fromUuid(path)
      // Item could be null if the item has been deleted in the compendium
      if (item) {
        infosPaths.push(item.infos)
      }
    }
    context.paths = infosPaths

    let infosEquipment = []
    for (const uuid of this.item.system.equipment) {
      let item = await fromUuid(uuid)
      // Item could be null if the item has been deleted in the compendium
      if (item) infosEquipment.push({ uuid: item.uuid, name: item.name, img: item.img })
    }
    context.equipment = infosEquipment

    // Select options
    context.choiceProfileFamily = Object.fromEntries(Object.entries(SYSTEM.FAMILIES).map(([key, value]) => [key, value.label]))
    context.profileFamily = PROFILE_FAMILY_ALIASES[this.item.system.family] ?? this.item.system.family
    context.choiceModifierSubtypes = SYSTEM.MODIFIERS.MODIFIERS_SUBTYPE
    context.choiceModifierAbilityTargets = Object.fromEntries(Object.entries(SYSTEM.MODIFIERS.MODIFIERS_TARGET).filter(([key, value]) => value.subtype === "ability"))
    context.choiceModifierCombatTargets = Object.fromEntries(
      Object.entries(SYSTEM.MODIFIERS.MODIFIERS_TARGET).filter(([key, value]) => value.subtype === "combat" || value.subtype === "attack"),
    )
    context.choiceModifierAttributeTargets = Object.fromEntries(Object.entries(SYSTEM.MODIFIERS.MODIFIERS_TARGET).filter(([key, value]) => value.subtype === "attribute"))
    context.choiceModifierResourceTargets = Object.fromEntries(Object.entries(SYSTEM.MODIFIERS.MODIFIERS_TARGET).filter(([key, value]) => value.subtype === "resource"))
    context.choiceModifierSkillTargets = Object.fromEntries(Object.entries(SYSTEM.MODIFIERS.MODIFIERS_TARGET).filter(([key, value]) => value.subtype === "ability"))
    context.choiceModifierStateTargets = Object.fromEntries(Object.entries(SYSTEM.MODIFIERS.MODIFIERS_TARGET).filter(([key, value]) => value.subtype === "state"))
    context.choiceModifierBonusDiceTargets = Object.fromEntries(
      Object.entries(SYSTEM.MODIFIERS.MODIFIERS_TARGET).filter(([key, value]) => value.id !== "all" && (value.subtype === "ability" || value.subtype === "attack")),
    )
    context.choiceModifierMalusDiceTargets = Object.fromEntries(
      Object.entries(SYSTEM.MODIFIERS.MODIFIERS_TARGET).filter(([key, value]) => value.id !== "all" && (value.subtype === "ability" || value.subtype === "attack")),
    )
    context.choiceModifierApplies = SYSTEM.MODIFIERS.MODIFIERS_APPLY
    context.choiceModifierGroups = SYSTEM.MODIFIERS.MODIFIERS_CHOICE_GROUP

    if (CONFIG.debug.cog?.sheets) console.debug(Utils.log(`CoProfileSheet - context`), context)
    return context
  }
}
