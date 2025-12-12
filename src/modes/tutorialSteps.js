// Tutorial Steps - Defines all tutorial messages and targets
(() => {
  // Stage 1: Learn the basics (no betting/bot settings)
  const stage1Steps = [
    {
      id: 'welcome',
      message: "Welcome! These are your 5 cards. You'll use them to make the best poker hand.",
      target: '.player-section',
      waitFor: 'click-target',
      highlight: true,
      showNextButton: true,
    },
    {
      id: 'see-flop',
      message: "Click 'See Flop' to reveal the first 3 community cards.",
      target: '#flop-button',
      waitFor: 'click-target',
      highlight: true,
      showNextButton: false,
    },
    {
      id: 'flop-revealed',
      message: "These are the Flop cards - shared by everyone. Combine them with your cards!",
      target: '.board .section:first-child',
      waitFor: 'click-target',
      highlight: true,
      showNextButton: true,
    },
    {
      id: 'discard-1',
      message: "Click one of your cards to discard it. Choose wisely!",
      target: '.player-section .slot-row',
      waitFor: 'discard',
      highlight: true,
      showNextButton: false,
      position: 'bottom', // Position below player cards so it doesn't block community cards
    },
    {
      id: 'turn-revealed',
      message: "The Turn card is revealed - another community card to use!",
      target: '.board .section:nth-child(2)',
      waitFor: 'click-target',
      highlight: true,
      showNextButton: true,
    },
    {
      id: 'discard-2',
      message: "Discard another card from your hand.",
      target: '.player-section .slot-row',
      waitFor: 'discard',
      highlight: true,
      showNextButton: false,
      position: 'bottom', // Position below player cards so it doesn't block community cards
    },
    {
      id: 'river-revealed',
      message: "The River - the final community card!",
      target: '.board .section:nth-child(3)',
      waitFor: 'click-target',
      highlight: true,
      showNextButton: true,
    },
    {
      id: 'discard-3',
      message: "Discard your last card to finish with 2 hole cards.",
      target: '.player-section .slot-row',
      waitFor: 'discard',
      highlight: true,
      showNextButton: false,
      position: 'bottom', // Position below player cards so it doesn't block community cards
    },
    {
      id: 'reveal-bot',
      message: "Click to reveal the bot's hand and see who wins!",
      target: '#reveal-button',
      waitFor: 'click-target',
      highlight: true,
      showNextButton: false,
    },
    {
      id: 'result-1',
      message: null, // Will be set dynamically based on result
      target: '.player-section',
      waitFor: 'click-target',
      highlight: false,
      isDynamic: true,
      showNextButton: true,
    },
  ];

  // Stage 2: Learn settings (with betting/bot controls)
  const stage2Steps = [
    {
      id: 'intro-betting',
      message: "Now let's learn about betting! This shows your current bet amount.",
      target: '#bet-control',
      waitFor: 'click-target',
      highlight: true,
      showNextButton: true,
    },
    {
      id: 'bet-arrows',
      message: "Use the arrows to increase or decrease your bet. Try it now!",
      target: '#bet-control',
      waitFor: 'bet-changed',
      highlight: true,
      showNextButton: false,
    },
    {
      id: 'bot-slider',
      message: "More bots = higher risk but bigger rewards! The multiplier increases your winnings.",
      target: '.bot-count-control',
      waitFor: 'click-target',
      highlight: true,
      showNextButton: true,
    },
    {
      id: 'play-round-2',
      message: "Adjust your settings if you'd like, then click 'See Flop' to play!",
      target: '#flop-button',
      waitFor: 'click-target',
      highlight: true,
      showNextButton: false,
    },
    // Normal gameplay continues without prompts until reveal
    {
      id: 'result-2',
      message: null, // Will be set dynamically based on result + multiplier explanation
      target: '.bank-display',
      waitFor: 'click-target',
      highlight: false,
      isDynamic: true,
      isFinal: true,
      showNextButton: true,
    },
  ];

  // Helper to get result message for stage 1
  function getStage1ResultMessage(handName, won) {
    if (won === true) {
      return `You won with ${handName}! Great job! Click to continue learning.`;
    } else if (won === false) {
      return `You had ${handName}, but the bot won this time. Don't worry, let's learn more!`;
    } else {
      return `It's a tie! You both had ${handName}. Click to continue.`;
    }
  }

  // Helper to get result message for stage 2
  function getStage2ResultMessage(handName, won, bet, multiplier, winnings) {
    if (won === true) {
      return `You won! Your ${bet} coin bet with a ${multiplier}x multiplier earned you ${winnings} coins! Ready to play for real?`;
    } else if (won === false) {
      return `You lost ${bet} coins with ${handName}. Higher multipliers mean bigger risks! Ready to try Casual mode?`;
    } else {
      return `Tie game! Your ${bet} coins were returned. Ready to play Casual mode?`;
    }
  }

  window.TutorialSteps = {
    stage1: stage1Steps,
    stage2: stage2Steps,
    getStage1ResultMessage,
    getStage2ResultMessage,
  };
})();

