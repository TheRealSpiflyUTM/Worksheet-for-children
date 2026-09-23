import React, { useState } from "react";
import { InputNumber, Button } from "antd";
import "./OddOrEvenMinigame.css";

function OddOrEvenMinigame({ isTeacher, game, onGameChange }) {
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
      <div className="odd-even-minigame teacher-odd-even">
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
          Copiii vor trebui să decidă dacă un număr este impar sau par.
        </p>
      </div>
    );
  }

  if (finished) {
    return (
      <div className="odd-even-minigame">
        <h2>{game.name}</h2>
        <div className="odd-even-feedback">
          <h3>Finalizat!</h3>
          <p>
            Scorul tău: {score} / {game.exerciseCount || 10}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="odd-even-minigame">
      <h2>{game.name}</h2>
      <div className="odd-even-score">Scor: {score}</div>

      <div className="odd-even-exercise-number">
        Exercițiul {exerciseNumber} / {game.exerciseCount || 10}
      </div>

      <div className="odd-even-question">
        <p>Acest număr este impar sau par?</p>
        <strong>{question.number}</strong>
      </div>

      <div className="odd-even-answers">
        <Button
          type="primary"
          size="large"
          onClick={() => checkAnswer("odd")}
          disabled={selectedAnswer !== null}
        >
          Impar
        </Button>

        <Button
          type="primary"
          size="large"
          onClick={() => checkAnswer("even")}
          disabled={selectedAnswer !== null}
        >
          Par
        </Button>
      </div>

      {selectedAnswer !== null && (
        <div className="odd-even-feedback">
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
  const number = Math.floor(Math.random() * safeMaxNumber) + 1;
  const correctAnswer = number % 2 === 0 ? "even" : "odd";
  return {
    number,
    correctAnswer,
  };
}

export default OddOrEvenMinigame;