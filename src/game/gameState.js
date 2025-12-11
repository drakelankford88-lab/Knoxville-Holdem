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
      playAgainButton,
      botCountSlider,
      botCountControl,
      botSection,
      botRows,
      bankAmount,
      winStreak,
      betInput,
      betDecrementBtn,
      betIncrementBtn,
      betControl,
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
      !botCountSlider ||
      !bankAmount ||
      !winStreak
    ) {
      throw new Error("GameState missing required dependencies.");
    }

    // Supports 1-5 bot opponents (two hole cards each), selected after the initial deal and locked once the flop is shown.
    const START_BANK = 100;
    const MIN_BET = 10;
    // Multipliers based on bot count: 1 bot = 1.3x, 2 = 1.6x, 3 = 1.9x, 4 = 2.1x, 5 = 2.4x
    const BOT_MULTIPLIERS = [1.3, 1.6, 1.9, 2.1, 2.4];
    const MAX_BOT = 5;
    const MIN_BOT = 1;
    const DEFAULT_BOT_COUNT = 1;
    const BOT_HOLE_CARDS = 2;
    
    // Helper to get current multiplier based on bot count
    function getMultiplier(count) {
      return BOT_MULTIPLIERS[Math.min(Math.max(count, 1), 5) - 1];
    }

    // phaseIndex: 0 not dealt, 1 waiting for flop button, 2 discard then deal Turn, 3 discard then deal River, 4 discard then reveal.
    let phaseIndex = 0;
    let deck = [];
    let playerCards = [];
    let botHands = [];
    let botRevealed = false;
    let playerRevealed = true;
    let discardRequired = false;
    let flopCards = [];
    let turnCard = null;
    let riverCard = null;
    let bank = START_BANK;
    let streak = 0;
    let flopUsed = false;
    let botCount = DEFAULT_BOT_COUNT;
    let botSelectionLocked = false;
    let currentBet = MIN_BET; // Persists between games

    function updateDeckLabel() {
      deckLabel.textContent = `Deck: ${deck.length} cards`;
    }

    function updateBankDisplay() {
      bankAmount.textContent = String(bank);
      winStreak.textContent = String(streak);
    }

    function updateFlopButtonText() {
      flopButton.textContent = "See Flop";
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

    function botReveal() {
      botRevealed = true;
      view.renderBotSlots(slotRefs.bot, botHands, { revealed: botRevealed, botRows: slotRefs.botRows });
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
      let bestBotResult = null;
      let bestBotIndex = -1;
      botHands.forEach((hand, idx) => {
        const botCards = [...hand, ...boardCards];
        if (botCards.length < 5) return;
        const result = window.HandEvaluator.evaluateBestHand(botCards);
        if (!bestBotResult || window.HandEvaluator.compareHands(result, bestBotResult) > 0) {
          bestBotResult = result;
          bestBotIndex = idx;
        }
      });
      if (!bestBotResult) {
        statusLabel.textContent = "Final discard complete. Hand ready.";
        return;
      }

      const cmp = window.HandEvaluator.compareHands(playerResult, bestBotResult);
      let verdict = "It's a tie.";
      let verdictLabel = "TIE";
      const multiplier = getMultiplier(botCount);
      // Apply rounding: .5+ rounds up, .4- rounds down (Math.round handles this)
      const winnings = Math.round(currentBet * multiplier);
      
      if (cmp > 0) {
        const profit = winnings - currentBet;
        verdict = "You win.";
        verdictLabel = "YOU WIN";
        bank += winnings; // Return bet plus profit (already paid currentBet earlier)
        streak += 1;
        updateBankDisplay();
        const playerDesc = handDescriptions.describeHand(playerResult);
        const botDesc = handDescriptions.describeHand(bestBotResult);
        statusLabel.innerHTML = [
          `<span class="verdict">${verdictLabel}</span>`,
          `You: ${playerDesc}.`,
          `Best Bot: ${botDesc}.`,
          `<span class="winnings">+${profit} coins (${multiplier}x)</span>`,
        ].join("<br>");
        // Highlight winning cards with green glow
        view.highlightWinningCards(playerResult.cards, slotRefs, true);
      } else if (cmp < 0) {
        const botName = `Bot ${bestBotIndex + 1}`;
        verdict = `${botName} wins.`;
        verdictLabel = `${botName.toUpperCase()} WINS`;
        streak = 0; // Reset win streak on loss
        updateBankDisplay();
        const playerDesc = handDescriptions.describeHand(playerResult);
        const botDesc = handDescriptions.describeHand(bestBotResult);
        statusLabel.innerHTML = [
          `<span class="verdict">${verdictLabel}</span>`,
          `You: ${playerDesc}.`,
          `Best Bot: ${botDesc}.`,
          `<span class="loss">-${currentBet} coins</span>`,
        ].join("<br>");
        // Highlight winning bot's cards with red glow
        view.highlightWinningCards(bestBotResult.cards, slotRefs, false, bestBotIndex);
      } else {
        // Tie - return the bet
        bank += currentBet;
        updateBankDisplay();
        const playerDesc = handDescriptions.describeHand(playerResult);
        const botDesc = handDescriptions.describeHand(bestBotResult);
        statusLabel.innerHTML = [
          `<span class="verdict">${verdictLabel}</span>`,
          `You: ${playerDesc}.`,
          `Best Bot: ${botDesc}.`,
          `<span class="tie">Bet returned</span>`,
        ].join("<br>");
        // No highlights for ties
      }
    }

    function requireDiscard(message) {
      discardRequired = true;
      statusLabel.textContent = message;
      view.updateDiscardableStyles(slotRefs.player, playerCards, true);
    }

    function setBotCount(nextCount) {
      const clamped = Math.max(MIN_BOT, Math.min(MAX_BOT, nextCount));
      if (phaseIndex !== 1 || botSelectionLocked) {
        statusLabel.textContent = "Bot count can only change after the deal and before the flop.";
        botCountSlider.value = String(botCount);
        return;
      }
      if (clamped === botCount) return;

      if (clamped > botCount) {
        const seatsToAdd = clamped - botCount;
        const cardsNeeded = seatsToAdd * BOT_HOLE_CARDS;
        if (deck.length < cardsNeeded) {
          statusLabel.textContent = "Not enough cards to add more bot opponents.";
          botCountSlider.value = String(botCount);
          return;
        }
        for (let i = 0; i < seatsToAdd; i += 1) {
          botHands.push(deckUtils.drawCards(deck, BOT_HOLE_CARDS));
        }
      } else {
        const removed = botHands.splice(clamped);
        removed.flat().forEach((card) => deck.push(card));
        deckUtils.shuffleDeck(deck);
      }

      botCount = clamped;
      botCountSlider.value = String(botCount);
      view.renderBotSlots(slotRefs.bot, botHands, { revealed: botRevealed, showPlaceholders: false, botRows: slotRefs.botRows });
      updateDeckLabel();
      const suffix = botCount > 1 ? "bots" : "bot";
      statusLabel.textContent = `Playing against ${botCount} ${suffix}. Adjust your bet and click See Flop to continue.`;
    }

    function dealInitial() {
      if (phaseIndex !== 0) return;
      const cards = deckUtils.drawCards(deck, 5);
      playerCards = cards;
      botHands = [];
      for (let i = 0; i < botCount; i += 1) {
        botHands.push(deckUtils.drawCards(deck, BOT_HOLE_CARDS));
      }
      botRevealed = false;
      playerRevealed = false;
      view.renderPlayerSlots(slotRefs.player, playerCards, { showPlaceholders: false, revealed: false });
      view.renderBotSlots(slotRefs.bot, botHands, { revealed: botRevealed, showPlaceholders: false, botRows: slotRefs.botRows });
      statusLabel.textContent =
        "Cards dealt. Choose bots, set your bet, then click See Flop.";
      flopButton.classList.remove("hidden");
      revealButton.classList.add("hidden");
      botCountSlider.disabled = false;
      if (botCountControl) {
        botCountControl.classList.remove("hidden");
      }
      // Show bet control and enable it
      if (betControl) {
        betControl.classList.remove("hidden");
      }
      if (betInput) {
        betInput.disabled = false;
      }
      if (betDecrementBtn) {
        betDecrementBtn.disabled = false;
      }
      if (betIncrementBtn) {
        betIncrementBtn.disabled = false;
      }
      if (botRows) {
        botRows.classList.remove("hidden");
        // Remove placeholder when showing real bot rows
        const botSectionElement = document.querySelector('.bot-section');
        if (botSectionElement) {
          const placeholder = botSectionElement.querySelector('.bot-placeholder');
          if (placeholder) {
            placeholder.remove();
          }
        }
      }
      phaseIndex = 1;
      updateDeckLabel();
      updateFlopButtonText();
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
      // Clear any card highlights from previous game
      view.clearHighlights(slotRefs);
      
      deck = deckUtils.buildDeck();
      deckUtils.shuffleDeck(deck);
      phaseIndex = 0;
      playerCards = [];
      botHands = [];
      botRevealed = false;
      playerRevealed = true;
      discardRequired = false;
      flopCards = [];
      turnCard = null;
      riverCard = null;
      flopUsed = false;
      botCount = DEFAULT_BOT_COUNT;
      botSelectionLocked = false;
      botCountSlider.value = String(botCount);
      botCountSlider.disabled = true;
      botCountSlider.classList.remove("locked");
      if (botCountControl) {
        botCountControl.classList.add("hidden");
      }
      // Hide bet control on reset
      if (betControl) {
        betControl.classList.add("hidden");
      }
      // Ensure currentBet doesn't exceed current bank (but keep it if valid)
      if (currentBet > bank) {
        currentBet = Math.max(MIN_BET, bank);
      }
      // Update bet input to show current bet
      if (betInput) {
        betInput.value = String(currentBet);
        betInput.disabled = true;
      }
      if (betDecrementBtn) {
        betDecrementBtn.disabled = true;
      }
      if (betIncrementBtn) {
        betIncrementBtn.disabled = true;
      }
      if (botRows) {
        botRows.classList.add("hidden");
        // Add invisible placeholder to maintain table size
        const botSectionElement = document.querySelector('.bot-section');
        if (botSectionElement && !botSectionElement.querySelector('.bot-placeholder')) {
          const placeholder = document.createElement('div');
          placeholder.className = 'bot-placeholder';
          botSectionElement.appendChild(placeholder);
        }
      }

      slotRefs.player.forEach((slot) => {
        view.setSlotCard(slot, null, { collapseWhenEmpty: true });
        slot.style.marginLeft = "0px";
        slot.style.transform = "none";
      });
      slotRefs.bot.forEach((seatSlots) => {
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
      view.renderBotSlots(
        slotRefs.bot,
        Array(MAX_BOT)
          .fill(0)
          .map(() => []),
        {
          showPlaceholders: true,
          revealed: botRevealed,
          showBacksWhenEmpty: false,
          addPrestartClass: true,
          botRows: slotRefs.botRows,
        },
      );
      renderBoard();
      updateDeckLabel();
      updateBankDisplay();
      flopButton.classList.add("hidden");
      revealButton.classList.add("hidden");
      if (playAgainButton) {
        playAgainButton.classList.add("hidden");
      }
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
      statusLabel.textContent = "Final discard complete. Press Reveal Bot Hand.";
      revealButton.classList.remove("hidden");
      }
    }

    function handleSeeFlop() {
      if (flopUsed || phaseIndex !== 1) {
        statusLabel.textContent = "Flop already dealt or not ready.";
        return;
      }
      if (botHands.length !== botCount) {
        setBotCount(botCount);
      }
      if (bank < currentBet) {
        statusLabel.textContent = `Not enough coins for ${currentBet} coin bet. Lower your bet or reset.`;
        flopButton.disabled = true;
        return;
      }
      bank = Math.max(0, bank - currentBet);
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
      botSelectionLocked = true;
      botCountSlider.disabled = true;
      botCountSlider.classList.add("locked");
      if (botCountControl) {
        botCountControl.classList.add("hidden");
      }
      // Hide and disable bet control after flop is seen
      if (betControl) {
        betControl.classList.add("hidden");
      }
      if (betInput) {
        betInput.disabled = true;
      }
      if (betDecrementBtn) {
        betDecrementBtn.disabled = true;
      }
      if (betIncrementBtn) {
        betIncrementBtn.disabled = true;
      }
      phaseIndex = 2; // next discard auto-deals Turn
      updateDeckLabel();
    }

    function handleRevealBot() {
      if (phaseIndex < 4) {
        statusLabel.textContent = "Finish discarding before revealing.";
        return;
      }
      revealButton.classList.add("hidden");
      botReveal();
      showFinalHand();
      // Show Play Again button after revealing
      if (playAgainButton) {
        playAgainButton.classList.remove("hidden");
      }
    }

    function handlePlayAgain() {
      // Hide play again button
      if (playAgainButton) {
        playAgainButton.classList.add("hidden");
      }
      // Reset game state but preserve bet
      baseReset();
      // Immediately deal cards (skip start screen)
      dealInitial();
    }

    function setBet(amount) {
      const parsed = Number(amount);
      if (Number.isNaN(parsed)) return;
      // Clamp bet between MIN_BET and current bank
      const clamped = Math.max(MIN_BET, Math.min(bank, parsed));
      currentBet = clamped;
      // Update the input to show the clamped value
      if (betInput) {
        betInput.value = String(clamped);
      }
      updateFlopButtonText();
    }

    function getBet() {
      return currentBet;
    }

    function getBank() {
      return bank;
    }

    return {
      baseReset,
      dealNextPhase: dealInitial, // start button uses this
      handleSeeFlop,
      handleRevealBot,
      handlePlayerDiscard,
      handlePlayAgain,
      setBotCount,
      setBet,
      getBet,
      getBank,
    };
  }

  window.GameState = { create };
})();
