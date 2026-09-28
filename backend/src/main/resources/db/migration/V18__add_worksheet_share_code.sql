ALTER TABLE worksheet
ADD COLUMN share_code VARCHAR(9);

CREATE UNIQUE INDEX ux_worksheet_share_code
ON worksheet (share_code);
