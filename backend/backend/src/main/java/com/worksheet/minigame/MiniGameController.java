package com.worksheet.minigame;

import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/mini-games")
public class MiniGameController {

    private final MiniGameService miniGameService;

    public MiniGameController(MiniGameService miniGameService) {
        this.miniGameService = miniGameService;
    }

    @GetMapping
    public List<MiniGameResponse> getMiniGames() {
        return miniGameService.getMiniGames();
    }
}
