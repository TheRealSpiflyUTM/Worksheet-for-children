import { useLayoutEffect, useRef } from "react";

// Both editor and child views reserve the same space beside each activity.
export default function WorksheetGameFrame({ children }) {
  const frameRef = useRef(null);
  useLayoutEffect(() => {
    const frame = frameRef.current;
    const card = frame.querySelector(
      ".math-minigame, .sequence-minigame, .higher-lower-minigame, .odd-even-minigame, .colorMinigame, .matching-minigame",
    );
    if (!card) return;
    const positionActions = () => {
      const frameBox = frame.getBoundingClientRect();
      const cardBox = card.getBoundingClientRect();
      frame.style.setProperty(
        "--game-card-right",
        `${cardBox.right - frameBox.left}px`,
      );
      frame.style.setProperty(
        "--game-card-center",
        `${cardBox.top - frameBox.top + cardBox.height / 2}px`,
      );
    };
    positionActions();
    const observer = new ResizeObserver(positionActions);
    observer.observe(frame);
    observer.observe(card);
    return () => observer.disconnect();
  }, []);
  return (
    <div className="worksheetGameFrame" ref={frameRef}>
      {children}
    </div>
  );
}
