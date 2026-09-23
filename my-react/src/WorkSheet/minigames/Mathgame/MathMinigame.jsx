import React, { useState } from "react";
import { Checkbox, InputNumber } from "antd";
import "./MathMinigame.css";

function MathMinigame({ isTeacher, game, onGameChange }) {
  const [question, setQuestion] = useState(() =>
    generateQuestion(game.maxNumber, game.operations)
  );
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [score, setScore] = useState(0);
  const [exerciseNumber, setExerciseNumber] = useState(1);
  const [finished, setFinished] = useState(false);

  function getNewQuestion() {
    if (exerciseNumber >= (game.exerciseCount || 10)) {
      setFinished(true);
      return;
    }
    setExerciseNumber((currentNumber) => currentNumber + 1);
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
        <h2>{game.name}</h2>

        <div className="math-setting">
          <p>Număr maxim pentru termeni:</p>
          <InputNumber
            min={1}
            max={100}
            value={game.maxNumber}
            onChange={changeMaxNumber}
          />
        </div>

        <div className="math-setting">
          <p>Număr de exerciții:</p>
          <InputNumber
            min={1}
            max={100}
            value={game.exerciseCount || 10}
            onChange={changeExerciseCount}
          />
        </div>

        <div className="math-setting">
          <p>Selectează operațiile:</p>
          <div className="math-operations">
            <Checkbox
              checked={operations.includes("+")}
              onChange={() => changeOperation("+")}
            >
              Adunare (+)
            </Checkbox>

            <Checkbox
              checked={operations.includes("-")}
              onChange={() => changeOperation("-")}
            >
              Scădere (-)
            </Checkbox>

            <Checkbox
              checked={operations.includes("*")}
              onChange={() => changeOperation("*")}
            >
              Înmulțire (×)
            </Checkbox>

            <Checkbox
              checked={operations.includes("/")}
              onChange={() => changeOperation("/")}
            >
              Împărțire (÷)
            </Checkbox>
          </div>
        </div>

        <p>
          Copiii vor primi {game.exerciseCount || 10} exerciții folosind
          numere de la 1 până la {game.maxNumber}.
        </p>
      </div>
    );
  }

  if (finished) {
    return (
      <div className="math-minigame">
        <h2>{game.name}</h2>
        <div className="math-feedback">
          <h3>Finalizat!</h3>
          <p>
            Scorul tău: {score} / {game.exerciseCount || 10}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="math-minigame">
      <h2>{game.name}</h2>
      <div className="math-score">Scor: {score}</div>

      <div className="math-exercise-number">
        Exercițiul {exerciseNumber} / {game.exerciseCount || 10}
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
          >
            {answer}
          </button>
        ))}
      </div>

      {selectedAnswer !== null && (
        <div className="math-feedback">
          {selectedAnswer === question.correctAnswer ? (
            <>
              <p>Corect!</p>
              <button onClick={getNewQuestion}>
                {exerciseNumber >= (game.exerciseCount || 10)
                  ? "Finalizează"
                  : "Următoarea întrebare"}
              </button>
            </>
          ) : (
            <>
              <p>Încearcă din nou!</p>
              <button onClick={() => setSelectedAnswer(null)}>
                Încearcă din nou
              </button>
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
  const operator =
    operators[Math.floor(Math.random() * operators.length)];
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