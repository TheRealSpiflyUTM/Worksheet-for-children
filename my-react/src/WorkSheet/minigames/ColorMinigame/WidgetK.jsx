import { usePlatform } from "../../../platform/PlatformState.js";
import { useState } from "react";
import { Button, Image, Typography } from "antd";
import { celebrateCorrectAnswer } from "../../../lib/confetti.js";
import { playAnswerFeedback } from "../../../lib/game-feedback.js";
import "./WidgetK.css";

const { Title } = Typography;

function Widget(params) {
  const { t } = usePlatform();
  // Values

  const [bubles, setBuble] = useState(() =>
    Array.from(params.name).map(() => false),
  );

  const [incorrectIndex, setIncorrectIndex] = useState(null);
  function bubleVerification(index) {
    if (params.disabled || bubles[index]) return;

    const currentLetter = Array.from(params.name)[index];
    if (!currentLetter || /\s/u.test(currentLetter)) return;

    const isMatch =
      currentLetter.toLocaleLowerCase("ro-RO") ===
      String(params.letter ?? "").toLocaleLowerCase("ro-RO");

    setIncorrectIndex(isMatch ? null : index);
    playAnswerFeedback(isMatch);
    if (isMatch) {
      celebrateCorrectAnswer();
      params.onMatch?.(index);
      // b for bubbles
      setBuble((b) => {
        const updatedBubbles = [...b];
        updatedBubbles[index] = true;
        return updatedBubbles;
      });
    }
  }

  return (
    <>
      <div className="widget">
        <Image src={params.img} alt={params.name} preview={false} />
        <Title level={4} className="animalNameText">
          {params.name}
        </Title>
        <div className="bubles">
          {Array.from(params.name).map((character, index) => {
            if (/\s/u.test(character)) return null;

            const buble = bubles[index] ?? false;
            return (
              <Button
                key={index}
                type={buble ? "primary" : "default"}
                shape="circle"
                className={buble ? "bubleActive" : "buble"}
                data-answer-state={
                  buble
                    ? "correct"
                    : incorrectIndex === index
                      ? "incorrect"
                      : undefined
                }
                onClick={() => bubleVerification(index)}
                aria-label={t("Letter {index} in {name}", {
                  index: index + 1,
                  name: params.name,
                })}
                aria-pressed={buble}
                disabled={params.disabled}
              />
            );
          })}
        </div>
        {incorrectIndex !== null && (
          <p
            className="letterFeedback"
            role="status"
            data-feedback-state="incorrect"
          >
            {t("Try again!")}
          </p>
        )}
      </div>
    </>
  );
}
export default Widget;
