// Bot management functions for adding/removing bots and revealing bot hands.
(() => {
  function createBotManagement(deps, state, constants, uiUpdates) {
    const { view, slotRefs, deckUtils, botCountSlider, botCountControl, statusLabel } = deps;
    const { BOT_HOLE_CARDS, MIN_BOT, MAX_BOT } = constants;

    function botReveal() {
      state.setBotRevealed(true);
      view.renderBotSlots(slotRefs.bot, state.getBotHands(), { 
        revealed: state.getBotRevealed(), 
        botRows: slotRefs.botRows,
        animateReveal: true
      });
    }

    function setBotCount(nextCount) {
      const clamped = Math.max(MIN_BOT, Math.min(MAX_BOT, nextCount));
      if (state.getPhaseIndex() !== 1 || state.getBotSelectionLocked()) {
        statusLabel.textContent = "Bot count can only change after the deal and before the flop.";
        botCountSlider.value = String(state.getBotCount());
        return;
      }
      if (clamped === state.getBotCount()) return;

      const deck = state.getDeck();
      const botHands = state.getBotHands();

      if (clamped > state.getBotCount()) {
        const seatsToAdd = clamped - state.getBotCount();
        const cardsNeeded = seatsToAdd * BOT_HOLE_CARDS;
        if (deck.length < cardsNeeded) {
          statusLabel.textContent = "Not enough cards to add more bot opponents.";
          botCountSlider.value = String(state.getBotCount());
          return;
        }
        for (let i = 0; i < seatsToAdd; i += 1) {
          botHands.push(deckUtils.drawCards(deck, BOT_HOLE_CARDS));
          // Play deal sound for each new bot's cards
          if (window.GameSounds) {
            setTimeout(() => {
              window.GameSounds.playCardDeal();
            }, i * 150);
            setTimeout(() => {
              window.GameSounds.playCardDeal();
            }, i * 150 + 80);
          }
        }
        state.setDeck(deck);
        state.setBotHands(botHands);
      } else {
        const removed = botHands.splice(clamped);
        // Play click sound for each bot removed
        if (window.GameSounds) {
          for (let i = 0; i < removed.length; i++) {
            setTimeout(() => {
              window.GameSounds.playClick();
            }, i * 100);
          }
        }
        removed.flat().forEach((card) => deck.push(card));
        deckUtils.shuffleDeck(deck);
        state.setDeck(deck);
        state.setBotHands(botHands);
      }

      state.setBotCount(clamped);
      botCountSlider.value = String(clamped);
      view.renderBotSlots(slotRefs.bot, state.getBotHands(), { 
        revealed: state.getBotRevealed(), 
        showPlaceholders: false, 
        botRows: slotRefs.botRows 
      });
      uiUpdates.updateDeckLabel();
      const suffix = clamped > 1 ? "bots" : "bot";
      statusLabel.textContent = `Playing against ${clamped} ${suffix}. Adjust your bet and click See Flop to continue.`;
    }

    return {
      botReveal,
      setBotCount,
    };
  }

  window.GameStateBotManagement = { create: createBotManagement };
})();

