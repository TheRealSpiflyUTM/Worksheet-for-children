# Worksheets for Kids — architecture and learning plan

This document preserves the product brief and architecture analysis. It is a target design, not a description of features already implemented. Open decisions below remain proposals until resolved.

## Learning approach

Build incrementally and explain each change. Keep the existing React, JavaScript, Vite, plain CSS, Java 25, and Spring Boot stack. Start with the fundamentals and a small working activity before building the full product. Do not replace or delete the existing prototype merely to start learning from scratch.

## Existing project

- `Project/frontend`: React UI built with Vite.
- `Project/src/main/java/com/worksheet`: Spring Boot application and an answer-checking controller.
- The UI asks `2 + 3`; `GET /api/check` checks an answer against 5 and returns a message.
- Vite forwards development requests under `/api` to Spring Boot on port 8080.
- The frontend production build is included in the Spring Boot JAR.
- No database or worksheet persistence exists yet.
- `Resources/Mini_Game_1/Worksheets For Kids Project`: eleven animal PNGs and Romanian body-part lists. These suggest an animal activity but do not define its gameplay.

## Product and scope

A parent or teacher creates a worksheet from reusable, configurable mini-games. A child plays one activity at a time and sees final results. Target tablet portrait layout: approximately 768 × 1024, with accessible touch controls and a friendly, minimal interface.

Primary flow:

Mini-game library → configuration modal → worksheet builder → worksheet runner → results.

Saved worksheets can be started again or edited. One game can appear multiple times with different configurations.

Exclude child/class assignments, sharing, permissions, and interrupted-run recovery from the initial implementation. Mock data is allowed; persistence choices still need to be resolved.

## Screens

1. Library: Mini-games, My Worksheets, Settings navigation; game cards with name, icon and description; persistent View Worksheet (N) action.
2. Configuration modal: schema-driven fields; Add to Worksheet or Save Changes when editing.
3. Builder: worksheet name; ordered activity cards with configuration summaries; edit, remove, reorder, add more, save and start actions.
4. My Worksheets: reusable saved worksheets, activity counts, Start and Edit actions; duplication optional.
5. Runner: separate child interface; one game at a time; minimal progress; Previous and Next navigation; no game-specific logic.
6. Results: overall score and completion; each activity's score, maximum, completion and time; finish or run again.

## Domain model

| Entity | Fields | Meaning |
| --- | --- | --- |
| MINI_GAME_DEFINITION | id, name, componentKey, configurationSchema (JSON) | Reusable game template |
| WORKSHEET | id, name, createdAt | Reusable collection of activities |
| WORKSHEET_ITEM | id, worksheetId, miniGameId, orderIndex | One occurrence of a game |
| MINI_GAME_CONFIGURATION | worksheetItemId, values (JSON) | Settings for that occurrence |
| WORKSHEET_RUN | id, worksheetId, currentItemIndex, status | One play attempt |
| MINI_GAME_RESULT | id, worksheetRunId, worksheetItemId, score, maxScore, completed, timeSeconds, details (JSON) | Result of one activity in one run |
| WORKSHEET_RESULT | worksheetRunId, totalScore, maxScore, completedAt | Overall result for a completed run |

All IDs are strings. `worksheetItemId` is the primary key of MINI_GAME_CONFIGURATION and a foreign key to WORKSHEET_ITEM. `worksheetRunId` is the primary key of WORKSHEET_RESULT and a foreign key to WORKSHEET_RUN. Other relationship IDs are foreign keys to their named entities.

Relationships:

- A worksheet has many ordered items.
- A definition can be referenced by many worksheet items.
- An item has one configuration.
- A worksheet has many runs.
- A run has many mini-game results and, when finished, one overall result.

Example: Animal body parts is a definition. Hen and dog activities are separate items with separate IDs and settings. Playing that worksheet twice creates two independent runs.

## Mini-game contract

Input: configuration, optional previously saved state, and a completion callback.

Standard completion output:

```json
{
  "score": 8,
  "maxScore": 10,
  "completed": true,
  "timeSeconds": 43,
  "details": {}
}
```

A registry maps a definition's componentKey to its React component. The runner passes configuration and receives results without knowing the game's rules. Games own their questions, interaction and scoring; the runner owns sequence and progress.

## Architecture recommendations

- Keep reusable screen components and an extensible game registry.
- Describe configuration field types, labels, defaults, allowed values and validation in schemas.
- Add display descriptions and icons to game metadata; the original definition fields do not yet include them.
- Define a mechanism for games to report intermediate state, so Previous/Next navigation preserves progress within an active run. This is separate from recovery after closing the application, which remains excluded.
- Snapshot or version worksheet items and configurations for each run so later edits do not alter historical result meaning.
- Keep storage access separate from screen components so mock storage can later be replaced with backend APIs.
- Do not select a database or add frameworks until a learning step requires them.

## Open product decisions

1. Initial games and exact interaction: addition and animal body parts are candidates, not a confirmed library.
2. Interface/content language and children's age range: the brief is English and animal labels are Romanian.
3. Skipping, retries, revisiting completed activities, and their effects on score and completion.
4. Device-local prototype saving versus backend persistence.
5. Settings screen functionality.
6. Run statuses, timing rules, and handling incomplete results.

## Suggested learning sequence

1. Understand browser, HTML, CSS, JavaScript, React, HTTP and backend using the existing addition example.
2. Understand one React activity: input, state, events and feedback.
3. Follow one request to a Spring Boot controller and its JSON response.
4. Introduce configurable activities and the game definition registry.
5. Build a worksheet in memory: add, edit, remove and reorder items.
6. Add a generic runner and consistent results.
7. Add saving and loading, explaining persistence and APIs as they become necessary.
8. Validate the complete flow on a tablet viewport.

Each step should be small enough to explain and verify before moving on. The full architecture is a destination, not a requirement to implement everything at once.

## References and verification status

Optional references from the brief (not inspected during the initial analysis):

- UX: https://www.figma.com/design/qXm0mEBwdLuFrC8fF8mGC1
- Architecture diagram: https://www.figma.com/board/K5JsqrFgky5YIxR1ZRcNDo

The initial analysis inspected source and resource notes only. It did not run or validate the application. Existing working-tree changes predate this architecture document and should be preserved.
