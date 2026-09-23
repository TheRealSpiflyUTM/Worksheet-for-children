package com.worksheet.worksheet.result;

import com.worksheet.worksheet.Worksheet;
import com.worksheet.worksheet.WorksheetRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import java.util.List;

@Service
public class WorksheetResultService {
    private final WorksheetResultRepository repository;
    private final WorksheetRepository worksheetRepository;

    public WorksheetResultService(WorksheetResultRepository repository, WorksheetRepository worksheetRepository) {
        this.repository = repository;
        this.worksheetRepository = worksheetRepository;
    }

    public WorksheetResultResponse create(Long worksheetId, CreateWorksheetResultRequest request) {
        if(request.totalScore() < 0) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Total score cannot be negative.");
        if(request.maxScore() < 0) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Max score cannot be negative.");
        if(request.totalScore() > request.maxScore()) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Total score cannot exceed max score.");

        Worksheet worksheet = worksheetRepository.findById(worksheetId).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Worksheet not found."));

        WorksheetResult result = repository.save(new WorksheetResult(worksheet, request.totalScore(), request.maxScore()));
        return toResponse(result);
    }

    public List<WorksheetResultResponse> getAll(Long worksheetId) {
        if(!worksheetRepository.existsById(worksheetId)) throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Worksheet not found.");

        return repository.findByWorksheet_IdOrderByCompletedAtDesc(worksheetId).stream().map(this::toResponse).toList();
    }

    private WorksheetResultResponse toResponse(WorksheetResult result) {
        return new WorksheetResultResponse(result.getId(), result.getWorksheet().getId(), result.getTotalScore(), result.getMaxScore(), result.getCompletedAt());
    }
}