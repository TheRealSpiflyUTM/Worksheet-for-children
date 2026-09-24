ALTER TABLE auth_users DROP CONSTRAINT ck_auth_users_role;
ALTER TABLE auth_users
    ADD CONSTRAINT ck_auth_users_role CHECK (role IN ('USER', 'TEACHER', 'ADMIN'));

ALTER TABLE worksheet ADD COLUMN row_version BIGINT NOT NULL DEFAULT 0;
ALTER TABLE classroom ADD COLUMN row_version BIGINT NOT NULL DEFAULT 0;
