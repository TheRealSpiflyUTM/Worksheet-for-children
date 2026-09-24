ALTER TABLE mini_game_definition
    DROP CONSTRAINT mini_game_definition_type_key;

ALTER TABLE mini_game_definition
    ADD COLUMN version INT NOT NULL DEFAULT 1,
    ADD COLUMN result_schema JSONB NOT NULL DEFAULT '{}'::jsonb,
    ADD COLUMN default_configuration JSONB NOT NULL DEFAULT '{}'::jsonb,
    ADD COLUMN owner_user_id BIGINT,
    ADD COLUMN created_at TIMESTAMP(6) WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ADD COLUMN updated_at TIMESTAMP(6) WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE mini_game_definition
    ADD CONSTRAINT ck_mini_game_definition_version CHECK (version > 0),
    ADD CONSTRAINT uq_mini_game_definition_type_version UNIQUE (type, version),
    ADD CONSTRAINT fk_mini_game_definition_owner
        FOREIGN KEY (owner_user_id) REFERENCES auth_users(id) ON DELETE SET NULL;

CREATE INDEX idx_mini_game_definition_owner ON mini_game_definition(owner_user_id);
CREATE INDEX idx_mini_game_definition_active ON mini_game_definition(active);
