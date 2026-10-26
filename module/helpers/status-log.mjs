const STATUS_CARD_TEMPLATE = "systems/cog/templates/chat/status-change-card.hbs"

/**
 * Publie dans le chat une tuile expliquant un changement d'état appliqué automatiquement par le système.
 *
 * @param {Actor} actor Acteur concerné.
 * @param {string} statusId Identifiant de l'état modifié.
 * @param {boolean} active true si l'état est appliqué, false s'il est retiré.
 * @param {string} reason Clé de la raison, traduite depuis `CO.statusLog.reason.<reason>`.
 * @returns {Promise<ChatMessage>}
 */
export async function postStatusChangeCard(actor, statusId, active, reason) {
  const statusConfig = globalThis.CONFIG?.statusEffects?.find((status) => status.id === statusId)
  const statusName = statusConfig?.name ?? game.i18n.localize(`CO.customStatus.${statusId}`)

  const content = await foundry.applications.handlebars.renderTemplate(STATUS_CARD_TEMPLATE, {
    actorId: actor.id,
    stage: reason,
    active,
    statusId,
    statusName,
    img: statusConfig?.img,
    title: game.i18n.format(`CO.statusLog.title.${active ? "applied" : "removed"}`, { status: statusName }),
    reason: game.i18n.format(`CO.statusLog.reason.${reason}`, { actorName: actor.name }),
  })

  return ChatMessage.create({
    content,
    speaker: ChatMessage.getSpeaker({ actor, scene: canvas.scene }),
    whisper: [],
    blind: false,
  })
}
