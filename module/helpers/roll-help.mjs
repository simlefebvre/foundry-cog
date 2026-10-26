const SOCKET_EVENT = "system.cog"
const SUCCESS_THRESHOLD = 10
const LUCK_BONUS = 5
const FLAT_BONUS = 2

/**
 * Gestion de l'aide apportée par d'autres personnages lors d'un jet de caractéristique.
 * Les échanges entre clients passent par le socket du système.
 */
export default class RollHelp {
  /** @type {Map<string, {resolve: Function, userId: string, actorName: string}>} */
  static #pending = new Map()

  /** @type {Map<string, Application>} Fenêtres d'aide ouvertes chez l'aidant, indexées par requestId */
  static #openDialogs = new Map()

  /** Enregistre l'écoute du socket. À appeler au chargement du système. */
  static initialize() {
    game.socket.on(SOCKET_EVENT, (data) => RollHelp.#onMessage(data))
  }

  /**
   * Liste les personnages pouvant aider : possédés par un joueur (non MJ) actif et connecté.
   * @param {Actor} excludedActor Le personnage qui effectue le jet
   * @returns {{id: string, name: string}[]}
   */
  static getCandidates(excludedActor) {
    return game.actors
      .filter((actor) => actor.type === "character" && actor.id !== excludedActor?.id && RollHelp.#getOwnerUser(actor))
      .map((actor) => ({ id: actor.id, name: actor.name }))
      .sort((a, b) => a.name.localeCompare(b.name))
  }

  static #getOwnerUser(actor) {
    return game.users.find((user) => user.active && !user.isGM && user.id !== game.user.id && actor.testUserPermission(user, "OWNER"))
  }

  /**
   * Demande de l'aide aux personnages indiqués et attend leurs réponses.
   * @param {object} params
   * @param {string[]} params.helperActorIds Identifiants des personnages aidants
   * @param {string} params.skillId Caractéristique du jet
   * @param {Actor} params.actor Personnage qui effectue le jet
   * @returns {Promise<{bonus: number, cancelModifiers: boolean, helpers: {name: string, bonus: number, cancelModifiers: boolean}[]}>}
   */
  static async requestHelp({ helperActorIds, skillId, actor }) {
    const summary = { bonus: 0, cancelModifiers: false, helpers: [] }
    const requestIds = []
    const promises = []

    for (const actorId of helperActorIds) {
      const helperActor = game.actors.get(actorId)
      const user = helperActor ? RollHelp.#getOwnerUser(helperActor) : null
      if (!user) continue
      const requestId = foundry.utils.randomID()
      requestIds.push(requestId)
      promises.push(
        new Promise((resolve) => {
          RollHelp.#pending.set(requestId, { resolve, userId: user.id, actorName: helperActor.name })
        }),
      )
      game.socket.emit(SOCKET_EVENT, {
        type: "helpRequest",
        requestId,
        userId: user.id,
        actorId,
        skillId,
        requesterName: actor.name,
      })
    }
    if (!promises.length) return summary

    const names = requestIds.map((id) => RollHelp.#pending.get(id).actorName).join(", ")
    const waitDialog = new foundry.applications.api.DialogV2({
      window: { title: game.i18n.localize("CO.help.waitTitle"), icon: "fa-solid fa-heart" },
      content: `<p>${game.i18n.format("CO.help.waiting", { names: foundry.utils.escapeHTML(names) })}</p>`,
      buttons: [{ action: "cancel", label: game.i18n.localize("CO.help.rollWithoutHelp"), icon: "fa-solid fa-forward", default: true }],
      rejectClose: false,
    })
    const closed = new Promise((resolve) => waitDialog.addEventListener("close", () => resolve(null), { once: true }))
    await waitDialog.render({ force: true })

    const responses = await Promise.race([Promise.all(promises), closed])
    if (responses === null) {
      // Attente annulée par le joueur principal
      for (const requestId of requestIds) {
        RollHelp.#pending.delete(requestId)
        game.socket.emit(SOCKET_EVENT, { type: "helpCancel", requestId })
      }
      return summary
    }
    waitDialog.close()

    for (const response of responses) {
      if (!response?.choice) continue
      const helper = { name: response.actorName, bonus: 0, cancelModifiers: false }
      if (response.choice === "luck") helper.bonus = LUCK_BONUS
      else if (response.choice === "bonus") helper.bonus = FLAT_BONUS
      else if (response.choice === "cancel") helper.cancelModifiers = true
      summary.bonus += helper.bonus
      summary.cancelModifiers ||= helper.cancelModifiers
      summary.helpers.push(helper)
    }
    return summary
  }

  static #onMessage(data) {
    switch (data?.type) {
      case "helpRequest":
        if (data.userId === game.user.id) RollHelp.#onHelpRequest(data)
        break
      case "helpResponse": {
        const pending = RollHelp.#pending.get(data.requestId)
        if (pending && pending.userId === data.userId) {
          RollHelp.#pending.delete(data.requestId)
          pending.resolve(data)
        }
        break
      }
      case "helpCancel":
        RollHelp.#openDialogs.get(data.requestId)?.close()
        break
    }
  }

  /**
   * Côté aidant : propose de lancer le jet, puis la fenêtre de choix si le résultat est suffisant.
   * @param {object} data
   */
  static async #onHelpRequest({ requestId, actorId, skillId, requesterName }) {
    const actor = game.actors.get(actorId)
    if (!actor) return
    const respond = (choice, total = null) =>
      game.socket.emit(SOCKET_EVENT, { type: "helpResponse", requestId, userId: game.user.id, actorName: actor.name, choice, total })
    const abilityLabel = game.i18n.localize(`CO.abilities.long.${skillId}`)

    const accepted = await RollHelp.#ask(requestId, {
      window: { title: game.i18n.localize("CO.help.requestTitle"), icon: "fa-solid fa-heart" },
      content: `<p>${game.i18n.format("CO.help.requestContent", {
        requester: foundry.utils.escapeHTML(requesterName),
        actor: foundry.utils.escapeHTML(actor.name),
        ability: abilityLabel,
      })}</p>`,
      buttons: [
        { action: "roll", label: game.i18n.localize("CO.help.roll"), icon: "fa-solid fa-dice-d20", default: true },
        { action: "decline", label: game.i18n.localize("CO.help.decline"), icon: "fa-solid fa-times" },
      ],
    })
    if (accepted !== "roll") return respond(null)

    const rolled = await actor.rollSkill(skillId, {
      withDialog: true,
      showResult: false,
      chatFlavor: game.i18n.format("CO.help.flavor", { ability: abilityLabel, requester: requesterName }),
    })
    if (!rolled) return respond(null)

    const { roll, result } = rolled
    await roll.toMessage(
      {
        speaker: ChatMessage.getSpeaker({ actor, scene: canvas.scene }),
        style: CONST.CHAT_MESSAGE_STYLES.OTHER,
        type: "skill",
        system: { result },
      },
      { messageMode: roll.options.rollMode },
    )

    if (roll.total <= SUCCESS_THRESHOLD) {
      await ChatMessage.create({
        speaker: ChatMessage.getSpeaker({ actor, scene: canvas.scene }),
        content: `<p>${game.i18n.format("CO.help.failed", {
          actor: foundry.utils.escapeHTML(actor.name),
          requester: foundry.utils.escapeHTML(requesterName),
        })}</p>`,
      })
      return respond(null, roll.total)
    }

    const choice = await RollHelp.#ask(requestId, {
      window: { title: game.i18n.localize("CO.help.chooseTitle"), icon: "fa-solid fa-heart" },
      content: `<p>${game.i18n.format("CO.help.chooseContent", { total: roll.total, requester: foundry.utils.escapeHTML(requesterName) })}</p>`,
      buttons: [
        { action: "luck", label: game.i18n.format("CO.help.optionLuck", { value: LUCK_BONUS }), icon: "fa-solid fa-clover" },
        { action: "cancel", label: game.i18n.localize("CO.help.optionCancel"), icon: "fa-solid fa-eraser" },
        { action: "bonus", label: game.i18n.format("CO.help.optionBonus", { value: FLAT_BONUS }), icon: "fa-solid fa-plus", default: true },
      ],
      render: (event, dialog) => {
        if (!actor.hasLuckyPoints) dialog.element.querySelector('button[data-action="luck"]')?.setAttribute("disabled", "")
      },
    })
    if (choice === "luck") await actor.spendLuckyPoints(1)
    respond(["luck", "cancel", "bonus"].includes(choice) ? choice : null, roll.total)
  }

  /**
   * Ouvre une fenêtre de dialogue côté aidant, fermable à distance par le joueur principal.
   * @returns {Promise<string|null>} L'action choisie, ou null si la fenêtre a été fermée
   */
  static async #ask(requestId, config) {
    let choice = null
    const { render, ...dialogConfig } = config
    const dialog = new foundry.applications.api.DialogV2({
      ...dialogConfig,
      rejectClose: false,
      buttons: config.buttons.map((button) => ({ ...button, callback: () => (choice = button.action) })),
    })
    if (render) dialog.addEventListener("render", (event) => render(event, dialog))
    const closed = new Promise((resolve) => dialog.addEventListener("close", resolve, { once: true }))
    RollHelp.#openDialogs.set(requestId, dialog)
    await dialog.render({ force: true })
    await closed
    RollHelp.#openDialogs.delete(requestId)
    return choice
  }
}
