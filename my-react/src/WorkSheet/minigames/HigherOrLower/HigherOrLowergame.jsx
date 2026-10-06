import { usePlatform } from "../../../platform/PlatformState.js";
import { useState } from "react";
import { InputNumber, Button } from "antd";
import { celebrateCorrectAnswer } from "../../../lib/confetti.js";
import "./HigherOrLowerMinigame.css";

function HigherOrLowerMinigame({ isTeacher, game, onGameChange, onComplete }) {
  const { t } = usePlatform();
  const [question, setQuestion] = useState(() =>
    generateQuestion(game.maxNumber),
  );
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [score, setScore] = useState(0);
  const [exerciseNumber, setExerciseNumber] = useState(1);
  const [finished, setFinished] = useState(false);

  function getNewQuestion() {
    if (exerciseNumber >= (game.exerciseCount || 10)) {
      setFinished(true);
      onComplete?.({ score, maxScore: game.exerciseCount || 10 });
      return;
    }
    setExerciseNumber((currentNumber) => currentNumber + 1);
    setQuestion(generateQuestion(game.maxNumber));
    setSelectedAnswer(null);
  }

  function checkAnswer(answer) {
    if (selectedAnswer !== null) return;
    setSelectedAnswer(answer);
    if (answer === question.correctAnswer) {
      celebrateCorrectAnswer();
      setScore((currentScore) => currentScore + 1);
    }
  }

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
        <p>{t("Is the first number greater or smaller than the second?")} </p>

        <strong>
          {question.firstNumber} &nbsp; ? &nbsp; {question.secondNumber}
        </strong>
      </div>

      <div className="higher-lower-answers">
        <Button
          type="primary"
          size="large"
          onClick={() => checkAnswer("bigger")}
          disabled={selectedAnswer !== null}
        >
          {t("Greater")}{" "}
        </Button>

        <Button
          type="primary"
          size="large"
          onClick={() => checkAnswer("smaller")}
          disabled={selectedAnswer !== null}
        >
          {t("Smaller")}{" "}
        </Button>
      </div>

      {selectedAnswer !== null && (
        <div className="higher-lower-feedback">
          {selectedAnswer === question.correctAnswer ? (
            <>
              <p>{t("Correct!")}</p>
              <Button type="primary" onClick={getNewQuestion}>
                {exerciseNumber >= (game.exerciseCount || 10)
                  ? t("Finish")
                  : t("Next exercise")}
              </Button>
            </>
          ) : (
            <>
              <p>{t("Try again!")}</p>
              <Button onClick={() => setSelectedAnswer(null)}>
                {t("Try again")}{" "}
              </Button>
            </>
          )}
        </div>
      )}
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
