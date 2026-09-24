DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM worksheet) THEN
        RAISE EXCEPTION
            'Cannot add worksheet ownership while legacy worksheet rows exist. Assign or remove them explicitly before applying V8.';
    END IF;
END $$;

ALTER TABLE worksheet
    ADD COLUMN user_id BIGINT NOT NULL;

ALTER TABLE worksheet
    ADD CONSTRAINT fk_worksheet_user
        FOREIGN KEY (user_id) REFERENCES auth_users(id);

CREATE INDEX idx_worksheet_user_id ON worksheet(user_id);
