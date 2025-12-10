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
    return { rankText, rank: RANK_VALUE[rankText], suit, code };
  }

  function evaluateBestHand(cardCodes) {
    if (!Array.isArray(cardCodes) || cardCodes.length < 5) {
      throw new Error("Need at least 5 cards to evaluate.");
    }

    const cards = cardCodes.map(parseCard);

    // Rank and suit counts.
    const rankCounts = new Map();
    const suitCounts = new Map();
    // Group cards by rank and suit for easy lookup
    const cardsByRank = new Map();
    const cardsBySuit = new Map();
    
    cards.forEach((c) => {
      rankCounts.set(c.rank, (rankCounts.get(c.rank) || 0) + 1);
      suitCounts.set(c.suit, (suitCounts.get(c.suit) || 0) + 1);
      
      if (!cardsByRank.has(c.rank)) cardsByRank.set(c.rank, []);
      cardsByRank.get(c.rank).push(c);
      
      if (!cardsBySuit.has(c.suit)) cardsBySuit.set(c.suit, []);
      cardsBySuit.get(c.suit).push(c);
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

    const flushCards = flushSuit
      ? cardsBySuit.get(flushSuit).sort((a, b) => b.rank - a.rank)
      : [];
    const flushRanksDesc = flushCards.map((c) => c.rank);

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
      const sfCards = getStraightCards(flushCards, straightFlushHigh);
      return {
        category: CATEGORY.STRAIGHT_FLUSH,
        name: "Straight Flush",
        tiebreak: [straightFlushHigh],
        cards: sfCards.map(c => c.code),
      };
    }

    // Four of a kind.
    if (quads !== null) {
      const quadCards = cardsByRank.get(quads).slice(0, 4);
      const kicker = topCardsExcluding(cards, [quads], 1);
      return {
        category: CATEGORY.FOUR_OF_A_KIND,
        name: "Four of a Kind",
        tiebreak: [quads, kicker[0]?.rank],
        cards: [...quadCards, ...kicker].map(c => c.code),
      };
    }

    // Full house.
    if (trips.length >= 1 && (pairs.length >= 1 || trips.length >= 2)) {
      const tripRank = trips[0];
      const pairRank = pairs.length >= 1 ? pairs[0] : trips[1];
      const tripCards = cardsByRank.get(tripRank).slice(0, 3);
      const pairCards = cardsByRank.get(pairRank).slice(0, 2);
      return {
        category: CATEGORY.FULL_HOUSE,
        name: "Full House",
        tiebreak: [tripRank, pairRank],
        cards: [...tripCards, ...pairCards].map(c => c.code),
      };
    }

    // Flush.
    if (flushSuit) {
      const topFlushCards = flushCards.slice(0, 5);
      return {
        category: CATEGORY.FLUSH,
        name: "Flush",
        tiebreak: topFlushCards.map(c => c.rank),
        cards: topFlushCards.map(c => c.code),
      };
    }

    // Straight.
    if (straightHigh) {
      const straightCards = getStraightCards(cards, straightHigh);
      return {
        category: CATEGORY.STRAIGHT,
        name: "Straight",
        tiebreak: [straightHigh],
        cards: straightCards.map(c => c.code),
      };
    }

    // Trips.
    if (trips.length >= 1) {
      const tripRank = trips[0];
      const tripCards = cardsByRank.get(tripRank).slice(0, 3);
      const kickers = topCardsExcluding(cards, [tripRank], 2);
      return {
        category: CATEGORY.THREE_OF_A_KIND,
        name: "Three of a Kind",
        tiebreak: [tripRank, ...kickers.map(c => c.rank)],
        cards: [...tripCards, ...kickers].map(c => c.code),
      };
    }

    // Two pair.
    if (pairs.length >= 2) {
      const topPair = pairs[0];
      const secondPair = pairs[1];
      const topPairCards = cardsByRank.get(topPair).slice(0, 2);
      const secondPairCards = cardsByRank.get(secondPair).slice(0, 2);
      const kicker = topCardsExcluding(cards, [topPair, secondPair], 1);
      return {
        category: CATEGORY.TWO_PAIR,
        name: "Two Pair",
        tiebreak: [topPair, secondPair, kicker[0]?.rank],
        cards: [...topPairCards, ...secondPairCards, ...kicker].map(c => c.code),
      };
    }

    // One pair.
    if (pairs.length === 1) {
      const pairRank = pairs[0];
      const pairCards = cardsByRank.get(pairRank).slice(0, 2);
      const kickers = topCardsExcluding(cards, [pairRank], 3);
      return {
        category: CATEGORY.ONE_PAIR,
        name: "One Pair",
        tiebreak: [pairRank, ...kickers.map(c => c.rank)],
        cards: [...pairCards, ...kickers].map(c => c.code),
      };
    }

    // High card.
    const highCards = cards.sort((a, b) => b.rank - a.rank).slice(0, 5);
    return {
      category: CATEGORY.HIGH_CARD,
      name: "High Card",
      tiebreak: highCards.map(c => c.rank),
      cards: highCards.map(c => c.code),
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

  // Get the 5 cards that make up a straight ending at highRank
  function getStraightCards(cards, highRank) {
    const result = [];
    // Handle wheel straight (A-2-3-4-5)
    const targetRanks = highRank === 5 
      ? [5, 4, 3, 2, 14] // Wheel: 5-4-3-2-A (A counts as 1)
      : [highRank, highRank - 1, highRank - 2, highRank - 3, highRank - 4];
    
    const usedRanks = new Set();
    for (const targetRank of targetRanks) {
      const card = cards.find(c => c.rank === targetRank && !usedRanks.has(c.code));
      if (card) {
        result.push(card);
        usedRanks.add(card.code);
      }
    }
    return result;
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

  // Get top N cards excluding certain ranks
  function topCardsExcluding(cards, excludeRanks, count) {
    const ex = new Set(excludeRanks);
    const sorted = cards.filter(c => !ex.has(c.rank)).sort((a, b) => b.rank - a.rank);
    return sorted.slice(0, count);
  }

  // Expose globally for now.
  window.HandEvaluator = {
    evaluateBestHand,
    compareHands,
    CATEGORY,
  };
})();
