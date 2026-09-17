package com.worksheet.auth;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.util.Map;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import static org.springframework.http.HttpStatus.*;

@RestController
@RequestMapping("/api/auth")
// The frontend uses a same-origin proxy. Do not add wildcard CORS to session endpoints.
public class AuthController {
    private static final String USER_ID = "auth.userId";
    private final AuthService auth;

    public AuthController(AuthService auth) { this.auth = auth; }

    @ModelAttribute
    void protectRequest(HttpServletRequest request, HttpServletResponse response) {
        response.setHeader("Cache-Control", "no-store");
        if (!"GET".equals(request.getMethod()) &&
                (!"1".equals(request.getHeader("X-Auth-Request")) || "cross-site".equals(request.getHeader("Sec-Fetch-Site")))) {
            throw new ResponseStatusException(FORBIDDEN, "Invalid authentication request.");
        }
    }

    @PostMapping(value = "/signup", consumes = "application/json")
    @ResponseStatus(CREATED)
    public AuthUser signup(@RequestBody Signup input, HttpServletRequest request) {
        AuthUser user = auth.signup(input.name(), input.email(), input.password());
        startSession(request, user);
        return user;
    }

    @PostMapping(value = "/login", consumes = "application/json")
    public AuthUser login(@RequestBody Login input, HttpServletRequest request) {
        AuthUser user = auth.login(input.email(), input.password());
        startSession(request, user);
        return user;
    }

    @GetMapping("/me")
    public AuthUser me(HttpServletRequest request) {
        var session = request.getSession(false);
        if (session == null || !(session.getAttribute(USER_ID) instanceof Long id)) {
            throw new ResponseStatusException(UNAUTHORIZED, "Please log in.");
        }
        return auth.currentUser(id);
    }

    @PostMapping("/logout")
    @ResponseStatus(NO_CONTENT)
    public void logout(HttpServletRequest request) {
        var session = request.getSession(false);
        if (session != null) session.invalidate();
    }

    private void startSession(HttpServletRequest request, AuthUser user) {
        request.getSession();
        request.changeSessionId();
        request.getSession().setAttribute(USER_ID, user.id());
        request.getSession().setMaxInactiveInterval(30 * 60);
    }

    @ExceptionHandler(ResponseStatusException.class)
    ResponseEntity<Map<String, String>> handleError(ResponseStatusException error) {
        return ResponseEntity.status(error.getStatusCode()).body(Map.of("message", error.getReason()));
    }

    public record Signup(String name, String email, String password) {}
    public record Login(String email, String password) {}
}
