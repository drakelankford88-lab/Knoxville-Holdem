// Rendering helpers for player and AI card slots.
(() => {
  function cardCodeToPath(code) {
    const rank = code.slice(0, -1);
    const suit = code.slice(-1);
    const suitNames = { S: "SPADE", H: "HEART", D: "DIAMOND", C: "CLUB" };
    const rankNames = {
      A: "1",
      K: "13-KING",
      Q: "12-QUEEN",
      J: "11-JACK",
      "10": "10",
      "9": "9",
      "8": "8",
      "7": "7",
      "6": "6",
      "5": "5",
      "4": "4",
      "3": "3",
      "2": "2",
    };

    const suitName = suitNames[suit];
    const rankName = rankNames[rank];

    if (!suitName || !rankName) {
      throw new Error(`Unknown card code: ${code}`);
    }

    return `assets/newcards/${suitName}-${rankName}.svg`;
  }

  function setSlotCard(slot, cardCode, options = {}) {
    const { collapseWhenEmpty = false } = options;
    slot.classList.toggle("has-card", Boolean(cardCode));
    if (!cardCode) {
      if (collapseWhenEmpty) {
        slot.classList.add("empty");
        slot.textContent = "";
        slot.style.backgroundImage = "";
      } else {
        slot.classList.remove("empty");
        slot.textContent = "--";
        slot.style.backgroundImage = "";
      }
      return;
    }
    slot.classList.remove("empty");
    slot.textContent = "";
    slot.style.backgroundImage = `url("${cardCodeToPath(cardCode)}")`;
  }

  function renderPlayerSlots(slots, cards, options = {}) {
    renderSlots(slots, cards, { ...options, revealed: true });
  }

  function renderAiSlots(slots, cards, options = {}) {
    renderSlots(slots, cards, { ...options });
  }

  function renderSlots(slots, cards, options) {
    const {
      showPlaceholders = false,
      showBacksWhenEmpty = false,
      revealed = false,
      addPrestartClass = false,
    } = options;
    const totalSlots = slots.length;
    const padLeft = Math.max(0, Math.floor((totalSlots - cards.length) / 2));
    const padRight = Math.max(0, totalSlots - cards.length - padLeft);
    const paddedCards = [...Array(padLeft).fill(null), ...cards, ...Array(padRight).fill(null)].slice(
      0,
      totalSlots,
    );

    let cardIdxCounter = 0;
    const activeSlots = [];

    paddedCards.forEach((card, idx) => {
      const slot = slots[idx];
      if (!slot) return;

      slot.dataset.cardIndex = "";
      slot.classList.remove("face-down");
      if (addPrestartClass) {
        slot.classList.add("prestart");
      } else {
        slot.classList.remove("prestart");
      }
      slot.style.marginLeft = "0px";
      slot.style.transform = "none";

      if (!card && showBacksWhenEmpty) {
        slot.classList.add("has-card");
        slot.classList.add("face-down");
        slot.classList.remove("empty");
        slot.textContent = "";
        slot.style.backgroundImage = 'url("../assets/cards/cardback_black.png?v=3")';
        slot.classList.remove("discardable");
        activeSlots.push(slot);
        return;
      }

      if (card) {
        slot.dataset.cardIndex = String(cardIdxCounter);
        cardIdxCounter += 1;
        slot.classList.add("has-card");
        slot.classList.remove("prestart");
        if (revealed) {
          slot.classList.remove("face-down");
          setSlotCard(slot, card, { collapseWhenEmpty: false });
        } else {
          slot.classList.add("face-down");
          slot.textContent = "";
          slot.style.backgroundImage = "";
          slot.classList.remove("empty");
        }
        activeSlots.push(slot);
        return;
      }

      slot.classList.remove("has-card");
      if (addPrestartClass) {
        // keep slot in flow (no collapse), but hide visually
        slot.classList.add("prestart");
        setSlotCard(slot, null, { collapseWhenEmpty: false });
      } else {
        slot.classList.remove("prestart");
        setSlotCard(slot, null, { collapseWhenEmpty: !showPlaceholders });
      }
    });

    fanCards(activeSlots);
  }

  function updateDiscardableStyles(slots, cards, enabled) {
    slots.forEach((slot, idx) => {
      const hasCard = Boolean(cards[idx]);
      if (enabled && hasCard) {
        slot.classList.add("discardable");
      } else {
        slot.classList.remove("discardable");
      }
    });
  }

  function fanCards(activeSlots) {
    const total = activeSlots.length;
    const configs = {
      5: { angles: [-16, -8, 0, 8, 16], offsets: [-6, -3, 0, 3, 6] },
      4: { angles: [-14, -4, 4, 14], offsets: [-5, -2, 2, 5] },
      3: { angles: [-10, 0, 10], offsets: [-4, 0, 4] },
      2: { angles: [-8, 8], offsets: [-3, 3] },
      1: { angles: [0], offsets: [0] },
      0: { angles: [], offsets: [] },
    };
    const cfg = configs[total] || configs[5];
    activeSlots.forEach((slot, idx) => {
      const angle = cfg.angles[idx] ?? 0;
      const offset = cfg.offsets[idx] ?? 0;
      const translateY = 0;
      const baseOverlap = idx === 0 ? 0 : -28;
      slot.style.marginLeft = `${baseOverlap}px`;
      slot.style.transform = `translateX(${offset}px) rotate(${angle}deg) translateY(${translateY}px)`;
      slot.style.zIndex = String(100 + idx);
    });
  }

  window.PlayerView = {
    cardCodeToPath,
    setSlotCard,
    renderPlayerSlots,
    renderAiSlots,
    updateDiscardableStyles,
  };
})();
