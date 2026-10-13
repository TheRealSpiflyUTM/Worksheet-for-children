package db.migration;

import com.worksheet.minigame.BuiltinPhotoConfiguration;
import org.flywaydb.core.api.migration.BaseJavaMigration;
import org.flywaydb.core.api.migration.Context;
import tools.jackson.databind.ObjectMapper;

/** New contracts only: existing draft IDs/configurations and immutable history stay untouched. */
public class V23__add_builtin_photo_versions extends BaseJavaMigration {
    @Override
    public void migrate(Context context) throws Exception {
        var connection = context.getConnection();
        var json = new ObjectMapper();
        for (String type : BuiltinPhotoConfiguration.TYPES) {
            try (var existing = connection.prepareStatement(
                    "SELECT id FROM mini_game_definition WHERE lower(type) = ? AND version >= 3")) {
                existing.setString(1, type);
                try (var rows = existing.executeQuery()) { if (rows.next()) continue; }
            }
            try (var source = connection.prepareStatement("""
                    SELECT * FROM mini_game_definition WHERE owner_user_id IS NULL AND lower(type) = ?
                      AND version IN (1, 2) ORDER BY version DESC LIMIT 1
                    """)) {
                source.setString(1, type);
                try (var row = source.executeQuery()) {
                    if (!row.next()) continue;
                    var schema = json.readTree(row.getString("configuration_schema"));
                    String key = type.equals("color-game") ? "animals" : type.equals("matching-game") ? "pairs" : "maxNumber";
                    // Historical malformed definitions are repaired by the existing startup seed first.
                    if (!schema.path("properties").has(key)) continue;
                    if ((type.equals("color-game") || type.equals("matching-game"))
                        && !schema.at("/properties/" + key + "/items/properties").isObject()) continue;
                    try (var insert = connection.prepareStatement("""
                            INSERT INTO mini_game_definition
                              (name, type, version, configuration_schema, result_schema, default_configuration,
                               active, description, thumbnail_asset_id)
                            VALUES (?, ?, 3, CAST(? AS jsonb), CAST(? AS jsonb), CAST(? AS jsonb), ?, ?, ?) RETURNING id
                            """)) {
                        insert.setString(1, row.getString("name"));
                        insert.setString(2, type);
                        insert.setString(3, BuiltinPhotoConfiguration.schema(type, schema).toString());
                        insert.setString(4, row.getString("result_schema"));
                        insert.setString(5, BuiltinPhotoConfiguration.defaults(json.readTree(row.getString("default_configuration"))).toString());
                        insert.setBoolean(6, row.getBoolean("active"));
                        insert.setString(7, row.getString("description"));
                        insert.setObject(8, row.getObject("thumbnail_asset_id"));
                        try (var created = insert.executeQuery()) {
                            created.next();
                            try (var links = connection.prepareStatement("""
                                    INSERT INTO mini_game_definition_asset (mini_game_definition_id, mini_game_asset_id, asset_key)
                                    SELECT ?, mini_game_asset_id, asset_key FROM mini_game_definition_asset WHERE mini_game_definition_id = ?
                                    """)) {
                                links.setLong(1, created.getLong(1));
                                links.setLong(2, row.getLong("id"));
                                links.executeUpdate();
                            }
                        }
                    }
                }
            }
        }
    }
}
