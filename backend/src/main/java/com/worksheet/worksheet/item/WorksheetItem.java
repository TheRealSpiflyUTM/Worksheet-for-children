package com.worksheet.worksheet.item;

import com.worksheet.minigame.MiniGameDefinition;
import com.worksheet.worksheet.Worksheet;
import jakarta.persistence.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import tools.jackson.databind.JsonNode;

@Entity
@Table(name = "worksheet_item")
public class WorksheetItem {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "worksheet_id", nullable = false)
    private Worksheet worksheet;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "mini_game_id", nullable = false)
    private MiniGameDefinition miniGame;

    @Column(name = "order_index", nullable = false)
    private int orderIndex;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(nullable = false)
    private JsonNode configuration;

    protected WorksheetItem() {}

    public WorksheetItem(Worksheet worksheet, MiniGameDefinition miniGame, int orderIndex, JsonNode configuration) {
        this.worksheet = worksheet;
        this.miniGame = miniGame;
        this.orderIndex = orderIndex;
        this.configuration = configuration;
    }

    public Long getId() { return id; }
    public Worksheet getWorksheet() { return worksheet; }
    public MiniGameDefinition getMiniGame() { return miniGame; }
    public int getOrderIndex() { return orderIndex; }
    public JsonNode getConfiguration() { return configuration; }

    public void update(MiniGameDefinition miniGame, int orderIndex, JsonNode configuration) {
        this.miniGame = miniGame;
        this.orderIndex = orderIndex;
        this.configuration = configuration;
    }
}
