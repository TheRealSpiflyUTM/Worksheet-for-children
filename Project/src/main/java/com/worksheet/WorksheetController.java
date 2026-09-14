package com.worksheet;

import java.util.Map;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class WorksheetController {

    // React calls this URL. Spring converts the returned map into JSON.
    @GetMapping("/api/check")
    public Map<String, String> check(@RequestParam(defaultValue = "") String answer) {
        String message;
        try {
            int number = Integer.parseInt(answer.trim());
            message = number == 5
                    ? "Well done! 2 + 3 = 5."
                    : "Not quite. Count 2, then add 3 more. Try again!";
        } catch (NumberFormatException exception) {
            message = "Please enter a whole number.";
        }
        return Map.of("message", message);
    }
}
