// UI helpers to toggle control visibility and set status text.
(() => {
  function showStart(refs) {
    refs.startButton.classList.remove("hidden");
    refs.resetButton.classList.add("hidden");
    refs.flopButton.classList.add("hidden");
    refs.revealButton.classList.add("hidden");
    if (refs.botCountControl) {
      refs.botCountControl.classList.add("hidden");
    }
    if (refs.betControl) {
      refs.betControl.classList.add("hidden");
    }
    if (refs.botRows) {
      refs.botRows.classList.add("hidden");
      // Add invisible placeholder to maintain table size
      const botSection = refs.botRows.parentElement;
      if (botSection && !botSection.querySelector('.bot-placeholder')) {
        const placeholder = document.createElement('div');
        placeholder.className = 'bot-placeholder';
        botSection.appendChild(placeholder);
      }
    }
  }

  function showPlaying(refs, mode = "casual") {
    refs.startButton.classList.add("hidden");
    // Show reset button only in casual mode, hide in tutorial
    if (mode === "casual") {
      refs.resetButton.classList.remove("hidden");
    } else {
      refs.resetButton.classList.add("hidden");
    }
    refs.flopButton.classList.add("hidden");
    refs.revealButton.classList.add("hidden");
    if (refs.botCountControl) {
      refs.botCountControl.classList.add("hidden");
    }
    // Bet control visibility is managed by gameState based on phase
  }

  function setStatus(refs, message) {
    refs.statusLabel.textContent = message;
  }

  window.StatusUI = { showStart, showPlaying, setStatus };
})();
