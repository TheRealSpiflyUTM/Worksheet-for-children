import React, { useState } from "react";
import { InputNumber, Button } from "antd";
import "./HigherOrLowerMinigame.css";

function HigherOrLowerMinigame({ isTeacher, game, onGameChange }) {
  const [question, setQuestion] = useState(() =>
    generateQuestion(game.maxNumber)
  );

  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [score, setScore] = useState(0);

  function getNewQuestion() {
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

  if (isTeacher) {
    return (
      <div className="higher-lower-minigame teacher-higher-lower">
        <h2>{game.name}</h2>

        <label>
          Maximum number:
          <InputNumber
            min={10}
            max={100}
            value={game.maxNumber}
            onChange={changeMaxNumber}
          />
        </label>

        <p>
          Children will have to decide if the next number is higher or lower.
        </p>
      </div>
    );
  }

  return (
    <div className="higher-lower-minigame">
      <h2>{game.name}</h2>

      <div className="higher-lower-score">Score: {score}</div>

      <div className="higher-lower-question">
        <p>Current number:</p>
        <strong>{question.currentNumber}</strong>
        <p>Is the next number higher or lower?</p>
      </div>

      <div className="higher-lower-answers">
        <Button
          type="primary"
          size="large"
          onClick={() => checkAnswer("higher")}
          disabled={selectedAnswer !== null}
        >
          Higher
        </Button>

        <Button
          type="primary"
          size="large"
          onClick={() => checkAnswer("lower")}
          disabled={selectedAnswer !== null}
        >
          Lower
        </Button>
      </div>

      {selectedAnswer !== null && (
        <div className="higher-lower-feedback">
          {selectedAnswer === question.correctAnswer ? (
            <>
              <p>Correct!</p>
              <Button type="primary" onClick={getNewQuestion}>
                Next Question
              </Button>
            </>
          ) : (
            <>
              <p>Try again!</p>
              <Button onClick={() => setSelectedAnswer(null)}>
                Try Again
              </Button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function generateQuestion(maxNumber) {
  const currentNumber = Math.floor(Math.random() * (maxNumber - 1)) + 1;
  let nextNumber;

  // Previne generarea aceluiași număr (pentru a evita egalitatea)
  do {
    nextNumber = Math.floor(Math.random() * (maxNumber - 1)) + 1;
  } while (nextNumber === currentNumber);

  const correctAnswer = nextNumber > currentNumber ? "higher" : "lower";

  return {
    currentNumber,
    nextNumber,
    correctAnswer,
  };
}

export default HigherOrLowerMinigame;