package com.worksheet.classroom;

import com.worksheet.auth.UserResponse;
import com.worksheet.worksheet.WorksheetShareService;
import java.util.Locale;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class StudentPlayService {
    private final ClassroomMemberRepository members;
    private final WorksheetShareService shares;

    public StudentPlayService(ClassroomMemberRepository members, WorksheetShareService shares) {
        this.members = members;
        this.shares = shares;
    }

    @Transactional
    public StudentEntry join(String studentCode, String worksheetCode) {
        if (studentCode == null || studentCode.isBlank()) throw invalidCode();
        ClassroomMember member = members.findByStudentCodeAndLeftAtIsNull(
            studentCode.strip().toUpperCase(Locale.ROOT)).orElseThrow(this::invalidCode);
        var worksheet = shares.joinForStudent(worksheetCode, member);
        UserResponse child = new UserResponse(member.getUser().getId(), member.getUser().getName(),
            null, member.getUser().getRole(), member.getUser().getCreatedAt());
        return new StudentEntry(child, worksheet.assignmentId());
    }

    private ResponseStatusException invalidCode() {
        return new ResponseStatusException(HttpStatus.NOT_FOUND, "Student code not found. Ask your teacher for your code.");
    }

    public record StudentEntry(UserResponse user, Long assignmentId) {}
}
