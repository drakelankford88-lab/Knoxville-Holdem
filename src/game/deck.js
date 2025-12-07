// Deck helpers for building, shuffling, and drawing cards.
(() => {
  const RANKS = ["A", "K", "Q", "J", "10", "9", "8", "7", "6", "5", "4", "3", "2"];
  const SUITS = ["S", "H", "D", "C"];

  function buildDeck() {
    const fresh = [];
    SUITS.forEach((suit) => {
      RANKS.forEach((rank) => {
        fresh.push(`${rank}${suit}`);
      });
    });
    return fresh;
  }

  function shuffleDeck(list) {
    for (let i = list.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      const temp = list[i];
      list[i] = list[j];
      list[j] = temp;
    }
  }

  function drawCards(deck, count) {
    if (!Array.isArray(deck) || deck.length < count) {
      throw new Error("Not enough cards remaining.");
    }
    const drawn = [];
    for (let i = 0; i < count; i += 1) {
      drawn.push(deck.pop());
    }
    return drawn;
  }

  window.Deck = { buildDeck, shuffleDeck, drawCards };
})();
