// Event wiring between DOM and game state.
(() => {
  const MIN_BET = 10;
  let currentMode = "casual"; // Track current mode: "casual" or "tutorial"
  let game = null; // Store game reference for tutorial handlers

  function bind(gameRef, refs, statusUI) {
    if (!gameRef || !refs || !statusUI) return;
    game = gameRef;

    const { startButton, flopButton, revealButton, resetButton, mainMenuButton, playAgainButton, playCasualButton, botCountSlider, botSliderTooltip, betInput, betDecrementBtn, betIncrementBtn, slotRefs, startScreen, gameScreen, modeCasualButton, modeTutorialButton, betControl, botCountControl } = refs;

    function goToStartScreen() {
      game.baseReset();
      // Reset bet to minimum on full reset (only matters for casual mode)
      if (currentMode === "casual") {
        game.setBet(MIN_BET);
      }
      statusUI.showStart(refs);
      statusUI.setStatus(refs, "Click Deal Cards to begin.");
    }

    function showModeSelect() {
      // Hide tutorial bubble if visible
      if (window.TutorialBubble) {
        window.TutorialBubble.hide();
      }
      // Reset tutorial if active
      if (window.TutorialMode) {
        window.TutorialMode.reset();
      }
      // Reset game state when returning to menu
      game.baseReset();
      // Show start screen, hide game screen
      if (startScreen) {
        startScreen.classList.remove("hidden");
      }
      if (gameScreen) {
        gameScreen.classList.add("hidden");
      }
    }

    function startCasualMode() {
      currentMode = "casual";
      game.setMode("casual");
      // Hide start screen, show game screen
      if (startScreen) {
        startScreen.classList.add("hidden");
      }
      if (gameScreen) {
        gameScreen.classList.remove("hidden");
      }
      goToStartScreen();
    }

    function startTutorialMode() {
      currentMode = "tutorial";
      game.setMode("tutorial");
      
      // Initialize tutorial system
      if (window.TutorialMode) {
        window.TutorialMode.start();
      }
      
      // Hide start screen, show game screen
      if (startScreen) {
        startScreen.classList.add("hidden");
      }
      if (gameScreen) {
        gameScreen.classList.remove("hidden");
      }
      
      // Reset and start the game
      game.baseReset();
      statusUI.showPlaying(refs, "tutorial");
      game.dealNextPhase();
      
      // Show first tutorial step after cards are dealt
      setTimeout(() => {
        if (window.TutorialMode) {
          window.TutorialMode.showCurrentStep();
        }
      }, 500);
    }

    function startGame() {
      game.baseReset();
      statusUI.showPlaying(refs, currentMode);
      game.dealNextPhase();
      
      // If in tutorial mode, show the tutorial step
      if (currentMode === 'tutorial' && window.TutorialMode) {
        setTimeout(() => {
          window.TutorialMode.showCurrentStep();
        }, 500);
      }
    }

    // Helper to format bot count text
    function formatBotText(count) {
      return count === 1 ? "1 Bot" : `${count} Bots`;
    }

    // Update tooltip position based on slider value
    function updateTooltipPosition() {
      if (!botCountSlider || !botSliderTooltip) return;
      const val = Number(botCountSlider.value);
      const min = Number(botCountSlider.min);
      const max = Number(botCountSlider.max);
      const percent = (val - min) / (max - min);
      const sliderWidth = botCountSlider.offsetWidth;
      const thumbWidth = 22; // Match CSS thumb width
      const position = percent * (sliderWidth - thumbWidth) + (thumbWidth / 2);
      botSliderTooltip.style.left = `${position}px`;
      botSliderTooltip.textContent = formatBotText(val);
    }

    // Update tick marks to highlight active one
    function updateTickMarks(value) {
      const ticks = document.querySelectorAll('.bot-slider-ticks .tick');
      ticks.forEach(tick => {
        const tickVal = Number(tick.dataset.value);
        tick.classList.toggle('active', tickVal === value);
      });
    }

    // Handle tutorial target clicks
    function handleTutorialTargetClick(element) {
      if (currentMode !== 'tutorial' || !window.TutorialMode) return;
      
      const state = window.TutorialMode.getState();
      if (!state.isActive) return;
      
      const step = window.TutorialMode.getCurrentStep();
      if (!step) return;
      
      // Check if the clicked element is the current target
      const targetElement = document.querySelector(step.target);
      if (targetElement && (element === targetElement || targetElement.contains(element))) {
        window.TutorialMode.handleEvent('target-clicked');
      }
    }

    // Handle result click in tutorial (transition stages or end tutorial)
    function handleTutorialResultClick() {
      if (currentMode !== 'tutorial' || !window.TutorialMode) return null;
      
      const result = window.TutorialMode.handleResultClicked();
      
      if (result === 'start-stage-2') {
        // Start stage 2 - play again with settings visible
        game.handlePlayAgain();
        setTimeout(() => {
          window.TutorialMode.showCurrentStep();
        }, 500);
        return true;
      } else if (result === 'tutorial-complete') {
        // Tutorial is done - Play Casual button should already be visible
        return true;
      }
      
      return false;
    }

    // Global click handler for tutorial
    document.addEventListener('click', (e) => {
      if (currentMode !== 'tutorial' || !window.TutorialMode) return;
      
      const state = window.TutorialMode.getState();
      if (!state.isActive) return;
      
      const step = window.TutorialMode.getCurrentStep();
      if (!step) return;
      
      // If waiting for click-target, allow clicking anywhere to advance
      if (state.waitingFor === 'click-target') {
        // Check if this is a result step (waiting for click to continue)
        if (step.isDynamic) {
          const handled = handleTutorialResultClick();
          if (handled) return;
        }
        
        // Allow clicking anywhere to advance (not just target element)
        // Use setTimeout to let any game actions complete first, then advance tutorial
        setTimeout(() => {
          window.TutorialMode.handleEvent('target-clicked');
        }, 50);
      }
    });

    slotRefs.player.forEach((slot) => {
      slot.addEventListener("click", () => {
        const cardIdx = Number(slot.dataset.cardIndex);
        if (Number.isNaN(cardIdx)) return;
        game.handlePlayerDiscard(cardIdx);
      });
    });

    startButton.addEventListener("click", startGame);
    
    // Slider event handling
    if (botCountSlider) {
      // Real-time updates while dragging
      botCountSlider.addEventListener("input", () => {
        const parsed = Number(botCountSlider.value);
        if (Number.isNaN(parsed)) return;
        updateTooltipPosition();
        updateTickMarks(parsed);
        game.setBotCount(parsed);
      });

      // Show tooltip on interaction start
      botCountSlider.addEventListener("mousedown", () => {
        if (botSliderTooltip) {
          updateTooltipPosition();
          botSliderTooltip.classList.add("visible");
        }
      });

      botCountSlider.addEventListener("touchstart", () => {
        if (botSliderTooltip) {
          updateTooltipPosition();
          botSliderTooltip.classList.add("visible");
        }
      });

      // Hide tooltip when interaction ends
      document.addEventListener("mouseup", () => {
        if (botSliderTooltip) {
          botSliderTooltip.classList.remove("visible");
        }
      });

      document.addEventListener("touchend", () => {
        if (botSliderTooltip) {
          botSliderTooltip.classList.remove("visible");
        }
      });

      // Initialize tick marks
      updateTickMarks(Number(botCountSlider.value));
    }

    // Bet control event handling
    if (betInput) {
      // Only validate and apply bet on blur (when user clicks away or presses enter)
      // This allows user to clear the field and type a new number
      betInput.addEventListener("blur", () => {
        const parsed = Number(betInput.value);
        // If empty or invalid or below minimum, reset to minimum
        if (betInput.value === "" || Number.isNaN(parsed) || parsed < MIN_BET) {
          game.setBet(MIN_BET);
        } else {
          game.setBet(parsed);
        }
      });

      // Handle Enter key to apply the bet
      betInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          betInput.blur(); // Trigger blur validation
        }
      });
    }

    if (betDecrementBtn) {
      betDecrementBtn.addEventListener("click", () => {
        const currentBet = game.getBet();
        const newBet = Math.max(MIN_BET, currentBet - 10);
        game.setBet(newBet);
        // Emit bet-changed event for tutorial
        if (currentMode === 'tutorial') {
          game.emitTutorialEvent('bet-changed');
        }
      });
    }

    if (betIncrementBtn) {
      betIncrementBtn.addEventListener("click", () => {
        const currentBet = game.getBet();
        const currentBank = game.getBank();
        const newBet = Math.min(currentBank, currentBet + 10);
        game.setBet(newBet);
        // Emit bet-changed event for tutorial
        if (currentMode === 'tutorial') {
          game.emitTutorialEvent('bet-changed');
        }
      });
    }

    flopButton.addEventListener("click", () => game.handleSeeFlop());
    revealButton.addEventListener("click", () => game.handleRevealBot());
    playAgainButton.addEventListener("click", () => {
      game.handlePlayAgain();
      // If in tutorial, show next step after play again
      if (currentMode === 'tutorial' && window.TutorialMode) {
        setTimeout(() => {
          window.TutorialMode.showCurrentStep();
        }, 500);
      }
    });
    resetButton.addEventListener("click", goToStartScreen);
    
    // Main menu button - goes back to mode selector
    if (mainMenuButton) {
      mainMenuButton.addEventListener("click", showModeSelect);
    }
    
    // Play Casual button (end of tutorial)
    if (playCasualButton) {
      playCasualButton.addEventListener("click", () => {
        // Hide tutorial bubble
        if (window.TutorialBubble) {
          window.TutorialBubble.hide();
        }
        // Reset tutorial
        if (window.TutorialMode) {
          window.TutorialMode.reset();
        }
        // Hide Play Casual button
        playCasualButton.classList.add("hidden");
        // Start casual mode
        startCasualMode();
      });
    }
    
    // Mode selection buttons
    if (modeCasualButton) {
      modeCasualButton.addEventListener("click", startCasualMode);
    }
    if (modeTutorialButton) {
      modeTutorialButton.addEventListener("click", startTutorialMode);
    }

    // Initialize UI - show mode select screen
    showModeSelect();
  }

  window.Bindings = { bind };
})();
