// Hand evaluation helper for Texas Hold'em (best 5 out of up to 7 cards).
// Cards are strings like "AS", "10H", "4D", "KC".
(() => {
  const RANK_VALUE = {
    "2": 2,
    "3": 3,
    "4": 4,
    "5": 5,
    "6": 6,
    "7": 7,
    "8": 8,
    "9": 9,
    "10": 10,
    J: 11,
    Q: 12,
    K: 13,
    A: 14,
  };

  const CATEGORY = {
    HIGH_CARD: 0,
    ONE_PAIR: 1,
    TWO_PAIR: 2,
    THREE_OF_A_KIND: 3,
    STRAIGHT: 4,
    FLUSH: 5,
    FULL_HOUSE: 6,
    FOUR_OF_A_KIND: 7,
    STRAIGHT_FLUSH: 8,
  };

  function parseCard(code) {
    const match = /^(10|[2-9]|[JQKA])([SHDC])$/.exec(code);
    if (!match) {
      throw new Error(`Invalid card code: ${code}`);
    }
    const [, rankText, suit] = match;
    return { rankText, rank: RANK_VALUE[rankText], suit };
  }

  function evaluateBestHand(cardCodes) {
    if (!Array.isArray(cardCodes) || cardCodes.length < 5) {
      throw new Error("Need at least 5 cards to evaluate.");
    }

    const cards = cardCodes.map(parseCard);

    // Rank and suit counts.
    const rankCounts = new Map();
    const suitCounts = new Map();
    cards.forEach((c) => {
      rankCounts.set(c.rank, (rankCounts.get(c.rank) || 0) + 1);
      suitCounts.set(c.suit, (suitCounts.get(c.suit) || 0) + 1);
    });

    const uniqueRanksDesc = Array.from(rankCounts.keys()).sort((a, b) => b - a);

    // Flush detection.
    let flushSuit = null;
    for (const [suit, count] of suitCounts.entries()) {
      if (count >= 5) {
        flushSuit = suit;
        break;
      }
    }

    const flushRanksDesc = flushSuit
      ? cards
          .filter((c) => c.suit === flushSuit)
          .map((c) => c.rank)
          .sort((a, b) => b - a)
      : [];

    // Straight detection helpers.
    const straightHigh = findStraightHigh(uniqueRanksDesc);
    const straightFlushHigh = flushSuit
      ? findStraightHigh(uniqueDescUnique(flushRanksDesc))
      : null;

    // Rank groupings.
    const trips = [];
    const pairs = [];
    let quads = null;
    rankCounts.forEach((count, rank) => {
      if (count === 4) quads = rank;
      else if (count === 3) trips.push(rank);
      else if (count === 2) pairs.push(rank);
    });
    trips.sort((a, b) => b - a);
    pairs.sort((a, b) => b - a);

    // Straight flush.
    if (straightFlushHigh) {
      return {
        category: CATEGORY.STRAIGHT_FLUSH,
        name: "Straight Flush",
        tiebreak: [straightFlushHigh],
      };
    }

    // Four of a kind.
    if (quads !== null) {
      const kicker = topRanksExcluding(uniqueRanksDesc, [quads], 1);
      return {
        category: CATEGORY.FOUR_OF_A_KIND,
        name: "Four of a Kind",
        tiebreak: [quads, kicker[0]],
      };
    }

    // Full house.
    if (trips.length >= 1 && (pairs.length >= 1 || trips.length >= 2)) {
      const tripRank = trips[0];
      const pairRank = pairs.length >= 1 ? pairs[0] : trips[1];
      return {
        category: CATEGORY.FULL_HOUSE,
        name: "Full House",
        tiebreak: [tripRank, pairRank],
      };
    }

    // Flush.
    if (flushSuit) {
      const topFlush = flushRanksDesc.slice(0, 5);
      return {
        category: CATEGORY.FLUSH,
        name: "Flush",
        tiebreak: topFlush,
      };
    }

    // Straight.
    if (straightHigh) {
      return {
        category: CATEGORY.STRAIGHT,
        name: "Straight",
        tiebreak: [straightHigh],
      };
    }

    // Trips.
    if (trips.length >= 1) {
      const tripRank = trips[0];
      const kickers = topRanksExcluding(uniqueRanksDesc, [tripRank], 2);
      return {
        category: CATEGORY.THREE_OF_A_KIND,
        name: "Three of a Kind",
        tiebreak: [tripRank, ...kickers],
      };
    }

    // Two pair.
    if (pairs.length >= 2) {
      const topPair = pairs[0];
      const secondPair = pairs[1];
      const kicker = topRanksExcluding(uniqueRanksDesc, [topPair, secondPair], 1);
      return {
        category: CATEGORY.TWO_PAIR,
        name: "Two Pair",
        tiebreak: [topPair, secondPair, kicker[0]],
      };
    }

    // One pair.
    if (pairs.length === 1) {
      const pairRank = pairs[0];
      const kickers = topRanksExcluding(uniqueRanksDesc, [pairRank], 3);
      return {
        category: CATEGORY.ONE_PAIR,
        name: "One Pair",
        tiebreak: [pairRank, ...kickers],
      };
    }

    // High card.
    return {
      category: CATEGORY.HIGH_CARD,
      name: "High Card",
      tiebreak: uniqueRanksDesc.slice(0, 5),
    };
  }

  function compareHands(a, b) {
    if (a.category !== b.category) {
      return a.category > b.category ? 1 : -1;
    }
    const len = Math.max(a.tiebreak.length, b.tiebreak.length);
    for (let i = 0; i < len; i += 1) {
      const av = a.tiebreak[i] || 0;
      const bv = b.tiebreak[i] || 0;
      if (av !== bv) {
        return av > bv ? 1 : -1;
      }
    }
    return 0;
  }

  // Helpers.
  function findStraightHigh(ranksDesc) {
    if (ranksDesc.length < 5) return null;
    const withWheel = ranksDesc.includes(14) ? [...ranksDesc, 1] : [...ranksDesc];
    for (let i = 0; i <= withWheel.length - 5; i += 1) {
      let run = true;
      for (let j = 1; j < 5; j += 1) {
        if (withWheel[i + j - 1] - 1 !== withWheel[i + j]) {
          run = false;
          break;
        }
      }
      if (run) {
        return withWheel[i] === 5 ? 5 : withWheel[i];
      }
    }
    return null;
  }

  function uniqueDescUnique(arr) {
    const seen = new Set();
    const out = [];
    arr.forEach((v) => {
      if (!seen.has(v)) {
        out.push(v);
        seen.add(v);
      }
    });
    out.sort((a, b) => b - a);
    return out;
  }

  function topRanksExcluding(ranksDesc, exclude, count) {
    const ex = new Set(exclude);
    const result = [];
    for (const r of ranksDesc) {
      if (!ex.has(r)) {
        result.push(r);
        if (result.length === count) break;
      }
    }
    return result;
  }

  // Expose globally for now.
  window.HandEvaluator = {
    evaluateBestHand,
    compareHands,
    CATEGORY,
  };
})();
