import React, { useState } from "react";
import { InputNumber, Button } from "antd";
import "./SequenceMinigame.css";

function SequenceMinigame({ isTeacher, game, onGameChange }) {
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
return ( <div className="sequence-minigame teacher-sequence"> <h2>{game.name}</h2>

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
      Children will have to find the next number in
      different sequences.
    </p>
  </div>
);

}

return ( <div className="sequence-minigame"> <h2>{game.name}</h2>

  <div className="sequence-score">
    Score: {score}
  </div>

  <div className="sequence-question">
    {question.sequence.map((number, index) => (
      <span key={index}>
        {number}
      </span>
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
          <p>Correct!</p>

          <Button
            type="primary"
            onClick={getNewQuestion}
          >
            Next Question
          </Button>
        </>
      ) : (
        <>
          <p>Try again!</p>

          <Button
            onClick={() => setSelectedAnswer(null)}
          >
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
const patterns = [
1,
2,
3,
5,
10,
];

const step =
patterns[Math.floor(Math.random() * patterns.length)];

const direction = Math.random() < 0.5 ? 1 : -1;

const realStep = step * direction;

let startNumber;

if (realStep > 0) {
const maxStart =
maxNumber - realStep * 4;

startNumber =
  Math.floor(Math.random() * maxStart) + 1;

} else {
startNumber =
Math.floor(Math.random() * (maxNumber - 10)) + 10;
}

const sequence = [];

for (let i = 0; i < 4; i++) {
sequence.push(startNumber + realStep * i);
}

const correctAnswer =
startNumber + realStep * 4;

const answers = generateAnswers(
correctAnswer,
realStep
);

return {
sequence,
correctAnswer,
answers,
};
}

function generateAnswers(correctAnswer, step) {
const answers = [correctAnswer];

while (answers.length < 4) {
const randomOffset =
Math.floor(Math.random() * 3) + 1;

const wrongAnswer =
  Math.random() < 0.5
    ? correctAnswer + randomOffset * Math.abs(step)
    : correctAnswer - randomOffset * Math.abs(step);

if (
  wrongAnswer > 0 &&
  !answers.includes(wrongAnswer)
) {
  answers.push(wrongAnswer);
}

}

return answers.sort(() => Math.random() - 0.5);
}

export default SequenceMinigame;
