// Betting logic for setting and getting bets.
(() => {
  function createBetting(deps, state, constants, uiUpdates) {
    const { betInput, flopButton } = deps;
    const { MIN_BET } = constants;

    function setBet(amount) {
      const parsed = Number(amount);
      if (Number.isNaN(parsed)) return;
      // Clamp bet between MIN_BET and current bank
      const clamped = Math.max(MIN_BET, Math.min(state.getBank(), parsed));
      state.setCurrentBet(clamped);
      // Update the input to show the clamped value
      if (betInput) {
        betInput.value = String(clamped);
      }
      uiUpdates.updateFlopButtonText();
    }

    function getBet() {
      return state.getCurrentBet();
    }

    function getBank() {
      return state.getBank();
    }

    return {
      setBet,
      getBet,
      getBank,
    };
  }

  window.GameStateBetting = { create: createBetting };
})();
