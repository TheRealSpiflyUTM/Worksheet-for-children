package com.worksheet.worksheet;

import java.security.SecureRandom;

public final class ShareCodeGenerator {

private static final String CHARACTERS =
        "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

private static final SecureRandom RANDOM = new SecureRandom();

private ShareCodeGenerator() {
}

public static String generateCode() {
    StringBuilder code = new StringBuilder();

    for (int i = 0; i < 8; i++) {
        if (i == 4) {
            code.append("-");
        }

        int index = RANDOM.nextInt(CHARACTERS.length());
        code.append(CHARACTERS.charAt(index));
    }

    return code.toString();
}

}
