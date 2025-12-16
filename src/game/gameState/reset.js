// Reset logic for clearing game state and UI.
(() => {
  function createReset(deps, state, constants, uiUpdates) {
    const { view, slotRefs, deckUtils, botCountSlider, botCountControl, betControl, betInput, betDecrementBtn, betIncrementBtn, botRows, flopButton, revealButton, playAgainButton } = deps;
    const { MIN_BET, DEFAULT_BOT_COUNT, MAX_BOT } = constants;

    function baseReset() {
      // Clear any card highlights from previous game
      view.clearHighlights(slotRefs);
      
      const deck = deckUtils.buildDeck();
      deckUtils.shuffleDeck(deck);
      state.setDeck(deck);
      state.setPhaseIndex(0);
      state.setPlayerCards([]);
      state.setBotHands([]);
      state.setBotRevealed(false);
      state.setPlayerRevealed(true);
      state.setDiscardRequired(false);
      state.setFlopCards([]);
      state.setTurnCard(null);
      state.setRiverCard(null);
      state.setFlopUsed(false);
      state.setBotCount(DEFAULT_BOT_COUNT);
      state.setBotSelectionLocked(false);
      botCountSlider.value = String(DEFAULT_BOT_COUNT);
      botCountSlider.disabled = true;
      botCountSlider.classList.remove("locked");
      if (botCountControl) {
        botCountControl.classList.add("hidden");
      }
      // Hide bet control on reset
      if (betControl) {
        betControl.classList.add("hidden");
      }
      // Ensure currentBet doesn't exceed current bank (but keep it if valid)
      const bank = state.getBank();
      const currentBet = state.getCurrentBet();
      if (currentBet > bank) {
        state.setCurrentBet(Math.max(MIN_BET, bank));
      }
      // Update bet input to show current bet
      if (betInput) {
        betInput.value = String(state.getCurrentBet());
        betInput.disabled = true;
      }
      if (betDecrementBtn) {
        betDecrementBtn.disabled = true;
      }
      if (betIncrementBtn) {
        betIncrementBtn.disabled = true;
      }
      if (botRows) {
        botRows.classList.add("hidden");
        // Add invisible placeholder to maintain table size
        const botSectionElement = document.querySelector('.bot-section');
        if (botSectionElement && !botSectionElement.querySelector('.bot-placeholder')) {
          const placeholder = document.createElement('div');
          placeholder.className = 'bot-placeholder';
          botSectionElement.appendChild(placeholder);
        }
      }

      slotRefs.player.forEach((slot) => {
        view.setSlotCard(slot, null, { collapseWhenEmpty: true });
        slot.style.marginLeft = "0px";
        slot.style.transform = "none";
      });
      slotRefs.bot.forEach((seatSlots) => {
        seatSlots.forEach((slot) => {
          view.setSlotCard(slot, null, { collapseWhenEmpty: true });
          slot.style.marginLeft = "0px";
          slot.style.transform = "none";
        });
      });
      [...slotRefs.flop, ...slotRefs.turn, ...slotRefs.river].forEach((slot) => {
        view.setSlotCard(slot, null, { collapseWhenEmpty: true });
        slot.style.marginLeft = "0px";
        slot.style.transform = "none";
      });
      const placeholderPlayer = Array(slotRefs.player.length).fill(null);
      view.renderPlayerSlots(slotRefs.player, placeholderPlayer, {
        showPlaceholders: false,
        showBacksWhenEmpty: false,
        addPrestartClass: true,
      });
      view.renderBotSlots(
        slotRefs.bot,
        Array(MAX_BOT)
          .fill(0)
          .map(() => []),
        {
          showPlaceholders: true,
          revealed: state.getBotRevealed(),
          showBacksWhenEmpty: false,
          addPrestartClass: true,
          botRows: slotRefs.botRows,
        },
      );
      uiUpdates.renderBoard();
      uiUpdates.updateDeckLabel();
      uiUpdates.updateBankDisplay();
      flopButton.classList.add("hidden");
      revealButton.classList.add("hidden");
      if (playAgainButton) {
        playAgainButton.classList.add("hidden");
      }
      view.updateDiscardableStyles(slotRefs.player, state.getPlayerCards(), false);
    }

    return {
      baseReset,
    };
  }

  window.GameStateReset = { create: createReset };
})();
