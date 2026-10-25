/**
 * Dialog for confirming a character level-up and entering its hit point gain.
 */
export class CoLevelUpDialog {
  /**
   * Ask for the hit point gain and return it, or null when the dialog is cancelled.
   * Characters without a profile gain Constitution-based HP automatically.
   * @param {{ actor: Actor, profileCount: number }} options
   * @returns {Promise<{hpGain: number, attackType: string|null}|null>}
   */
  static async choose({ actor, profileCount }) {
    const nextLevel = actor.system.attributes.level + 1
    const constitution = actor.system.abilities.con.value
    const noHitDieGain = profileCount > 0 && nextLevel >= 10 && nextLevel % 2 === 0
    const rollHitDie = profileCount > 0 && nextLevel < 10 && nextLevel % 2 === 0
    const hitDie = actor.system.hd
    const hpGain = rollHitDie ? null : noHitDieGain ? 0 : Math.max(0, constitution)
    if (rollHitDie && !hitDie) {
      throw new Error(`Cannot roll a hit die for ${actor.name}: no hit die is configured.`)
    }
    const attackChoices = [
      { id: "melee", label: game.i18n.localize("CO.combat.short.melee") },
      { id: "ranged", label: game.i18n.localize("CO.combat.short.ranged") },
    ]
      .map((choice) => ({
        ...choice,
        base: Math.max(0, Math.min(actor.system.combat[choice.id].base, 6)),
      }))
      .filter((choice) => choice.base < 6)

    const dialogId = foundry.utils.randomID()
    const content = await foundry.applications.handlebars.renderTemplate("systems/cog/templates/dialogs/level-up-dialog.hbs", {
      dialogId,
      nextLevel,
      capacityPoints: 2,
      multipleProfiles: profileCount > 1,
      noHitDieGain,
      rollHitDie,
      hitDie,
      initialHpGain: hpGain ?? "—",
      attackChoices: attackChoices.map((choice) => ({ ...choice, nextBase: choice.base + 1 })),
      hasAttackChoices: attackChoices.length > 0,
    })

    let rolledGain
    const onRollHitDie = async (event) => {
      if (!(event.target instanceof Element)) return
      const rollButton = event.target.closest("[data-level-up-roll]")
      const dialogContent = rollButton?.closest("[data-dialog-id]")
      if (dialogContent?.dataset.dialogId !== dialogId) return

      event.preventDefault()
      rollButton.disabled = true
      try {
        const roll = await new Roll(hitDie).evaluate()
        await roll.toMessage(
          {
            speaker: ChatMessage.getSpeaker({ actor }),
            flavor: game.i18n.format("CO.dialogs.levelUp.hitDieRoll", { actor: actor.name, level: nextLevel }),
          },
          { messageMode: game.settings.get("core", "rollMode") },
        )
        rolledGain = Math.max(0, roll.total + Math.min(0, constitution))
        const gainOutput = dialogContent.querySelector("#level-up-hp-gain")
        gainOutput.textContent = String(rolledGain)
      } catch (error) {
        console.error("Failed to roll a hit die during level-up.", error)
        ui.notifications.error(game.i18n.localize("CO.dialogs.levelUp.rollHitDieError"))
      } finally {
        rollButton.disabled = false
      }
    }

    document.addEventListener("click", onRollHitDie, true)
    let result
    try {
      result = await foundry.applications.api.DialogV2.wait({
        window: { title: game.i18n.localize("CO.dialogs.levelUp.title") },
        position: { width: 420 },
        classes: ["co", "level-up-dialog"],
        content,
        rejectClose: false,
        buttons: [
          {
            action: "confirm",
            label: game.i18n.localize("CO.dialogs.levelUp.confirm"),
            icon: "fas fa-arrow-up",
            default: true,
            callback: () => {
              const gain = hpGain ?? rolledGain
              if (gain === undefined) {
                ui.notifications.warn(game.i18n.localize("CO.dialogs.levelUp.rollHitDieFirst"))
                return false
              }
              const selectedAttack = document.querySelector(`[data-dialog-id="${dialogId}"] input[name="level-up-attack"]:checked`)
              if (attackChoices.length > 0 && !selectedAttack) {
                ui.notifications.warn(game.i18n.localize("CO.dialogs.levelUp.chooseAttackHint"))
                return false
              }
              return { hpGain: gain, attackType: selectedAttack?.value ?? null }
            },
          },
          {
            action: "cancel",
            label: game.i18n.localize("CO.dialogs.levelUp.cancel"),
            icon: "fas fa-xmark",
          },
        ],
      })
    } finally {
      document.removeEventListener("click", onRollHitDie, true)
    }

    if (!result || result === "cancel") return null
    return result
  }
}
