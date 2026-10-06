import { usePlatform } from "./PlatformState.js";

const labels = {
  ACTIVE: "Active",
  IN_PROGRESS: "In progress",
  COMPLETED: "Completed",
  ABANDONED: "Abandoned",
  REVOKED: "Revoked",
  TEACHER: "Teacher",
  USER: "Student",
  ADMIN: "Admin",
  SKIPPED: "Skipped",
  NOT_STARTED: "Not started",
};

export default function StatusBadge({ value = "ACTIVE" }) {
  const { t } = usePlatform();
  const tone =
    value === "COMPLETED"
      ? "success"
      : value === "IN_PROGRESS" || value === "ACTIVE"
        ? "progress"
        : value === "REVOKED" || value === "ABANDONED"
          ? "warning"
          : "neutral";
  return (
    <span className={`platformStatus platformStatus--${tone}`}>
      {t(labels[value] || String(value).replaceAll("_", " "))}
    </span>
  );
}
