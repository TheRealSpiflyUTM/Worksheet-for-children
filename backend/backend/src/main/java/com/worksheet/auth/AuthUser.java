package com.worksheet.auth;

import java.time.Instant;

// Only these public fields are returned to the browser. Password hashes stay in the repository.
public record AuthUser(long id, String name, String email, Instant createdAt) {}
