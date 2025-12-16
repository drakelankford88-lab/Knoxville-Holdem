// Game constants and configuration values.
(() => {
  // Supports 1-5 bot opponents (two hole cards each), selected after the initial deal and locked once the flop is shown.
  const START_BANK = 100;
  const MIN_BET = 10;
  // Multipliers based on bot count: 1 bot = 1.3x, 2 = 1.6x, 3 = 1.9x, 4 = 2.1x, 5 = 2.4x
  const BOT_MULTIPLIERS = [1.3, 1.6, 1.9, 2.1, 2.4];
  const MAX_BOT = 5;
  const MIN_BOT = 1;
  const DEFAULT_BOT_COUNT = 1;
  const BOT_HOLE_CARDS = 2;
  
  // Helper to get current multiplier based on bot count
  function getMultiplier(count) {
    return BOT_MULTIPLIERS[Math.min(Math.max(count, 1), 5) - 1];
  }

  window.GameStateConstants = {
    START_BANK,
    MIN_BET,
    BOT_MULTIPLIERS,
    MAX_BOT,
    MIN_BOT,
    DEFAULT_BOT_COUNT,
    BOT_HOLE_CARDS,
    getMultiplier,
  };
})();
