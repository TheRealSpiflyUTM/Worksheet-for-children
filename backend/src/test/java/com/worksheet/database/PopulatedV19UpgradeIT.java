package com.worksheet.database;

import java.sql.DriverManager;
import org.flywaydb.core.Flyway;
import org.junit.jupiter.api.Test;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.postgresql.PostgreSQLContainer;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

@Testcontainers(disabledWithoutDocker = true)
class PopulatedV19UpgradeIT {
    @Container
    static final PostgreSQLContainer postgres = new PostgreSQLContainer("postgres:18-alpine");

    @Test
    void existingShareMigrationUpgradesToTaskImagesWithoutChangingShares() throws Exception {
        Flyway.configure()
            .dataSource(postgres.getJdbcUrl(), postgres.getUsername(), postgres.getPassword())
            .target("19")
            .load()
            .migrate();

        try (var connection = DriverManager.getConnection(
                postgres.getJdbcUrl(), postgres.getUsername(), postgres.getPassword());
             var sql = connection.createStatement()) {
            sql.executeUpdate("""
                INSERT INTO auth_users (id, created_at, email, name, password_hash, role)
                VALUES (100, CURRENT_TIMESTAMP, 'teacher@v19.test', 'Teacher', 'hash', 'TEACHER')
                """);
            sql.executeUpdate("""
                INSERT INTO worksheet (id, name, created_at, updated_at, user_id, share_code)
                VALUES (300, 'Shared worksheet', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 100, 'SHARE019')
                """);
            sql.executeUpdate("""
                INSERT INTO worksheet_revision
                    (id, worksheet_id, revision_number, name_snapshot, content_hash, published_at)
                VALUES (400, 300, 1, 'Shared worksheet', 'existing-share-hash', CURRENT_TIMESTAMP)
                """);
            sql.executeUpdate("UPDATE worksheet SET share_revision_id = 400 WHERE id = 300");

            Flyway latest = Flyway.configure()
                .dataSource(postgres.getJdbcUrl(), postgres.getUsername(), postgres.getPassword())
                .load();
            assertEquals(1, latest.migrate().migrationsExecuted);
            latest.validate();
            assertEquals(0, latest.migrate().migrationsExecuted);

            try (var row = sql.executeQuery("SELECT share_code, share_revision_id FROM worksheet WHERE id = 300")) {
                assertTrue(row.next());
                assertEquals("SHARE019", row.getString("share_code"));
                assertEquals(400L, row.getLong("share_revision_id"));
            }
            try (var row = sql.executeQuery("""
                    SELECT to_regclass('worksheet_item_image_asset') IS NOT NULL
                       AND to_regclass('worksheet_revision_item_image_asset') IS NOT NULL
                    """)) {
                assertTrue(row.next());
                assertTrue(row.getBoolean(1), "Both task-image reference tables must exist");
            }
        }
    }
}
