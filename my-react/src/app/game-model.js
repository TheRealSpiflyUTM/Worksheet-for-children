export const gameRegistry = {
  "color-game": {
    title: "Letters & pictures",
    description: "Find letters in familiar words.",
    symbol: "Aa",
    tone: "peach",
  },
  "math-game": {
    title: "Easy math",
    description: "A little practice with numbers.",
    symbol: "＋",
    tone: "mint",
  },
  "sequence-game": {
    title: "Number sequence",
    description: "Discover the missing number.",
    symbol: "123",
    tone: "lavender",
  },
  "higher-lower-game": {
    title: "Higher or lower",
    description: "Compare two numbers.",
    symbol: "≷",
    tone: "sand",
  },
  "odd-even-game": {
    title: "Odd or even",
    description: "Explore pairs and patterns.",
    symbol: "2·4",
    tone: "blue",
  },
};
export function gameTitle(definition, t) {
  return gameRegistry[definition?.type]
    ? t(gameRegistry[definition.type].title)
    : definition?.name || t("Unavailable activity");
}
export function generateQuestions(type, config, random = Math.random) {
  const max = Math.max(1, Math.min(10000, Number(config.maxNumber) || 10));
  const integer = (n = max) => Math.floor(random() * n) + 1;
  if (type === "color-game")
    return (config.animals || []).map((animal) => ({
      animal,
      letter: config.letter || "",
      answer: Array.from(animal.name || "").flatMap((letter, index) =>
        letter.toLocaleLowerCase() === String(config.letter).toLocaleLowerCase()
          ? [index]
          : [],
      ),
    }));
  return Array.from(
    { length: Math.max(1, Math.min(100, config.exerciseCount || 5)) },
    () => {
      let a = integer();
      let b = integer();
      if (type === "odd-even-game")
        return {
          prompt: String(a),
          answer: a % 2 ? "Odd" : "Even",
          choices: ["Odd", "Even"],
        };
      if (type === "higher-lower-game")
        return {
          prompt: `${a}  …  ${b}`,
          answer: a > b ? ">" : a < b ? "<" : "=",
          choices: ["<", "=", ">"],
        };
      if (type === "sequence-game") {
        const start = Math.max(0, a - 3);
        return {
          prompt: `${start}, ${start + 1}, ${start + 2}, …`,
          answer: start + 3,
        };
      }
      const operations = (config.operations || ["+"]).filter((o) =>
        ["+", "-", "*", "/"].includes(o),
      );
      const op = operations[Math.floor(random() * operations.length)] || "+";
      if (op === "-") [a, b] = [Math.max(a, b), Math.min(a, b)];
      if (op === "/") {
        b = integer(max);
        a = b * integer(Math.max(1, Math.floor(max / b)));
      }
      const answer =
        op === "+" ? a + b : op === "-" ? a - b : op === "*" ? a * b : a / b;
      return {
        prompt: `${a} ${op === "*" ? "×" : op === "/" ? "÷" : op} ${b} = ?`,
        answer,
      };
    },
  );
}
export function isCorrect(question, answer) {
  if (question.animal)
    return (
      Array.isArray(answer) &&
      answer.length === question.answer.length &&
      question.answer.every((i) => answer.includes(i))
    );
  return String(answer) === String(question.answer);
}
export function resultPayload(score, maxScore, seconds, outcome = "COMPLETED") {
  return {
    outcome,
    score: outcome === "SKIPPED" ? 0 : score,
    maxScore,
    timeSeconds: Math.max(0, Math.round(seconds)),
    details: {},
  };
}
export function remainingItems(attempt) {
  const saved = new Set(attempt.results.map((r) => r.revisionItemId));
  return [...attempt.items]
    .sort((a, b) => a.orderIndex - b.orderIndex)
    .filter((i) => !saved.has(i.id));
}
export async function saveDraft(
  api,
  worksheetId,
  draft,
  removed,
  onItemSaved,
  onItemDeleted,
) {
  const current = await api.renameWorksheet(worksheetId, draft.name.trim());
  for (const id of removed) {
    await api.deleteItem(worksheetId, id);
    onItemDeleted(id);
  }
  // PostgreSQL enforces one item per position. Free the occupied positions
  // before a swap, keeping successful updates recoverable if a later request fails.
  const reordering = draft.items.some(
    (item, index) => item.id && item.orderIndex !== index,
  );
  if (reordering) {
    const temporaryStart =
      Math.max(
        draft.items.length,
        ...(current?.items || draft.items).map((item) => item.orderIndex || 0),
      ) + 1;
    for (let index = 0; index < draft.items.length; index++) {
      const item = draft.items[index];
      if (item.id) {
        const saved = await api.saveItem(worksheetId, {
          ...item,
          orderIndex: temporaryStart + index,
        });
        onItemSaved(item.key, saved);
      }
    }
  }
  for (let index = 0; index < draft.items.length; index++) {
    const item = draft.items[index];
    const saved = await api.saveItem(worksheetId, {
      ...item,
      orderIndex: index,
    });
    onItemSaved(item.key, saved);
  }
}
export function imagePaths(config, path) {
  const parts = path.split("/").slice(1);
  const matches = [];
  function visit(value, index, actual) {
    if (index === parts.length) {
      matches.push({ path: actual, value });
      return;
    }
    const part = parts[index];
    if (part === "*") {
      if (Array.isArray(value))
        value.forEach((entry, i) => visit(entry, index + 1, [...actual, i]));
    } else visit(value?.[part], index + 1, [...actual, part]);
  }
  visit(config, 0, []);
  return matches;
}
export function setAtPath(config, path, value) {
  const next = structuredClone(config);
  let cursor = next;
  path.slice(0, -1).forEach((key, i) => {
    cursor[key] ??= typeof path[i + 1] === "number" ? [] : {};
    cursor = cursor[key];
  });
  cursor[path.at(-1)] = value;
  return next;
}
