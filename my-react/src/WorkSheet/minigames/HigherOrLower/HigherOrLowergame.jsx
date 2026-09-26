import React, { useState } from "react";
import { InputNumber, Button } from "antd";
import "./HigherOrLowerMinigame.css";

function HigherOrLowerMinigame({ isTeacher, game, onGameChange }) {
  const [question, setQuestion] = useState(() =>
    generateQuestion(game.maxNumber)
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
    setQuestion(generateQuestion(game.maxNumber));
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

  function changeExerciseCount(value) {
    onGameChange({
      ...game,
      exerciseCount: value,
    });
  }

  if (isTeacher) {
    return (
      <div className="higher-lower-minigame teacher-higher-lower">
        <h2>{game.name}</h2>
        <label>
          Număr maxim:
          <InputNumber
            min={10}
            max={100}
            value={game.maxNumber}
            onChange={changeMaxNumber}
          />
        </label>

        <label>
          Număr de exerciții:
          <InputNumber
            min={1}
            max={100}
            value={game.exerciseCount || 10}
            onChange={changeExerciseCount}
          />
        </label>

        <p>
          Copiii vor trebui să decidă dacă primul număr este mai mare sau mai
          mic decât al doilea număr.
        </p>
      </div>
    );
  }

  if (finished) {
    return (
      <div className="higher-lower-minigame">
        <h2>{game.name}</h2>
        <div className="higher-lower-feedback">
          <h3>Finalizat!</h3>
          <p>
            Scorul tău: {score} / {game.exerciseCount || 10}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="higher-lower-minigame">
      <h2>{game.name}</h2>
      <div className="higher-lower-score">Scor: {score}</div>

      <div className="higher-lower-exercise-number">
        Exercițiul {exerciseNumber} / {game.exerciseCount || 10}
      </div>

      <div className="higher-lower-question">
        <p>
          Primul număr este mai mare sau mai mic decât al doilea?
        </p>

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
          Mai mare
        </Button>

        <Button
          type="primary"
          size="large"
          onClick={() => checkAnswer("smaller")}
          disabled={selectedAnswer !== null}
        >
          Mai mic
        </Button>
      </div>

      {selectedAnswer !== null && (
        <div className="higher-lower-feedback">
          {selectedAnswer === question.correctAnswer ? (
            <>
              <p>Corect!</p>
              <Button type="primary" onClick={getNewQuestion}>
                {exerciseNumber >= (game.exerciseCount || 10)
                  ? "Finalizează"
                  : "Următorul exercițiu"}
              </Button>
            </>
          ) : (
            <>
              <p>Încearcă din nou!</p>
              <Button onClick={() => setSelectedAnswer(null)}>
                Încearcă din nou
              </Button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function generateQuestion(maxNumber) {
  const safeMaxNumber = Number(maxNumber) || 10;
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