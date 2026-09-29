import { useRef, useState } from "react";
import { Alert, Button, InputNumber, Progress } from "antd";
import { Check, Sparkles } from "lucide-react";
import { useApp } from "./state.js";
import {
  gameRegistry,
  gameTitle,
  generateQuestions,
  isCorrect,
  resultPayload,
  imagePaths,
} from "./game-model.js";
export function Game({ item, onComplete, busy = false, preview = false }) {
  const { t } = useApp();
  const definition = item.definition;
  const type = definition?.type;
  const [questions] = useState(() =>
    generateQuestions(type, item.configuration),
  );
  const [index, setIndex] = useState(0);
  const [answer, setAnswer] = useState(null);
  const [checked, setChecked] = useState(false);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  const [started] = useState(() => performance.now());
  const lock = useRef(false);
  const finalResult = useRef(null);
  const question = questions[index];
  const pictures = Object.values(
    definition?.configurationSchema?.["x-image-slots"] || {},
  ).flatMap((slot) =>
    imagePaths(item.configuration, slot.path)
      .filter(
        (entry) =>
          entry.value &&
          (!entry.path.some((p) => typeof p === "number") ||
            entry.path.find((p) => typeof p === "number") === index),
      )
      .map((entry) => ({ id: entry.value, label: slot.label || t("Images") })),
  );

  if (!gameRegistry[type])
    return (
      <Alert
        showIcon
        type="warning"
        title={t("Unavailable activity")}
        description={t(
          "This activity is preserved, but this app cannot play it yet.",
        )}
      />
    );
  if (!questions.length)
    return (
      <Alert
        type="warning"
        title={t("No playable questions. Check the activity configuration.")}
      />
    );
  function check(value = answer) {
    if (lock.current || value === null) return;
    lock.current = true;
    setAnswer(value);
    setChecked(true);
    if (isCorrect(question, value)) setScore((s) => s + 1);
  }
  function next(finishedAt) {
    if (index + 1 === questions.length) {
      finalResult.current = resultPayload(
        score,
        questions.length,
        (finishedAt - started) / 1000,
      );
      setFinished(true);
    } else {
      setIndex((i) => i + 1);
      setAnswer(null);
      setChecked(false);
      lock.current = false;
    }
  }
  if (finished)
    return (
      <div className="game-finished">
        <span className="success-orb">
          <Sparkles size={34} />
        </span>
        <h2>{t("Well done!")}</h2>
        <p className="result-number">
          {score}
          <span> / {questions.length}</span>
        </p>
        <Button
          type="primary"
          size="large"
          loading={busy}
          onClick={() => onComplete(finalResult.current)}
        >
          {t(preview ? "Next" : "Save & continue")}
        </Button>
      </div>
    );
  const correct = checked && isCorrect(question, answer);
  const instruction =
    type === "sequence-game"
      ? "Which number comes next?"
      : type === "higher-lower-game"
        ? "Choose the correct sign."
        : type === "odd-even-game"
          ? "Is this number odd or even?"
          : null;
  return (
    <section className="game-panel">
      <div className="game-meta">
        <span>{gameTitle(definition, t)}</span>
        <span>
          {t("Question")} {index + 1} / {questions.length}
        </span>
      </div>
      <Progress
        percent={Math.round((index / questions.length) * 100)}
        showInfo={false}
        strokeColor="#256b60"
        size="small"
      />
      {pictures.length > 0 && (
        <div className="task-pictures">
          {pictures.map((picture, i) => (
            <img
              key={`${picture.id}-${i}`}
              src={`/api/minigame-assets/${picture.id}/content`}
              alt={picture.label}
            />
          ))}
        </div>
      )}
      {question.animal ? (
        <>
          <h2>
            {t("Find the letter")} “{question.letter}”
          </h2>
          <p>{t("Select every matching letter, then check your answer.")}</p>
          <img
            className="word-image"
            src={question.animal.img}
            alt={question.animal.name}
          />
          <div className="letter-options">
            {Array.from(question.animal.name).map((letter, i) => (
              <Button
                key={i}
                size="large"
                disabled={checked}
                type={answer?.includes(i) ? "primary" : "default"}
                aria-pressed={!!answer?.includes(i)}
                onClick={() =>
                  setAnswer((current) =>
                    current?.includes(i)
                      ? current.filter((v) => v !== i)
                      : [...(current || []), i],
                  )
                }
              >
                {letter}
              </Button>
            ))}
          </div>
        </>
      ) : (
        <>
          {instruction && <p className="game-instruction">{t(instruction)}</p>}
          <h2 className="equation">{question.prompt}</h2>
        </>
      )}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (checked) next(e.timeStamp);
          else check(question.animal ? answer || [] : answer);
        }}
      >
        {!question.animal &&
          (question.choices ? (
            <div className="answer-choices">
              {question.choices.map((choice) => (
                <Button
                  size="large"
                  key={choice}
                  disabled={checked}
                  type={answer === choice ? "primary" : "default"}
                  onClick={() => check(choice)}
                >
                  {t(choice)}
                </Button>
              ))}
            </div>
          ) : (
            <InputNumber
              size="large"
              aria-label={t("Your answer")}
              placeholder={t("Your answer")}
              value={answer}
              onChange={setAnswer}
              disabled={checked}
              autoFocus
              changeOnWheel={false}
            />
          ))}
        {checked ? (
          <div className={`feedback ${correct ? "correct" : ""}`} role="status">
            <strong>
              {correct && <Check size={19} />}{" "}
              {t(correct ? "Correct!" : "Keep going!")}
            </strong>
            {!correct && !question.animal && (
              <span>
                {t("The answer is")} {t(String(question.answer))}
              </span>
            )}
            <Button type="primary" htmlType="submit">
              {t(index + 1 === questions.length ? "Finish activity" : "Next")}
            </Button>
          </div>
        ) : (
          !question.choices && (
            <Button
              type="primary"
              htmlType="submit"
              disabled={!question.animal && answer === null}
            >
              {t("Check answer")}
            </Button>
          )
        )}
      </form>
    </section>
  );
}
