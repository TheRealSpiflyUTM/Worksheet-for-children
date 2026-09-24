package com.worksheet.classroom;

import com.worksheet.auth.AuthSessionService;
import com.worksheet.auth.User;
import com.worksheet.auth.UserRole;
import jakarta.servlet.http.HttpServletRequest;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/classes")
public class ClassroomController {
    private final ClassroomService service;
    private final AuthSessionService sessions;

    public ClassroomController(ClassroomService service, AuthSessionService sessions) {
        this.service = service;
        this.sessions = sessions;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ClassroomResponse create(@RequestBody CreateClassroomRequest body, HttpServletRequest request) {
        return service.create(sessions.requireRole(request, UserRole.TEACHER), body);
    }

    @GetMapping
    public List<ClassroomResponse> getAll(HttpServletRequest request) {
        return service.getAll(sessions.requireUser(request));
    }

    @GetMapping("/{classroomId}")
    public ClassroomResponse getById(@PathVariable Long classroomId, HttpServletRequest request) {
        return service.getById(classroomId, sessions.requireUser(request));
    }

    @PostMapping("/join")
    @ResponseStatus(HttpStatus.CREATED)
    public ClassroomResponse join(@RequestBody JoinClassroomRequest body, HttpServletRequest request) {
        return service.join(sessions.requireRole(request, UserRole.USER), body);
    }

    @GetMapping("/{classroomId}/members")
    public List<ClassroomMemberResponse> getMembers(@PathVariable Long classroomId, HttpServletRequest request) {
        return service.getMembers(classroomId, sessions.requireRole(request, UserRole.TEACHER));
    }

    @DeleteMapping("/{classroomId}/members/{userId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void removeMember(@PathVariable Long classroomId, @PathVariable Long userId, HttpServletRequest request) {
        service.removeMember(classroomId, userId, sessions.requireRole(request, UserRole.TEACHER));
    }

    @PostMapping("/{classroomId}/join-code/rotate")
    public ClassroomResponse rotateJoinCode(@PathVariable Long classroomId, HttpServletRequest request) {
        return service.rotateJoinCode(classroomId, sessions.requireRole(request, UserRole.TEACHER));
    }
}
