// UI update functions for displaying game state.
(() => {
  function createUIUpdates(deps, state) {
    const { deckLabel, flopButton, slotRefs, view, bankAmount, winStreak } = deps;

    function updateDeckLabel() {
      deckLabel.textContent = `Deck: ${state.getDeck().length} cards`;
    }

    function updateBankDisplay() {
      bankAmount.textContent = String(state.getBank());
      winStreak.textContent = String(state.getStreak());
    }

    function updateFlopButtonText() {
      flopButton.textContent = "See Flop";
    }

    function renderBoard(animate = true) {
      const flopCards = state.getFlopCards();
      const turnCard = state.getTurnCard();
      const riverCard = state.getRiverCard();
      
      // Track which cards are newly being shown (for animation)
      const newFlopCards = [];
      const newTurnCard = turnCard && !slotRefs.turn[0].classList.contains("has-card");
      const newRiverCard = riverCard && !slotRefs.river[0].classList.contains("has-card");
      
      slotRefs.flop.forEach((slot, idx) => {
        const card = flopCards[idx] || null;
        const isNew = card && !slot.classList.contains("has-card");
        if (isNew) {
          newFlopCards.push(slot);
          // Hide card immediately to prevent flash before animation
          slot.style.opacity = "0";
        }
        if (card) {
          view.setSlotCard(slot, card, { collapseWhenEmpty: false });
        } else {
          view.setSlotCard(slot, null, { collapseWhenEmpty: false });
        }
      });
      if (turnCard) {
        view.setSlotCard(slotRefs.turn[0], turnCard, { collapseWhenEmpty: false });
      } else {
        view.setSlotCard(slotRefs.turn[0], null, { collapseWhenEmpty: false });
      }
      if (riverCard) {
        view.setSlotCard(slotRefs.river[0], riverCard, { collapseWhenEmpty: false });
      } else {
        view.setSlotCard(slotRefs.river[0], null, { collapseWhenEmpty: false });
      }
      
      // Animate newly shown cards
      if (animate && view.animateCommunityCards) {
        if (newFlopCards.length > 0) {
          // Play sound only for flop
          view.animateCommunityCards(newFlopCards, true);
        }
        if (newTurnCard) {
          view.animateCommunityCards(slotRefs.turn, true);
        }
        if (newRiverCard) {
          view.animateCommunityCards(slotRefs.river, true);
        }
      }
    }

    return {
      updateDeckLabel,
      updateBankDisplay,
      updateFlopButtonText,
      renderBoard,
    };
  }

  window.GameStateUIUpdates = { create: createUIUpdates };
})();

