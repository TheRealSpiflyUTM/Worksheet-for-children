import { useState } from "react";

export function useSorting(initialKey, initialDirection = "asc") {
  const [sort, setSort] = useState({
    key: initialKey,
    direction: initialDirection,
  });
  const toggle = (key) =>
    setSort((current) => ({
      key,
      direction:
        current.key === key && current.direction === "asc" ? "desc" : "asc",
    }));
  return { ...sort, toggle };
}
