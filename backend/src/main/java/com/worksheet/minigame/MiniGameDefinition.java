package com.worksheet.minigame;

import com.fasterxml.jackson.databind.JsonNode;
import jakarta.persistence.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

@Entity
@Table(name = "mini_game_definition")
public class MiniGameDefinition {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(nullable = false, unique = true, length = 100)
    private String type;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "configuration_schema", nullable = false)
    private JsonNode configurationSchema;

    @Column(nullable = false)
    private boolean active;

    protected MiniGameDefinition() {}

    public MiniGameDefinition(String name, String type, JsonNode configurationSchema, boolean active) {
        this.name = name;
        this.type = type;
        this.configurationSchema = configurationSchema;
        this.active = active;
    }

    public Long getId() { return id; }
    public String getName() { return name; }
    public String getType() { return type; }
    public JsonNode getConfigurationSchema() { return configurationSchema; }
    public boolean isActive() { return active; }
}