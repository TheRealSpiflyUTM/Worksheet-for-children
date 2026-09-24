package com.worksheet.assignment;

import com.worksheet.auth.AuthSessionService;
import com.worksheet.auth.UserRole;
import com.worksheet.worksheet.result.CreateWorksheetResultRequest;
import com.worksheet.worksheet.result.WorksheetResultResponse;
import jakarta.servlet.http.HttpServletRequest;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api")
public class WorksheetAssignmentController {
    private final WorksheetAssignmentService service;
    private final AuthSessionService sessions;

    public WorksheetAssignmentController(WorksheetAssignmentService service, AuthSessionService sessions) {
        this.service = service;
        this.sessions = sessions;
    }

    @PostMapping("/worksheets/{worksheetId}/assignments")
    @ResponseStatus(HttpStatus.CREATED)
    public List<WorksheetAssignmentResponse> create(@PathVariable Long worksheetId, @RequestBody CreateAssignmentRequest body, HttpServletRequest request) {
        return service.create(worksheetId, sessions.requireRole(request, UserRole.TEACHER), body);
    }

    @GetMapping("/assignments")
    public List<WorksheetAssignmentResponse> getAll(HttpServletRequest request) {
        return service.getAll(sessions.requireUser(request));
    }

    @GetMapping("/assignments/{assignmentId}")
    public WorksheetAssignmentResponse getById(@PathVariable Long assignmentId, HttpServletRequest request) {
        return service.getById(assignmentId, sessions.requireUser(request));
    }

    @PostMapping("/assignments/{assignmentId}/results")
    @ResponseStatus(HttpStatus.CREATED)
    public WorksheetResultResponse createResult(@PathVariable Long assignmentId, @RequestBody CreateWorksheetResultRequest body, HttpServletRequest request) {
        return service.createResult(assignmentId, sessions.requireRole(request, UserRole.USER), body);
    }

    @GetMapping("/assignments/{assignmentId}/results")
    public List<WorksheetResultResponse> getResults(@PathVariable Long assignmentId, HttpServletRequest request) {
        return service.getResults(assignmentId, sessions.requireUser(request));
    }
}
