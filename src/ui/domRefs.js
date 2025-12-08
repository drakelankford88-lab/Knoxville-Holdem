// DOM lookups and validation for game UI elements.
(() => {
  function getSlots(name, expectedCount) {
    const slots = Array.from(document.querySelectorAll(`[data-slot="${name}"]`));
    if (expectedCount != null && slots.length !== expectedCount) {
      throw new Error(`Expected ${expectedCount} slots for ${name}, found ${slots.length}.`);
    }
    return slots;
  }

  function getAiSlots() {
    const aiSlots = [];
    for (let i = 0; i < 3; i += 1) {
      const slots = getSlots(`ai-${i}`, 2);
      aiSlots.push(slots);
    }
    return aiSlots;
  }

  function getDomRefs() {
    const deckLabel = document.getElementById("deck-label");
    const statusLabel = document.getElementById("status-label");
    const startButton = document.getElementById("start-button");
    const flopButton = document.getElementById("flop-button");
    const revealButton = document.getElementById("reveal-button");
    const resetButton = document.getElementById("reset-button");
    const aiCountSelect = document.getElementById("ai-count-select");
    const bankAmount = document.getElementById("bank-amount");
    const winCount = document.getElementById("win-count");
    const lossCount = document.getElementById("loss-count");

    if (
      !deckLabel ||
      !statusLabel ||
      !flopButton ||
      !revealButton ||
      !resetButton ||
      !startButton ||
      !bankAmount ||
      !winCount ||
      !lossCount ||
      !aiCountSelect
    ) {
      throw new Error("Missing required DOM nodes. Check index.html markup.");
    }

    const slotRefs = {
      player: getSlots("player", 5),
      ai: getAiSlots(),
      flop: getSlots("flop", 3),
      turn: getSlots("turn", 1),
      river: getSlots("river", 1),
    };

    return {
      deckLabel,
      statusLabel,
      startButton,
      flopButton,
      resetButton,
      revealButton,
      aiCountSelect,
      bankAmount,
      winCount,
      lossCount,
      slotRefs,
    };
  }

  window.DomRefs = { getDomRefs };
})();
