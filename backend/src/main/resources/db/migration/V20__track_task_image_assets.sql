-- Configuration retains asset IDs; relational references protect draft and frozen task images.
CREATE TABLE worksheet_item_image_asset (
    worksheet_item_id BIGINT NOT NULL REFERENCES worksheet_item(id) ON DELETE CASCADE,
    mini_game_asset_id BIGINT NOT NULL REFERENCES mini_game_asset(id) ON DELETE RESTRICT,
    PRIMARY KEY (worksheet_item_id, mini_game_asset_id)
);
CREATE INDEX idx_worksheet_item_image_asset_asset ON worksheet_item_image_asset(mini_game_asset_id);

CREATE TABLE worksheet_revision_item_image_asset (
    worksheet_revision_item_id BIGINT NOT NULL REFERENCES worksheet_revision_item(id) ON DELETE CASCADE,
    mini_game_asset_id BIGINT NOT NULL REFERENCES mini_game_asset(id) ON DELETE RESTRICT,
    PRIMARY KEY (worksheet_revision_item_id, mini_game_asset_id)
);
CREATE INDEX idx_revision_item_image_asset_asset ON worksheet_revision_item_image_asset(mini_game_asset_id);
