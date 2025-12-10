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

  function showPlaying(refs) {
    refs.startButton.classList.add("hidden");
    refs.resetButton.classList.remove("hidden");
    refs.flopButton.classList.add("hidden");
    refs.revealButton.classList.add("hidden");
    if (refs.botCountControl) {
      refs.botCountControl.classList.add("hidden");
    }
  }

  function setStatus(refs, message) {
    refs.statusLabel.textContent = message;
  }

  window.StatusUI = { showStart, showPlaying, setStatus };
})();
