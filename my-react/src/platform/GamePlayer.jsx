import { useRef, useState } from "react";
import { Alert, Button, Image, InputNumber, Progress } from "antd";
import { celebrateCorrectAnswer } from "../lib/confetti.js";
import { gameRegistry, gameTitle, generateQuestions, imagePaths, isCorrect, resultPayload } from "./game-model.js";
import { usePlatform } from "./PlatformState.js";

export default function GamePlayer({ item, onComplete, busy = false }) {
  const { t } = usePlatform();
  const definition = item.definition;
  const type = definition?.type;
  const [questions] = useState(() => generateQuestions(type, item.configuration));
  const [index, setIndex] = useState(0);
  const [answer, setAnswer] = useState(null);
  const [checked, setChecked] = useState(false);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  const [started] = useState(() => performance.now());
  const finalResult = useRef(null);
  const question = questions[index];

  if (!gameRegistry[type]) {
    return <Alert type="warning" showIcon title="Unavailable activity" description="This activity is preserved and can be skipped, but this app cannot play it yet." />;
  }
  if (!questions.length) return <Alert type="warning" title="This activity has no playable questions." />;

  const pictures = Object.values(definition?.configurationSchema?.["x-image-slots"] || {}).flatMap((slot) =>
    imagePaths(item.configuration, slot.path)
      .filter((entry) => entry.value && (!entry.path.some((part) => typeof part === "number") || entry.path.find((part) => typeof part === "number") === index))
      .map((entry) => ({ id: entry.value, label: slot.label || "Activity image" }))
  );

  function check(nextAnswer = answer) {
    if (checked || nextAnswer === null) return;
    setAnswer(nextAnswer);
    setChecked(true);
    if (isCorrect(question, nextAnswer)) {
      setScore((value) => value + 1);
      celebrateCorrectAnswer();
    }
  }

  function next() {
    if (index + 1 === questions.length) {
      finalResult.current = resultPayload(score, questions.length, (performance.now() - started) / 1000);
      setFinished(true);
      return;
    }
    setIndex((value) => value + 1);
    setAnswer(null);
    setChecked(false);
  }

  if (finished) {
    return (
      <div className="platformPlay platformPanel">
        <h2>🎉 Well done!</h2>
        <p className="platformQuestion">{score} / {questions.length}</p>
        <Button type="primary" size="large" loading={busy} onClick={() => onComplete(finalResult.current)}>Save & continue</Button>
      </div>
    );
  }

  const correct = checked && isCorrect(question, answer);
  return (
    <section className="platformPlay platformPanel">
      <div className="platformRow">
        <strong>{gameTitle(definition)}</strong>
        <span>Question {index + 1} / {questions.length}</span>
      </div>
      <Progress className="platformProgress" percent={Math.round((index / questions.length) * 100)} showInfo={false} strokeColor="#6c5ce7" />
      {pictures.map((picture) => <Image key={picture.id} className="platformWordImage" preview={false} src={`/api/minigame-assets/${picture.id}/content`} alt={picture.label} />)}
      {question.animal ? (
        <>
          <h2>Find the letter “{question.letter}”</h2>
          <Image className="platformWordImage" preview={false} src={question.animal.img} alt={question.animal.name} />
          <div className="platformAnswers">
            {Array.from(question.animal.name).map((letter, letterIndex) => (
              <Button
                key={letterIndex}
                size="large"
                disabled={checked}
                type={answer?.includes(letterIndex) ? "primary" : "default"}
                onClick={() => setAnswer((current) => current?.includes(letterIndex) ? current.filter((value) => value !== letterIndex) : [...(current || []), letterIndex])}
              >
                {letter}
              </Button>
            ))}
          </div>
        </>
      ) : <h2 className="platformQuestion">{question.prompt}</h2>}
      {!question.animal && question.choices ? (
        <div className="platformAnswers">
          {question.choices.map((choice) => <Button key={choice} size="large" disabled={checked} onClick={() => check(choice)}>{t(String(choice))}</Button>)}
        </div>
      ) : !question.animal ? (
        <div className="platformAnswers">
          <InputNumber size="large" value={answer} disabled={checked} onChange={setAnswer} onPressEnter={() => check()} />
          {!checked && <Button type="primary" size="large" disabled={answer === null} onClick={() => check()}>{t("Check answer")}</Button>}
        </div>
      ) : !checked && <Button type="primary" onClick={() => check(answer || [])}>{t("Check answer")}</Button>}
      {checked && (
        <div className="platformFeedback">
          <p>{correct ? t("Correct!") : `The answer is ${question.animal ? question.answer.map((answerIndex) => question.animal.name[answerIndex]).join(", ") : question.answer}`}</p>
          <Button type="primary" onClick={next}>{index + 1 === questions.length ? "Finish activity" : t("Next")}</Button>
        </div>
      )}
    </section>
  );
}
