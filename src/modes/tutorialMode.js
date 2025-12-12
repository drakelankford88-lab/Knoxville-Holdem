// Tutorial Mode - Learn to Play
// Two-stage tutorial: Stage 1 = basics (no betting), Stage 2 = settings
(() => {
  // Tutorial state
  const state = {
    isActive: false,
    stage: 1,           // 1 = basics, 2 = settings
    stepIndex: 0,       // Current step within stage
    roundsCompleted: 0, // 0, 1, or 2
    waitingFor: null,   // What event we're waiting for
  };

  // Mode configuration
  const config = {
    name: "tutorial",
    displayName: "Play Tutorial",
    subtitle: "Learn to Play",
    enabled: true,
    botCount: 1,
    showBetControls: false,
    showBotSlider: false,
    fixedBet: 10,
  };

  // Get current steps based on stage
  function getCurrentSteps() {
    if (!window.TutorialSteps) return [];
    return state.stage === 1 ? window.TutorialSteps.stage1 : window.TutorialSteps.stage2;
  }

  // Get current step
  function getCurrentStep() {
    const steps = getCurrentSteps();
    return steps[state.stepIndex] || null;
  }

  // Start the tutorial
  function start() {
    state.isActive = true;
    state.stage = 1;
    state.stepIndex = 0;
    state.roundsCompleted = 0;
    state.waitingFor = null;
    
    // Stage 1 config - no betting or bot controls
    config.showBetControls = false;
    config.showBotSlider = false;
    config.botCount = 1;
    
    console.log('[Tutorial] Started - Stage 1');
  }

  // Show current step bubble
  function showCurrentStep() {
    const step = getCurrentStep();
    if (!step || !window.TutorialBubble) return;
    
    // Skip if message is null (dynamic steps before result is known)
    if (!step.message && !step.isDynamic) return;
    
    const targetElement = document.querySelector(step.target);
    if (!targetElement && step.target) {
      console.warn('[Tutorial] Target not found:', step.target);
      return;
    }
    
    state.waitingFor = step.waitFor;
    
    if (step.message) {
      window.TutorialBubble.show(targetElement, step.message, {
        highlight: step.highlight !== false,
        showNextButton: step.showNextButton === true,
        position: step.position || 'auto', // Use step's position or default to auto
      });
    }
    
    console.log('[Tutorial] Showing step:', step.id, '| Waiting for:', step.waitFor);
  }

  // Advance to next step
  function nextStep() {
    const steps = getCurrentSteps();
    state.stepIndex++;
    state.waitingFor = null;
    
    if (window.TutorialBubble) {
      window.TutorialBubble.hide();
    }
    
    if (state.stepIndex < steps.length) {
      // Small delay before showing next step
      setTimeout(() => showCurrentStep(), 300);
    } else {
      console.log('[Tutorial] Stage', state.stage, 'complete');
    }
  }

  // Handle tutorial events from game
  function handleEvent(eventType, data = {}) {
    if (!state.isActive) return;
    
    const step = getCurrentStep();
    if (!step) return;
    
    console.log('[Tutorial] Event:', eventType, '| Waiting for:', state.waitingFor);
    
    // Check if this event matches what we're waiting for
    let shouldAdvance = false;
    
    switch (state.waitingFor) {
      case 'click-target':
        // For click-target, we advance when the target is clicked
        // This is handled by the click listener added in bindings
        if (eventType === 'target-clicked') {
          shouldAdvance = true;
        }
        break;
        
      case 'discard':
        if (eventType === 'card-discarded') {
          shouldAdvance = true;
        }
        break;
        
      case 'bet-changed':
        if (eventType === 'bet-changed') {
          shouldAdvance = true;
        }
        break;
    }
    
    if (shouldAdvance) {
      nextStep();
    }
  }

  // Called when a round ends (after reveal)
  function handleRoundEnd(result) {
    if (!state.isActive) return;
    
    state.roundsCompleted++;
    console.log('[Tutorial] Round ended. Rounds completed:', state.roundsCompleted);
    
    const step = getCurrentStep();
    
    // Show dynamic result message
    if (step && step.isDynamic && window.TutorialSteps && window.TutorialBubble) {
      let message;
      
      if (state.stage === 1) {
        message = window.TutorialSteps.getStage1ResultMessage(
          result.handName,
          result.won
        );
      } else {
        message = window.TutorialSteps.getStage2ResultMessage(
          result.handName,
          result.won,
          result.bet,
          result.multiplier,
          result.winnings
        );
      }
      
      const targetElement = document.querySelector(step.target);
      window.TutorialBubble.show(targetElement, message, { 
        highlight: false,
        showNextButton: step.showNextButton === true,
        position: step.position || 'auto',
      });
      state.waitingFor = 'click-target';
    }
  }

  // Called after result is clicked (to transition stages or end tutorial)
  function handleResultClicked() {
    if (!state.isActive) return;
    
    const step = getCurrentStep();
    
    if (window.TutorialBubble) {
      window.TutorialBubble.hide();
    }
    
    if (state.stage === 1 && state.roundsCompleted >= 1) {
      // Move to stage 2
      state.stage = 2;
      state.stepIndex = 0;
      state.waitingFor = null;
      
      // Stage 2 config - show betting and bot controls
      config.showBetControls = true;
      config.showBotSlider = true;
      
      console.log('[Tutorial] Moving to Stage 2');
      return 'start-stage-2';
    } else if (state.stage === 2 && step && step.isFinal) {
      // Tutorial complete
      console.log('[Tutorial] Complete!');
      return 'tutorial-complete';
    }
    
    return null;
  }

  // Check if we're at the final step (show Play Casual instead of Play Again)
  function isAtFinalStep() {
    if (!state.isActive) return false;
    const step = getCurrentStep();
    return step && step.isFinal && state.roundsCompleted >= 2;
  }

  // Check if we're in stage 2 gameplay (after initial settings explanation)
  function isInStage2Gameplay() {
    if (!state.isActive) return false;
    if (state.stage !== 2) return false;
    // If we're past the "play-round-2" step, we're in gameplay
    const step = getCurrentStep();
    return step && (step.id === 'result-2' || state.stepIndex > 3);
  }

  // Reset tutorial state
  function reset() {
    state.isActive = false;
    state.stage = 1;
    state.stepIndex = 0;
    state.roundsCompleted = 0;
    state.waitingFor = null;
    
    config.showBetControls = false;
    config.showBotSlider = false;
    config.botCount = 1;
    
    if (window.TutorialBubble) {
      window.TutorialBubble.hide();
    }
  }

  // Get current config
  function getConfig() {
    return { ...config };
  }

  // Get current state
  function getState() {
    return { ...state };
  }

  window.TutorialMode = {
    config,
    start,
    reset,
    getConfig,
    getState,
    getCurrentStep,
    showCurrentStep,
    nextStep,
    handleEvent,
    handleRoundEnd,
    handleResultClicked,
    isAtFinalStep,
    isInStage2Gameplay,
  };
})();
