ALTER TABLE worksheet
    ADD COLUMN share_revision_id BIGINT;

ALTER TABLE worksheet
    ADD CONSTRAINT fk_worksheet_share_revision
        FOREIGN KEY (share_revision_id) REFERENCES worksheet_revision(id);

CREATE INDEX idx_worksheet_share_revision_id
    ON worksheet(share_revision_id);
