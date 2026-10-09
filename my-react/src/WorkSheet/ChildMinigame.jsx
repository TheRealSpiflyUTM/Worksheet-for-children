import { usePlatform } from "../platform/PlatformState.js";
import { useCallback, useEffect, useRef, useState } from "react";
import { Alert, Button } from "antd";
import ColorMinigame from "./minigames/ColorMinigame/ColorMinigame.jsx";
import MathMinigame from "./minigames/Mathgame/MathMinigame.jsx";
import SequenceMinigame from "./minigames/Sequencegame/SequenceMinigame.jsx";
import HigherOrLowerMinigame from "./minigames/HigherOrLower/HigherOrLowergame.jsx";
import OddOrEvenMinigame from "./minigames/OddOrEven/OddOrEvengame.jsx";
import MatchingMinigame from "./minigames/MatchingGame/MatchingMinigame.jsx";
import WorksheetSprinkles from "./WorksheetSprinkles.jsx";
import WorksheetGameFrame from "./WorksheetGameFrame.jsx";
import { resultPayload } from "../platform/game-model.js";
import { playTaskComplete, stopGameFeedback } from "../lib/game-feedback.js";
import "./MainMinigamePage.css";
import "./PlayfulMinigames.css";
import "./ChildMinigame.css";
import "./ChildGameTheme.css";
import "./GameFeedback.css";

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
const scoredNumberGames = new Set([
  "math-game",
  "sequence-game",
  "higher-lower-game",
  "odd-even-game",
]);
const animals = [
  { id: "bear", name: "Urs", img: "/img/BearImg.webp" },
  { id: "fox", name: "Vulpe", img: "/img/FoxImg.webp" },
  { id: "wolf", name: "Lup", img: "/img/WolfImg.webp" },
];

// Editor preview and saved attempts render the same child-facing games.
export default function ChildMinigame({ game, onComplete, busy = false }) {
  const { t } = usePlatform();
  const [started] = useState(() => performance.now());
  const [result, setResult] = useState(null);
  const [saveFailed, setSaveFailed] = useState(false);
  const completed = useRef(false);
  const saving = useRef(false);
  const autoAdvance = scoredNumberGames.has(game.id);
  useEffect(
    () => () => {
      // Let the reward finish when a completed game advances to the next activity.
      stopGameFeedback({ preserveCompletion: true });
    },
    [],
  );
  const submitResult = useCallback(
    async (payload) => {
      if (!onComplete || saving.current) return;
      saving.current = true;
      setSaveFailed(false);
      try {
        if ((await onComplete(payload)) === false) setSaveFailed(true);
      } catch {
        setSaveFailed(true);
      } finally {
        saving.current = false;
      }
    },
    [onComplete],
  );
  const clearResult = useCallback(() => {
    completed.current = false;
    setResult(null);
    setSaveFailed(false);
  }, []);
  const recordResult = useCallback(
    ({ score, maxScore }) => {
      if (completed.current) return;
      completed.current = true;
      playTaskComplete();
      const payload = resultPayload(
        score,
        maxScore,
        (performance.now() - started) / 1000,
      );
      setResult(payload);
      if (autoAdvance) void submitResult(payload);
    },
    [started, autoAdvance, submitResult],
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
  if (!Game) return <Alert type="warning" title={t("Unavailable activity")} />;
  return (
    <WorksheetGameFrame>
      <section
        className="worksheetGame worksheetGameAppearance worksheetGamePreview"
        data-game-type={game.id}
      >
        <WorksheetSprinkles seed={game.decorationSeed} />
        <div className="worksheetGameContent">
          <div inert={busy}>
            <Game
              isTeacher={false}
              game={configuration}
              onComplete={recordResult}
              onReset={clearResult}
            />
          </div>
          {result && (
            <div className="childGameActions">
              {onComplete && (!autoAdvance || saveFailed) ? (
                <Button
                  size="large"
                  type="primary"
                  loading={busy}
                  onClick={() => submitResult(result)}
                >
                  {t(autoAdvance ? "Save result" : "Continue")}{" "}
                </Button>
              ) : (
                <p role="status">
                  {onComplete
                    ? t("Saving…")
                    : `${t("Result:")} ${result.score} / ${result.maxScore}`}
                </p>
              )}
            </div>
          )}
        </div>
      </section>
    </WorksheetGameFrame>
  );
}
