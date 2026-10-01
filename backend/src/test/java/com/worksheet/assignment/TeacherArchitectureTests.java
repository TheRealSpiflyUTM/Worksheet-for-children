package com.worksheet.assignment;

import com.jayway.jsonpath.JsonPath;
import com.worksheet.auth.UserRepository;
import com.worksheet.attempt.WorksheetAttemptItemResultRepository;
import com.worksheet.attempt.WorksheetAttemptRepository;
import com.worksheet.classroom.ClassroomMemberRepository;
import com.worksheet.classroom.ClassroomRepository;
import com.worksheet.minigame.MiniGameDefinition;
import com.worksheet.minigame.MiniGameDefinitionRepository;
import com.worksheet.worksheet.WorksheetRepository;
import com.worksheet.worksheet.item.WorksheetItemRepository;
import com.worksheet.worksheet.result.WorksheetResultRepository;
import com.worksheet.worksheet.result.minigame.MiniGameResultRepository;
import com.worksheet.worksheet.revision.WorksheetRevisionItemRepository;
import com.worksheet.worksheet.revision.WorksheetRevisionRepository;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import tools.jackson.databind.node.JsonNodeFactory;

import static org.hamcrest.Matchers.hasSize;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(properties = {
    "spring.datasource.url=jdbc:h2:mem:teacher-architecture-test;DB_CLOSE_DELAY=-1",
    "spring.flyway.enabled=false",
    "spring.jpa.hibernate.ddl-auto=create-drop"
})
@AutoConfigureMockMvc
class TeacherArchitectureTests {
    @Autowired MockMvc mvc;
    @Autowired MiniGameResultRepository miniGameResults;
    @Autowired WorksheetResultRepository worksheetResults;
    @Autowired WorksheetAttemptItemResultRepository attemptItemResults;
    @Autowired WorksheetAttemptRepository attempts;
    @Autowired WorksheetAssignmentRepository assignments;
    @Autowired ClassroomMemberRepository members;
    @Autowired ClassroomRepository classrooms;
    @Autowired WorksheetItemRepository worksheetItems;
    @Autowired WorksheetRevisionItemRepository revisionItems;
    @Autowired WorksheetRevisionRepository revisions;
    @Autowired WorksheetRepository worksheets;
    @Autowired MiniGameDefinitionRepository miniGames;
    @Autowired UserRepository users;
    @Autowired org.springframework.jdbc.core.JdbcTemplate jdbc;

    private Long miniGameId;

    @BeforeEach
    void setUp() {
        miniGameResults.deleteAll();
        worksheetResults.deleteAll();
        attemptItemResults.deleteAll();
        attempts.deleteAll();
        assignments.deleteAll();
        members.deleteAll();
        classrooms.deleteAll();
        jdbc.update("UPDATE worksheet SET share_revision_id = NULL");
        revisionItems.deleteAll();
        revisions.deleteAll();
        worksheetItems.deleteAll();
        worksheets.deleteAll();
        miniGames.deleteAll();
        users.deleteAll();
        miniGameId = miniGames.save(new MiniGameDefinition(
            "Teacher test", "teacher-test", JsonNodeFactory.instance.objectNode(), true)).getId();
    }

    @Test
    void supportsRolesAndEnforcesTeacherOnlyActions() throws Exception {
        Account defaultTeacher = signup("Default Teacher", "default.teacher@example.com", null);
        Account teacher = signup("Teacher", "teacher.roles@example.com", "TEACHER");
        Account student = signup("Student", "student.roles@example.com", "USER");

        mvc.perform(get("/api/auth/me").session(defaultTeacher.session()))
            .andExpect(status().isOk()).andExpect(jsonPath("$.role").value("TEACHER"));
        mvc.perform(get("/api/auth/me").session(teacher.session()))
            .andExpect(status().isOk()).andExpect(jsonPath("$.role").value("TEACHER"));
        mvc.perform(get("/api/auth/me").session(student.session()))
            .andExpect(status().isOk()).andExpect(jsonPath("$.role").value("USER"));
        mvc.perform(post("/api/classes").session(student.session()).contentType("application/json")
                .content("{\"name\":\"Forbidden\"}"))
            .andExpect(status().isForbidden());
        mvc.perform(post("/api/classes/join").session(teacher.session()).contentType("application/json")
                .content("{\"joinCode\":\"UNKNOWN\"}"))
            .andExpect(status().isForbidden());
        mvc.perform(post("/api/auth/signup").header("X-Auth-Request", "1").contentType("application/json")
                .content("{\"name\":\"Bad\",\"email\":\"bad.role@example.com\",\"password\":\"a long test password\",\"role\":\"ADMIN\"}"))
            .andExpect(status().isForbidden());
    }

    @Test
    void joinsClassesByRotatableCodeAndProtectsTeacherBoundaries() throws Exception {
        Account teacher = signup("Teacher", "teacher.classes@example.com", "TEACHER");
        Account otherTeacher = signup("Other Teacher", "other.teacher@example.com", "TEACHER");
        Account user = signup("Student", "student.classes@example.com", "USER");
        MvcResult created = createClassroom(teacher, "Class A");
        Long classroomId = idFrom(created);
        String oldCode = JsonPath.read(body(created), "$.joinCode");

        mvc.perform(post("/api/classes/join").session(user.session()).contentType("application/json")
                .content("{\"joinCode\":\"" + oldCode.toLowerCase() + "\"}"))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.joinCode").value((Object) null));
        mvc.perform(post("/api/classes/join").session(user.session()).contentType("application/json")
                .content("{\"joinCode\":\"" + oldCode + "\"}"))
            .andExpect(status().isConflict());
        mvc.perform(get("/api/classes/{id}/members", classroomId).session(otherTeacher.session()))
            .andExpect(status().isNotFound());
        mvc.perform(get("/api/classes/{id}", classroomId).session(otherTeacher.session()))
            .andExpect(status().isNotFound());

        MvcResult rotated = mvc.perform(post("/api/classes/{id}/join-code/rotate", classroomId).session(teacher.session()))
            .andExpect(status().isOk()).andReturn();
        String newCode = JsonPath.read(body(rotated), "$.joinCode");
        Account secondUser = signup("Second", "second.classes@example.com", "USER");
        mvc.perform(post("/api/classes/join").session(secondUser.session()).contentType("application/json")
                .content("{\"joinCode\":\"" + oldCode + "\"}"))
            .andExpect(status().isNotFound());
        mvc.perform(post("/api/classes/join").session(secondUser.session()).contentType("application/json")
                .content("{\"joinCode\":\"" + newCode + "\"}"))
            .andExpect(status().isCreated());
    }

    @Test
    void createsPerUserAssignmentsWithoutBackfillingFutureMembers() throws Exception {
        Account teacher = signup("Teacher", "teacher.assign@example.com", "TEACHER");
        Account userOne = signup("One", "one.assign@example.com", "USER");
        Account userTwo = signup("Two", "two.assign@example.com", "USER");
        Long classroomId = idFrom(joinClass(teacher, userOne, "Assignments"));
        joinExistingClass(teacher, userTwo, classroomId);
        Long worksheetId = createWorksheet(teacher, "Assigned worksheet");
        createItem(teacher, worksheetId);

        MvcResult assigned = mvc.perform(post("/api/worksheets/{id}/assignments", worksheetId).session(teacher.session())
                .contentType("application/json").content("{\"classroomId\":" + classroomId + "}"))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$", hasSize(2)))
            .andExpect(jsonPath("$[0].status").value("NOT_STARTED"))
            .andReturn();
        Long userOneAssignment = assignmentIdFor(assigned, userOne.id());

        mvc.perform(get("/api/assignments").session(userOne.session()))
            .andExpect(status().isOk()).andExpect(jsonPath("$", hasSize(1)))
            .andExpect(jsonPath("$[0].worksheet.items", hasSize(1)));
        mvc.perform(post("/api/worksheets/{id}/assignments", worksheetId).session(userOne.session())
                .contentType("application/json").content("{\"classroomId\":" + classroomId + "}"))
            .andExpect(status().isForbidden());

        Account futureUser = signup("Future", "future.assign@example.com", "USER");
        joinExistingClass(teacher, futureUser, classroomId);
        mvc.perform(get("/api/assignments").session(futureUser.session()))
            .andExpect(status().isOk()).andExpect(jsonPath("$", hasSize(0)));
        Account unrelated = signup("Unrelated", "unrelated.assign@example.com", "USER");
        mvc.perform(post("/api/worksheets/{id}/assignments", worksheetId).session(teacher.session())
                .contentType("application/json").content("{\"userId\":" + unrelated.id() + "}"))
            .andExpect(status().isNotFound());
        mvc.perform(get("/api/assignments/{id}", userOneAssignment).session(userTwo.session()))
            .andExpect(status().isNotFound());
    }

    @Test
    void recordsAssignedResultsAndRevokesAccessWithoutDeletingHistory() throws Exception {
        Account teacher = signup("Teacher", "teacher.results@example.com", "TEACHER");
        Account otherTeacher = signup("Other Teacher", "other.results@example.com", "TEACHER");
        Account user = signup("Student", "student.results@example.com", "USER");
        Long classroomId = idFrom(joinClass(teacher, user, "Results"));
        Long worksheetId = createWorksheet(teacher, "Results worksheet");
        Long itemId = createItem(teacher, worksheetId);
        MvcResult assigned = mvc.perform(post("/api/worksheets/{id}/assignments", worksheetId).session(teacher.session())
                .contentType("application/json").content("{\"classroomId\":" + classroomId + "}"))
            .andExpect(status().isCreated()).andExpect(jsonPath("$", hasSize(1))).andReturn();
        Long assignmentId = ((Number) JsonPath.read(body(assigned), "$[0].id")).longValue();

        MvcResult result = mvc.perform(post("/api/assignments/{id}/results", assignmentId).session(user.session())
                .contentType("application/json").content("{\"totalScore\":3,\"maxScore\":5}"))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.assignmentId").value(assignmentId)).andReturn();
        Long resultId = idFrom(result);
        mvc.perform(post("/api/worksheet-results/{id}/mini-game-results", resultId).session(user.session())
                .contentType("application/json").content(miniResultBody(itemId)))
            .andExpect(status().isCreated());
        mvc.perform(get("/api/assignments/{id}/results", assignmentId).session(teacher.session()))
            .andExpect(status().isOk()).andExpect(jsonPath("$", hasSize(1)));
        mvc.perform(get("/api/assignments/{id}/results", assignmentId).session(otherTeacher.session()))
            .andExpect(status().isNotFound());
        mvc.perform(get("/api/worksheets/{id}/results", worksheetId).session(teacher.session()))
            .andExpect(status().isOk()).andExpect(jsonPath("$", hasSize(0)));
        mvc.perform(delete("/api/worksheets/{worksheetId}/results/{resultId}", worksheetId, resultId).session(teacher.session()))
            .andExpect(status().isNotFound());
        mvc.perform(get("/api/worksheets/{id}", worksheetId).session(user.session()))
            .andExpect(status().isNotFound());
        mvc.perform(get("/api/worksheet-results/{id}/mini-game-results", resultId).session(teacher.session()))
            .andExpect(status().isOk()).andExpect(jsonPath("$", hasSize(1)));
        mvc.perform(post("/api/worksheet-results/{id}/mini-game-results", resultId).session(teacher.session())
                .contentType("application/json").content(miniResultBody(itemId)))
            .andExpect(status().isNotFound());

        MvcResult activeAttempt = mvc.perform(post("/api/assignments/{id}/attempts", assignmentId)
                .session(user.session()))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.status").value("IN_PROGRESS"))
            .andReturn();
        Long attemptId = idFrom(activeAttempt);

        mvc.perform(delete("/api/classes/{classId}/members/{userId}", classroomId, user.id()).session(teacher.session()))
            .andExpect(status().isNoContent());
        mvc.perform(get("/api/assignments").session(user.session()))
            .andExpect(status().isOk()).andExpect(jsonPath("$", hasSize(0)));
        mvc.perform(get("/api/assignments/{id}", assignmentId).session(user.session()))
            .andExpect(status().isNotFound());
        mvc.perform(post("/api/assignments/{id}/results", assignmentId).session(user.session())
                .contentType("application/json").content("{\"totalScore\":4,\"maxScore\":5}"))
            .andExpect(status().isNotFound());
        mvc.perform(get("/api/assignments/{id}", assignmentId).session(teacher.session()))
            .andExpect(status().isOk()).andExpect(jsonPath("$.status").value("REVOKED"));
        mvc.perform(get("/api/assignments/{id}/results", assignmentId).session(teacher.session()))
            .andExpect(status().isOk()).andExpect(jsonPath("$", hasSize(1)));
        mvc.perform(get("/api/attempts/{id}", attemptId).session(user.session()))
            .andExpect(status().isNotFound());
        mvc.perform(get("/api/attempts/{id}", attemptId).session(teacher.session()))
            .andExpect(status().isOk()).andExpect(jsonPath("$.status").value("ABANDONED"));
    }

    @Test
    void childrenPlayByCodesAndKeepClassResultsWithoutSigningUp() throws Exception {
        Account teacher = signup("Teacher", "teacher.codes@example.com", "TEACHER");
        Long classroomId = idFrom(createClassroom(teacher, "Code class"));
        MvcResult child = mvc.perform(post("/api/classes/{id}/members", classroomId).session(teacher.session())
                .contentType("application/json").content("{\"name\":\"Ana\"}"))
            .andExpect(status().isCreated()).andExpect(jsonPath("$.name").value("Ana"))
            .andExpect(jsonPath("$.email").value((Object) null)).andReturn();
        Long childId = ((Number) JsonPath.read(body(child), "$.userId")).longValue();
        String childCode = JsonPath.read(body(child), "$.studentCode");
        Long worksheetId = createWorksheet(teacher, "Code worksheet");
        createItem(teacher, worksheetId);
        MvcResult started = mvc.perform(post("/api/classes/{id}/tests", classroomId).session(teacher.session())
                .contentType("application/json").content("{\"worksheetId\":" + worksheetId + "}"))
            .andExpect(status().isCreated()).andReturn();
        String worksheetCode = JsonPath.read(body(started), "$.code");

        MvcResult joined = mvc.perform(post("/api/play/join").contentType("application/json")
                .content(entryBody(" " + childCode.toLowerCase() + " ", " " + worksheetCode.toLowerCase() + " ")))
            .andExpect(status().isOk()).andExpect(jsonPath("$.user.id").value(childId))
            .andExpect(jsonPath("$.user.email").value((Object) null)).andReturn();
        MockHttpSession childSession = (MockHttpSession) joined.getRequest().getSession(false);
        Long assignmentId = ((Number) JsonPath.read(body(joined), "$.assignmentId")).longValue();
        mvc.perform(get("/api/auth/me").session(childSession)).andExpect(status().isOk())
            .andExpect(jsonPath("$.id").value(childId)).andExpect(jsonPath("$.email").value((Object) null));
        mvc.perform(post("/api/classes/join").session(childSession).contentType("application/json")
                .content("{\"joinCode\":\"" + classrooms.findById(classroomId).orElseThrow().getJoinCode() + "\"}"))
            .andExpect(status().isForbidden());
        mvc.perform(get("/api/assignments").session(childSession)).andExpect(status().isOk())
            .andExpect(jsonPath("$", hasSize(1))).andExpect(jsonPath("$[0].classroomId").value(classroomId));
        MvcResult attempt = mvc.perform(post("/api/assignments/{id}/attempts", assignmentId).session(childSession))
            .andExpect(status().isCreated()).andReturn();
        Long attemptId = idFrom(attempt);
        Long revisionItemId = ((Number) JsonPath.read(body(attempt), "$.items[0].id")).longValue();
        mvc.perform(put("/api/attempts/{id}/items/{item}/result", attemptId, revisionItemId).session(childSession)
                .contentType("application/json").content("{\"outcome\":\"COMPLETED\",\"score\":3,\"maxScore\":5,\"timeSeconds\":10,\"details\":{}}"))
            .andExpect(status().isOk());
        mvc.perform(post("/api/attempts/{id}/complete", attemptId).session(childSession))
            .andExpect(status().isOk()).andExpect(jsonPath("$.totalScore").value(3));
        mvc.perform(get("/api/classes/{id}/members", classroomId).session(teacher.session()))
            .andExpect(status().isOk()).andExpect(jsonPath("$[0].lastTestPercent").value(60))
            .andExpect(jsonPath("$[0].averagePercent").value(60))
            .andExpect(jsonPath("$[0].worstTest").value("Code worksheet"));
        mvc.perform(get("/api/classes/{id}/members/{user}/tests", classroomId, childId).session(teacher.session()))
            .andExpect(status().isOk()).andExpect(jsonPath("$[0].attemptId").value(attemptId));
        mvc.perform(patch("/api/classes/{id}/members/{user}", classroomId, childId).session(teacher.session())
                .contentType("application/json").content("{\"name\":\"Ana Maria\"}"))
            .andExpect(status().isOk()).andExpect(jsonPath("$.studentCode").value(childCode));
        mvc.perform(post("/api/play/join").contentType("application/json").content(entryBody(childCode, worksheetCode)))
            .andExpect(status().isOk()).andExpect(jsonPath("$.user.name").value("Ana Maria"))
            .andExpect(jsonPath("$.assignmentId").value(assignmentId));

        mvc.perform(delete("/api/classes/{id}/members/{user}", classroomId, childId).session(teacher.session()))
            .andExpect(status().isNoContent());
        mvc.perform(post("/api/play/join").contentType("application/json").content(entryBody(childCode, worksheetCode)))
            .andExpect(status().isNotFound());
        mvc.perform(post("/api/worksheets/join").session(childSession).contentType("application/json")
                .content("{\"code\":\"" + worksheetCode + "\"}"))
            .andExpect(status().isNotFound());
        mvc.perform(get("/api/attempts/{id}", attemptId).session(childSession)).andExpect(status().isNotFound());
        mvc.perform(get("/api/attempts/{id}", attemptId).session(teacher.session())).andExpect(status().isOk())
            .andExpect(jsonPath("$.results[0].score").value(3));
    }

    @Test
    void childCodesProtectTeacherBoundariesAndFailedEntryKeepsExistingSession() throws Exception {
        Account teacher = signup("Teacher", "teacher.boundary@example.com", "TEACHER");
        Account other = signup("Other", "other.boundary@example.com", "TEACHER");
        Long classroomId = idFrom(createClassroom(teacher, "Private roster"));
        mvc.perform(post("/api/classes/{id}/members", classroomId).session(other.session())
                .contentType("application/json").content("{\"name\":\"Ana\"}"))
            .andExpect(status().isNotFound());
        mvc.perform(post("/api/classes/{id}/members", classroomId).session(teacher.session())
                .contentType("application/json").content("{\"name\":\"   \"}"))
            .andExpect(status().isBadRequest());
        MvcResult child = mvc.perform(post("/api/classes/{id}/members", classroomId).session(teacher.session())
                .contentType("application/json").content("{\"name\":\"Ana\"}"))
            .andExpect(status().isCreated()).andReturn();
        Long childId = ((Number) JsonPath.read(body(child), "$.userId")).longValue();
        String childCode = JsonPath.read(body(child), "$.studentCode");
        Long worksheetId = createWorksheet(other, "Other teacher worksheet");
        createItem(other, worksheetId);
        MvcResult share = mvc.perform(post("/api/worksheets/{id}/share", worksheetId).session(other.session()))
            .andExpect(status().isOk()).andReturn();
        String code = JsonPath.read(body(share), "$.code");
        mvc.perform(post("/api/play/join").session(teacher.session()).contentType("application/json")
                .content(entryBody(childCode, code))).andExpect(status().isNotFound());
        mvc.perform(get("/api/auth/me").session(teacher.session())).andExpect(status().isOk())
            .andExpect(jsonPath("$.id").value(teacher.id()));
        mvc.perform(post("/api/play/join").contentType("application/json").content(entryBody("UNKNOWN", code)))
            .andExpect(status().isNotFound());
        mvc.perform(get("/api/classes/{id}/members/{user}/tests", classroomId, childId).session(other.session()))
            .andExpect(status().isNotFound());
        mvc.perform(patch("/api/classes/{id}/members/{user}", classroomId, childId).session(other.session())
                .contentType("application/json").content("{\"name\":\"Changed\"}"))
            .andExpect(status().isNotFound());
    }

    @Test
    void existingStudentsCanUseCodesForTheCorrectClass() throws Exception {
        Account teacher = signup("Teacher", "teacher.legacy@example.com", "TEACHER");
        Account student = signup("Student", "student.legacy@example.com", "USER");
        Long firstClass = idFrom(joinClass(teacher, student, "First class"));
        Long secondClass = idFrom(joinClass(teacher, student, "Second class"));
        String firstCode = JsonPath.read(body(mvc.perform(post("/api/classes/{id}/members/{user}/code", firstClass, student.id())
                .session(teacher.session())).andExpect(status().isOk()).andReturn()), "$.studentCode");
        String secondCode = JsonPath.read(body(mvc.perform(post("/api/classes/{id}/members/{user}/code", secondClass, student.id())
                .session(teacher.session())).andExpect(status().isOk()).andReturn()), "$.studentCode");
        mvc.perform(post("/api/classes/{id}/members/{user}/code", firstClass, student.id()).session(teacher.session()))
            .andExpect(status().isOk()).andExpect(jsonPath("$.studentCode").value(firstCode));
        Long worksheetId = createWorksheet(teacher, "Shared worksheet");
        createItem(teacher, worksheetId);
        String worksheetCode = JsonPath.read(body(mvc.perform(post("/api/worksheets/{id}/share", worksheetId)
                .session(teacher.session())).andExpect(status().isOk()).andReturn()), "$.code");
        for (var entry : java.util.Map.of(firstCode, firstClass, secondCode, secondClass).entrySet()) {
            MvcResult joined = mvc.perform(post("/api/play/join").contentType("application/json")
                    .content(entryBody(entry.getKey(), worksheetCode))).andExpect(status().isOk()).andReturn();
            Long assignmentId = ((Number) JsonPath.read(body(joined), "$.assignmentId")).longValue();
            mvc.perform(get("/api/assignments/{id}", assignmentId).session(teacher.session()))
                .andExpect(status().isOk()).andExpect(jsonPath("$.classroomId").value(entry.getValue()));
        }
        var promoted = users.findById(student.id()).orElseThrow();
        promoted.changeRole(com.worksheet.auth.UserRole.ADMIN);
        users.saveAndFlush(promoted);
        mvc.perform(post("/api/play/join").contentType("application/json").content(entryBody(firstCode, worksheetCode)))
            .andExpect(status().isForbidden());
    }

    private String entryBody(String studentCode, String worksheetCode) {
        return "{\"studentCode\":\"" + studentCode + "\",\"worksheetCode\":\"" + worksheetCode + "\"}";
    }

    private Account signup(String name, String email, String role) throws Exception {
        String roleJson = role == null ? "" : ",\"role\":\"" + role + "\"";
        MvcResult result = mvc.perform(post("/api/auth/signup").header("X-Auth-Request", "1")
                .contentType("application/json")
                .content("{\"name\":\"" + name + "\",\"email\":\"" + email
                    + "\",\"password\":\"a long test password\"" + roleJson + "}"))
            .andExpect(status().isCreated()).andReturn();
        return new Account((MockHttpSession) result.getRequest().getSession(false), idFrom(result));
    }

    private MvcResult createClassroom(Account teacher, String name) throws Exception {
        return mvc.perform(post("/api/classes").session(teacher.session()).contentType("application/json")
                .content("{\"name\":\"" + name + "\"}"))
            .andExpect(status().isCreated()).andReturn();
    }

    private MvcResult joinClass(Account teacher, Account user, String name) throws Exception {
        MvcResult classroom = createClassroom(teacher, name);
        String code = JsonPath.read(body(classroom), "$.joinCode");
        mvc.perform(post("/api/classes/join").session(user.session()).contentType("application/json")
                .content("{\"joinCode\":\"" + code + "\"}"))
            .andExpect(status().isCreated());
        return classroom;
    }

    private void joinExistingClass(Account teacher, Account user, Long classroomId) throws Exception {
        MvcResult classroom = mvc.perform(get("/api/classes/{id}", classroomId).session(teacher.session()))
            .andExpect(status().isOk()).andReturn();
        String code = JsonPath.read(body(classroom), "$.joinCode");
        mvc.perform(post("/api/classes/join").session(user.session()).contentType("application/json")
                .content("{\"joinCode\":\"" + code + "\"}"))
            .andExpect(status().isCreated());
    }

    private Long createWorksheet(Account account, String name) throws Exception {
        MvcResult result = mvc.perform(post("/api/worksheets").session(account.session()).contentType("application/json")
                .content("{\"name\":\"" + name + "\"}"))
            .andExpect(status().isCreated()).andReturn();
        return idFrom(result);
    }

    private Long createItem(Account account, Long worksheetId) throws Exception {
        MvcResult result = mvc.perform(post("/api/worksheets/{id}/items", worksheetId).session(account.session())
                .contentType("application/json")
                .content("{\"miniGameId\":" + miniGameId + ",\"orderIndex\":1,\"configuration\":{}}"))
            .andExpect(status().isCreated()).andReturn();
        return idFrom(result);
    }

    private Long assignmentIdFor(MvcResult result, Long userId) throws Exception {
        List<Number> ids = JsonPath.read(body(result), "$[?(@.userId == " + userId + ")].id");
        return ids.getFirst().longValue();
    }

    private String miniResultBody(Long itemId) {
        return "{\"worksheetItemId\":" + itemId + ",\"score\":3,\"maxScore\":5,\"timeSeconds\":10,\"details\":{}}";
    }

    private Long idFrom(MvcResult result) throws Exception {
        return ((Number) JsonPath.read(body(result), "$.id")).longValue();
    }

    private String body(MvcResult result) throws Exception {
        return result.getResponse().getContentAsString();
    }

    private record Account(MockHttpSession session, Long id) {}
}
