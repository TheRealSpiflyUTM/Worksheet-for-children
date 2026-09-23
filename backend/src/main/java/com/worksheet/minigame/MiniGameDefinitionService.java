package com.worksheet.minigame;

import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class MiniGameDefinitionService {
    private final MiniGameDefinitionRepository repository;

    public MiniGameDefinitionService(MiniGameDefinitionRepository repository) {
        this.repository = repository;
    }

    public List<MiniGameDefinitionResponse> getAll() {
        return repository.findAll().stream().map(this::toResponse).toList();
    }

    private MiniGameDefinitionResponse toResponse(MiniGameDefinition definition) {
        return new MiniGameDefinitionResponse(definition.getId(), definition.getName(), definition.getType(), definition.getConfigurationSchema(), definition.isActive());
    }
}