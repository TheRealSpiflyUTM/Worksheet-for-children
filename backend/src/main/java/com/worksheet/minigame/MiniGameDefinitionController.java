package com.worksheet.minigame;

import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/minigames")
@CrossOrigin(origins = "http://localhost:5173")
public class MiniGameDefinitionController {
    private final MiniGameDefinitionService service;

    public MiniGameDefinitionController(MiniGameDefinitionService service) {
        this.service = service;
    }

    @GetMapping
    public List<MiniGameDefinitionResponse> getAll() {
        return service.getAll();
    }
}