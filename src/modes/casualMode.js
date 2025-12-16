// Casual Mode - Standard Mode
// The default game mode with standard rules and betting.
(() => {
  const CasualMode = {
    name: "casual",
    displayName: "Casual",
    subtitle: "Standard Mode",
    enabled: true,
    
    // Casual mode configuration
    config: {
      startingCoins: 100,
      minBet: 10,
      maxBots: 5,
      multipliers: [1.3, 1.6, 1.9, 2.1, 2.4], // Based on bot count
      allowBetAdjustment: true,
      preserveSettingsOnPlayAgain: true,
    },

    // Initialize casual mode
    init(gameState) {
      // Casual mode uses default game state settings
      return gameState;
    },

    // Calculate winnings based on bet and bot count
    calculateWinnings(bet, botCount) {
      const multiplier = this.config.multipliers[Math.min(botCount, 5) - 1];
      return Math.round(bet * multiplier);
    },

    // Get multiplier for bot count
    getMultiplier(botCount) {
      return this.config.multipliers[Math.min(Math.max(botCount, 1), 5) - 1];
    },
  };

  window.CasualMode = CasualMode;
})();



