import { usePlatform } from "../../../platform/PlatformState.js";
import { useState } from "react";
import { Button, Image, Typography } from "antd";
import { celebrateCorrectAnswer } from "../../../lib/confetti.js";
import "./WidgetK.css";

const { Title } = Typography;

function Widget(params) {
  const { t } = usePlatform();
  // Values

  const [bubles, setBuble] = useState(() =>
    Array.from(params.name).map(() => false),
  );

  function playCorrectSFX() {
    const sound = new Audio("/sounds/check-mark.mp3");
    void sound.play().catch(() => {});
  }
  function bubleVerification(index) {
    if (params.disabled || bubles[index]) return;

    const currentLetter = Array.from(params.name)[index];
    if (!currentLetter || /\s/u.test(currentLetter)) return;

    const isMatch =
      currentLetter.toLocaleLowerCase("ro-RO") ===
      String(params.letter ?? "").toLocaleLowerCase("ro-RO");

    if (isMatch) {
      playCorrectSFX();
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
      </div>
    </>
  );
}
export default Widget;
