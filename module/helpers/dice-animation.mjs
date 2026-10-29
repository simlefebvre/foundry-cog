/**
 * Waits for Dice So Nice to finish animating a roll before showing follow-up content.
 * @param {ChatMessage|null|undefined} message The chat message containing the roll.
 * @returns {Promise<void>}
 */
export async function waitForDiceAnimation(message) {
  if (!message?.id) return
  await game.dice3d?.waitFor3DAnimationByMessageID?.(message.id)
}
