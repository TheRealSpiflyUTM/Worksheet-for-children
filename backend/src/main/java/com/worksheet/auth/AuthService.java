package com.worksheet.auth;

import java.util.Locale;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.crypto.password.Pbkdf2PasswordEncoder;
import static org.springframework.security.crypto.password.Pbkdf2PasswordEncoder.SecretKeyFactoryAlgorithm.PBKDF2WithHmacSHA256;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import static org.springframework.http.HttpStatus.*;

@Service
public class AuthService {
    private final UserRepository users;
    private final Pbkdf2PasswordEncoder passwords = new Pbkdf2PasswordEncoder("", 16, 600_000, PBKDF2WithHmacSHA256);
    private final String dummyHash = passwords.encode("unused-password-for-timing");

    public AuthService(UserRepository users) { this.users = users; }

    public UserResponse signup(String name, String email, String password) {
        if (name == null || name.isBlank() || name.strip().length() > 100) {
            throw new ResponseStatusException(BAD_REQUEST, "Name must contain 1 to 100 characters.");
        }
        String normalizedEmail = normalizeEmail(email);
        validatePassword(password);
        if (users.existsByEmail(normalizedEmail)) throw duplicateEmail();
        try {
            User user = users.saveAndFlush(new User(name.strip(), normalizedEmail, passwords.encode(password)));
            return UserResponse.from(user);
        } catch (DataIntegrityViolationException error) {
            // The database's unique constraint also covers simultaneous signup requests.
            if (users.existsByEmail(normalizedEmail)) throw duplicateEmail();
            throw error;
        }
    }

    public UserResponse login(String email, String password) {
        String normalizedEmail = normalizeEmail(email);
        validatePassword(password);
        var user = users.findByEmail(normalizedEmail);
        boolean valid = passwords.matches(password, user.map(User::getPasswordHash).orElse(dummyHash));
        if (user.isEmpty() || !valid) {
            throw new ResponseStatusException(UNAUTHORIZED, "Email or password is incorrect.");
        }
        return UserResponse.from(user.get());
    }

    public UserResponse currentUser(Long id) {
        return users.findById(id).map(UserResponse::from)
            .orElseThrow(() -> new ResponseStatusException(UNAUTHORIZED, "Please log in."));
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

    private ResponseStatusException duplicateEmail() {
        return new ResponseStatusException(CONFLICT, "An account with this email already exists.");
    }
}
