import ItemData from "./item.mjs"
import { SYSTEM } from "../config/system.mjs"
import { PROFILE_FAMILY_ALIASES } from "../config/profile.mjs"
import { Modifier } from "./schemas/modifier.mjs"

export default class ProfileData extends ItemData {
  static defineSchema() {
    const fields = foundry.data.fields
    return foundry.utils.mergeObject(super.defineSchema(), {
      family: new fields.StringField({ required: false, nullable: true }),
      maxDefenseArmor: new fields.NumberField({ integer: true, min: 0, initial: 0 }),
      modifiers: new fields.ArrayField(new fields.EmbeddedDataField(Modifier)),
      martialTrainingsWeapons: new fields.ObjectField(),
      martialTrainingsArmors: new fields.ObjectField(),
      martialTrainingsShields: new fields.ObjectField(),
      paths: new fields.ArrayField(new fields.DocumentUUIDField({ type: "Item" })),
      equipment: new fields.ArrayField(new fields.DocumentUUIDField({ type: "Item" })),
      proficiencies: new fields.ArrayField(new fields.StringField()),
      mainProfile: new fields.BooleanField(),
    })
  }

  /** @override */
  static LOCALIZATION_PREFIXES = ["CO.Profile"]

  /** @override */
  prepareBaseData() {
    super.prepareBaseData()
    if (this.family) {
      const familyId = PROFILE_FAMILY_ALIASES[this.family] ?? this.family
      const family = SYSTEM.FAMILIES[familyId]
      this.fp = family.fp
      this.recoveryDice = family.recoveryDice
    }
  }
}
