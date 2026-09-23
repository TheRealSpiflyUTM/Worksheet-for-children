package com.worksheet.worksheets;

import org.springframework.stereotype.Service;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;
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

    public void delete(Long id) {
        Worksheet worksheet = repository.findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Worksheet not found."));
        repository.delete(worksheet);
    }

    private WorksheetResponse toResponse(Worksheet worksheet) {
        return new WorksheetResponse(worksheet.getId(), worksheet.getName(), worksheet.getCreatedAt(), worksheet.getUpdatedAt());
    }
}
