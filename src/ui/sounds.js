// Sound effects utility for the game.
(() => {
  // Preload sounds
  const sounds = {
    cardFlip: new Audio('assets/sounds/flipcard-91468.mp3'),
    click: new Audio('assets/sounds/clicksound.mp3'),
    cardDeal: new Audio('assets/sounds/card deal sound.mp3'),
    winSmall: new Audio('assets/sounds/winsound-small.mp3'),
    winMedium: new Audio('assets/sounds/winsound-medium.mp3'),
    winLarge: new Audio('assets/sounds/winsound-large.mp3'),
    lose: new Audio('assets/sounds/losesound.mp3'),
  };

  // Set default volume
  Object.values(sounds).forEach(sound => {
    sound.volume = 0.5;
  });

  /**
   * Play the card flip sound.
   */
  function playCardFlip() {
    // Clone the audio to allow overlapping plays
    const sound = sounds.cardFlip.cloneNode();
    sound.volume = 0.5;
    sound.play().catch(() => {
      // Ignore autoplay restrictions
    });
  }

  /**
   * Play the click/discard sound.
   */
  function playClick() {
    try {
      const sound = sounds.click.cloneNode();
      sound.volume = 0.5;
      sound.play();
    } catch (e) {
      // Sound failed - ignore silently
    }
  }

  /**
   * Play the card deal sound.
   */
  function playCardDeal() {
    try {
      const sound = sounds.cardDeal.cloneNode();
      sound.volume = 0.5;
      sound.play();
    } catch (e) {
      // Sound failed - ignore silently
    }
  }

  /**
   * Play win sound based on bot count.
   * @param {number} botCount - Number of bots (1=small, 2-4=medium, 5=large)
   */
  function playWin(botCount) {
    try {
      let sound;
      if (botCount === 1) {
        sound = sounds.winSmall.cloneNode();
      } else if (botCount >= 2 && botCount <= 4) {
        sound = sounds.winMedium.cloneNode();
      } else {
        sound = sounds.winLarge.cloneNode();
      }
      sound.volume = 0.5;
      sound.play();
    } catch (e) {
      // Sound failed - ignore silently
    }
  }

  /**
   * Play lose sound.
   */
  function playLose() {
    try {
      const sound = sounds.lose.cloneNode();
      sound.volume = 0.5;
      sound.play();
    } catch (e) {
      // Sound failed - ignore silently
    }
  }

  window.GameSounds = {
    playCardFlip,
    playClick,
    playCardDeal,
    playWin,
    playLose,
  };
})();

