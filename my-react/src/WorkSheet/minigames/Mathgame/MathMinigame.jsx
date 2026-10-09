import { usePlatform } from "../../../platform/PlatformState.js";
import { Checkbox, InputNumber } from "antd";
import { useNumberGame } from "../../../lib/useNumberGame.js";
import { answerState } from "../../../lib/game-feedback.js";
import "./MathMinigame.css";

function MathMinigame({ isTeacher, game, onGameChange, onComplete }) {
  const { t } = usePlatform();
  const {
    question,
    setQuestion,
    selectedAnswer,
    setSelectedAnswer,
    score,
    exerciseNumber,
    finished,
    checkAnswer,
  } = useNumberGame(
    () => generateQuestion(game.maxNumber, game.operations),
    game.exerciseCount,
    onComplete,
  );

  function changeMaxNumber(value) {
    onGameChange({
      ...game,
      maxNumber: value,
    });
    setQuestion(generateQuestion(value, game.operations));
    setSelectedAnswer(null);
  }

  function changeExerciseCount(value) {
    onGameChange({
      ...game,
      exerciseCount: value,
    });
  }

  function changeOperation(operation) {
    const currentOperations = game.operations || ["+"];
    let newOperations;

    if (currentOperations.includes(operation)) {
      newOperations = currentOperations.filter((item) => item !== operation);
    } else {
      newOperations = [...currentOperations, operation];
    }

    if (newOperations.length === 0) {
      return;
    }

    onGameChange({
      ...game,
      operations: newOperations,
    });

    setQuestion(generateQuestion(game.maxNumber, newOperations));
    setSelectedAnswer(null);
  }

  if (isTeacher) {
    const operations = game.operations || ["+"];
    return (
      <div className="math-minigame teacher-math">
        <h2>{t(game.name)}</h2>

        <div className="math-setting">
          <p>{t("Maximum number for operands:")}</p>
          <InputNumber
            min={1}
            max={100}
            value={game.maxNumber}
            onChange={changeMaxNumber}
          />
        </div>

        <div className="math-setting">
          <p>{t("Number of exercises:")}</p>
          <InputNumber
            min={1}
            max={100}
            value={game.exerciseCount || 10}
            onChange={changeExerciseCount}
          />
        </div>

        <div className="math-setting">
          <p>{t("Select operations:")}</p>
          <div className="math-operations">
            <Checkbox
              checked={operations.includes("+")}
              onChange={() => changeOperation("+")}
            >
              {t("Addition (+)")}{" "}
            </Checkbox>

            <Checkbox
              checked={operations.includes("-")}
              onChange={() => changeOperation("-")}
            >
              {t("Subtraction (-)")}{" "}
            </Checkbox>

            <Checkbox
              checked={operations.includes("*")}
              onChange={() => changeOperation("*")}
            >
              {t("Multiplication (×)")}{" "}
            </Checkbox>

            <Checkbox
              checked={operations.includes("/")}
              onChange={() => changeOperation("/")}
            >
              {t("Division (÷)")}{" "}
            </Checkbox>
          </div>
        </div>

        <p>
          {t(
            "Children will receive {count} exercises using numbers from 1 to {max}.",
            { count: game.exerciseCount || 10, max: game.maxNumber },
          )}
        </p>
      </div>
    );
  }

  if (finished) {
    return (
      <div className="math-minigame">
        <h2>{t(game.name)}</h2>
        <div className="math-feedback">
          <h3>{t("Finished!")}</h3>
          <p>
            {t("Your score:")} {score} / {game.exerciseCount || 10}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="math-minigame">
      <h2>{t(game.name)}</h2>
      <div className="math-score">
        {t("Score:")} {score}
      </div>

      <div className="math-exercise-number">
        {t("Exercise")} {exerciseNumber} / {game.exerciseCount || 10}
      </div>

      <div className="math-question">
        {question.number1} {question.operator} {question.number2} = ?
      </div>

      <div className="math-answers">
        {question.answers.map((answer, index) => (
          <button
            key={index}
            onClick={() => checkAnswer(answer)}
            disabled={selectedAnswer !== null}
            data-answer-state={answerState(
              selectedAnswer,
              answer,
              question.correctAnswer,
            )}
          >
            {answer}
          </button>
        ))}
      </div>
    </div>
  );
}

function generateQuestion(maxNumber, selectedOperations) {
  const operators =
    selectedOperations && selectedOperations.length > 0
      ? selectedOperations
      : ["+"];
  const operator = operators[Math.floor(Math.random() * operators.length)];
  let number1;
  let number2;
  let correctAnswer;

  if (operator === "+") {
    number1 = getRandomNumber(maxNumber);
    number2 = getRandomNumber(maxNumber);
    correctAnswer = number1 + number2;
  } else if (operator === "-") {
    number1 = getRandomNumber(maxNumber);
    number2 = getRandomNumber(maxNumber);
    if (number2 > number1) {
      [number1, number2] = [number2, number1];
    }
    correctAnswer = number1 - number2;
  } else if (operator === "*") {
    number1 = getRandomNumber(maxNumber);
    number2 = getRandomNumber(Math.floor(maxNumber / number1));
    correctAnswer = number1 * number2;
  } else {
    number2 = getRandomNumber(maxNumber);
    const maxResult = Math.floor(maxNumber / number2);
    const safeMaxResult = Math.max(1, maxResult);
    correctAnswer = getRandomNumber(safeMaxResult);
    number1 = number2 * correctAnswer;
  }

  const answers = generateAnswers(correctAnswer);
  return {
    number1,
    number2,
    operator,
    correctAnswer,
    answers,
  };
}

function generateAnswers(correctAnswer) {
  const answers = [correctAnswer];
  while (answers.length < 4) {
    const difference = getRandomNumber(5);
    const wrongAnswer =
      Math.random() < 0.5
        ? correctAnswer + difference
        : correctAnswer - difference;
    if (wrongAnswer >= 0 && !answers.includes(wrongAnswer)) {
      answers.push(wrongAnswer);
    }
  }
  return answers.sort(() => Math.random() - 0.5);
}

function getRandomNumber(maxNumber) {
  return Math.floor(Math.random() * (maxNumber || 1)) + 1;
}

export default MathMinigame;
