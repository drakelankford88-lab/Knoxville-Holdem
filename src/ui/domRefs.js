// DOM lookups and validation for game UI elements.
(() => {
  function getSlots(name, expectedCount) {
    const slots = Array.from(document.querySelectorAll(`[data-slot="${name}"]`));
    if (expectedCount != null && slots.length !== expectedCount) {
      throw new Error(`Expected ${expectedCount} slots for ${name}, found ${slots.length}.`);
    }
    return slots;
  }

  function getBotSlots() {
    const botSlots = [];
    const botRows = [];
    for (let i = 0; i < 5; i += 1) {
      const slots = getSlots(`bot-${i}`, 2);
      botSlots.push(slots);
      // Get the parent .bot-row element
      const row = slots[0]?.closest('.bot-row');
      if (row) botRows.push(row);
    }
    return { slots: botSlots, rows: botRows };
  }

  function getDomRefs() {
    const deckLabel = document.getElementById("deck-label");
    const statusLabel = document.getElementById("status-label");
    const startButton = document.getElementById("start-button");
    const tutorialButton = document.getElementById("tutorial-button");
    const flopButton = document.getElementById("flop-button");
    const revealButton = document.getElementById("reveal-button");
    const resetButton = document.getElementById("reset-button");
    const playAgainButton = document.getElementById("play-again-button");
    const botCountSlider = document.getElementById("bot-count-slider");
    const botSliderTooltip = document.getElementById("bot-slider-tooltip");
    const botCountControl = document.querySelector(".bot-count-control");
    const botSection = document.querySelector(".bot-section");
    const botRows = document.querySelector(".bot-rows");
    const bankAmount = document.getElementById("bank-amount");
    const winStreak = document.getElementById("win-streak");
    const betInput = document.getElementById("bet-input");
    const betDecrementBtn = document.getElementById("bet-decrement-btn");
    const betIncrementBtn = document.getElementById("bet-increment-btn");
    const betControl = document.getElementById("bet-control");

    if (
      !deckLabel ||
      !statusLabel ||
      !flopButton ||
      !revealButton ||
      !resetButton ||
      !startButton ||
      !playAgainButton ||
      !bankAmount ||
      !winStreak ||
      !botCountSlider ||
      !betInput ||
      !betDecrementBtn ||
      !betIncrementBtn ||
      !betControl
    ) {
      throw new Error("Missing required DOM nodes. Check index.html markup.");
    }

    const botData = getBotSlots();
    const slotRefs = {
      player: getSlots("player", 5),
      bot: botData.slots,
      botRows: botData.rows,
      flop: getSlots("flop", 3),
      turn: getSlots("turn", 1),
      river: getSlots("river", 1),
    };

    return {
      deckLabel,
      statusLabel,
      startButton,
      tutorialButton,
      flopButton,
      resetButton,
      revealButton,
      playAgainButton,
      botCountSlider,
      botSliderTooltip,
      botCountControl,
      botSection,
      botRows,
      bankAmount,
      winStreak,
      betInput,
      betDecrementBtn,
      betIncrementBtn,
      betControl,
      slotRefs,
    };
  }

  window.DomRefs = { getDomRefs };
})();
