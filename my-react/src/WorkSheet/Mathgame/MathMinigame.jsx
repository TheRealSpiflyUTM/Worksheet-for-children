import React, { useState } from "react";
import { Checkbox, InputNumber } from "antd";
import "./MathMinigame.css";

function MathMinigame({ isTeacher, game, onGameChange }) {
  const [question, setQuestion] = useState(() =>
    generateQuestion(game.maxNumber, game.operations)
  );

  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [score, setScore] = useState(0);

  function getNewQuestion() {
    setQuestion(generateQuestion(game.maxNumber, game.operations));
    setSelectedAnswer(null);
  }

  function checkAnswer(answer) {
    setSelectedAnswer(answer);

    if (answer === question.correctAnswer) {
      setScore((currentScore) => currentScore + 1);
    }
  }

  function changeMaxNumber(value) {
    onGameChange({
      ...game,
      maxNumber: value,
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
        <h2>{game.name}</h2>

        <div className="math-setting">
          <p>Maximum number:</p>

          <InputNumber
            min={5}
            max={100}
            value={game.maxNumber}
            onChange={changeMaxNumber}
          />
        </div>

        <div className="math-setting">
          <p>Select the operations:</p>

          <div className="math-operations">
            <Checkbox
              checked={operations.includes("+")}
              onChange={() => changeOperation("+")}
            >
              Addition (+)
            </Checkbox>

            <Checkbox
              checked={operations.includes("-")}
              onChange={() => changeOperation("-")}
            >
              Subtraction (-)
            </Checkbox>

            <Checkbox
              checked={operations.includes("*")}
              onChange={() => changeOperation("*")}
            >
              Multiplication (×)
            </Checkbox>

            <Checkbox
              checked={operations.includes("/")}
              onChange={() => changeOperation("/")}
            >
              Division (÷)
            </Checkbox>
          </div>
        </div>

        <p>
          Children will get questions using numbers from 1 to {game.maxNumber}.
        </p>
      </div>
    );
  }

  return (
    <div className="math-minigame">
      <h2>{game.name}</h2>

      <div className="math-score">Score: {score}</div>

      <div className="math-question">
        {question.number1} {question.operator} {question.number2} = ?
      </div>

      <div className="math-answers">
        {question.answers.map((answer, index) => (
          <button
            key={index}
            onClick={() => checkAnswer(answer)}
            disabled={selectedAnswer !== null}
          >
            {answer}
          </button>
        ))}
      </div>

      {selectedAnswer !== null && (
        <div className="math-feedback">
          {selectedAnswer === question.correctAnswer ? (
            <>
              <p>Correct!</p>
              <button onClick={getNewQuestion}>Next Question</button>
            </>
          ) : (
            <>
              <p>Try again!</p>
              <button onClick={() => setSelectedAnswer(null)}>Try Again</button>
            </>
          )}
        </div>
      )}
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
    number2 = getRandomNumber(maxNumber);
    correctAnswer = number1 * number2;
  } else {
    number2 = getRandomNumber(maxNumber);
    correctAnswer = getRandomNumber(maxNumber);
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
  return Math.floor(Math.random() * maxNumber) + 1;
}

export default MathMinigame;