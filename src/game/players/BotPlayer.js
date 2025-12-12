// Basic bot discard logic. Exposed globally as window.BotPlayer.
(() => {
  function chooseDiscard(cards, boardCards) {
    // cards: array of codes like "AS", "10H".
    // Simple heuristic: keep highest ranks; discard the lowest rank.
    if (!Array.isArray(cards) || cards.length <= 2) return null;
    let lowestIdx = 0;
    let lowestVal = rankValue(cards[0]);
    for (let i = 1; i < cards.length; i += 1) {
      const val = rankValue(cards[i]);
      if (val < lowestVal) {
        lowestVal = val;
        lowestIdx = i;
      }
    }
    return lowestIdx;
  }

  function rankValue(code) {
    const match = /^(10|[2-9]|[JQKA])[SHDC]$/.exec(code);
    if (!match) return 0;
    const rank = match[1];
    const map = { A: 14, K: 13, Q: 12, J: 11 };
    if (map[rank]) return map[rank];
    return parseInt(rank, 10);
  }

  window.BotPlayer = { chooseDiscard };
})();



