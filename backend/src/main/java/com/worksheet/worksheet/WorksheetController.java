package com.worksheet.worksheet;

import com.worksheet.auth.AuthSessionService;
import jakarta.servlet.http.HttpServletRequest;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/worksheets")
public class WorksheetController {

    private final WorksheetService service;
    private final AuthSessionService sessions;

    public WorksheetController(WorksheetService service, AuthSessionService sessions) {
        this.service = service;
        this.sessions = sessions;
    }

    @GetMapping
    public List<WorksheetResponse> getAll(HttpServletRequest request) {
        return service.getAll(sessions.requireUserId(request));
    }

    @GetMapping("/{id}")
    public WorksheetResponse getById(@PathVariable Long id, HttpServletRequest request) {
        return service.getById(id, sessions.requireUserId(request));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public WorksheetResponse create(@RequestBody CreateWorksheetRequest input, HttpServletRequest request) {
        return service.create(sessions.requireUserId(request), input);
    }

    @PutMapping("/{id}")
    public WorksheetResponse update(@PathVariable Long id, @RequestBody CreateWorksheetRequest input,
                                    HttpServletRequest request) {
        return service.update(id, sessions.requireUserId(request), input);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id, HttpServletRequest request) {
        service.delete(id, sessions.requireUserId(request));
    }
}
