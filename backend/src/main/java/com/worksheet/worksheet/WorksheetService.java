package com.worksheet.worksheets;

import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class WorksheetService {
    private final WorksheetRepository repository;

    public WorksheetService(WorksheetRepository repository) {
        this.repository = repository;
    }

    public WorksheetResponse create(CreateWorksheetRequest request) {
        String name = request.name() == null ? "" : request.name().trim();
        if(name.isEmpty()) throw new IllegalArgumentException("Worksheet name is required.");

        Worksheet worksheet = repository.save(new Worksheet(name));
        return toResponse(worksheet);
    }

    public List<WorksheetResponse> getAll() {
        return repository.findAll().stream().map(this::toResponse).toList();
    }

    private WorksheetResponse toResponse(Worksheet worksheet) {
        return new WorksheetResponse(worksheet.getId(), worksheet.getName(), worksheet.getCreatedAt(), worksheet.getUpdatedAt());
    }
}