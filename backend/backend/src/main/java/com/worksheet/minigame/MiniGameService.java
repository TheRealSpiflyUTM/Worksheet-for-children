package com.worksheet.minigame;

import java.util.List;
import org.springframework.stereotype.Service;

@Service
public class MiniGameService {

    public List<MiniGameResponse> getMiniGames() {
        return List.of(
            new MiniGameResponse("addition", "Addition", "Practice adding two numbers."),
            new MiniGameResponse("animal-body-parts", "Animal Body Parts", "Identify parts of an animal.")
        );
    }
}
