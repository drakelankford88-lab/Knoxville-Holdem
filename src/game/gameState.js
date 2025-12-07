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
      !bankAmount ||
      !winCount ||
      !lossCount
    ) {
      throw new Error("GameState missing required dependencies.");
    }

    const START_BANK = 10;
    const WIN_DELTA = 1;
    const LOSS_DELTA = 0; // no extra loss beyond the buy-in
    const BUY_IN = 1;

    // phaseIndex: 0 not dealt, 1 waiting for flop button, 2 discard then deal Turn, 3 discard then deal River, 4 discard then reveal.
    let phaseIndex = 0;
    let deck = [];
    let playerCards = [];
    let aiCards = [];
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
      view.renderAiSlots(slotRefs.ai, aiCards, { revealed: aiRevealed });
    }

    function aiAutoDiscard() {
      if (!window.AIPlayer) return;
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
        bank += WIN_DELTA;
        wins += 1;
      } else if (cmp < 0) {
        verdict = "AI wins.";
        verdictLabel = "AI WINS";
        bank = Math.max(0, bank - LOSS_DELTA);
        losses += 1;
      }
      updateBankDisplay();
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
      statusLabel.textContent = message;
      view.updateDiscardableStyles(slotRefs.player, playerCards, true);
    }

    function dealInitial() {
      if (phaseIndex !== 0) return;
      const cards = deckUtils.drawCards(deck, 5);
      const aiDeal = deckUtils.drawCards(deck, 5);
      playerCards = cards;
      aiCards = aiDeal;
      aiRevealed = false;
      playerRevealed = false;
      view.renderPlayerSlots(slotRefs.player, playerCards, { showPlaceholders: false, revealed: false });
      view.renderAiSlots(slotRefs.ai, aiCards, { revealed: aiRevealed, showPlaceholders: false });
      statusLabel.textContent = "Cards dealt face-down. Click See Flop - $1 Buy-In to continue.";
      flopButton.classList.remove("hidden");
      revealButton.classList.add("hidden");
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
      aiCards = [];
      aiRevealed = false;
      playerRevealed = true;
      discardRequired = false;
      flopCards = [];
      turnCard = null;
      riverCard = null;
      flopUsed = false;
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
      aiAutoDiscard();
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
    };
  }

  window.GameState = { create };
})();
