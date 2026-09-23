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
return ( <div className="higher-lower-minigame teacher-higher-lower"> <h2>{game.name}</h2>

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
      Children will have to decide if the first number is bigger or smaller than the second number.
    </p>
  </div>
);

}

return ( <div className="higher-lower-minigame"> <h2>{game.name}</h2>

  <div className="higher-lower-score">Score: {score}</div>

  <div className="higher-lower-question">
    <p>Is the first number bigger or smaller than the second?</p>

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
      Bigger
    </Button>

    <Button
      type="primary"
      size="large"
      onClick={() => checkAnswer("smaller")}
      disabled={selectedAnswer !== null}
    >
      Smaller
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
const firstNumber = Math.floor(Math.random() * maxNumber) + 1;
let secondNumber;

// Previne generarea aceluiași număr (pentru a evita egalitatea)
do {
secondNumber = Math.floor(Math.random() * maxNumber) + 1;
} while (secondNumber === firstNumber);

const correctAnswer =
firstNumber > secondNumber ? "bigger" : "smaller";

return {
firstNumber,
secondNumber,
correctAnswer,
};
}

export default HigherOrLowerMinigame;
