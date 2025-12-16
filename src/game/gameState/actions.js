// Action handlers for user interactions (flop, reveal, play again).
(() => {
  function createActions(deps, state, constants, uiUpdates, betting, botManagement, handEvaluation, dealing, reset, discard) {
    const { statusLabel, flopButton, revealButton, playAgainButton, playCasualButton, botCountSlider, botCountControl, betControl, betInput, betDecrementBtn, betIncrementBtn, deckUtils, view, slotRefs } = deps;
    const { MIN_BET } = constants;

    function handleSeeFlop() {
      if (state.getFlopUsed() || state.getPhaseIndex() !== 1) {
        statusLabel.textContent = "Flop already dealt or not ready.";
        return;
      }
      const botHands = state.getBotHands();
      const botCount = state.getBotCount();
      if (botHands.length !== botCount) {
        botManagement.setBotCount(botCount);
      }
      // Deduct bet in both modes
      const currentBet = state.getCurrentBet();
      const bank = state.getBank();
      if (bank < currentBet) {
        statusLabel.textContent = `Not enough coins for ${currentBet} coin bet. Lower your bet or reset.`;
        flopButton.disabled = true;
        return;
      }
      state.setBank(Math.max(0, bank - currentBet));
      uiUpdates.updateBankDisplay();
      const deck = state.getDeck();
      const cards = deckUtils.drawCards(deck, 3);
      state.setFlopCards(cards);
      state.setDeck(deck);
      uiUpdates.renderBoard();
      state.setPlayerRevealed(true);
      state.setFlopUsed(true);
      view.renderPlayerSlots(slotRefs.player, state.getPlayerCards(), { showPlaceholders: false, revealed: true });
      discard.requireDiscard("Discard one hole card before the Turn.");
      flopButton.classList.add("hidden");
      state.setBotSelectionLocked(true);
      botCountSlider.disabled = true;
      botCountSlider.classList.add("locked");
      if (botCountControl) {
        botCountControl.classList.add("hidden");
      }
      // Hide and disable bet control after flop is seen
      if (betControl) {
        betControl.classList.add("hidden");
      }
      if (betInput) {
        betInput.disabled = true;
      }
      if (betDecrementBtn) {
        betDecrementBtn.disabled = true;
      }
      if (betIncrementBtn) {
        betIncrementBtn.disabled = true;
      }
      state.setPhaseIndex(2); // next discard auto-deals Turn
      uiUpdates.updateDeckLabel();
    }

    function handleRevealBot() {
      if (state.getPhaseIndex() < 4) {
        statusLabel.textContent = "Finish discarding before revealing.";
        return;
      }
      revealButton.classList.add("hidden");
      botManagement.botReveal();
      handEvaluation.showFinalHand();
      
      // Check if tutorial is at final step
      const inTutorial = state.getCurrentMode() === 'tutorial' && window.TutorialMode;
      const isAtFinal = inTutorial && window.TutorialMode.isAtFinalStep();
      
      if (isAtFinal && playCasualButton) {
        // Show Play Casual button instead of Play Again
        playCasualButton.classList.remove("hidden");
        if (playAgainButton) {
          playAgainButton.classList.add("hidden");
        }
      } else if (playAgainButton) {
        // Show Play Again button after revealing
        playAgainButton.classList.remove("hidden");
      }
    }

    function handlePlayAgain() {
      // Hide play again button
      if (playAgainButton) {
        playAgainButton.classList.add("hidden");
      }
      
      // Save previous settings before reset
      const prevBotCount = state.getBotCount();
      const prevBet = state.getCurrentBet();
      
      // Reset game state
      reset.baseReset();
      
      // Restore bot count from previous game
      state.setBotCount(prevBotCount);
      botCountSlider.value = String(prevBotCount);
      
      // Restore bet, adjusting if player can't afford it
      const bank = state.getBank();
      if (prevBet <= bank) {
        state.setCurrentBet(prevBet);
      } else {
        // Set to max they can afford (but at least MIN_BET)
        state.setCurrentBet(Math.max(MIN_BET, bank));
      }
      if (betInput) {
        betInput.value = String(state.getCurrentBet());
      }
      
      // Immediately deal cards (skip start screen)
      dealing.dealInitial();
    }

    return {
      handleSeeFlop,
      handleRevealBot,
      handlePlayAgain,
    };
  }

  window.GameStateActions = { create: createActions };
})();
