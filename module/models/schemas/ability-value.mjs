export class AbilityValue extends foundry.abstract.DataModel {
  static defineSchema() {
    const fields = foundry.data.fields
    return {
      superior: new fields.BooleanField({
        required: true,
        initial: false,
      }),
      base: new fields.NumberField({
        required: true,
        nullable: false,
        initial: 0,
        integer: true,
      }),
      bonuses: new fields.SchemaField({
        sheet: new fields.NumberField({
          required: true,
          initial: 0,
          integer: true,
        }),
        effects: new fields.NumberField({
          required: true,
          initial: 0,
          integer: true,
        }),
      }),
    }
  }
}
