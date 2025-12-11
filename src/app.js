// Bootstrap the game on DOMContentLoaded.
document.addEventListener("DOMContentLoaded", () => {
  const view = window.PlayerView;
  const deckUtils = window.Deck;
  const handDescriptions = window.HandDescriptions;
  const gameStateFactory = window.GameState;
  const domRefs = window.DomRefs;
  const statusUI = window.StatusUI;
  const bindings = window.Bindings;

  if (!view || !deckUtils || !handDescriptions || !gameStateFactory || !domRefs || !statusUI || !bindings) {
    throw new Error("App bootstrap missing required helpers. Check script order in index.html.");
  }

  const refs = domRefs.getDomRefs();

  const game = gameStateFactory.create({
    view,
    deckUtils,
    handDescriptions,
    slotRefs: refs.slotRefs,
    statusLabel: refs.statusLabel,
    deckLabel: refs.deckLabel,
    flopButton: refs.flopButton,
    revealButton: refs.revealButton,
    playAgainButton: refs.playAgainButton,
    botCountSlider: refs.botCountSlider,
    botCountControl: refs.botCountControl,
    botSection: refs.botSection,
    botRows: refs.botRows,
    bankAmount: refs.bankAmount,
    winStreak: refs.winStreak,
    betInput: refs.betInput,
    betDecrementBtn: refs.betDecrementBtn,
    betIncrementBtn: refs.betIncrementBtn,
    betControl: refs.betControl,
  });

  bindings.bind(game, refs, statusUI);
});
