ALTER TABLE auth_users
    ADD COLUMN role VARCHAR(20) NOT NULL DEFAULT 'USER';

ALTER TABLE auth_users
    ADD CONSTRAINT ck_auth_users_role
        CHECK (role IN ('USER', 'TEACHER'));
