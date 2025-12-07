// UI helpers to toggle control visibility and set status text.
(() => {
  function showStart(refs) {
    refs.startButton.classList.remove("hidden");
    refs.resetButton.classList.add("hidden");
    refs.flopButton.classList.add("hidden");
    refs.revealButton.classList.add("hidden");
  }

  function showPlaying(refs) {
    refs.startButton.classList.add("hidden");
    refs.resetButton.classList.remove("hidden");
    refs.flopButton.classList.add("hidden");
    refs.revealButton.classList.add("hidden");
  }

  function setStatus(refs, message) {
    refs.statusLabel.textContent = message;
  }

  window.StatusUI = { showStart, showPlaying, setStatus };
})();
