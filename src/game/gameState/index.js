// Game state and phase control for table flow with bank and win/loss tracking.
// Main entry point that composes all gameState modules.
(() => {
  function create(deps) {
    const {
      view,
      deckUtils,
      handDescriptions,
      slotRefs,
      statusLabel,
      deckLabel,
      flopButton,
      revealButton,
      playAgainButton,
      playCasualButton,
      botCountSlider,
      botCountControl,
      botSection,
      botRows,
      bankAmount,
      winStreak,
      streakDisplay,
      bankDisplay,
      betInput,
      betDecrementBtn,
      betIncrementBtn,
      betControl,
    } = deps || {};
    const missingDeps = [];
    if (!view) missingDeps.push('view');
    if (!deckUtils) missingDeps.push('deckUtils');
    if (!handDescriptions) missingDeps.push('handDescriptions');
    if (!slotRefs) missingDeps.push('slotRefs');
    if (!statusLabel) missingDeps.push('statusLabel');
    if (!deckLabel) missingDeps.push('deckLabel');
    if (!flopButton) missingDeps.push('flopButton');
    if (!revealButton) missingDeps.push('revealButton');
    if (!botCountSlider) missingDeps.push('botCountSlider');
    if (!bankAmount) missingDeps.push('bankAmount');
    if (!winStreak) missingDeps.push('winStreak');
    
    if (missingDeps.length > 0) {
      throw new Error(`GameState missing required dependencies: ${missingDeps.join(', ')}`);
    }

    // Load constants
    if (!window.GameStateConstants) {
      throw new Error("GameStateConstants not loaded. Check script order in index.html.");
    }
    const constants = window.GameStateConstants;
    
    // Create state manager
    if (!window.GameStateState) {
      throw new Error("GameStateState not loaded. Check script order in index.html.");
    }
    const state = window.GameStateState.create(constants);
    
    // Create all modules with dependencies
    const allDeps = {
      view,
      deckUtils,
      handDescriptions,
      slotRefs,
      statusLabel,
      deckLabel,
      flopButton,
      revealButton,
      playAgainButton,
      playCasualButton,
      botCountSlider,
      botCountControl,
      botSection,
      botRows,
      bankAmount,
      winStreak,
      streakDisplay,
      bankDisplay,
      betInput,
      betDecrementBtn,
      betIncrementBtn,
      betControl,
    };
    
    // Verify all modules are loaded
    const requiredModules = [
      'GameStateUIUpdates',
      'GameStateBotManagement',
      'GameStateHandEvaluation',
      'GameStateBetting',
      'GameStateModeManagement',
      'GameStateReset',
      'GameStateDealing',
      'GameStateDiscard',
      'GameStateActions',
    ];
    
    for (const moduleName of requiredModules) {
      if (!window[moduleName]) {
        throw new Error(`${moduleName} not loaded. Check script order in index.html.`);
      }
    }
    
    const uiUpdates = window.GameStateUIUpdates.create(allDeps, state);
    const betting = window.GameStateBetting.create(allDeps, state, constants, uiUpdates);
    const modeManagement = window.GameStateModeManagement.create(allDeps, state, uiUpdates);
    const botManagement = window.GameStateBotManagement.create(allDeps, state, constants, uiUpdates);
    const handEvaluation = window.GameStateHandEvaluation.create(allDeps, state, constants, uiUpdates);
    const reset = window.GameStateReset.create(allDeps, state, constants, uiUpdates);
    
    // Create dealing module (needs modeManagement)
    const dealing = window.GameStateDealing.create(allDeps, state, constants, uiUpdates, botManagement, modeManagement);
    
    // Create discard module (needs dealing for dealTurn/dealRiver)
    const discard = window.GameStateDiscard.create(allDeps, state, uiUpdates, dealing, null);
    
    // Create actions module (needs discard)
    const actions = window.GameStateActions.create(allDeps, state, constants, uiUpdates, betting, botManagement, handEvaluation, dealing, reset, discard);
    
    // Update discard to use actions for tutorial events
    const discardFinal = {
      requireDiscard: discard.requireDiscard,
      handlePlayerDiscard: (idx) => {
        if (!state.getDiscardRequired()) return;
        if (idx < 0 || idx >= state.getPlayerCards().length) return;
        
        // Play click sound for discard
        if (window.GameSounds) {
          window.GameSounds.playClick();
        }
        
        // Get the slot element for the card being discarded
        const slot = slotRefs.player[idx];
        
        // Disable further discards during animation
        state.setDiscardRequired(false);
        view.updateDiscardableStyles(slotRefs.player, state.getPlayerCards(), false);
        
        // Animate the discard, then process it
        const processDiscard = () => {
          const playerCards = state.getPlayerCards();
          playerCards.splice(idx, 1);
          state.setPlayerCards(playerCards);
          view.renderPlayerSlots(slotRefs.player, state.getPlayerCards(), { 
            showPlaceholders: false, 
            revealed: state.getPlayerRevealed() 
          });
          
          // Emit tutorial event for discard
          modeManagement.emitTutorialEvent('card-discarded');

          const phaseIndex = state.getPhaseIndex();
          if (phaseIndex === 2) {
            // Delay before dealing turn card
            setTimeout(() => {
              dealing.dealTurn(discardFinal);
              state.setPhaseIndex(3);
            }, 400);
          } else if (phaseIndex === 3) {
            // Delay before dealing river card
            setTimeout(() => {
              dealing.dealRiver(discardFinal);
              state.setPhaseIndex(4);
            }, 400);
          } else if (phaseIndex >= 4) {
            statusLabel.textContent = "Final discard complete. Press Reveal Bot Hand.";
            revealButton.classList.remove("hidden");
          }
        };
        
        // Use animation if available, otherwise process immediately
        if (view.animateDiscard) {
          view.animateDiscard(slot, processDiscard);
        } else {
          processDiscard();
        }
      },
    };
    
    // Update actions to use final discard
    const actionsFinal = {
      handleSeeFlop: () => {
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
        discardFinal.requireDiscard("Discard one hole card before the Turn.");
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
      },
      handleRevealBot: () => {
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
      },
      handlePlayAgain: () => {
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
          state.setCurrentBet(Math.max(constants.MIN_BET, bank));
        }
        if (betInput) {
          betInput.value = String(state.getCurrentBet());
        }
        
        // Immediately deal cards (skip start screen)
        dealing.dealInitial();
      },
    };

    return {
      baseReset: reset.baseReset,
      dealNextPhase: dealing.dealInitial, // start button uses this
      handleSeeFlop: actionsFinal.handleSeeFlop,
      handleRevealBot: actionsFinal.handleRevealBot,
      handlePlayerDiscard: discardFinal.handlePlayerDiscard,
      handlePlayAgain: actionsFinal.handlePlayAgain,
      setBotCount: botManagement.setBotCount,
      setBet: betting.setBet,
      getBet: betting.getBet,
      getBank: betting.getBank,
      setMode: modeManagement.setMode,
      getMode: modeManagement.getMode,
      getLastResult: modeManagement.getLastResult,
      showTutorialStep: modeManagement.showTutorialStep,
      emitTutorialEvent: modeManagement.emitTutorialEvent,
    };
  }

  window.GameState = { create };
})();

