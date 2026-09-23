package com.worksheet.worksheet.result.minigame;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/worksheet-results/{worksheetResultId}/mini-game-results")
@CrossOrigin(origins = "http://localhost:5173")
public class MiniGameResultController {
    private final MiniGameResultService service;

    public MiniGameResultController(MiniGameResultService service) {
        this.service = service;
    }

    @GetMapping
    public List<MiniGameResultResponse> getAll(@PathVariable Long worksheetResultId) {
        return service.getAll(worksheetResultId);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public MiniGameResultResponse create(@PathVariable Long worksheetResultId, @RequestBody CreateMiniGameResultRequest request) {
        return service.create(worksheetResultId, request);
    }
}