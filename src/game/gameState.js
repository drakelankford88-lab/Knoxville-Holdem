// Game state and phase control for table flow.
(() => {
  function create(deps) {
    const { view, deckUtils, handDescriptions, slotRefs, statusLabel, deckLabel, dealButton } = deps || {};
    if (!view || !deckUtils || !handDescriptions || !slotRefs || !statusLabel || !deckLabel || !dealButton) {
      throw new Error("GameState missing required dependencies.");
    }

    const phaseOrder = ["player", "flop", "turn", "river"];

    let deck = [];
    let phaseIndex = 0;
    let playerCards = [];
    let aiCards = [];
    let aiRevealed = false;
    let discardRequired = false;
    let flopCards = [];
    let turnCard = null;
    let riverCard = null;

    function updateDeckLabel() {
      deckLabel.textContent = `Deck: ${deck.length} cards`;
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
      view.renderAiSlots(slotRefs.ai, aiCards, { revealed: aiRevealed });
    }

    function aiAutoDiscard() {
      if (!window.AIPlayer) {
        return;
      }
      if (aiCards.length <= 2) return;
      const boardCards = [
        ...flopCards.filter(Boolean),
        ...(turnCard ? [turnCard] : []),
        ...(riverCard ? [riverCard] : []),
      ];
      const discardIdx = window.AIPlayer.chooseDiscard(aiCards, boardCards);
      if (discardIdx == null || discardIdx < 0 || discardIdx >= aiCards.length) return;
      aiCards.splice(discardIdx, 1);
      view.renderAiSlots(slotRefs.ai, aiCards, { revealed: aiRevealed, showPlaceholders: false });
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
      const allAiCards = [...aiCards, ...boardCards];
      if (allPlayerCards.length < 5 || allAiCards.length < 5) {
        statusLabel.textContent = "Final discard complete. Hand ready.";
        return;
      }
      const playerResult = window.HandEvaluator.evaluateBestHand(allPlayerCards);
      const aiResult = window.HandEvaluator.evaluateBestHand(allAiCards);
      const cmp = window.HandEvaluator.compareHands(playerResult, aiResult);
      let verdict = "It's a tie.";
      let verdictLabel = "TIE";
      if (cmp > 0) {
        verdict = "You win.";
        verdictLabel = "YOU WIN";
      } else if (cmp < 0) {
        verdict = "AI wins.";
        verdictLabel = "AI WINS";
      }
      const playerDesc = handDescriptions.describeHand(playerResult);
      const aiDesc = handDescriptions.describeHand(aiResult);
      statusLabel.innerHTML = [
        `<span class="verdict">${verdictLabel}</span>`,
        `You: ${playerDesc}.`,
        `AI: ${aiDesc}.`,
      ].join("<br>");
    }

    function requireDiscard(message) {
      discardRequired = true;
      dealButton.disabled = true;
      statusLabel.textContent = message;
      view.updateDiscardableStyles(slotRefs.player, playerCards, true);
    }

    function dealNextPhase() {
      if (discardRequired) {
        statusLabel.textContent = "Discard a card before continuing.";
        return;
      }
      const phase = phaseOrder[phaseIndex];
      if (!phase) {
        return;
      }

      if (phase === "player") {
        const cards = deckUtils.drawCards(deck, 5);
        const aiDeal = deckUtils.drawCards(deck, 5);
        playerCards = cards;
        aiCards = aiDeal;
        aiRevealed = false;
        view.renderPlayerSlots(slotRefs.player, playerCards, { showPlaceholders: false });
        view.renderAiSlots(slotRefs.ai, aiCards, { revealed: aiRevealed, showPlaceholders: false });
        statusLabel.innerHTML =
          "Cards dealt. Advance to the flop.<br>You will discard after each new card is dealt until only two remain in your hand.";
      } else if (phase === "flop") {
        const cards = deckUtils.drawCards(deck, 3);
        flopCards = cards;
        renderBoard();
        statusLabel.textContent = "Flop dealt.";
        requireDiscard("Discard one hole card before the Turn.");
      } else if (phase === "turn") {
        const card = deckUtils.drawCards(deck, 1)[0];
        turnCard = card;
        renderBoard();
        statusLabel.textContent = "Turn dealt.";
        requireDiscard("Discard one hole card before the River.");
      } else if (phase === "river") {
        const card = deckUtils.drawCards(deck, 1)[0];
        riverCard = card;
        renderBoard();
        statusLabel.textContent = "River dealt.";
        requireDiscard("Discard one final hole card to finish.");
      }

      phaseIndex += 1;
      updateDeckLabel();

      if (phaseIndex >= phaseOrder.length) {
        dealButton.disabled = true;
        if (!discardRequired) {
          statusLabel.textContent = "Sequence complete. Press Reset to start again.";
        }
      }
    }

    function baseReset() {
      deck = deckUtils.buildDeck();
      deckUtils.shuffleDeck(deck);
      phaseIndex = 0;
    playerCards = [];
    aiCards = [];
    aiRevealed = false;
    discardRequired = false;
    flopCards = [];
    turnCard = null;
    riverCard = null;
    Object.values(slotRefs).forEach((group) => {
      group.forEach((slot) => {
        view.setSlotCard(slot, null, { collapseWhenEmpty: true });
        slot.style.marginLeft = "0px";
        slot.style.transform = "none";
      });
    });
    const placeholderPlayer = Array(slotRefs.player.length).fill(null);
    const placeholderAi = Array(slotRefs.ai.length).fill(null);
    view.renderPlayerSlots(slotRefs.player, placeholderPlayer, {
      showPlaceholders: false,
      showBacksWhenEmpty: false,
      addPrestartClass: true,
    });
    view.renderAiSlots(slotRefs.ai, placeholderAi, {
      showPlaceholders: false,
      revealed: aiRevealed,
      showBacksWhenEmpty: false,
      addPrestartClass: true,
    });
      renderBoard();
      updateDeckLabel();
      dealButton.disabled = false;
      view.updateDiscardableStyles(slotRefs.player, playerCards, false);
    }

    function handlePlayerDiscard(idx) {
      if (!discardRequired) {
        return;
      }
    if (idx < 0 || idx >= playerCards.length) {
      return;
    }
    playerCards.splice(idx, 1);
    view.renderPlayerSlots(slotRefs.player, playerCards, { showPlaceholders: false });
    aiAutoDiscard();
    discardRequired = false;
    dealButton.disabled = phaseIndex >= phaseOrder.length;

      if (phaseIndex >= phaseOrder.length) {
        statusLabel.textContent = "Final discard complete. Hand ready.";
        aiReveal();
        showFinalHand();
      } else {
        statusLabel.textContent = "Discard complete. Continue dealing.";
      }
      view.updateDiscardableStyles(slotRefs.player, playerCards, false);
    }

    return {
      baseReset,
      dealNextPhase,
      handlePlayerDiscard,
    };
  }

  window.GameState = { create };
})();
