package com.worksheet.worksheet.result.minigame;

import com.worksheet.worksheet.item.WorksheetItem;
import com.worksheet.worksheet.item.WorksheetItemRepository;
import com.worksheet.worksheet.result.WorksheetResult;
import com.worksheet.worksheet.result.WorksheetResultRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.node.JsonNodeFactory;
import java.util.List;

@Service
public class MiniGameResultService {
    private final MiniGameResultRepository repository;
    private final WorksheetResultRepository worksheetResultRepository;
    private final WorksheetItemRepository worksheetItemRepository;

    public MiniGameResultService(MiniGameResultRepository repository, WorksheetResultRepository worksheetResultRepository, WorksheetItemRepository worksheetItemRepository) {
        this.repository = repository;
        this.worksheetResultRepository = worksheetResultRepository;
        this.worksheetItemRepository = worksheetItemRepository;
    }

    public MiniGameResultResponse create(Long worksheetResultId, CreateMiniGameResultRequest request) {
        if(request.score() < 0) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Score cannot be negative.");
        if(request.maxScore() < 0) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Max score cannot be negative.");
        if(request.score() > request.maxScore()) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Score cannot exceed max score.");
        if(request.timeSeconds() < 0) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Time cannot be negative.");

        WorksheetResult worksheetResult = worksheetResultRepository.findById(worksheetResultId).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Worksheet result not found."));
        WorksheetItem worksheetItem = worksheetItemRepository.findById(request.worksheetItemId()).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Worksheet item not found."));

        if(!worksheetItem.getWorksheet().getId().equals(worksheetResult.getWorksheet().getId())) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Worksheet item does not belong to this worksheet.");

        JsonNode details = request.details() != null ? request.details() : JsonNodeFactory.instance.objectNode();

        MiniGameResult result = repository.save(new MiniGameResult(worksheetResult, worksheetItem, request.score(), request.maxScore(), request.timeSeconds(), details));
        return toResponse(result);
    }

    public List<MiniGameResultResponse> getAll(Long worksheetResultId) {
        if(!worksheetResultRepository.existsById(worksheetResultId)) throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Worksheet result not found.");

        return repository.findByWorksheetResult_IdOrderByWorksheetItem_OrderIndex(worksheetResultId).stream().map(this::toResponse).toList();
    }

    private MiniGameResultResponse toResponse(MiniGameResult result) {
        return new MiniGameResultResponse(result.getId(), result.getWorksheetResult().getId(), result.getWorksheetItem().getId(), result.getScore(), result.getMaxScore(), result.getTimeSeconds(), result.getDetails());
    }
}