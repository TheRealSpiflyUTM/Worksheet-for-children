package com.worksheet.worksheet.result;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/worksheets/{worksheetId}/results")
@CrossOrigin(origins = "http://localhost:5173")
public class WorksheetResultController {
    private final WorksheetResultService service;

    public WorksheetResultController(WorksheetResultService service) {
        this.service = service;
    }

    @GetMapping
    public List<WorksheetResultResponse> getAll(@PathVariable Long worksheetId) {
        return service.getAll(worksheetId);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public WorksheetResultResponse create(@PathVariable Long worksheetId, @RequestBody CreateWorksheetResultRequest request) {
        return service.create(worksheetId, request);
    }
}