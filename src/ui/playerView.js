// Rendering helpers for player and bot card slots.
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
    
    // Store or clear card code in data attribute
    if (cardCode) {
      slot.dataset.cardCode = cardCode;
    } else {
      delete slot.dataset.cardCode;
    }
    
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
    const { revealed = true, animate = false } = options;
    renderSlots(slots, cards, { ...options, revealed, animate });
  }

  function renderBotSlots(slots, cards, options = {}) {
    const { botRows, animate = false, revealed = false, animateReveal = false } = options;
    const hands = Array.isArray(cards) ? cards : [];
    let revealSoundPlayed = false;
    slots.forEach((seatSlots, idx) => {
      const hand = hands[idx] || [];
      const isActiveSeat = idx < hands.length;
      // Add extra delay for bot cards so they deal after player cards
      const botDelay = animate ? 450 + (idx * 150) : 0;
      
      if (animate && isActiveSeat) {
        setTimeout(() => {
          renderSlots(seatSlots, hand, { ...options, showPlaceholders: false, animate: true });
        }, botDelay);
      } else if (animateReveal && revealed && isActiveSeat) {
        // Flip animation for bot reveal - hide cards first to prevent flash
        seatSlots.forEach(slot => {
          slot.style.opacity = "0";
        });
        renderSlots(seatSlots, hand, { ...options, showPlaceholders: false, animate: false });
        // Apply revealing animation to all cards simultaneously
        setTimeout(() => {
          seatSlots.forEach(slot => {
            if (slot.classList.contains("has-card")) {
              slot.style.opacity = "";
              slot.classList.add("revealing");
              // Play sound once when bot cards flip
              if (!revealSoundPlayed && window.GameSounds) {
                window.GameSounds.playCardFlip();
                revealSoundPlayed = true;
              }
              setTimeout(() => {
                slot.classList.remove("revealing");
              }, 600);
            }
          });
        }, 0);
      } else {
        renderSlots(seatSlots, isActiveSeat ? hand : [], { ...options, showPlaceholders: false, animate: false });
      }
      
      // Hide/show the entire bot row based on whether it's active
      if (botRows && botRows[idx]) {
        if (isActiveSeat) {
          botRows[idx].classList.remove("hidden");
        } else {
          botRows[idx].classList.add("hidden");
        }
      }
    });
  }

  function renderSlots(slots, cards, options) {
    const {
      showPlaceholders = false,
      showBacksWhenEmpty = false,
      revealed = false,
      addPrestartClass = false,
      animate = false,
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
    let animatedCardIndex = 0;

    paddedCards.forEach((card, idx) => {
      const slot = slots[idx];
      if (!slot) return;

      slot.dataset.cardIndex = "";
      delete slot.dataset.cardCode; // Clear card code when re-rendering
      slot.classList.remove("face-down", "dealing", "discarding", "revealing");
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
        slot.style.backgroundImage = 'url("assets/newcards/cardback_black.png?v=3")';
        slot.classList.remove("discardable");
        activeSlots.push(slot);
        return;
      }

      if (card) {
        slot.dataset.cardIndex = String(cardIdxCounter);
        slot.dataset.cardCode = card; // Store card code
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
        
        // Add staggered deal animation
        if (animate && card) {
          const delay = animatedCardIndex * 80; // 80ms stagger between cards
          slot.style.opacity = "0";
          setTimeout(() => {
            slot.style.opacity = "";
            slot.classList.add("dealing");
            // Play card deal sound for each card
            if (window.GameSounds) {
              window.GameSounds.playCardDeal();
            }
            // Remove animation class after it completes
            setTimeout(() => {
              slot.classList.remove("dealing");
            }, 350);
          }, delay);
          animatedCardIndex++;
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

  /**
   * Highlight the winning cards with a glow effect.
   * @param {string[]} winningCardCodes - Array of 5 card codes that make up the winning hand
   * @param {object} slotRefs - Reference to all slot elements
   * @param {boolean} isPlayerWin - True for green glow (player), false for red glow (bot)
   * @param {number} winningBotIndex - Index of winning bot (only used when isPlayerWin is false)
   */
  function highlightWinningCards(winningCardCodes, slotRefs, isPlayerWin, winningBotIndex = -1) {
    const winningSet = new Set(winningCardCodes);
    const highlightClass = isPlayerWin ? "winning-card" : "losing-card";
    
    // Helper to check and highlight a slot
    function checkAndHighlight(slot) {
      const cardCode = slot.dataset.cardCode;
      if (cardCode && winningSet.has(cardCode)) {
        slot.classList.add(highlightClass);
        winningSet.delete(cardCode); // Avoid double-highlighting same card
      }
    }
    
    // Check player slots (only if player won)
    if (isPlayerWin) {
      slotRefs.player.forEach(checkAndHighlight);
    }
    
    // Check bot slots (only the winning bot's cards if bot won)
    if (!isPlayerWin && winningBotIndex >= 0) {
      const botSlots = slotRefs.bot[winningBotIndex];
      if (botSlots) {
        botSlots.forEach(checkAndHighlight);
      }
    }
    
    // Check community cards (flop, turn, river) - these apply to both player and bot wins
    slotRefs.flop.forEach(checkAndHighlight);
    slotRefs.turn.forEach(checkAndHighlight);
    slotRefs.river.forEach(checkAndHighlight);
  }

  /**
   * Clear all highlight classes from all card slots.
   * @param {object} slotRefs - Reference to all slot elements
   */
  function clearHighlights(slotRefs) {
    const clearSlot = (slot) => {
      slot.classList.remove("winning-card", "losing-card");
    };
    
    // Clear player slots
    slotRefs.player.forEach(clearSlot);
    
    // Clear all bot slots
    slotRefs.bot.forEach((botSlots) => {
      botSlots.forEach(clearSlot);
    });
    
    // Clear community cards
    slotRefs.flop.forEach(clearSlot);
    slotRefs.turn.forEach(clearSlot);
    slotRefs.river.forEach(clearSlot);
  }

  /**
   * Animate a card being discarded, then call the callback.
   * @param {HTMLElement} slot - The card slot element to animate
   * @param {Function} onComplete - Callback after animation completes
   */
  function animateDiscard(slot, onComplete) {
    if (!slot) {
      if (onComplete) onComplete();
      return;
    }
    
    slot.classList.add("discarding");
    slot.classList.remove("discardable");
    
    // Wait for animation to complete, then call callback
    setTimeout(() => {
      slot.classList.remove("discarding");
      if (onComplete) onComplete();
    }, 250);
  }

  /**
   * Animate community cards being revealed (flop/turn/river).
   * @param {HTMLElement[]} slots - The card slots to animate
   * @param {boolean} playSound - Whether to play the flip sound (default false)
   */
  function animateCommunityCards(slots, playSound = false) {
    let soundPlayed = false;
    slots.forEach((slot, idx) => {
      if (slot.classList.contains("has-card")) {
        slot.style.opacity = "0";
        // All cards flip at once (no delay)
        setTimeout(() => {
          slot.style.opacity = "";
          slot.classList.add("revealing");
          // Play sound once when cards flip (only if playSound is true)
          if (playSound && !soundPlayed && window.GameSounds) {
            window.GameSounds.playCardFlip();
            soundPlayed = true;
          }
          setTimeout(() => {
            slot.classList.remove("revealing");
          }, 600);
        }, 0);
      }
    });
  }

  window.PlayerView = {
    cardCodeToPath,
    setSlotCard,
    renderPlayerSlots,
    renderBotSlots,
    updateDiscardableStyles,
    highlightWinningCards,
    clearHighlights,
    animateDiscard,
    animateCommunityCards,
  };
})();
