// Event wiring between DOM and game state.
(() => {
  function bind(game, refs, statusUI) {
    if (!game || !refs || !statusUI) return;

    const { startButton, flopButton, revealButton, resetButton, botCountSlider, botSliderTooltip, slotRefs } = refs;

    function goToStartScreen() {
      game.baseReset();
      statusUI.showStart(refs);
      statusUI.setStatus(refs, "Click Deal Cards to begin.");
    }

    function startGame() {
      game.baseReset();
      statusUI.showPlaying(refs);
      game.dealNextPhase();
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

    flopButton.addEventListener("click", () => game.handleSeeFlop());
    revealButton.addEventListener("click", () => game.handleRevealBot());
    resetButton.addEventListener("click", goToStartScreen);

    // Initialize UI.
    goToStartScreen();
  }

  window.Bindings = { bind };
})();
