package com.worksheet.classroom;

import com.worksheet.auth.AuthSessionService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/play")
public class StudentPlayController {
    private final StudentPlayService play;
    private final AuthSessionService sessions;

    public StudentPlayController(StudentPlayService play, AuthSessionService sessions) {
        this.play = play;
        this.sessions = sessions;
    }

    @PostMapping("/join")
    public StudentPlayService.StudentEntry join(@RequestBody JoinRequest body, HttpServletRequest request) {
        var entry = play.join(body.studentCode(), body.worksheetCode());
        // Authenticate only after both codes have been validated and the assignment committed.
        sessions.startSession(request, entry.user());
        return entry;
    }

    public record JoinRequest(String studentCode, String worksheetCode) {}
}
