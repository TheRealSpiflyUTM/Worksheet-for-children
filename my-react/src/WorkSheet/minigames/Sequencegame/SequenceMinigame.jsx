import React, { useState } from "react";
import { InputNumber, Button } from "antd";
import "./SequenceMinigame.css";

function SequenceMinigame({ isTeacher, game, onGameChange }) {
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
      <div className="sequence-minigame teacher-sequence">
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
          Copiii vor trebui să găsească următorul număr din diferite șiruri.
        </p>
      </div>
    );
  }

  if (finished) {
    return (
      <div className="sequence-minigame">
        <h2>{game.name}</h2>
        <div className="sequence-feedback">
          <h3>Finalizat!</h3>
          <p>
            Scorul tău: {score} / {game.exerciseCount || 10}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="sequence-minigame">
      <h2>{game.name}</h2>

      <div className="sequence-score">Scor: {score}</div>

      <div className="sequence-exercise-number">
        Exercițiul {exerciseNumber} / {game.exerciseCount || 10}
      </div>

      <div className="sequence-question">
        {question.sequence.map((number, index) => (
          <span key={index}>{number}</span>
        ))}
        <span>?</span>
      </div>

      <div className="sequence-answers">
        {question.answers.map((answer, index) => (
          <Button
            key={index}
            size="large"
            onClick={() => checkAnswer(answer)}
            disabled={selectedAnswer !== null}
          >
            {answer}
          </Button>
        ))}
      </div>

      {selectedAnswer !== null && (
        <div className="sequence-feedback">
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
  const patterns = [1, 2, 3, 5, 10];
  const safeMaxNumber = Number(maxNumber) || 50;
  const step = patterns[Math.floor(Math.random() * patterns.length)];
  const direction = Math.random() < 0.5 ? 1 : -1;
  const realStep = step * direction;

  let startNumber;
  if (realStep > 0) {
    const maxStart = safeMaxNumber - realStep * 4;
    if (maxStart < 1) {
      startNumber = 1;
    } else {
      startNumber = Math.floor(Math.random() * maxStart) + 1;
    }
  } else {
    const minStart = Math.abs(realStep) * 4 + 1;
    const maxStart = safeMaxNumber;
    if (maxStart < minStart) {
      startNumber = safeMaxNumber;
    } else {
      startNumber =
        Math.floor(Math.random() * (maxStart - minStart + 1)) + minStart;
    }
  }

  const sequence = [];
  for (let i = 0; i < 4; i++) {
    sequence.push(startNumber + realStep * i);
  }

  const correctAnswer = startNumber + realStep * 4;
  const answers = generateAnswers(correctAnswer, realStep);

  return {
    sequence,
    correctAnswer,
    answers,
  };
}

function generateAnswers(correctAnswer, step) {
  const answers = [correctAnswer];
  let difference = Math.abs(step);
  if (difference === 0) {
    difference = 1;
  }

  let attempts = 0;
  while (answers.length < 4 && attempts < 100) {
    const randomOffset = Math.floor(Math.random() * 3) + 1;
    const wrongAnswer =
      Math.random() < 0.5
        ? correctAnswer + randomOffset * difference
        : correctAnswer - randomOffset * difference;

    if (wrongAnswer > 0 && !answers.includes(wrongAnswer)) {
      answers.push(wrongAnswer);
    }

    attempts++;
  }

  let nextNumber = 1;
  while (answers.length < 4) {
    if (!answers.includes(nextNumber)) {
      answers.push(nextNumber);
    }
    nextNumber++;
  }

  return answers.sort(() => Math.random() - 0.5);
}

export default SequenceMinigame;