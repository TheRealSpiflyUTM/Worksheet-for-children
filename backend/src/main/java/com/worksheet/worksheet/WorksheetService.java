package com.worksheet.worksheet;

import com.worksheet.worksheet.item.WorksheetItemResponse;
import com.worksheet.worksheet.item.WorksheetItemService;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;
import java.util.List;

@Service
public class WorksheetService {
    private final WorksheetRepository repository;
    private final WorksheetItemService itemService;

    public WorksheetService(WorksheetRepository repository, WorksheetItemService itemService) {
        this.repository = repository;
        this.itemService = itemService;
    }

    public WorksheetResponse create(CreateWorksheetRequest request) {
        String name = request.name() == null ? "" : request.name().trim();
        if(name.isEmpty()) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Worksheet name is required.");

        Worksheet worksheet = repository.save(new Worksheet(name));
        return toResponse(worksheet, List.of());
    }

    public List<WorksheetResponse> getAll() {
        return repository.findAll().stream().map(worksheet -> toResponse(worksheet, itemService.getAll(worksheet.getId()))).toList();
    }

    public WorksheetResponse getById(Long id) {
        Worksheet worksheet = repository.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Worksheet not found."));
        return toResponse(worksheet, itemService.getAll(id));
    }

    public void delete(Long id) {
        Worksheet worksheet = repository.findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Worksheet not found."));
        repository.delete(worksheet);
    }

    private WorksheetResponse toResponse(Worksheet worksheet, List<WorksheetItemResponse> items) {
        return new WorksheetResponse(worksheet.getId(), worksheet.getName(), worksheet.getCreatedAt(), worksheet.getUpdatedAt(), items);
    }
}
