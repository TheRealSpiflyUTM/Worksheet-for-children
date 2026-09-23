import React, { useState } from "react";
import { InputNumber, Button } from "antd";
import "./OddOrEvenMinigame.css";

function OddOrEvenMinigame({ isTeacher, game, onGameChange }) {
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
      <div className="odd-even-minigame teacher-odd-even">
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
          Children will have to decide if a number is odd or even.
        </p>
      </div>
    );
  }

  return (
    <div className="odd-even-minigame">
      <h2>{game.name}</h2>

      <div className="odd-even-score">Score: {score}</div>

      <div className="odd-even-question">
        <p>Is this number odd or even?</p>
        <strong>{question.number}</strong>
      </div>

      <div className="odd-even-answers">
        <Button
          type="primary"
          size="large"
          onClick={() => checkAnswer("odd")}
          disabled={selectedAnswer !== null}
        >
          Odd
        </Button>

        <Button
          type="primary"
          size="large"
          onClick={() => checkAnswer("even")}
          disabled={selectedAnswer !== null}
        >
          Even
        </Button>
      </div>

      {selectedAnswer !== null && (
        <div className="odd-even-feedback">
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
  const number = Math.floor(Math.random() * maxNumber) + 1;
  const correctAnswer = number % 2 === 0 ? "even" : "odd";

  return {
    number,
    correctAnswer,
  };
}

export default OddOrEvenMinigame;