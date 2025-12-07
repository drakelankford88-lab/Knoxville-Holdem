// Event wiring between DOM and game state.
(() => {
  function bind(game, refs, statusUI) {
    if (!game || !refs || !statusUI) return;

    const { startButton, dealButton, resetButton, slotRefs } = refs;

    function goToStartScreen() {
      game.baseReset();
      statusUI.showStart(refs);
      statusUI.setStatus(refs, "Click Start to begin.");
    }

    function startGame() {
      game.baseReset();
      statusUI.showPlaying(refs);
      game.dealNextPhase();
    }

    slotRefs.player.forEach((slot) => {
      slot.addEventListener("click", () => {
        const cardIdx = Number(slot.dataset.cardIndex);
        if (Number.isNaN(cardIdx)) return;
        game.handlePlayerDiscard(cardIdx);
      });
    });

    startButton.addEventListener("click", startGame);
    dealButton.addEventListener("click", () => game.dealNextPhase());
    resetButton.addEventListener("click", goToStartScreen);

    // Initialize UI.
    goToStartScreen();
  }

  window.Bindings = { bind };
})();
