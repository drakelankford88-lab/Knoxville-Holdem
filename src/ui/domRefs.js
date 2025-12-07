// DOM lookups and validation for game UI elements.
(() => {
  function getSlots(name, expectedCount) {
    const slots = Array.from(document.querySelectorAll(`[data-slot="${name}"]`));
    if (slots.length !== expectedCount) {
      throw new Error(`Expected ${expectedCount} slots for ${name}, found ${slots.length}.`);
    }
    return slots;
  }

  function getDomRefs() {
    const deckLabel = document.getElementById("deck-label");
    const statusLabel = document.getElementById("status-label");
    const startButton = document.getElementById("start-button");
    const dealButton = document.getElementById("deal-button");
    const resetButton = document.getElementById("reset-button");

    if (!deckLabel || !statusLabel || !dealButton || !resetButton || !startButton) {
      throw new Error("Missing required DOM nodes. Check index.html markup.");
    }

    const slotRefs = {
      player: getSlots("player", 5),
      ai: getSlots("ai", 5),
      flop: getSlots("flop", 3),
      turn: getSlots("turn", 1),
      river: getSlots("river", 1),
    };

    return { deckLabel, statusLabel, startButton, dealButton, resetButton, slotRefs };
  }

  window.DomRefs = { getDomRefs };
})();
