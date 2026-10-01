import { useCallback, useState } from "react";
import { Alert, Button } from "antd";
import ColorMinigame from "./minigames/ColorMinigame/ColorMinigame.jsx";
import MathMinigame from "./minigames/Mathgame/MathMinigame.jsx";
import SequenceMinigame from "./minigames/Sequencegame/SequenceMinigame.jsx";
import HigherOrLowerMinigame from "./minigames/HigherOrLower/HigherOrLowergame.jsx";
import OddOrEvenMinigame from "./minigames/OddOrEven/OddOrEvengame.jsx";
import MatchingMinigame from "./minigames/MatchingGame/MatchingMinigame.jsx";
import WorksheetSprinkles from "./WorksheetSprinkles.jsx";
import { resultPayload } from "../platform/game-model.js";
import "./MainMinigamePage.css";
import "./PlayfulMinigames.css";
import "./ChildMinigame.css";

const games = {
  "color-game": ColorMinigame,
  "math-game": MathMinigame,
  "sequence-game": SequenceMinigame,
  "higher-lower-game": HigherOrLowerMinigame,
  "odd-even-game": OddOrEvenMinigame,
  "matching-game": MatchingMinigame,
};
const names = {
  "color-game": "Color Game",
  "math-game": "Easy Math",
  "sequence-game": "Number Sequence",
  "higher-lower-game": "Higher or Lower",
  "odd-even-game": "Odd or Even",
  "matching-game": "Match the Amounts",
};
const animals = [
  { id: "bear", name: "Urs", img: "/img/BearImg.webp" },
  { id: "fox", name: "Vulpe", img: "/img/FoxImg.webp" },
  { id: "wolf", name: "Lup", img: "/img/WolfImg.webp" },
];

// Editor preview and saved attempts render the same child-facing games.
export default function ChildMinigame({ game, onComplete, busy = false }) {
  const [started] = useState(() => performance.now());
  const [result, setResult] = useState(null);
  const clearResult = useCallback(() => setResult(null), []);
  const recordResult = useCallback(
    ({ score, maxScore }) => {
      setResult(
        resultPayload(score, maxScore, (performance.now() - started) / 1000),
      );
    },
    [started],
  );
  const Game = games[game.id];
  const configuration = {
    name: names[game.id],
    maxNumber: 10,
    operations: ["+", "-", "*", "/"],
    letter: "u",
    animals,
    ...game,
  };
  if (!Game) return <Alert type="warning" title="Activitate indisponibilă" />;
  return (
    <section
      className="worksheetGame worksheetGamePreview"
      data-game-type={game.id}
    >
      <WorksheetSprinkles seed={game.decorationSeed} />
      <div className="worksheetGameContent">
        <Game
          isTeacher={false}
          game={configuration}
          onComplete={recordResult}
          onReset={clearResult}
        />
        {result && (
          <div className="childGameActions">
            {onComplete ? (
              <Button
                size="large"
                type="primary"
                loading={busy}
                onClick={() => onComplete(result)}
              >
                Continuă
              </Button>
            ) : (
              <p role="status">
                Rezultat: {result.score} / {result.maxScore}
              </p>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
