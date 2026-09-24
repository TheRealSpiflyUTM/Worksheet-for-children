package com.worksheet.minigame;

import com.worksheet.auth.AuthSessionService;
import com.worksheet.auth.UserRole;
import jakarta.servlet.http.HttpServletRequest;
import java.util.List;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/minigames")
public class AdminMiniGameController {
    private final MiniGameDefinitionService service;
    private final AuthSessionService sessions;

    public AdminMiniGameController(MiniGameDefinitionService service, AuthSessionService sessions) {
        this.service = service;
        this.sessions = sessions;
    }

    @GetMapping
    public List<MiniGameDefinitionResponse> getAll(HttpServletRequest request) {
        sessions.requireRole(request, UserRole.ADMIN);
        return service.getAllForAdmin();
    }

    @PostMapping("/{id}/activate")
    public MiniGameDefinitionResponse activate(@PathVariable Long id, HttpServletRequest request) {
        sessions.requireRole(request, UserRole.ADMIN);
        return service.activate(id);
    }
}
