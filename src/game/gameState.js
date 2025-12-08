// Game state and phase control for table flow with bank and win/loss tracking.
(() => {
  function create(deps) {
    const {
      view,
      deckUtils,
      handDescriptions,
      slotRefs,
      statusLabel,
      deckLabel,
      flopButton,
      revealButton,
      aiCountSelect,
      bankAmount,
      winCount,
      lossCount,
    } = deps || {};
    if (
      !view ||
      !deckUtils ||
      !handDescriptions ||
      !slotRefs ||
      !statusLabel ||
      !deckLabel ||
      !flopButton ||
      !revealButton ||
      !aiCountSelect ||
      !bankAmount ||
      !winCount ||
      !lossCount
    ) {
      throw new Error("GameState missing required dependencies.");
    }

    // Supports 1-3 AI opponents (two hole cards each), selected after the initial deal and locked once the flop is shown.
    const START_BANK = 10;
    const BUY_IN = 1;
    const WIN_DELTA = BUY_IN * 2; // pay double the buy-in on win
    const LOSS_DELTA = 0; // no extra loss beyond the buy-in
    const MAX_AI = 3;
    const MIN_AI = 1;
    const DEFAULT_AI_COUNT = 1;
    const AI_HOLE_CARDS = 2;

    // phaseIndex: 0 not dealt, 1 waiting for flop button, 2 discard then deal Turn, 3 discard then deal River, 4 discard then reveal.
    let phaseIndex = 0;
    let deck = [];
    let playerCards = [];
    let aiHands = [];
    let aiRevealed = false;
    let playerRevealed = true;
    let discardRequired = false;
    let flopCards = [];
    let turnCard = null;
    let riverCard = null;
    let bank = START_BANK;
    let wins = 0;
    let losses = 0;
    let flopUsed = false;
    let aiCount = DEFAULT_AI_COUNT;
    let aiSelectionLocked = false;

    function updateDeckLabel() {
      deckLabel.textContent = `Deck: ${deck.length} cards`;
    }

    function updateBankDisplay() {
      bankAmount.textContent = String(bank);
      winCount.textContent = String(wins);
      lossCount.textContent = String(losses);
    }

    function renderBoard() {
      slotRefs.flop.forEach((slot, idx) => {
        const card = flopCards[idx] || null;
        if (card) {
          view.setSlotCard(slot, card, { collapseWhenEmpty: false });
        } else {
          view.setSlotCard(slot, null, { collapseWhenEmpty: false });
        }
      });
      if (turnCard) {
        view.setSlotCard(slotRefs.turn[0], turnCard, { collapseWhenEmpty: false });
      } else {
        view.setSlotCard(slotRefs.turn[0], null, { collapseWhenEmpty: false });
      }
      if (riverCard) {
        view.setSlotCard(slotRefs.river[0], riverCard, { collapseWhenEmpty: false });
      } else {
        view.setSlotCard(slotRefs.river[0], null, { collapseWhenEmpty: false });
      }
    }

    function aiReveal() {
      aiRevealed = true;
      view.renderAiSlots(slotRefs.ai, aiHands, { revealed: aiRevealed });
    }

    function showFinalHand() {
      if (!window.HandEvaluator) {
        statusLabel.textContent = "Final discard complete. Hand ready.";
        return;
      }
      const boardCards = [
        ...flopCards.filter(Boolean),
        ...(turnCard ? [turnCard] : []),
        ...(riverCard ? [riverCard] : []),
      ];
      const allPlayerCards = [...playerCards, ...boardCards];
      if (allPlayerCards.length < 5) {
        statusLabel.textContent = "Final discard complete. Hand ready.";
        return;
      }
      const playerResult = window.HandEvaluator.evaluateBestHand(allPlayerCards);
      let bestAiResult = null;
      let bestAiIndex = -1;
      aiHands.forEach((hand, idx) => {
        const aiCards = [...hand, ...boardCards];
        if (aiCards.length < 5) return;
        const result = window.HandEvaluator.evaluateBestHand(aiCards);
        if (!bestAiResult || window.HandEvaluator.compareHands(result, bestAiResult) > 0) {
          bestAiResult = result;
          bestAiIndex = idx;
        }
      });
      if (!bestAiResult) {
        statusLabel.textContent = "Final discard complete. Hand ready.";
        return;
      }

      const cmp = window.HandEvaluator.compareHands(playerResult, bestAiResult);
      let verdict = "It's a tie.";
      let verdictLabel = "TIE";
      if (cmp > 0) {
        verdict = "You win.";
        verdictLabel = "YOU WIN";
        bank += WIN_DELTA;
        wins += 1;
      } else if (cmp < 0) {
        const aiName = `AI ${bestAiIndex + 1}`;
        verdict = `${aiName} wins.`;
        verdictLabel = `${aiName.toUpperCase()} WINS`;
        bank = Math.max(0, bank - LOSS_DELTA);
        losses += 1;
      }
      updateBankDisplay();
      const playerDesc = handDescriptions.describeHand(playerResult);
      const aiDesc = handDescriptions.describeHand(bestAiResult);
      statusLabel.innerHTML = [
        `<span class="verdict">${verdictLabel}</span>`,
        `You: ${playerDesc}.`,
        `Best AI: ${aiDesc}.`,
      ].join("<br>");
    }

    function requireDiscard(message) {
      discardRequired = true;
      statusLabel.textContent = message;
      view.updateDiscardableStyles(slotRefs.player, playerCards, true);
    }

    function setAiCount(nextCount) {
      const clamped = Math.max(MIN_AI, Math.min(MAX_AI, nextCount));
      if (phaseIndex !== 1 || aiSelectionLocked) {
        statusLabel.textContent = "AI count can only change after the deal and before the flop.";
        aiCountSelect.value = String(aiCount);
        return;
      }
      if (clamped === aiCount) return;

      if (clamped > aiCount) {
        const seatsToAdd = clamped - aiCount;
        const cardsNeeded = seatsToAdd * AI_HOLE_CARDS;
        if (deck.length < cardsNeeded) {
          statusLabel.textContent = "Not enough cards to add more AI opponents.";
          aiCountSelect.value = String(aiCount);
          return;
        }
        for (let i = 0; i < seatsToAdd; i += 1) {
          aiHands.push(deckUtils.drawCards(deck, AI_HOLE_CARDS));
        }
      } else {
        const removed = aiHands.splice(clamped);
        removed.flat().forEach((card) => deck.push(card));
        deckUtils.shuffleDeck(deck);
      }

      aiCount = clamped;
      aiCountSelect.value = String(aiCount);
      view.renderAiSlots(slotRefs.ai, aiHands, { revealed: aiRevealed, showPlaceholders: false });
      updateDeckLabel();
      const suffix = aiCount > 1 ? "AIs" : "AI";
      statusLabel.textContent = `Playing against ${aiCount} ${suffix}. Click See Flop - $1 Buy-In to continue.`;
    }

    function dealInitial() {
      if (phaseIndex !== 0) return;
      const cards = deckUtils.drawCards(deck, 5);
      playerCards = cards;
      aiHands = [];
      for (let i = 0; i < aiCount; i += 1) {
        aiHands.push(deckUtils.drawCards(deck, AI_HOLE_CARDS));
      }
      aiRevealed = false;
      playerRevealed = false;
      view.renderPlayerSlots(slotRefs.player, playerCards, { showPlaceholders: false, revealed: false });
      view.renderAiSlots(slotRefs.ai, aiHands, { revealed: aiRevealed, showPlaceholders: false });
      statusLabel.textContent =
        "Cards dealt. Choose 1-3 AI opponents, then click See Flop - $1 Buy-In.";
      flopButton.classList.remove("hidden");
      revealButton.classList.add("hidden");
      aiCountSelect.disabled = false;
      phaseIndex = 1;
      updateDeckLabel();
    }

    function dealTurn() {
      const card = deckUtils.drawCards(deck, 1)[0];
      turnCard = card;
      renderBoard();
      statusLabel.textContent = "Turn dealt. Discard one hole card before the River.";
      requireDiscard("Discard one hole card before the River.");
      updateDeckLabel();
    }

    function dealRiver() {
      const card = deckUtils.drawCards(deck, 1)[0];
      riverCard = card;
      renderBoard();
      statusLabel.textContent = "River dealt. Discard one final hole card to finish.";
      requireDiscard("Discard one final hole card to finish.");
      updateDeckLabel();
    }

    function baseReset() {
      deck = deckUtils.buildDeck();
      deckUtils.shuffleDeck(deck);
      phaseIndex = 0;
      playerCards = [];
      aiHands = [];
      aiRevealed = false;
      playerRevealed = true;
      discardRequired = false;
      flopCards = [];
      turnCard = null;
      riverCard = null;
      flopUsed = false;
      aiCount = DEFAULT_AI_COUNT;
      aiSelectionLocked = false;
      aiCountSelect.value = String(aiCount);
      aiCountSelect.disabled = true;
      aiCountSelect.classList.remove("locked");

      slotRefs.player.forEach((slot) => {
        view.setSlotCard(slot, null, { collapseWhenEmpty: true });
        slot.style.marginLeft = "0px";
        slot.style.transform = "none";
      });
      slotRefs.ai.forEach((seatSlots) => {
        seatSlots.forEach((slot) => {
          view.setSlotCard(slot, null, { collapseWhenEmpty: true });
          slot.style.marginLeft = "0px";
          slot.style.transform = "none";
        });
      });
      [...slotRefs.flop, ...slotRefs.turn, ...slotRefs.river].forEach((slot) => {
        view.setSlotCard(slot, null, { collapseWhenEmpty: true });
        slot.style.marginLeft = "0px";
        slot.style.transform = "none";
      });
      const placeholderPlayer = Array(slotRefs.player.length).fill(null);
      view.renderPlayerSlots(slotRefs.player, placeholderPlayer, {
        showPlaceholders: false,
        showBacksWhenEmpty: false,
        addPrestartClass: true,
      });
      view.renderAiSlots(
        slotRefs.ai,
        Array(MAX_AI)
          .fill(0)
          .map(() => []),
        {
          showPlaceholders: true,
          revealed: aiRevealed,
          showBacksWhenEmpty: false,
          addPrestartClass: true,
        },
      );
      renderBoard();
      updateDeckLabel();
      updateBankDisplay();
      flopButton.classList.add("hidden");
      revealButton.classList.add("hidden");
      view.updateDiscardableStyles(slotRefs.player, playerCards, false);
    }

    function handlePlayerDiscard(idx) {
      if (!discardRequired) return;
      if (idx < 0 || idx >= playerCards.length) return;
      playerCards.splice(idx, 1);
      view.renderPlayerSlots(slotRefs.player, playerCards, { showPlaceholders: false, revealed: playerRevealed });
      discardRequired = false;
      view.updateDiscardableStyles(slotRefs.player, playerCards, false);

      if (phaseIndex === 2) {
        dealTurn();
        phaseIndex = 3;
      } else if (phaseIndex === 3) {
        dealRiver();
        phaseIndex = 4;
      } else if (phaseIndex >= 4) {
      statusLabel.textContent = "Final discard complete. Press Reveal AI Hand.";
      revealButton.classList.remove("hidden");
      }
    }

    function handleSeeFlop() {
      if (flopUsed || phaseIndex !== 1) {
        statusLabel.textContent = "Flop already dealt or not ready.";
        return;
      }
      if (aiHands.length !== aiCount) {
        setAiCount(aiCount);
      }
      if (bank < BUY_IN) {
        statusLabel.textContent = "Not enough bank for the $1 buy-in. Reset to start over.";
        flopButton.disabled = true;
        return;
      }
      bank = Math.max(0, bank - BUY_IN);
      updateBankDisplay();
      const cards = deckUtils.drawCards(deck, 3);
      flopCards = cards;
      renderBoard();
      playerRevealed = true;
      flopUsed = true;
      view.renderPlayerSlots(slotRefs.player, playerCards, { showPlaceholders: false, revealed: true });
      statusLabel.textContent = "Flop dealt. Discard one hole card before the Turn.";
      requireDiscard("Discard one hole card before the Turn.");
      flopButton.classList.add("hidden");
      aiSelectionLocked = true;
      aiCountSelect.disabled = true;
      aiCountSelect.classList.add("locked");
      phaseIndex = 2; // next discard auto-deals Turn
      updateDeckLabel();
    }

    function handleRevealAi() {
      if (phaseIndex < 4) {
        statusLabel.textContent = "Finish discarding before revealing.";
        return;
      }
      revealButton.classList.add("hidden");
      aiReveal();
      showFinalHand();
    }

    return {
      baseReset,
      dealNextPhase: dealInitial, // start button uses this
      handleSeeFlop,
      handleRevealAi,
      handlePlayerDiscard,
      setAiCount,
    };
  }

  window.GameState = { create };
})();
