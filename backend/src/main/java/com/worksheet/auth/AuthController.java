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
@CrossOrigin(origins = "${app.auth.allowed-origin:http://localhost:5173}", allowCredentials = "true")
public class AuthController {
    private static final String USER_ID = "auth.userId";
    private final AuthService auth;

    public AuthController(AuthService auth) { this.auth = auth; }

    @ModelAttribute
    void protectRequest(HttpServletRequest request, HttpServletResponse response) {
        response.setHeader("Cache-Control", "no-store");
        // Custom headers require a CORS preflight; only the configured origin is allowed.
        if ("POST".equals(request.getMethod()) && !"1".equals(request.getHeader("X-Auth-Request"))) {
            throw new ResponseStatusException(FORBIDDEN, "Invalid authentication request.");
        }
    }

    @PostMapping(value = "/signup", consumes = "application/json")
    @ResponseStatus(CREATED)
    public UserResponse signup(@RequestBody Signup input, HttpServletRequest request) {
        UserResponse user = auth.signup(input.name(), input.email(), input.password());
        startSession(request, user.id());
        return user;
    }

    @PostMapping(value = "/login", consumes = "application/json")
    public UserResponse login(@RequestBody Login input, HttpServletRequest request) {
        UserResponse user = auth.login(input.email(), input.password());
        startSession(request, user.id());
        return user;
    }

    @GetMapping("/me")
    public UserResponse me(HttpServletRequest request) {
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

    private void startSession(HttpServletRequest request, Long id) {
        request.getSession();
        request.changeSessionId();
        request.getSession().setAttribute(USER_ID, id);
        request.getSession().setMaxInactiveInterval(30 * 60);
    }

    @ExceptionHandler(ResponseStatusException.class)
    ResponseEntity<Map<String, String>> handleError(ResponseStatusException error) {
        return ResponseEntity.status(error.getStatusCode()).body(Map.of("message", error.getReason()));
    }

    public record Signup(String name, String email, String password) {}
    public record Login(String email, String password) {}
}
