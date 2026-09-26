package com.worksheet.auth;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;
import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import static org.springframework.http.HttpStatus.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    private static final String USER_ID = "auth.userId";
    private final AuthService auth;

    public AuthController(AuthService auth) { this.auth = auth; }

    @PostMapping(value = "/signup", consumes = "application/json")
    @ResponseStatus(CREATED)
    public UserResponse signup(@RequestBody Signup input, HttpServletRequest request) {
        UserResponse user = auth.signup(input.name(), input.email(), input.password(), input.role());
        startSession(request, user);
        return user;
    }

    @PostMapping(value = "/login", consumes = "application/json")
    public UserResponse login(@RequestBody Login input, HttpServletRequest request) {
        UserResponse user = auth.login(input.email(), input.password());
        startSession(request, user);
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
        SecurityContextHolder.clearContext();
        var session = request.getSession(false);
        if (session != null) session.invalidate();
    }

    @GetMapping("/csrf")
    public CsrfResponse csrf(CsrfToken token) {
        return new CsrfResponse(token.getHeaderName(), token.getParameterName(), token.getToken());
    }

    private void startSession(HttpServletRequest request, UserResponse user) {
        request.getSession();
        request.changeSessionId();
        request.getSession().setAttribute(USER_ID, user.id());
        request.getSession().setMaxInactiveInterval(30 * 60);
        var authentication = UsernamePasswordAuthenticationToken.authenticated(
            user.id().toString(), null, java.util.List.of(new SimpleGrantedAuthority("ROLE_" + user.role().name())));
        var context = SecurityContextHolder.createEmptyContext();
        context.setAuthentication(authentication);
        SecurityContextHolder.setContext(context);
        request.getSession().setAttribute(HttpSessionSecurityContextRepository.SPRING_SECURITY_CONTEXT_KEY, context);
    }

    public record Signup(String name, String email, String password, UserRole role) {}
    public record Login(String email, String password) {}
    public record CsrfResponse(String headerName, String parameterName, String token) {}
}
