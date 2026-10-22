import ItemData from "./item.mjs"
import { Modifier } from "./schemas/modifier.mjs"

export default class FeatureData extends ItemData {
  static defineSchema() {
    const fields = foundry.data.fields
    return foundry.utils.mergeObject(super.defineSchema(), {
      subtype: new fields.StringField({ required: true }),
      modifiers: new fields.ArrayField(new fields.EmbeddedDataField(Modifier)),
      paths: new fields.ArrayField(new fields.DocumentUUIDField({ type: "Item" })),
      capacities: new fields.ArrayField(new fields.DocumentUUIDField({ type: "Item" })),
    })
  }

  /** @override */
  static LOCALIZATION_PREFIXES = ["CO.Feature"]
}
