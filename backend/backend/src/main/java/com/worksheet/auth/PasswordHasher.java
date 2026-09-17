package com.worksheet.auth;

import java.security.MessageDigest;
import java.security.SecureRandom;
import java.util.Base64;
import javax.crypto.SecretKeyFactory;
import javax.crypto.spec.PBEKeySpec;

final class PasswordHasher {
    private static final int ITERATIONS = 600_000;
    private static final SecureRandom RANDOM = new SecureRandom();

    static String hash(String password) {
        byte[] salt = new byte[16];
        RANDOM.nextBytes(salt);
        return "pbkdf2-sha256$" + ITERATIONS + "$" + Base64.getEncoder().encodeToString(salt)
            + "$" + Base64.getEncoder().encodeToString(derive(password, salt, ITERATIONS));
    }

    static boolean matches(String password, String stored) {
        String[] parts = stored.split("\\$");
        byte[] expected = Base64.getDecoder().decode(parts[3]);
        byte[] actual = derive(password, Base64.getDecoder().decode(parts[2]), Integer.parseInt(parts[1]));
        return MessageDigest.isEqual(expected, actual);
    }

    private static byte[] derive(String password, byte[] salt, int iterations) {
        var spec = new PBEKeySpec(password.toCharArray(), salt, iterations, 256);
        try {
            return SecretKeyFactory.getInstance("PBKDF2WithHmacSHA256").generateSecret(spec).getEncoded();
        } catch (java.security.GeneralSecurityException error) {
            throw new IllegalStateException("Password hashing is unavailable", error);
        } finally { spec.clearPassword(); }
    }
}
