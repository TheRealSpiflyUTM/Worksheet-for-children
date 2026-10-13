import { usePlatform } from "../../../platform/PlatformState.js";
import { InputNumber, Button } from "antd";
import { useNumberGame } from "../../../lib/useNumberGame.js";
import { answerState } from "../../../lib/game-feedback.js";
import "./HigherOrLowerMinigame.css";

function HigherOrLowerMinigame({ isTeacher, game, onGameChange, onComplete }) {
  const { t } = usePlatform();
  const {
    question,
    selectedAnswer,
    score,
    exerciseNumber,
    finished,
    checkAnswer,
  } = useNumberGame(
    () => generateQuestion(game.maxNumber),
    game.exerciseCount,
    onComplete,
  );

  function changeMaxNumber(value) {
    onGameChange({
      ...game,
      maxNumber: value,
    });
  }

  function changeExerciseCount(value) {
    onGameChange({
      ...game,
      exerciseCount: value,
    });
  }

  if (isTeacher) {
    return (
      <div className="higher-lower-minigame teacher-higher-lower">
        <h2>{t(game.name)}</h2>
        <label>
          {t("Maximum number:")}{" "}
          <InputNumber
            min={10}
            max={100}
            value={game.maxNumber}
            onChange={changeMaxNumber}
          />
        </label>

        <label>
          {t("Number of exercises:")}{" "}
          <InputNumber
            min={1}
            max={100}
            value={game.exerciseCount || 10}
            onChange={changeExerciseCount}
          />
        </label>

        <p>
          {t(
            "Children will decide whether the first number is greater or smaller than the second.",
          )}{" "}
        </p>
      </div>
    );
  }

  if (finished) {
    return (
      <div className="higher-lower-minigame">
        <h2>{t(game.name)}</h2>
        <div className="higher-lower-feedback">
          <h3>{t("Finished!")}</h3>
          <p>
            {t("Your score:")} {score} / {game.exerciseCount || 10}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="higher-lower-minigame">
      <h2>{t(game.name)}</h2>
      <div className="higher-lower-score">
        {t("Score:")} {score}
      </div>

      <div className="higher-lower-exercise-number">
        {t("Exercise")} {exerciseNumber} / {game.exerciseCount || 10}
      </div>

      <div className="higher-lower-question">
        <strong className="comparison-row">
          <span className="comparison-tile">{question.firstNumber}</span>
          <span className="comparison-tile">
            {selectedAnswer === null
              ? "?"
              : selectedAnswer === "bigger"
                ? ">"
                : "<"}
          </span>
          <span className="comparison-tile">{question.secondNumber}</span>
        </strong>
      </div>

      <div className="higher-lower-answers">
        <Button
          type="primary"
          size="large"
          onClick={() => checkAnswer("bigger")}
          data-answer-state={answerState(
            selectedAnswer,
            "bigger",
            question.correctAnswer,
          )}
          disabled={selectedAnswer !== null}
        >
          <span className="comparison-symbol" aria-hidden="true">
            &gt;
          </span>
          <span>{t("Greater")}</span>
        </Button>

        <Button
          type="primary"
          size="large"
          onClick={() => checkAnswer("smaller")}
          data-answer-state={answerState(
            selectedAnswer,
            "smaller",
            question.correctAnswer,
          )}
          disabled={selectedAnswer !== null}
        >
          <span className="comparison-symbol" aria-hidden="true">
            &lt;
          </span>
          <span>{t("Smaller")}</span>
        </Button>
      </div>
    </div>
  );
}

function generateQuestion(maxNumber) {
  const safeMaxNumber = Math.max(2, Number(maxNumber) || 10);
  const firstNumber = Math.floor(Math.random() * safeMaxNumber) + 1;
  let secondNumber;

  // Previne generarea aceluiași număr (pentru a evita egalitatea)
  do {
    secondNumber = Math.floor(Math.random() * safeMaxNumber) + 1;
  } while (secondNumber === firstNumber);

  const correctAnswer = firstNumber > secondNumber ? "bigger" : "smaller";

  return {
    firstNumber,
    secondNumber,
    correctAnswer,
  };
}

export default HigherOrLowerMinigame;
