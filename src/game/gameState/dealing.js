// Card dealing functions for initial deal, turn, and river.
(() => {
  function createDealing(deps, state, constants, uiUpdates, botManagement, modeManagement) {
    const { view, slotRefs, deckUtils, flopButton, revealButton, statusLabel, botCountSlider, botCountControl, betControl, betInput, betDecrementBtn, betIncrementBtn, botRows } = deps;
    const { DEFAULT_BOT_COUNT, BOT_HOLE_CARDS } = constants;

    function dealInitial() {
      if (state.getPhaseIndex() !== 0) return;
      const deck = state.getDeck();
      const cards = deckUtils.drawCards(deck, 5);
      state.setPlayerCards(cards);
      state.setDeck(deck);
      
      const botHands = [];
      const botCount = state.getBotCount();
      for (let i = 0; i < botCount; i += 1) {
        botHands.push(deckUtils.drawCards(deck, BOT_HOLE_CARDS));
      }
      state.setBotHands(botHands);
      state.setDeck(deck);
      
      state.setBotRevealed(false);
      state.setPlayerRevealed(true);
      view.renderPlayerSlots(slotRefs.player, state.getPlayerCards(), { showPlaceholders: false, revealed: true, animate: true });
      view.renderBotSlots(slotRefs.bot, state.getBotHands(), { 
        revealed: state.getBotRevealed(), 
        showPlaceholders: false, 
        botRows: slotRefs.botRows,
        animate: true
      });
      
      flopButton.classList.remove("hidden");
      revealButton.classList.add("hidden");
      
      // Check if tutorial mode and get current stage settings
      const inTutorial = state.getCurrentMode() === 'tutorial' && window.TutorialMode;
      const tutorialConfig = inTutorial ? window.TutorialMode.getConfig() : null;
      
      // Show/hide controls based on tutorial stage
      if (inTutorial && !tutorialConfig.showBotSlider) {
        // Stage 1: Hide bot slider
        if (botCountControl) {
          botCountControl.classList.add("hidden");
        }
        botCountSlider.disabled = true;
      } else {
        // Casual mode or Tutorial Stage 2: Show bot slider
        botCountSlider.disabled = false;
        if (botCountControl) {
          botCountControl.classList.remove("hidden");
        }
      }
      
      if (inTutorial && !tutorialConfig.showBetControls) {
        // Stage 1: Hide bet controls
        if (betControl) {
          betControl.classList.add("hidden");
        }
        if (betInput) betInput.disabled = true;
        if (betDecrementBtn) betDecrementBtn.disabled = true;
        if (betIncrementBtn) betIncrementBtn.disabled = true;
        statusLabel.textContent = "Cards dealt. Click See Flop to reveal the community cards.";
      } else {
        // Casual mode or Tutorial Stage 2: Show bet controls
        if (betControl) {
          betControl.classList.remove("hidden");
        }
        if (betInput) betInput.disabled = false;
        if (betDecrementBtn) betDecrementBtn.disabled = false;
        if (betIncrementBtn) betIncrementBtn.disabled = false;
        statusLabel.textContent = "Cards dealt. Choose bots, set your bet, then click See Flop.";
      }
      
      if (botRows) {
        botRows.classList.remove("hidden");
        // Remove placeholder when showing real bot rows
        const botSectionElement = document.querySelector('.bot-section');
        if (botSectionElement) {
          const placeholder = botSectionElement.querySelector('.bot-placeholder');
          if (placeholder) {
            placeholder.remove();
          }
        }
      }
      state.setPhaseIndex(1);
      uiUpdates.updateDeckLabel();
      uiUpdates.updateFlopButtonText();
      
      // Emit tutorial event after cards are dealt
      modeManagement.emitTutorialEvent('cards-dealt');
    }

    function dealTurn(discard) {
      const deck = state.getDeck();
      const card = deckUtils.drawCards(deck, 1)[0];
      state.setTurnCard(card);
      state.setDeck(deck);
      uiUpdates.renderBoard();
      discard.requireDiscard("Discard one hole card before the River.");
      uiUpdates.updateDeckLabel();
    }

    function dealRiver(discard) {
      const deck = state.getDeck();
      const card = deckUtils.drawCards(deck, 1)[0];
      state.setRiverCard(card);
      state.setDeck(deck);
      uiUpdates.renderBoard();
      discard.requireDiscard("Discard one final hole card to finish.");
      uiUpdates.updateDeckLabel();
    }

    return {
      dealInitial,
      dealTurn,
      dealRiver,
    };
  }

  window.GameStateDealing = { create: createDealing };
})();
