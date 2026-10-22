export class BaseValue extends foundry.abstract.DataModel {
  static defineSchema() {
    const fields = foundry.data.fields
    return {
      base: new fields.NumberField({ required: true, nullable: false, initial: 0, integer: true }),
      ability: new fields.StringField({ required: false, nullable: true, initial: null }),
      details: new fields.StringField({ required: false, nullable: true, initial: null }),
      unit: new fields.StringField({ required: false, nullable: true, initial: null }),
      min: new fields.NumberField({ required: false, nullable: true, initial: null, integer: true }),
      max: new fields.NumberField({ required: false, nullable: true, initial: null, integer: true }),
      bonuses: new fields.SchemaField({
        sheet: new fields.NumberField({ required: true, initial: 0, integer: true }),
        effects: new fields.NumberField({ required: true, initial: 0, integer: true }),
      }),
      value: new fields.NumberField({ integer: true }),
    }
  }
}
