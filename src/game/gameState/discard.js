// Discard logic for player card discards.
(() => {
  function createDiscard(deps, state, uiUpdates, dealing, actions) {
    const { view, slotRefs, statusLabel, revealButton } = deps;

    function requireDiscard(message) {
      state.setDiscardRequired(true);
      statusLabel.textContent = message;
      view.updateDiscardableStyles(slotRefs.player, state.getPlayerCards(), true);
    }

    function handlePlayerDiscard(idx, modeManagement) {
      if (!state.getDiscardRequired()) return;
      if (idx < 0 || idx >= state.getPlayerCards().length) return;
      
      // Play click sound for every discard
      if (window.GameSounds) {
        window.GameSounds.playClick();
      }
      
      const playerCards = state.getPlayerCards();
      playerCards.splice(idx, 1);
      state.setPlayerCards(playerCards);
      view.renderPlayerSlots(slotRefs.player, state.getPlayerCards(), { 
        showPlaceholders: false, 
        revealed: state.getPlayerRevealed() 
      });
      state.setDiscardRequired(false);
      view.updateDiscardableStyles(slotRefs.player, state.getPlayerCards(), false);
      
      // Emit tutorial event for discard
      modeManagement.emitTutorialEvent('card-discarded');

      const phaseIndex = state.getPhaseIndex();
      if (phaseIndex === 2) {
        // Delay before dealing turn card
        setTimeout(() => {
          dealing.dealTurn({ requireDiscard });
          state.setPhaseIndex(3);
        }, 400);
      } else if (phaseIndex === 3) {
        // Delay before dealing river card
        setTimeout(() => {
          dealing.dealRiver({ requireDiscard });
          state.setPhaseIndex(4);
        }, 400);
      } else if (phaseIndex >= 4) {
        statusLabel.textContent = "Final discard complete. Press Reveal Bot Hand.";
        revealButton.classList.remove("hidden");
      }
    }

    return {
      requireDiscard,
      handlePlayerDiscard,
    };
  }

  window.GameStateDiscard = { create: createDiscard };
})();

