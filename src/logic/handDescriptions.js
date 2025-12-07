// Friendly descriptions of evaluated hands.
(() => {
  function rankLabel(value) {
    const map = { 14: "A", 13: "K", 12: "Q", 11: "J" };
    return map[value] || String(value);
  }

  function describeHand(result) {
    const [a, b, c, d, e] = result.tiebreak;
    switch (result.category) {
      case window.HandEvaluator.CATEGORY.STRAIGHT_FLUSH:
        return `Straight Flush, ${rankLabel(a)}-high`;
      case window.HandEvaluator.CATEGORY.FOUR_OF_A_KIND:
        return `Four of a Kind, ${rankLabel(a)}s with ${rankLabel(b)} kicker`;
      case window.HandEvaluator.CATEGORY.FULL_HOUSE:
        return `Full House, ${rankLabel(a)}s over ${rankLabel(b)}s`;
      case window.HandEvaluator.CATEGORY.FLUSH:
        return `Flush, ${result.tiebreak.map(rankLabel).join(" ")} high`;
      case window.HandEvaluator.CATEGORY.STRAIGHT:
        return `${rankLabel(a)}-high Straight`;
      case window.HandEvaluator.CATEGORY.THREE_OF_A_KIND:
        return `Three of a Kind, ${rankLabel(a)}s with ${rankLabel(b)} ${rankLabel(c)} kickers`;
      case window.HandEvaluator.CATEGORY.TWO_PAIR:
        return `Two Pair, ${rankLabel(a)} and ${rankLabel(b)} with ${rankLabel(c)} kicker`;
      case window.HandEvaluator.CATEGORY.ONE_PAIR:
        return `One Pair of ${rankLabel(a)}s with ${[b, c, d].map(rankLabel).join(" ")} kickers`;
      default:
        return `High Card, ${[a, b, c, d, e].map(rankLabel).filter(Boolean).join(" ")}`;
    }
  }

  window.HandDescriptions = { rankLabel, describeHand };
})();
