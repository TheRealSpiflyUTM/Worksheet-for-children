import { usePlatform } from "./PlatformState.js";

export default function SortHeading({ label, column, sorting, table = false }) {
  const { t } = usePlatform();
  const active = sorting.key === column;
  const direction = active ? sorting.direction : null;
  const Container = table ? "th" : "div";
  return (
    <Container
      role={table ? undefined : "columnheader"}
      scope={table ? "col" : undefined}
      aria-sort={
        direction === "asc"
          ? "ascending"
          : direction === "desc"
            ? "descending"
            : "none"
      }
    >
      <button
        type="button"
        className="sortHeading"
        onClick={() => sorting.toggle(column)}
        title={t(direction === "asc" ? "Sort descending" : "Sort ascending")}
      >
        {label}{" "}
        <span aria-hidden="true">
          {direction === "asc" ? "↑" : direction === "desc" ? "↓" : "↕"}
        </span>
      </button>
    </Container>
  );
}
