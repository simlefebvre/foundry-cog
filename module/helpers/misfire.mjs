import { waitForDiceAnimation } from "./dice-animation.mjs"

const TEMPLATE = "systems/cog/templates/chat/misfire-card.hbs"

/**
 * Prépare les données d'affichage de la carte d'incident de tir.
 * @param {Actor} actor Porteur de l'arme.
 * @param {Item} item Arme concernée.
 * @param {"request"|"safe"|"stillMisfire"|"broken"|"luck"} stage Étape à afficher.
 * @param {number} [diceResult] Résultat du d20 de relance.
 * @returns {object}
 */
function buildCardData(actor, item, stage, diceResult) {
  const threshold = item.system.misfireThreshold
  return {
    actorUuid: actor.uuid,
    itemUuid: item.uuid,
    stage,
    isRequest: stage === "request",
    hasLuckyPoints: stage === "request" && actor.hasLuckyPoints,
    title: game.i18n.localize("CO.notif.misfire.title"),
    description: game.i18n.format(`CO.notif.misfire.${stage}`, { actorName: actor.name, itemName: item.name, threshold, result: diceResult }),
  }
}

/**
 * Passe l'arme en incident de tir et publie la carte invitant à relancer un d20.
 * @param {Actor} actor Porteur de l'arme.
 * @param {Item} item Arme concernée.
 * @returns {Promise<ChatMessage>}
 */
export async function triggerMisfire(actor, item) {
  await item.update({ "system.rangedState": "misfire" })
  const content = await foundry.applications.handlebars.renderTemplate(TEMPLATE, buildCardData(actor, item, "request"))
  return ChatMessage.create({
    content,
    speaker: ChatMessage.getSpeaker({ actor, scene: canvas.scene }),
    type: "check",
    whisper: [],
    blind: false,
  })
}

/**
 * Relance un d20 sans modificateur : sous le seuil, l'arme est cassée.
 * @param {ChatMessage} message Carte d'incident à mettre à jour.
 * @param {Actor} actor Porteur de l'arme.
 * @param {Item} item Arme concernée.
 */
export async function rollMisfireCheck(message, actor, item) {
  const roll = await new Roll("1d20").evaluate()
  const diceResult = roll.total
  const broken = diceResult <= item.system.misfireThreshold
  const rollMessage = await roll.toMessage({
    speaker: ChatMessage.getSpeaker({ actor, scene: canvas.scene }),
    flavor: game.i18n.format("CO.notif.misfire.rollFlavor", { itemName: item.name }),
  })
  await waitForDiceAnimation(rollMessage)
  if (broken) await item.update({ "system.rangedState": "broken" })
  const content = await foundry.applications.handlebars.renderTemplate(TEMPLATE, buildCardData(actor, item, broken ? "broken" : "stillMisfire", diceResult))
  await message.update({ content })
}

/**
 * Dépense un point de chance pour annuler l'incident de tir : l'arme redevient normale.
 * @param {ChatMessage} message Carte d'incident à mettre à jour.
 * @param {Actor} actor Porteur de l'arme.
 * @param {Item} item Arme concernée.
 * @returns {Promise<boolean>} true si l'incident a été annulé.
 */
export async function cancelMisfire(message, actor, item) {
  if (!actor.hasLuckyPoints) return false
  await actor.spendLuckyPoints(1)
  await item.update({ "system.rangedState": "normal" })
  const content = await foundry.applications.handlebars.renderTemplate(TEMPLATE, buildCardData(actor, item, "luck"))
  await message.update({ content })
  return true
}
