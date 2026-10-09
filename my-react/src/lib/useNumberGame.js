import { useEffect, useRef, useState } from "react";
import { celebrateCorrectAnswer } from "./confetti.js";
import { playAnswerFeedback } from "./game-feedback.js";

// A question is scored once; both outcomes advance after the feedback interval.
export function useNumberGame(createQuestion, exerciseCount, onComplete) {
  const [question, setQuestion] = useState(createQuestion);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [score, setScore] = useState(0);
  const [exerciseNumber, setExerciseNumber] = useState(1);
  const [finished, setFinished] = useState(false);
  const locked = useRef(false);
  const timer = useRef(null);
  const maxScore = exerciseCount || 10;

  useEffect(() => () => clearTimeout(timer.current), []);

  function checkAnswer(answer) {
    if (locked.current) return;
    locked.current = true;
    const correct = answer === question.correctAnswer;
    const nextScore = score + (correct ? 1 : 0);
    setSelectedAnswer(answer);
    setScore(nextScore);
    playAnswerFeedback(correct);
    if (correct) celebrateCorrectAnswer();

    timer.current = setTimeout(() => {
      if (exerciseNumber >= maxScore) {
        setFinished(true);
        onComplete?.({ score: nextScore, maxScore });
        return;
      }
      setExerciseNumber(exerciseNumber + 1);
      setQuestion(createQuestion());
      setSelectedAnswer(null);
      locked.current = false;
    }, 2000);
  }

  return {
    question,
    setQuestion,
    selectedAnswer,
    setSelectedAnswer,
    score,
    exerciseNumber,
    finished,
    checkAnswer,
  };
}
