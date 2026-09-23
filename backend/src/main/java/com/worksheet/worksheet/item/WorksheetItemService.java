package com.worksheet.worksheet.item;

import com.worksheet.minigame.MiniGameDefinition;
import com.worksheet.minigame.MiniGameDefinitionRepository;
import com.worksheet.worksheet.Worksheet;
import com.worksheet.worksheet.WorksheetRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.node.JsonNodeFactory;
import java.util.List;

@Service
public class WorksheetItemService {
    private final WorksheetItemRepository repository;
    private final WorksheetRepository worksheetRepository;
    private final MiniGameDefinitionRepository miniGameRepository;

    public WorksheetItemService(WorksheetItemRepository repository, WorksheetRepository worksheetRepository, MiniGameDefinitionRepository miniGameRepository) {
        this.repository = repository;
        this.worksheetRepository = worksheetRepository;
        this.miniGameRepository = miniGameRepository;
    }

    public WorksheetItemResponse create(Long worksheetId, CreateWorksheetItemRequest request) {
        Worksheet worksheet = worksheetRepository.findById(worksheetId).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Worksheet not found."));
        MiniGameDefinition miniGame = miniGameRepository.findById(request.miniGameId()).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Mini-game not found."));

        JsonNode configuration = request.configuration() != null ? request.configuration() : JsonNodeFactory.instance.objectNode();

        WorksheetItem item = repository.save(new WorksheetItem(worksheet, miniGame, request.orderIndex(), configuration));
        return toResponse(item);
    }

    public List<WorksheetItemResponse> getAll(Long worksheetId) {
        if(!worksheetRepository.existsById(worksheetId)) throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Worksheet not found.");

        return repository.findByWorksheet_IdOrderByOrderIndex(worksheetId).stream().map(this::toResponse).toList();
    }

    private WorksheetItemResponse toResponse(WorksheetItem item) {
        return new WorksheetItemResponse(item.getId(), item.getWorksheet().getId(), item.getMiniGame().getId(), item.getOrderIndex(), item.getConfiguration());
    }
}