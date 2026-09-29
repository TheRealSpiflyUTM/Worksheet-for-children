import test from "node:test";
import assert from "node:assert/strict";
import {
  generateQuestions,
  isCorrect,
  resultPayload,
  remainingItems,
  saveDraft,
  imagePaths,
  setAtPath,
} from "../src/app/game-model.js";
import { initialLanguage, translate, ro } from "../src/app/translations.js";
test("language preference survives reload and safely handles denied storage", () => {
  assert.equal(initialLanguage({ getItem: () => "ro" }, "en-US"), "ro");
  assert.equal(initialLanguage({ getItem: () => "other" }, "ro-MD"), "ro");
  assert.equal(
    initialLanguage(
      {
        getItem: () => {
          throw Error();
        },
      },
      "fr",
    ),
    "en",
  );
  assert.equal(translate("ro", "Worksheets"), "Fișe de lucru");
  assert.equal(translate("ro", "User authored title"), "User authored title");
  assert.ok(Object.values(ro).every(Boolean));
});
test("all arithmetic operations produce finite, nonnegative, exact answers", () => {
  for (const op of ["+", "-", "*", "/"]) {
    for (const maxNumber of [1, 2, 10, 100]) {
      const questions = generateQuestions("math-game", {
        maxNumber,
        operations: [op],
        exerciseCount: 100,
      });
      assert.equal(questions.length, 100);
      for (const q of questions) {
        assert.ok(Number.isInteger(q.answer));
        assert.ok(q.answer >= 0);
        assert.ok(isCorrect(q, q.answer));
        assert.ok(!isCorrect(q, q.answer + 1));
      }
    }
  }
});
test("letter scoring requires all matching positions and rejects extra selections", () => {
  const [q] = generateQuestions("color-game", {
    letter: "a",
    animals: [{ name: "Banana" }],
  });
  assert.deepEqual(q.answer, [1, 3, 5]);
  assert.ok(isCorrect(q, [5, 3, 1]));
  assert.ok(!isCorrect(q, [1]));
  assert.ok(!isCorrect(q, [0, 1, 3, 5]));
});
test("attempt progress uses frozen revision item IDs and preserves order", () => {
  const a = {
    items: [
      { id: 9, orderIndex: 1 },
      { id: 4, orderIndex: 0 },
    ],
    results: [{ revisionItemId: 4 }],
  };
  assert.deepEqual(
    remainingItems(a).map((i) => i.id),
    [9],
  );
  assert.deepEqual(resultPayload(4, 5, -2, "SKIPPED"), {
    outcome: "SKIPPED",
    score: 0,
    maxScore: 5,
    timeSeconds: 0,
    details: {},
  });
});
test("retry after a partial editor save updates saved IDs without creating duplicates", async () => {
  const draft = {
    name: "  Lesson  ",
    items: [
      { key: "a", miniGameId: 17, configuration: { letter: "x" } },
      { key: "b", miniGameId: 19, configuration: {} },
    ],
  };
  const removed = [8];
  const calls = [];
  let fail = true;
  let creates = 0;
  const api = {
    renameWorksheet: async (_, name) => assert.equal(name, "Lesson"),
    deleteItem: async (_, id) => calls.push(["delete", id]),
    saveItem: async (_, item) => {
      if (item.key === "b" && fail) {
        fail = false;
        throw Error("network");
      }
      if (!item.id) creates++;
      calls.push(["save", item.id, item.miniGameId, item.orderIndex]);
      return { ...item, id: item.id || 100 + creates };
    },
  };
  const save = () =>
    saveDraft(
      api,
      1,
      draft,
      removed,
      (key, saved) => {
        draft.items = draft.items.map((item) =>
          item.key === key ? saved : item,
        );
      },
      (id) => removed.splice(removed.indexOf(id), 1),
    );
  await assert.rejects(save(), /network/);
  assert.equal(draft.items[0].id, 101);
  assert.deepEqual(removed, []);
  await save();
  assert.equal(creates, 2);
  assert.equal(calls.filter((c) => c[0] === "delete").length, 1);
  assert.equal(draft.items[0].miniGameId, 17);
});
test("image slots resolve nested array paths without changing sibling content", () => {
  const configuration = {
    tasks: [
      { variants: [{ imageAssetId: 1 }, {}] },
      { variants: [{ imageAssetId: 2 }] },
    ],
  };
  const paths = imagePaths(configuration, "/tasks/*/variants/*/imageAssetId");
  assert.equal(paths.length, 3);
  const next = setAtPath(configuration, paths[1].path, 7);
  assert.equal(next.tasks[0].variants[1].imageAssetId, 7);
  assert.equal(configuration.tasks[0].variants[1].imageAssetId, undefined);
  assert.equal(next.tasks[1].variants[0].imageAssetId, 2);
});
test("worksheet swaps use free positions and can recover after an interrupted reorder", async () => {
  const server = new Map([
    [1, { id: 1, miniGameId: 3, orderIndex: 0, configuration: {} }],
    [2, { id: 2, miniGameId: 4, orderIndex: 1, configuration: {} }],
  ]);
  const draft = {
    name: "Swap",
    items: [
      { ...server.get(2), key: "b" },
      { ...server.get(1), key: "a" },
    ],
  };
  let writes = 0;
  let fail = true;
  const api = {
    renameWorksheet: async () => ({ items: [...server.values()] }),
    saveItem: async (_, item) => {
      writes++;
      if (fail && writes === 3) {
        fail = false;
        throw Error("interrupted");
      }
      assert.ok(
        ![...server.values()].some(
          (other) =>
            other.id !== item.id && other.orderIndex === item.orderIndex,
        ),
      );
      server.set(item.id, { ...item });
      return item;
    },
  };
  const save = () =>
    saveDraft(
      api,
      1,
      draft,
      [],
      (key, saved) => {
        draft.items = draft.items.map((i) => (i.key === key ? saved : i));
      },
      () => {},
    );
  await assert.rejects(save(), /interrupted/);
  await save();
  assert.equal(server.get(2).orderIndex, 0);
  assert.equal(server.get(1).orderIndex, 1);
});
