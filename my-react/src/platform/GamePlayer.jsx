import ChildMinigame from "../WorkSheet/ChildMinigame.jsx";

export default function GamePlayer({ item, onComplete, busy = false }) {
  const game = {
    ...item.configuration,
    id: item.definition?.type,
    decorationSeed: `worksheet-item-${item.id}`,
  };
  return <ChildMinigame game={game} onComplete={onComplete} busy={busy} />;
}
