package com.worksheet.auth;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.test.web.servlet.MockMvc;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.options;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;

@SpringBootTest(properties = {
    "spring.datasource.url=jdbc:h2:mem:cors-game-test;DB_CLOSE_DELAY=-1",
    "app.auth.database-url=jdbc:h2:mem:cors-auth-test;DB_CLOSE_DELAY=-1"
})
@AutoConfigureMockMvc
class AuthCorsTests {
    @Autowired MockMvc mvc;

    @Test void rejectsUntrustedPreflight() throws Exception {
        mvc.perform(options("/api/auth/signup").header("Origin", "https://untrusted.example")
            .header("Access-Control-Request-Method", "POST").header("Access-Control-Request-Headers", "X-Auth-Request"))
            .andExpect(header().doesNotExist("Access-Control-Allow-Origin"))
            .andExpect(header().doesNotExist("Access-Control-Allow-Credentials"));
    }
}
