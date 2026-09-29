import confetti from "canvas-confetti";

const CELEBRATION_COLORS = [
  "#6c5ce7",
  "#37a7e8",
  "#f04472",
  "#ffca3a",
  "#26b979",
];

export function celebrateCorrectAnswer() {
  if (
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
  ) {
    return;
  }

  const options = {
    particleCount: 45,
    spread: 72,
    startVelocity: 38,
    gravity: 1.05,
    decay: 0.92,
    scalar: 0.9,
    colors: CELEBRATION_COLORS,
    disableForReducedMotion: true,
    zIndex: 2000,
  };

  confetti({
    ...options,
    angle: 60,
    origin: { x: 0.18, y: 0.72 },
  });

  confetti({
    ...options,
    angle: 120,
    origin: { x: 0.82, y: 0.72 },
  });
}
