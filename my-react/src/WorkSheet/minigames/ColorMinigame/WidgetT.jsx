import { usePlatform } from "../../../platform/PlatformState.js";
import { useState } from "react";
import { Button, Image, Input } from "antd";
import { celebrateCorrectAnswer } from "../../../lib/confetti.js";
import "./WidgetT.css";
function Widget(params) {
  const { t } = usePlatform();

  // Values

  const [bubles, setBuble] = useState(() =>
    Array.from(params.name).map(() => false),
  );

  function playCorrectSFX() {
    const sound = new Audio("/sounds/check-mark.mp3");
    sound.play();
  }

  function bubleVerification(index) {
    if (bubles[index]) return;

    const currentLetter = Array.from(params.name)[index];
    if (!currentLetter || /\s/u.test(currentLetter)) return;

    const isMatch = currentLetter.toLowerCase() === params.letter.toLowerCase();

    if (isMatch) {
      playCorrectSFX();
      celebrateCorrectAnswer();
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
        <Input
          className="animalNameInput"
          value={params.name}
          maxLength={14}
          aria-label={t("Animal name")}
          onChange={(event) => {
            const newName = event.target.value;
            params.onNameChange(newName);
            setBuble(Array.from(newName, () => false));
          }}
        />

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
              />
            );
          })}
        </div>
      </div>
    </>
  );
}
export default Widget;
