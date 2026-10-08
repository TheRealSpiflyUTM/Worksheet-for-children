# User instructions

Dont change the files unless I tell you the message "Change the file"

# Mini-game settings

When adding or changing a mini-game, keep every teacher-editable configuration field aligned
across the frontend editor, backend JSON Schema, default configuration, player and scoring.
Declare fields even when the editor displays them using a fallback. JSON Schema defaults do
not automatically persist values. Keep strict validation and preserve teachers' edited values.

For number games, reuse the shared schema/default helpers in `MiniGameDataInitializer`:
`exerciseCount` is an integer from 1 to 100, default 10, optional for historical configurations.
Use a real-backend save/update/reload regression test with non-default values, not only a
mocked catalog. Existing stored definitions need an upgrade plan; startup seeds alone are
insufficient. Preserve draft IDs, published revisions and saved results.

See `backend/README.md`, "Editable settings contract for new mini-games", for details.
