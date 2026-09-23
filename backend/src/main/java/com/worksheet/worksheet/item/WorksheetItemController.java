package com.worksheet.worksheet.item;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/worksheets/{worksheetId}/items")
@CrossOrigin(origins = "http://localhost:5173")
public class WorksheetItemController {
    private final WorksheetItemService service;

    public WorksheetItemController(WorksheetItemService service) {
        this.service = service;
    }

    @GetMapping
    public List<WorksheetItemResponse> getAll(@PathVariable Long worksheetId) {
        return service.getAll(worksheetId);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public WorksheetItemResponse create(@PathVariable Long worksheetId, @RequestBody CreateWorksheetItemRequest request) {
        return service.create(worksheetId, request);
    }
}