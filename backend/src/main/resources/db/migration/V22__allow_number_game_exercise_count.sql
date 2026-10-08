-- Add the editor's existing optional field to built-in definitions already pinned
-- by drafts/revisions. Keep IDs, required fields, saved configurations and scores.
-- User-owned definitions and later versions have independent contracts.
UPDATE mini_game_definition
SET configuration_schema = jsonb_set(
        configuration_schema,
        '{properties}',
        COALESCE(configuration_schema -> 'properties', '{}'::jsonb)
            || '{"exerciseCount":{"type":"integer","minimum":1,"maximum":100,"default":10}}'::jsonb
    ),
    updated_at = CURRENT_TIMESTAMP
WHERE owner_user_id IS NULL
  AND lower(type) IN ('math-game', 'sequence-game', 'higher-lower-game', 'odd-even-game')
  AND version IN (1, 2)
  AND NOT (COALESCE(configuration_schema -> 'properties', '{}'::jsonb) ? 'exerciseCount');

UPDATE mini_game_definition
SET default_configuration = default_configuration || '{"exerciseCount":10}'::jsonb,
    updated_at = CURRENT_TIMESTAMP
WHERE owner_user_id IS NULL
  AND lower(type) IN ('math-game', 'sequence-game', 'higher-lower-game', 'odd-even-game')
  AND version IN (1, 2)
  AND NOT (default_configuration ? 'exerciseCount');
