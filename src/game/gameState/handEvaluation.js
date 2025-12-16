// Hand evaluation and result display logic.
(() => {
  function createHandEvaluation(deps, state, constants, uiUpdates) {
    const { view, slotRefs, statusLabel, handDescriptions } = deps;
    const { getMultiplier } = constants;

    function showFinalHand() {
      if (!window.HandEvaluator) {
        statusLabel.textContent = "Final discard complete. Hand ready.";
        return;
      }
      const flopCards = state.getFlopCards();
      const turnCard = state.getTurnCard();
      const riverCard = state.getRiverCard();
      const boardCards = [
        ...flopCards.filter(Boolean),
        ...(turnCard ? [turnCard] : []),
        ...(riverCard ? [riverCard] : []),
      ];
      const playerCards = state.getPlayerCards();
      const allPlayerCards = [...playerCards, ...boardCards];
      if (allPlayerCards.length < 5) {
        statusLabel.textContent = "Final discard complete. Hand ready.";
        return;
      }
      const playerResult = window.HandEvaluator.evaluateBestHand(allPlayerCards);
      let bestBotResult = null;
      let bestBotIndex = -1;
      const botHands = state.getBotHands();
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
      const playerDesc = handDescriptions.describeHand(playerResult);
      const botDesc = handDescriptions.describeHand(bestBotResult);
      
      // Both modes use the same betting logic
      let verdictLabel = "TIE";
      const multiplier = getMultiplier(state.getBotCount());
      const currentBet = state.getCurrentBet();
      const winnings = Math.round(currentBet * multiplier);
      
      // Determine win/loss/tie
      let won = null; // null = tie
      if (cmp > 0) won = true;
      else if (cmp < 0) won = false;
      
      // Store result for tutorial
      const lastResult = {
        won,
        handName: playerDesc,
        bet: currentBet,
        multiplier,
        winnings: won ? winnings : 0,
      };
      state.setLastResult(lastResult);
      
      let bank = state.getBank();
      let streak = state.getStreak();
      
      if (cmp > 0) {
        const profit = winnings - currentBet;
        verdictLabel = "YOU WIN";
        bank += winnings;
        streak += 1;
        state.setBank(bank);
        state.setStreak(streak);
        uiUpdates.updateBankDisplay();
        // Play win sound after flip animation completes (600ms)
        if (window.GameSounds) {
          setTimeout(() => {
            window.GameSounds.playWin(state.getBotCount());
          }, 700);
        }
        // Show win popup
        const winPopup = document.getElementById('win-popup');
        if (winPopup) {
          const winText = winPopup.querySelector('.win-popup-text');
          if (winText) {
            winText.textContent = `+${profit}`;
          }
          winPopup.classList.remove('hidden');
          winPopup.classList.add('show');
          setTimeout(() => {
            winPopup.classList.remove('show');
            winPopup.classList.add('hidden');
          }, 3000);
        }
        // Spawn falling coins - more coins for higher multipliers
        const coinContainer = document.getElementById('coin-container');
        if (coinContainer) {
          const botCount = state.getBotCount();
          // Scale coins: 1 bot = 8, 2 bots = 12, 3 bots = 18, 4 bots = 25, 5 bots = 35
          const coinCounts = { 1: 8, 2: 12, 3: 18, 4: 25, 5: 35 };
          const coinCount = coinCounts[botCount] || 18;
          for (let i = 0; i < coinCount; i++) {
            const coin = document.createElement('div');
            coin.className = 'coin';
            coin.style.left = `${Math.random() * 100}%`;
            coin.style.animationDelay = `${Math.random() * 0.8}s`;
            coin.style.animationDuration = `${2 + Math.random() * 1}s`;
            coinContainer.appendChild(coin);
          }
          // Clean up coins after animation
          setTimeout(() => {
            coinContainer.innerHTML = '';
          }, 4000);
        }
        statusLabel.innerHTML = [
          `<span class="verdict">${verdictLabel}</span>`,
          `You: ${playerDesc}.`,
          `Best Bot: ${botDesc}.`,
          `<span class="winnings">+${profit} coins (${multiplier}x)</span>`,
        ].join("<br>");
        view.highlightWinningCards(playerResult.cards, slotRefs, true);
      } else if (cmp < 0) {
        const botName = `Bot ${bestBotIndex + 1}`;
        verdictLabel = `${botName.toUpperCase()} WINS`;
        streak = 0;
        state.setStreak(streak);
        uiUpdates.updateBankDisplay();
        // Play lose sound after flip animation completes (600ms)
        if (window.GameSounds) {
          setTimeout(() => {
            window.GameSounds.playLose();
          }, 700);
        }
        statusLabel.innerHTML = [
          `<span class="verdict">${verdictLabel}</span>`,
          `You: ${playerDesc}.`,
          `Best Bot: ${botDesc}.`,
          `<span class="loss">-${currentBet} coins</span>`,
        ].join("<br>");
        view.highlightWinningCards(bestBotResult.cards, slotRefs, false, bestBotIndex);
      } else {
        bank += currentBet;
        state.setBank(bank);
        uiUpdates.updateBankDisplay();
        statusLabel.innerHTML = [
          `<span class="verdict">${verdictLabel}</span>`,
          `You: ${playerDesc}.`,
          `Best Bot: ${botDesc}.`,
          `<span class="tie">Bet returned</span>`,
        ].join("<br>");
      }
      
      // Notify tutorial of round end
      if (state.getCurrentMode() === 'tutorial' && window.TutorialMode) {
        window.TutorialMode.handleRoundEnd(lastResult);
      }
    }

    return {
      showFinalHand,
    };
  }

  window.GameStateHandEvaluation = { create: createHandEvaluation };
})();

