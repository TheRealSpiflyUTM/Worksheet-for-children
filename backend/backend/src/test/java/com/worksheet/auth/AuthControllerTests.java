package com.worksheet.auth;

import java.nio.file.Path;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

class AuthControllerTests {
    @TempDir Path directory;
    private UserRepository users;
    private MockMvc mvc;
    private String url;
    private static final String DETAILS = """
        {"name":" Teacher ","email":"Teacher@Example.com","password":"a long test password"}
        """;

    @BeforeEach void setup() {
        url = "jdbc:h2:file:" + directory.resolve("users").toString().replace('\\', '/');
        users = new UserRepository(url);
        mvc = MockMvcBuilders.standaloneSetup(new AuthController(new AuthService(users))).build();
    }

    @Test void signupSessionLogoutAndLogin() throws Exception {
        mvc.perform(get("/api/auth/me")).andExpect(status().isUnauthorized());
        var oldSession = new MockHttpSession();
        String oldId = oldSession.getId();
        var result = mvc.perform(post("/api/auth/signup").session(oldSession).header("X-Auth-Request", "1")
                .contentType("application/json").content(DETAILS))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.name").value("Teacher"))
            .andExpect(jsonPath("$.email").value("teacher@example.com"))
            .andExpect(jsonPath("$.password").doesNotExist())
            .andExpect(jsonPath("$.passwordHash").doesNotExist())
            .andExpect(header().string("Cache-Control", "no-store")).andReturn();
        var session = (MockHttpSession) result.getRequest().getSession(false);
        assertNotEquals(oldId, session.getId());
        mvc.perform(get("/api/auth/me").session(session)).andExpect(status().isOk());
        mvc.perform(post("/api/auth/logout").session(session).header("X-Auth-Request", "1"))
            .andExpect(status().isNoContent());
        assertTrue(session.isInvalid());
        mvc.perform(get("/api/auth/me")).andExpect(status().isUnauthorized());
        mvc.perform(post("/api/auth/login").header("X-Auth-Request", "1")
            .contentType("application/json").content(DETAILS)).andExpect(status().isOk());
    }

    @Test void persistsHashAndRejectsDuplicateAndWrongPassword() throws Exception {
        mvc.perform(post("/api/auth/signup").header("X-Auth-Request", "1")
            .contentType("application/json").content(DETAILS)).andExpect(status().isCreated());
        var reopened = new UserRepository(url);
        var stored = reopened.findByEmail("teacher@example.com").orElseThrow();
        assertNotEquals("a long test password", stored.passwordHash());
        assertTrue(PasswordHasher.matches("a long test password", stored.passwordHash()));
        assertNotEquals(stored.passwordHash(), PasswordHasher.hash("a long test password"));
        mvc.perform(post("/api/auth/signup").header("X-Auth-Request", "1")
            .contentType("application/json").content(DETAILS.replace("Teacher@Example.com", "teacher@example.com")))
            .andExpect(status().isConflict());
        mvc.perform(post("/api/auth/login").header("X-Auth-Request", "1")
            .contentType("application/json").content(DETAILS.replace("a long test password", "an incorrect password")))
            .andExpect(status().isUnauthorized());
        mvc.perform(post("/api/auth/login").header("X-Auth-Request", "1")
            .contentType("application/json").content(DETAILS.replace("Teacher@Example.com", "unknown@example.com")))
            .andExpect(status().isUnauthorized());
    }

    @Test void validatesInputAndRejectsCrossSiteRequests() throws Exception {
        for (String details : new String[] {"{}", DETAILS.replace("a long test password", "short"),
                DETAILS.replace("Teacher@Example.com", "bad-email"), DETAILS.replace(" Teacher ", " ")}) {
            mvc.perform(post("/api/auth/signup").header("X-Auth-Request", "1")
                .contentType("application/json").content(details)).andExpect(status().isBadRequest());
        }
        mvc.perform(post("/api/auth/signup").contentType("application/json").content(DETAILS))
            .andExpect(status().isForbidden());
        mvc.perform(post("/api/auth/signup").header("X-Auth-Request", "1").header("Sec-Fetch-Site", "cross-site")
            .contentType("application/json").content(DETAILS)).andExpect(status().isForbidden());
        assertTrue(users.findByEmail("teacher@example.com").isEmpty());
    }
}
