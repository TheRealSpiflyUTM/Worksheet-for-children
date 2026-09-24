package com.worksheet.assignment;

import com.worksheet.auth.User;
import com.worksheet.auth.UserRole;
import com.worksheet.attempt.AttemptStatus;
import com.worksheet.attempt.WorksheetAttemptRepository;
import com.worksheet.classroom.Classroom;
import com.worksheet.classroom.ClassroomMember;
import com.worksheet.classroom.ClassroomMemberRepository;
import com.worksheet.classroom.ClassroomRepository;
import com.worksheet.worksheet.Worksheet;
import com.worksheet.worksheet.WorksheetRepository;
import com.worksheet.worksheet.WorksheetResponse;
import com.worksheet.worksheet.item.WorksheetItemResponse;
import com.worksheet.worksheet.revision.WorksheetRevision;
import com.worksheet.worksheet.revision.WorksheetRevisionItemRepository;
import com.worksheet.worksheet.revision.WorksheetRevisionService;
import com.worksheet.worksheet.result.CreateWorksheetResultRequest;
import com.worksheet.worksheet.result.WorksheetResult;
import com.worksheet.worksheet.result.WorksheetResultRepository;
import com.worksheet.worksheet.result.WorksheetResultResponse;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@Transactional
public class WorksheetAssignmentService {
    private final WorksheetAssignmentRepository assignments;
    private final WorksheetRepository worksheets;
    private final ClassroomRepository classrooms;
    private final ClassroomMemberRepository members;
    private final WorksheetResultRepository results;
    private final WorksheetRevisionService revisionService;
    private final WorksheetRevisionItemRepository revisionItems;
    private final WorksheetAttemptRepository attempts;

    public WorksheetAssignmentService(WorksheetAssignmentRepository assignments, WorksheetRepository worksheets,
            ClassroomRepository classrooms, ClassroomMemberRepository members, WorksheetResultRepository results,
            WorksheetRevisionService revisionService,
            WorksheetRevisionItemRepository revisionItems,
            WorksheetAttemptRepository attempts) {
        this.assignments = assignments;
        this.worksheets = worksheets;
        this.classrooms = classrooms;
        this.members = members;
        this.results = results;
        this.revisionService = revisionService;
        this.revisionItems = revisionItems;
        this.attempts = attempts;
    }

    @Transactional
    public List<WorksheetAssignmentResponse> create(Long worksheetId, User teacher, CreateAssignmentRequest request) {
        requireRole(teacher, UserRole.TEACHER);
        if((request.classroomId() == null) == (request.userId() == null)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Provide exactly one of classroomId or userId.");
        }
        Worksheet worksheet = worksheets.findByIdAndUser_Id(worksheetId, teacher.getId())
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Worksheet not found."));
        WorksheetRevision revision = revisionService.publish(worksheet);
        UUID batchId = UUID.randomUUID();

        List<WorksheetAssignment> created;
        if(request.classroomId() != null) {
            Classroom classroom = classrooms.findByIdAndTeacher_Id(request.classroomId(), teacher.getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Class not found."));
            List<ClassroomMember> recipients = members.findByClassroom_IdAndLeftAtIsNullOrderByJoinedAt(classroom.getId());
            if(recipients.isEmpty()) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Class has no active users.");
            created = recipients.stream()
                .map(member -> new WorksheetAssignment(batchId, revision, classroom, member.getUser()))
                .toList();
        } else {
            ClassroomMember membership = members.findFirstByClassroom_Teacher_IdAndUser_IdAndLeftAtIsNullOrderByJoinedAt(teacher.getId(), request.userId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User is not an active member of this teacher's classes."));
            if(membership.getUser().getRole() != UserRole.USER) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only USER accounts can receive assignments.");
            }
            created = List.of(new WorksheetAssignment(batchId, revision, null, membership.getUser()));
        }
        return assignments.saveAll(created).stream().map(this::toResponse).toList();
    }

    public List<WorksheetAssignmentResponse> getAll(User actor) {
        List<WorksheetAssignment> found = actor.getRole() == UserRole.TEACHER
            ? assignments.findByWorksheetRevision_Worksheet_User_IdOrderByAssignedAtDesc(actor.getId())
            : assignments.findByUser_IdAndRevokedAtIsNullOrderByAssignedAtDesc(actor.getId());
        return found.stream().map(this::toResponse).toList();
    }

    public WorksheetAssignmentResponse getById(Long assignmentId, User actor) {
        return toResponse(requireReadable(assignmentId, actor));
    }

    public WorksheetResultResponse createResult(Long assignmentId, User user, CreateWorksheetResultRequest request) {
        requireRole(user, UserRole.USER);
        WorksheetAssignment assignment = assignments.findById(assignmentId)
            .filter(value -> value.getUser().getId().equals(user.getId()) && value.getRevokedAt() == null)
            .orElseThrow(() -> assignmentNotFound());
        validateScores(request);
        WorksheetResult result = results.save(new WorksheetResult(
            assignment.getWorksheetRevision().getWorksheet(), assignment, request.totalScore(), request.maxScore()));
        return toResultResponse(result);
    }

    public List<WorksheetResultResponse> getResults(Long assignmentId, User actor) {
        WorksheetAssignment assignment = requireReadable(assignmentId, actor);
        return results.findByAssignment_IdOrderByCompletedAtDesc(assignment.getId()).stream()
            .map(this::toResultResponse).toList();
    }

    private WorksheetAssignment requireReadable(Long assignmentId, User actor) {
        WorksheetAssignment assignment = assignments.findById(assignmentId).orElseThrow(() -> assignmentNotFound());
        boolean teacher = assignment.getTeacher().getId().equals(actor.getId());
        boolean assignedUser = assignment.getUser().getId().equals(actor.getId()) && assignment.getRevokedAt() == null;
        if(!teacher && !assignedUser) throw assignmentNotFound();
        return assignment;
    }

    private WorksheetAssignmentResponse toResponse(WorksheetAssignment assignment) {
        Worksheet worksheet = assignment.getWorksheetRevision().getWorksheet();
        List<WorksheetItemResponse> frozenItems = revisionItems
            .findByRevision_IdOrderByOrderIndex(assignment.getWorksheetRevision().getId()).stream()
            .map(item -> new WorksheetItemResponse(item.getId(), worksheet.getId(),
                item.getMiniGameDefinition().getId(), item.getOrderIndex(), item.getConfiguration()))
            .toList();
        WorksheetResponse worksheetResponse = new WorksheetResponse(worksheet.getId(),
            assignment.getWorksheetRevision().getNameSnapshot(), worksheet.getCreatedAt(),
            assignment.getWorksheetRevision().getPublishedAt(), frozenItems);
        AssignmentStatus status = assignment.getRevokedAt() != null ? AssignmentStatus.REVOKED
            : results.existsByAssignment_Id(assignment.getId())
                || attempts.existsByAssignment_IdAndStatus(assignment.getId(), AttemptStatus.COMPLETED)
                ? AssignmentStatus.COMPLETED : AssignmentStatus.NOT_STARTED;
        Long classroomId = assignment.getClassroom() == null ? null : assignment.getClassroom().getId();
        return new WorksheetAssignmentResponse(assignment.getId(), assignment.getBatchId(), worksheetResponse,
            assignment.getTeacher().getId(), assignment.getTeacher().getName(), classroomId,
            assignment.getUser().getId(), assignment.getUser().getName(), assignment.getAssignedAt(),
            assignment.getRevokedAt(), status);
    }

    private WorksheetResultResponse toResultResponse(WorksheetResult result) {
        return new WorksheetResultResponse(result.getId(), result.getWorksheet().getId(), result.getAssignment().getId(),
            result.getTotalScore(), result.getMaxScore(), result.getCompletedAt());
    }

    private void validateScores(CreateWorksheetResultRequest request) {
        if(request.totalScore() < 0) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Total score cannot be negative.");
        if(request.maxScore() < 0) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Max score cannot be negative.");
        if(request.totalScore() > request.maxScore()) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Total score cannot exceed max score.");
    }

    private void requireRole(User user, UserRole role) {
        if(user.getRole() != role) throw new ResponseStatusException(HttpStatus.FORBIDDEN, "This account does not have permission for this action.");
    }

    private ResponseStatusException assignmentNotFound() {
        return new ResponseStatusException(HttpStatus.NOT_FOUND, "Assignment not found.");
    }
}
