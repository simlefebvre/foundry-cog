import CoBaseItemSheet from "./base-item-sheet.mjs"
import Utils from "../../helpers/utils.mjs"
export default class CoPathSheet extends CoBaseItemSheet {
  /** @override */
  static DEFAULT_OPTIONS = {
    classes: ["path"],
    position: {
      width: 600,
      height: 500,
    },
  }

  static PARTS = {
    header: { template: "systems/cog/templates/items/shared/header.hbs" },
    tabs: { template: "templates/generic/tab-navigation.hbs" },
    description: { template: "systems/cog/templates/items/shared/description.hbs" },
    details: { template: "systems/cog/templates/items/path.hbs" },
  }

  static TABS = {
    primary: {
      tabs: [{ id: "description" }, { id: "details" }],
      initial: "description",
      labelPrefix: "CO.sheet.tabs.path",
    },
  }

  /** @override */
  async _prepareContext() {
    const context = await super._prepareContext()

    context.capacities = await this.item.system.getCapacities()

    // Enrichir les descriptions des capacités pour les tooltips
    const enrichHTML = foundry.applications.ux.TextEditor.implementation.enrichHTML
    for (const capacity of context.capacities) {
      capacity.enrichedTooltip = await enrichHTML(capacity.system.description ?? "")
    }

    context.equipment = []
    for (const uuid of this.item.system.equipment) {
      const equipment = await fromUuid(uuid)
      if (equipment) context.equipment.push({ uuid: equipment.uuid, name: equipment.name, img: equipment.img })
    }

    // Select options
    context.choicePathSubtypes = SYSTEM.PATH_TYPES

    if (CONFIG.debug.cog?.sheets) console.debug(Utils.log(`CoPathSheet - context`), context)
    return context
  }
}
