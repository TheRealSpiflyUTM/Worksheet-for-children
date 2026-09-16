package com.worksheet.worksheets;

import java.util.List;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/worksheets")
@CrossOrigin(origins = "http://localhost:5173")
public class WorksheetController {

    @GetMapping
    public List<WorksheetResponse> findAll() {
        return List.of(
            new WorksheetResponse(1L, "Animals worksheet"),
            new WorksheetResponse(2L, "Colors worksheet"),
            new WorksheetResponse(3L, "Numbers worksheet")
        );
    }
}