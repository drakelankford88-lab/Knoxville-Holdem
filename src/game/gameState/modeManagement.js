// Mode management for switching between casual and tutorial modes.
(() => {
  function createModeManagement(deps, state, uiUpdates) {
    const { botCountSlider, betInput, bankDisplay, streakDisplay } = deps;

    function setMode(mode) {
      // Save current mode state before switching
      state.saveModeState();
      
      // Switch to new mode
      state.setCurrentMode(mode);
      
      // Load new mode state
      state.loadModeState(mode);
      
      // Update UI
      botCountSlider.value = String(state.getBotCount());
      if (betInput) {
        betInput.value = String(state.getCurrentBet());
      }
      
      // Always show bank display (both modes use coins)
      if (bankDisplay) {
        bankDisplay.classList.remove("hidden");
      }
      
      // Hide win streak in tutorial mode
      if (streakDisplay) {
        if (mode === "tutorial") {
          streakDisplay.classList.add("hidden");
        } else {
          streakDisplay.classList.remove("hidden");
        }
      }
      
      uiUpdates.updateBankDisplay();
    }

    function getMode() {
      return state.getCurrentMode();
    }

    function emitTutorialEvent(eventType, data = {}) {
      if (state.getCurrentMode() === 'tutorial' && window.TutorialMode) {
        window.TutorialMode.handleEvent(eventType, data);
      }
    }

    function showTutorialStep() {
      if (state.getCurrentMode() === 'tutorial' && window.TutorialMode) {
        window.TutorialMode.showCurrentStep();
      }
    }

    function getLastResult() {
      return state.getLastResult();
    }

    return {
      setMode,
      getMode,
      emitTutorialEvent,
      showTutorialStep,
      getLastResult,
    };
  }

  window.GameStateModeManagement = { create: createModeManagement };
})();
