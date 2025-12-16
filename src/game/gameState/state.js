// Core game state variables and state management.
(() => {
  function createState(constants) {
    const { DEFAULT_BOT_COUNT } = constants;
    
    // phaseIndex: 0 not dealt, 1 waiting for flop button, 2 discard then deal Turn, 3 discard then deal River, 4 discard then reveal.
    let phaseIndex = 0;
    let deck = [];
    let playerCards = [];
    let botHands = [];
    let botRevealed = false;
    let playerRevealed = true;
    let discardRequired = false;
    let flopCards = [];
    let turnCard = null;
    let riverCard = null;
    let flopUsed = false;
    let botCount = DEFAULT_BOT_COUNT;
    let botSelectionLocked = false;
    let currentMode = "casual"; // "casual" or "tutorial"
    
    // Separate state for each mode (both work the same, just independent)
    const modeState = {
      casual: {
        bank: constants.START_BANK,
        streak: 0,
        currentBet: constants.MIN_BET,
        botCount: DEFAULT_BOT_COUNT,
      },
      tutorial: {
        bank: constants.START_BANK,
        streak: 0,
        currentBet: constants.MIN_BET,
        botCount: DEFAULT_BOT_COUNT,
      }
    };
    
    // Current active state (points to mode-specific state)
    let bank = modeState.casual.bank;
    let streak = modeState.casual.streak;
    let currentBet = modeState.casual.currentBet;

    // Store last result for tutorial
    let lastResult = null;

    return {
      // Getters
      getPhaseIndex: () => phaseIndex,
      getDeck: () => deck,
      getPlayerCards: () => playerCards,
      getBotHands: () => botHands,
      getBotRevealed: () => botRevealed,
      getPlayerRevealed: () => playerRevealed,
      getDiscardRequired: () => discardRequired,
      getFlopCards: () => flopCards,
      getTurnCard: () => turnCard,
      getRiverCard: () => riverCard,
      getFlopUsed: () => flopUsed,
      getBotCount: () => botCount,
      getBotSelectionLocked: () => botSelectionLocked,
      getCurrentMode: () => currentMode,
      getBank: () => bank,
      getStreak: () => streak,
      getCurrentBet: () => currentBet,
      getLastResult: () => lastResult,
      getModeState: () => modeState,
      
      // Setters
      setPhaseIndex: (val) => { phaseIndex = val; },
      setDeck: (val) => { deck = val; },
      setPlayerCards: (val) => { playerCards = val; },
      setBotHands: (val) => { botHands = val; },
      setBotRevealed: (val) => { botRevealed = val; },
      setPlayerRevealed: (val) => { playerRevealed = val; },
      setDiscardRequired: (val) => { discardRequired = val; },
      setFlopCards: (val) => { flopCards = val; },
      setTurnCard: (val) => { turnCard = val; },
      setRiverCard: (val) => { riverCard = val; },
      setFlopUsed: (val) => { flopUsed = val; },
      setBotCount: (val) => { botCount = val; },
      setBotSelectionLocked: (val) => { botSelectionLocked = val; },
      setCurrentMode: (val) => { currentMode = val; },
      setBank: (val) => { bank = val; },
      setStreak: (val) => { streak = val; },
      setCurrentBet: (val) => { currentBet = val; },
      setLastResult: (val) => { lastResult = val; },
      
      // Mode state management
      saveModeState: () => {
        modeState[currentMode].bank = bank;
        modeState[currentMode].streak = streak;
        modeState[currentMode].currentBet = currentBet;
        modeState[currentMode].botCount = botCount;
      },
      loadModeState: (mode) => {
        bank = modeState[mode].bank;
        streak = modeState[mode].streak;
        currentBet = modeState[mode].currentBet;
        botCount = modeState[mode].botCount;
      },
    };
  }

  window.GameStateState = { create: createState };
})();
