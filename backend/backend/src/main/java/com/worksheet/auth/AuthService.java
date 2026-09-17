package com.worksheet.auth;

import java.util.Locale;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import static org.springframework.http.HttpStatus.*;

@Service
public class AuthService {
    private final UserRepository users;
    private final String dummyHash = PasswordHasher.hash("dummy-password-for-timing-only");

    public AuthService(UserRepository users) { this.users = users; }

    public AuthUser signup(String name, String email, String password) {
        if (name == null || name.isBlank() || name.strip().length() > 100) {
            throw new ResponseStatusException(BAD_REQUEST, "Name must contain 1 to 100 characters.");
        }
        String normalizedEmail = normalizeEmail(email);
        validatePassword(password);
        return users.create(name.strip(), normalizedEmail, PasswordHasher.hash(password));
    }

    public AuthUser login(String email, String password) {
        String normalizedEmail = normalizeEmail(email);
        validatePassword(password);
        var stored = users.findByEmail(normalizedEmail);
        boolean valid = PasswordHasher.matches(password, stored.map(UserRepository.StoredUser::passwordHash).orElse(dummyHash));
        if (stored.isEmpty() || !valid) {
            throw new ResponseStatusException(UNAUTHORIZED, "Email or password is incorrect.");
        }
        return stored.get().user();
    }

    public AuthUser currentUser(long id) {
        return users.findById(id).orElseThrow(() -> new ResponseStatusException(UNAUTHORIZED, "Please log in."));
    }

    private String normalizeEmail(String email) {
        if (email == null) throw new ResponseStatusException(BAD_REQUEST, "Enter a valid email address.");
        String normalized = email.strip().toLowerCase(Locale.ROOT);
        if (normalized.length() > 254 || !normalized.matches("[^\\s@]+@[^\\s@]+\\.[^\\s@]+")) {
            throw new ResponseStatusException(BAD_REQUEST, "Enter a valid email address.");
        }
        return normalized;
    }

    private void validatePassword(String password) {
        if (password == null || password.length() < 15 || password.length() > 128) {
            throw new ResponseStatusException(BAD_REQUEST, "Use a password between 15 and 128 characters.");
        }
    }
}
