export const gameRegistry = {
  "matching-game": { title: "Match the Amounts", symbol: "↔" },
  "color-game": { title: "Letters & pictures", symbol: "Aa" },
  "math-game": { title: "Easy math", symbol: "+" },
  "sequence-game": { title: "Number sequence", symbol: "123" },
  "higher-lower-game": { title: "Higher or lower", symbol: "≷" },
  "odd-even-game": { title: "Odd or even", symbol: "2·4" },
};

export function gameTitle(definition) {
  return gameRegistry[definition?.type]?.title || definition?.name || "Unavailable activity";
}

export function generateQuestions(type, config, random = Math.random) {
  const maximum = Math.max(1, Math.min(10000, Number(config.maxNumber) || 10));
  const integer = (limit = maximum) => Math.floor(random() * limit) + 1;

  if (type === "color-game") {
    return (config.animals || []).map((animal) => ({
      animal,
      letter: config.letter || "",
      answer: Array.from(animal.name || "").flatMap((letter, index) =>
        letter.toLocaleLowerCase("ro-RO") === String(config.letter).toLocaleLowerCase("ro-RO")
          ? [index]
          : []
      ),
    }));
  }

  return Array.from(
    { length: Math.max(1, Math.min(100, Number(config.exerciseCount) || 5)) },
    () => {
      let first = integer();
      let second = integer();

      if (type === "odd-even-game") {
        return { prompt: String(first), answer: first % 2 ? "Odd" : "Even", choices: ["Odd", "Even"] };
      }
      if (type === "higher-lower-game") {
        return { prompt: `${first}  …  ${second}`, answer: first > second ? ">" : first < second ? "<" : "=", choices: ["<", "=", ">"] };
      }
      if (type === "sequence-game") {
        const start = Math.max(0, first - 3);
        return { prompt: `${start}, ${start + 1}, ${start + 2}, …`, answer: start + 3 };
      }

      const operations = (config.operations || ["+"]).filter((operator) => ["+", "-", "*", "/"].includes(operator));
      const operator = operations[Math.floor(random() * operations.length)] || "+";
      if (operator === "-") [first, second] = [Math.max(first, second), Math.min(first, second)];
      if (operator === "/") {
        second = integer(maximum);
        first = second * integer(Math.max(1, Math.floor(maximum / second)));
      }
      const answer = operator === "+" ? first + second : operator === "-" ? first - second : operator === "*" ? first * second : first / second;
      return { prompt: `${first} ${operator === "*" ? "×" : operator === "/" ? "÷" : operator} ${second} = ?`, answer };
    }
  );
}

export function isCorrect(question, answer) {
  if (question.animal) {
    return Array.isArray(answer) && answer.length === question.answer.length && question.answer.every((index) => answer.includes(index));
  }
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

export function activityMaxScore(item) {
  const configuration = item.configuration || {};
  if (item.definition?.type === "color-game") {
    const letter = String(configuration.letter || "u").toLocaleLowerCase("ro-RO");
    return (configuration.animals || []).reduce((count, animal) => count +
      Array.from(animal.name).filter(character => character.toLocaleLowerCase("ro-RO") === letter).length, 0);
  }
  if (item.definition?.type === "matching-game") return configuration.pairs?.length || 3;
  return configuration.exerciseCount || 10;
}

export function remainingItems(attempt) {
  const saved = new Set(attempt.results.map((result) => result.revisionItemId));
  return [...attempt.items]
    .sort((first, second) => first.orderIndex - second.orderIndex)
    .filter((item) => !saved.has(item.id));
}

export async function saveDraft(api, worksheetId, draft, removed, onItemSaved, onItemDeleted) {
  const current = await api.renameWorksheet(worksheetId, draft.name.trim());
  for (const id of removed) {
    await api.deleteItem(worksheetId, id);
    onItemDeleted(id);
  }
  const reordering = draft.items.some(
    (item, index) => item.id && item.orderIndex !== index
  );
  if (reordering) {
    const temporaryStart =
      Math.max(
        draft.items.length,
        ...(current?.items || draft.items).map((item) => item.orderIndex || 0)
      ) + 1;
    for (let index = 0; index < draft.items.length; index += 1) {
      const item = draft.items[index];
      if (!item.id) continue;
      const saved = await api.saveItem(worksheetId, {
        ...item,
        orderIndex: temporaryStart + index,
      });
      onItemSaved(item.key, saved);
    }
  }
  for (let index = 0; index < draft.items.length; index += 1) {
    const item = draft.items[index];
    const saved = await api.saveItem(worksheetId, { ...item, orderIndex: index });
    onItemSaved(item.key, saved);
  }
}

export function imagePaths(configuration, pointer) {
  const parts = pointer.split("/").slice(1);
  const matches = [];
  function visit(value, index, actualPath) {
    if (index === parts.length) {
      matches.push({ path: actualPath, value });
      return;
    }
    const part = parts[index];
    if (part === "*") {
      if (Array.isArray(value)) value.forEach((entry, entryIndex) => visit(entry, index + 1, [...actualPath, entryIndex]));
    } else {
      visit(value?.[part], index + 1, [...actualPath, part]);
    }
  }
  visit(configuration, 0, []);
  return matches;
}

export function setAtPath(configuration, path, value) {
  const next = structuredClone(configuration);
  let cursor = next;
  path.slice(0, -1).forEach((key, index) => {
    cursor[key] ??= typeof path[index + 1] === "number" ? [] : {};
    cursor = cursor[key];
  });
  cursor[path.at(-1)] = value;
  return next;
}
