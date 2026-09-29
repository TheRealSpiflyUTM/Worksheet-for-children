package com.worksheet.shared.codes;

import java.security.SecureRandom;
import org.springframework.stereotype.Component;

@Component
public class JoinCodeGenerator {
    private static final char[] CHARACTERS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789".toCharArray();
    private static final int DEFAULT_LENGTH = 8;

    private final SecureRandom random = new SecureRandom();

    public String generate() {
        StringBuilder code = new StringBuilder(DEFAULT_LENGTH);
        for (int index = 0; index < DEFAULT_LENGTH; index++) {
            code.append(CHARACTERS[random.nextInt(CHARACTERS.length)]);
        }
        return code.toString();
    }
}
