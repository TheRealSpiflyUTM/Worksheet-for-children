package com.worksheet.worksheet;

import com.jayway.jsonpath.JsonPath;
import com.worksheet.auth.UserRepository;
import com.worksheet.minigame.MiniGameDefinition;
import com.worksheet.minigame.MiniGameDefinitionRepository;
import com.worksheet.worksheet.item.WorksheetItemRepository;
import com.worksheet.worksheet.result.WorksheetResultRepository;
import com.worksheet.worksheet.result.minigame.MiniGameResultRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.test.web.servlet.MockMvc;
import tools.jackson.databind.node.JsonNodeFactory;

import static org.hamcrest.Matchers.hasSize;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.options;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(properties = {
    "spring.datasource.url=jdbc:h2:mem:worksheet-ownership-test;DB_CLOSE_DELAY=-1",
    "spring.flyway.enabled=false",
    "spring.jpa.hibernate.ddl-auto=create-drop"
})
@AutoConfigureMockMvc
class WorksheetOwnershipTests {
    @Autowired MockMvc mvc;
    @Autowired MiniGameResultRepository miniGameResults;
    @Autowired WorksheetResultRepository worksheetResults;
    @Autowired WorksheetItemRepository worksheetItems;
    @Autowired WorksheetRepository worksheets;
    @Autowired MiniGameDefinitionRepository miniGames;
    @Autowired UserRepository users;

    private Long miniGameId;

    @BeforeEach
    void setUp() {
        miniGameResults.deleteAll();
        worksheetResults.deleteAll();
        worksheetItems.deleteAll();
        worksheets.deleteAll();
        miniGames.deleteAll();
        users.deleteAll();
        miniGameId = miniGames.save(new MiniGameDefinition(
            "Ownership test", "ownership-test", JsonNodeFactory.instance.objectNode(), true)).getId();
    }

    @Test
    void scopesWorksheetListDetailAndDeleteToTheSessionUser() throws Exception {
        MockHttpSession alice = signup("Alice", "alice@example.com");
        MockHttpSession bob = signup("Bob", "bob@example.com");
        Long aliceWorksheet = createWorksheet(alice, "Alice worksheet");
        Long bobWorksheet = createWorksheet(bob, "Bob worksheet");

        mvc.perform(get("/api/worksheets").session(alice))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$", hasSize(1)))
            .andExpect(jsonPath("$[0].id").value(aliceWorksheet))
            .andExpect(jsonPath("$[0].name").value("Alice worksheet"))
            .andExpect(jsonPath("$[0].userId").doesNotExist());
        mvc.perform(get("/api/worksheets").session(bob))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$", hasSize(1)))
            .andExpect(jsonPath("$[0].id").value(bobWorksheet));

        mvc.perform(get("/api/worksheets/{id}", aliceWorksheet).session(alice))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.id").value(aliceWorksheet));
        mvc.perform(get("/api/worksheets/{id}", aliceWorksheet).session(bob))
            .andExpect(status().isNotFound());
        mvc.perform(delete("/api/worksheets/{id}", aliceWorksheet).session(bob))
            .andExpect(status().isNotFound());
        mvc.perform(get("/api/worksheets/{id}", aliceWorksheet).session(alice))
            .andExpect(status().isOk());
        mvc.perform(delete("/api/worksheets/{id}", aliceWorksheet).session(alice))
            .andExpect(status().isNoContent());
        mvc.perform(get("/api/worksheets/{id}", aliceWorksheet).session(alice))
            .andExpect(status().isNotFound());

        mvc.perform(get("/api/worksheets")).andExpect(status().isUnauthorized());
        mvc.perform(post("/api/worksheets").contentType("application/json").content("{\"name\":\"No session\"}"))
            .andExpect(status().isUnauthorized());
    }

    @Test
    void protectsChildResourcesAndRequiresAnItemFromTheResultsWorksheet() throws Exception {
        MockHttpSession alice = signup("Alice", "alice.children@example.com");
        MockHttpSession bob = signup("Bob", "bob.children@example.com");
        Long aliceWorksheet = createWorksheet(alice, "Alice worksheet");
        Long bobWorksheet = createWorksheet(bob, "Bob worksheet");
        Long aliceItem = createItem(alice, aliceWorksheet, 1);
        Long bobItem = createItem(bob, bobWorksheet, 1);
        Long aliceResult = createResult(alice, aliceWorksheet);

        mvc.perform(get("/api/worksheets/{id}/items", aliceWorksheet).session(bob))
            .andExpect(status().isNotFound());
        mvc.perform(post("/api/worksheets/{id}/items", aliceWorksheet).session(bob)
                .contentType("application/json").content(itemBody(2)))
            .andExpect(status().isNotFound());
        mvc.perform(get("/api/worksheets/{id}/results", aliceWorksheet).session(bob))
            .andExpect(status().isNotFound());
        mvc.perform(post("/api/worksheets/{id}/results", aliceWorksheet).session(bob)
                .contentType("application/json").content("{\"totalScore\":1,\"maxScore\":1}"))
            .andExpect(status().isNotFound());

        mvc.perform(get("/api/worksheet-results/{id}/mini-game-results", aliceResult).session(bob))
            .andExpect(status().isNotFound());
        mvc.perform(post("/api/worksheet-results/{id}/mini-game-results", aliceResult).session(bob)
                .contentType("application/json").content(resultBody(aliceItem)))
            .andExpect(status().isNotFound());
        mvc.perform(post("/api/worksheet-results/{id}/mini-game-results", aliceResult).session(alice)
                .contentType("application/json").content(resultBody(bobItem)))
            .andExpect(status().isNotFound());
        mvc.perform(post("/api/worksheet-results/{id}/mini-game-results", aliceResult).session(alice)
                .contentType("application/json").content(resultBody(aliceItem)))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.worksheetItemId").value(aliceItem));
        mvc.perform(get("/api/worksheet-results/{id}/mini-game-results", aliceResult).session(alice))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$", hasSize(1)));

        mvc.perform(get("/api/worksheets/{id}/items", aliceWorksheet)).andExpect(status().isUnauthorized());
        mvc.perform(get("/api/worksheets/{id}/results", aliceWorksheet)).andExpect(status().isUnauthorized());
        mvc.perform(get("/api/worksheet-results/{id}/mini-game-results", aliceResult)).andExpect(status().isUnauthorized());
    }

    @Test
    void allowsCredentialedCorsForAuthenticatedWorksheetRoutes() throws Exception {
        for (String path : new String[] {
            "/api/worksheets",
            "/api/worksheets/1/items",
            "/api/worksheets/1/results",
            "/api/worksheet-results/1/mini-game-results"
        }) {
            mvc.perform(options(path)
                    .header("Origin", "http://localhost:5173")
                    .header("Access-Control-Request-Method", "GET"))
                .andExpect(status().isOk())
                .andExpect(header().string("Access-Control-Allow-Origin", "http://localhost:5173"))
                .andExpect(header().string("Access-Control-Allow-Credentials", "true"));
        }
    }

    @Test
    void updatesAndDeletesChildResourcesOnlyForTheirOwner() throws Exception {
        MockHttpSession alice = signup("Alice", "alice.updates@example.com");
        MockHttpSession bob = signup("Bob", "bob.updates@example.com");
        Long aliceWorksheet = createWorksheet(alice, "Alice worksheet");
        Long bobWorksheet = createWorksheet(bob, "Bob worksheet");
        Long aliceItem = createItem(alice, aliceWorksheet, 1);
        Long secondAliceItem = createItem(alice, aliceWorksheet, 2);
        Long bobItem = createItem(bob, bobWorksheet, 1);
        Long aliceResult = createResult(alice, aliceWorksheet);
        Long miniGameResult = createMiniGameResult(alice, aliceResult, aliceItem);

        mvc.perform(put("/api/worksheets/{worksheetId}/items/{itemId}", aliceWorksheet, aliceItem).session(alice)
                .contentType("application/json").content(itemBody(3)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.orderIndex").value(3));
        mvc.perform(put("/api/worksheets/{worksheetId}/items/{itemId}", aliceWorksheet, aliceItem).session(bob)
                .contentType("application/json").content(itemBody(4)))
            .andExpect(status().isNotFound());
        mvc.perform(delete("/api/worksheets/{worksheetId}/items/{itemId}", aliceWorksheet, aliceItem).session(bob))
            .andExpect(status().isNotFound());

        mvc.perform(put("/api/worksheets/{worksheetId}/results/{resultId}", aliceWorksheet, aliceResult).session(alice)
                .contentType("application/json").content("{\"totalScore\":4,\"maxScore\":5}"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.totalScore").value(4))
            .andExpect(jsonPath("$.maxScore").value(5));
        mvc.perform(put("/api/worksheets/{worksheetId}/results/{resultId}", aliceWorksheet, aliceResult).session(bob)
                .contentType("application/json").content("{\"totalScore\":1,\"maxScore\":1}"))
            .andExpect(status().isNotFound());

        mvc.perform(put("/api/worksheet-results/{resultId}/mini-game-results/{miniResultId}", aliceResult, miniGameResult).session(alice)
                .contentType("application/json").content(resultBody(secondAliceItem)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.worksheetItemId").value(secondAliceItem));
        mvc.perform(put("/api/worksheet-results/{resultId}/mini-game-results/{miniResultId}", aliceResult, miniGameResult).session(alice)
                .contentType("application/json").content(resultBody(bobItem)))
            .andExpect(status().isNotFound());
        mvc.perform(put("/api/worksheet-results/{resultId}/mini-game-results/{miniResultId}", aliceResult, miniGameResult).session(bob)
                .contentType("application/json").content(resultBody(bobItem)))
            .andExpect(status().isNotFound());

        mvc.perform(delete("/api/worksheets/{worksheetId}/items/{itemId}", aliceWorksheet, secondAliceItem).session(alice))
            .andExpect(status().isConflict());
        mvc.perform(delete("/api/worksheet-results/{resultId}/mini-game-results/{miniResultId}", aliceResult, miniGameResult).session(bob))
            .andExpect(status().isNotFound());
        mvc.perform(delete("/api/worksheet-results/{resultId}/mini-game-results/{miniResultId}", aliceResult, miniGameResult).session(alice))
            .andExpect(status().isNoContent());
        mvc.perform(delete("/api/worksheets/{worksheetId}/items/{itemId}", aliceWorksheet, secondAliceItem).session(alice))
            .andExpect(status().isNoContent());

        createMiniGameResult(alice, aliceResult, aliceItem);
        mvc.perform(delete("/api/worksheets/{worksheetId}/results/{resultId}", aliceWorksheet, aliceResult).session(bob))
            .andExpect(status().isNotFound());
        mvc.perform(delete("/api/worksheets/{worksheetId}/results/{resultId}", aliceWorksheet, aliceResult).session(alice))
            .andExpect(status().isNoContent());
        mvc.perform(get("/api/worksheet-results/{id}/mini-game-results", aliceResult).session(alice))
            .andExpect(status().isNotFound());
        mvc.perform(delete("/api/worksheets/{worksheetId}/items/{itemId}", aliceWorksheet, aliceItem).session(alice))
            .andExpect(status().isNoContent());

        mvc.perform(put("/api/worksheets/{worksheetId}/items/{itemId}", bobWorksheet, bobItem)
                .contentType("application/json").content(itemBody(2)))
            .andExpect(status().isUnauthorized());
    }

    private MockHttpSession signup(String name, String email) throws Exception {
        String body = "{\"name\":\"" + name + "\",\"email\":\"" + email
            + "\",\"password\":\"a long test password\"}";
        var result = mvc.perform(post("/api/auth/signup")
                .header("X-Auth-Request", "1")
                .contentType("application/json")
                .content(body))
            .andExpect(status().isCreated())
            .andReturn();
        return (MockHttpSession) result.getRequest().getSession(false);
    }

    private Long createWorksheet(MockHttpSession session, String name) throws Exception {
        var result = mvc.perform(post("/api/worksheets").session(session)
                .contentType("application/json")
                .content("{\"name\":\"" + name + "\"}"))
            .andExpect(status().isCreated())
            .andReturn();
        return idFrom(result.getResponse().getContentAsString());
    }

    private Long createItem(MockHttpSession session, Long worksheetId, int orderIndex) throws Exception {
        var result = mvc.perform(post("/api/worksheets/{id}/items", worksheetId).session(session)
                .contentType("application/json")
                .content(itemBody(orderIndex)))
            .andExpect(status().isCreated())
            .andReturn();
        return idFrom(result.getResponse().getContentAsString());
    }

    private Long createResult(MockHttpSession session, Long worksheetId) throws Exception {
        var result = mvc.perform(post("/api/worksheets/{id}/results", worksheetId).session(session)
                .contentType("application/json")
                .content("{\"totalScore\":1,\"maxScore\":2}"))
            .andExpect(status().isCreated())
            .andReturn();
        return idFrom(result.getResponse().getContentAsString());
    }

    private Long createMiniGameResult(MockHttpSession session, Long worksheetResultId, Long worksheetItemId) throws Exception {
        var result = mvc.perform(post("/api/worksheet-results/{id}/mini-game-results", worksheetResultId).session(session)
                .contentType("application/json")
                .content(resultBody(worksheetItemId)))
            .andExpect(status().isCreated())
            .andReturn();
        return idFrom(result.getResponse().getContentAsString());
    }

    private String itemBody(int orderIndex) {
        return "{\"miniGameId\":" + miniGameId + ",\"orderIndex\":" + orderIndex + ",\"configuration\":{}}";
    }

    private String resultBody(Long worksheetItemId) {
        return "{\"worksheetItemId\":" + worksheetItemId + ",\"score\":1,\"maxScore\":2,\"timeSeconds\":3,\"details\":{}}";
    }

    private Long idFrom(String json) {
        return ((Number) JsonPath.read(json, "$.id")).longValue();
    }
}
