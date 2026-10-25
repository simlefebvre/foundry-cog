/**
 * Hook callback function that executes when an actor is created.
 * Updates all action UUIDs for the actor if the user is a GM and specific conditions are met.
 *
 * @param {Actor} document The actor document being created
 * @param {Object} options Creation options
 * @param {string} userId The ID of the user creating the actor
 * @returns {void}
 */
export function createActor(document, options, userId) {
  if (options?.fromCompendium || (!options?.strict && !options?.renderSheet)) {
    if (game.user.isGM) document.system.updateAllActionsUuid()
  }
}

/**
 * Hook function called when an actor is updated.
 * Handles automatic status effects based on HP and temporary damage changes:
 * - For characters: applies unconscious status when HP reaches 0 or temporary damage exceeds current HP
 * - For encounters: applies dead status when HP reaches 0
 *
 * @param {Actor} actor The actor being updated
 * @param {object} updateData The data being updated on the actor
 * @param {object} options Additional options for the update operation
 * @param {string} userId The ID of the user performing the update
 * @returns {Promise<void>}
 */
export async function updateActor(actor, updateData, options, userId) {
  if (!game.user.isActiveGM) return

  if (actor.type === "character") {
    const hpUpdated = updateData?.system?.attributes?.hp?.value !== undefined || updateData?.["system.attributes.hp.value"] !== undefined
    const tempDmUpdated = updateData?.system?.attributes?.tempDm !== undefined || updateData?.["system.attributes.tempDm"] !== undefined
    const tempDmExceededHp = (hpUpdated || tempDmUpdated) && actor.system.attributes.tempDm > actor.system.attributes.hp.value
    const wasUnconscious = actor.statuses.has("unconscious")

    if (actor.system.attributes.hp.value === 0 && hpUpdated && !wasUnconscious) {
      await actor.toggleStatusEffect("unconscious", { active: true })
      await actor.setFlag("cog", "statuses.unconsciousFromZeroHP", true)
    } else if (tempDmExceededHp && !wasUnconscious) {
      await actor.toggleStatusEffect("unconscious", { active: true })
    }

    if (tempDmExceededHp && !wasUnconscious) {
      await ChatMessage.create({
        content: game.i18n.format("CO.notif.unconsciousFromTempDm", { actorName: actor.name }),
        speaker: ChatMessage.getSpeaker({ actor, scene: canvas.scene }),
        whisper: [],
        blind: false,
      })
    }
  }

  if (actor.type === "character") {
    await actor.system.tryRecoverFromWeakened()
    await actor.system.tryRecoverFromWounded()
  }

  // Une rencontre est morte à 0 PV
  if (actor.type === "encounter" && updateData?.system?.attributes?.hp?.value === 0 && !actor.statuses.has("dead")) {
    await actor.toggleStatusEffect("dead", { active: true })
  }
}

/**
 * Hook callback function `cog.companionMasterDeleted`, émis quand un Compagnon
 * (Rencontre) perd son maitre (`EncounterData.deleteMaster()`/`toggleCompanion(false)`).
 * Retire le compagnon délié du tableau `system.companions` de son ancien maitre.
 *
 * @param {string} masterUuid UUID de l'ancien maitre (Personnage)
 * @param {string} companionUuid UUID de la Rencontre-Compagnon déliée
 * @returns {void}
 */
export function companionMasterDeleted(masterUuid, companionUuid) {
  if (!game.user.isActiveGM) return
  const master = fromUuidSync(masterUuid)
  if (!master || master.type !== "character") return
  const companions = master.system.companions.filter((uuid) => uuid !== companionUuid)
  if (companions.length !== master.system.companions.length) {
    master.update({ "system.companions": companions })
  }
}
