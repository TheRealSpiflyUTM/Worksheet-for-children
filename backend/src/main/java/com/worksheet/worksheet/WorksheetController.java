package com.worksheet.worksheet;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/worksheets")
@CrossOrigin(origins = "http://localhost:5173")
public class WorksheetController {
    private final WorksheetService service;

    public WorksheetController(WorksheetService service) {
        this.service = service;
    }

    @GetMapping
    public List<WorksheetResponse> getAll() {
        return service.getAll();
    }

    @GetMapping("/{id}")
    public WorksheetResponse getById(@PathVariable Long id) {
        return service.getById(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public WorksheetResponse create(@RequestBody CreateWorksheetRequest request) {
        return service.create(request);
    }
}