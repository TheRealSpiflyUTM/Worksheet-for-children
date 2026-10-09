import { usePlatform } from "../../../platform/PlatformState.js";
import { InputNumber, Button } from "antd";
import { useNumberGame } from "../../../lib/useNumberGame.js";
import { answerState } from "../../../lib/game-feedback.js";
import "./OddOrEvenMinigame.css";

function OddOrEvenMinigame({ isTeacher, game, onGameChange, onComplete }) {
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
      <div className="odd-even-minigame teacher-odd-even">
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

        <p>{t("Children will decide whether a number is odd or even.")} </p>
      </div>
    );
  }

  if (finished) {
    return (
      <div className="odd-even-minigame">
        <h2>{t(game.name)}</h2>
        <div className="odd-even-feedback">
          <h3>{t("Finished!")}</h3>
          <p>
            {t("Your score:")} {score} / {game.exerciseCount || 10}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="odd-even-minigame">
      <h2>{t(game.name)}</h2>
      <div className="odd-even-score">
        {t("Score:")} {score}
      </div>

      <div className="odd-even-exercise-number">
        {t("Exercise")} {exerciseNumber} / {game.exerciseCount || 10}
      </div>

      <div className="odd-even-question">
        <p>{t("Is this number odd or even?")}</p>
        <strong>{question.number}</strong>
      </div>

      <div className="odd-even-answers">
        <Button
          type="primary"
          size="large"
          onClick={() => checkAnswer("odd")}
          data-answer-state={answerState(
            selectedAnswer,
            "odd",
            question.correctAnswer,
          )}
          disabled={selectedAnswer !== null}
        >
          {t("Odd")}{" "}
        </Button>

        <Button
          type="primary"
          size="large"
          onClick={() => checkAnswer("even")}
          data-answer-state={answerState(
            selectedAnswer,
            "even",
            question.correctAnswer,
          )}
          disabled={selectedAnswer !== null}
        >
          {t("Even")}{" "}
        </Button>
      </div>
    </div>
  );
}

function generateQuestion(maxNumber) {
  const safeMaxNumber = Number(maxNumber) || 10;
  const number = Math.floor(Math.random() * safeMaxNumber) + 1;
  const correctAnswer = number % 2 === 0 ? "even" : "odd";
  return {
    number,
    correctAnswer,
  };
}

export default OddOrEvenMinigame;
