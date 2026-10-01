package com.worksheet.worksheet;

import com.worksheet.assignment.WorksheetAssignment;
import com.worksheet.assignment.WorksheetAssignmentRepository;
import com.worksheet.auth.User;
import com.worksheet.auth.UserRole;
import com.worksheet.classroom.ClassroomMember;
import com.worksheet.classroom.ClassroomMemberRepository;
import com.worksheet.shared.codes.JoinCodeGenerator;
import com.worksheet.worksheet.revision.WorksheetRevision;
import com.worksheet.worksheet.revision.WorksheetRevisionItemRepository;
import com.worksheet.worksheet.revision.WorksheetRevisionResponseMapper;
import com.worksheet.worksheet.revision.WorksheetRevisionService;
import java.util.Locale;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@Transactional
public class WorksheetShareService {
    private final WorksheetRepository worksheets;
    private final WorksheetAssignmentRepository assignments;
    private final WorksheetRevisionService revisions;
    private final WorksheetRevisionItemRepository revisionItems;
    private final WorksheetRevisionResponseMapper responseMapper;
    private final JoinCodeGenerator codes;
    private final ClassroomMemberRepository members;

    public WorksheetShareService(WorksheetRepository worksheets,
                                 WorksheetAssignmentRepository assignments,
                                 WorksheetRevisionService revisions,
                                 WorksheetRevisionItemRepository revisionItems,
                                 WorksheetRevisionResponseMapper responseMapper,
                                 JoinCodeGenerator codes, ClassroomMemberRepository members) {
        this.worksheets = worksheets;
        this.assignments = assignments;
        this.revisions = revisions;
        this.revisionItems = revisionItems;
        this.responseMapper = responseMapper;
        this.codes = codes;
        this.members = members;
    }

    public String share(Long worksheetId, User teacher) {
        requireRole(teacher, UserRole.TEACHER);
        Worksheet worksheet = requireOwned(worksheetId, teacher.getId());
        if (worksheet.getShareCode() != null && worksheet.getShareRevision() != null) {
            return worksheet.getShareCode();
        }

        WorksheetRevision revision = publishNonEmpty(worksheet);
        String code = worksheet.getShareCode() == null ? nextCode() : worksheet.getShareCode();
        worksheet.share(code, revision);
        worksheets.save(worksheet);
        return code;
    }

    public String rotate(Long worksheetId, User teacher) {
        requireRole(teacher, UserRole.TEACHER);
        Worksheet worksheet = requireOwned(worksheetId, teacher.getId());
        worksheet.share(nextCode(), publishNonEmpty(worksheet));
        worksheets.save(worksheet);
        return worksheet.getShareCode();
    }

    public JoinWorksheetResponse join(String rawCode, User user) {
        requireRole(user, UserRole.USER);
        return join(rawCode, user, null);
    }

    public JoinWorksheetResponse joinForStudent(String rawCode, ClassroomMember member) {
        requireRole(member.getUser(), UserRole.USER);
        return join(rawCode, member.getUser(), member);
    }

    public String shareCurrent(Long worksheetId, User teacher) {
        requireRole(teacher, UserRole.TEACHER);
        Worksheet worksheet = requireOwned(worksheetId, teacher.getId());
        String code = worksheet.getShareCode() == null ? nextCode() : worksheet.getShareCode();
        worksheet.share(code, publishNonEmpty(worksheet));
        worksheets.save(worksheet);
        return code;
    }

    private JoinWorksheetResponse join(String rawCode, User user, ClassroomMember member) {
        String code = normalize(rawCode);
        Worksheet worksheet = worksheets.findByShareCode(code)
            .orElseThrow(this::codeNotFound);
        if (member == null && members.existsByUser_IdAndStudentCodeIsNotNull(user.getId())) {
            member = members.findFirstByUser_IdAndClassroom_Teacher_IdAndStudentCodeIsNotNullAndLeftAtIsNull(
                user.getId(), worksheet.getUser().getId()).orElseThrow(this::codeNotFound);
        }
        if (member != null && (member.getLeftAt() != null
            || !worksheet.getUser().getId().equals(member.getClassroom().getTeacher().getId()))) {
            throw codeNotFound();
        }

        // V18 codes predate revision pinning. Pin them once on first use.
        WorksheetRevision revision = worksheet.getShareRevision();
        if (revision == null) {
            revision = publishNonEmpty(worksheet);
            worksheet.share(code, revision);
            worksheets.save(worksheet);
        }

        WorksheetRevision pinnedRevision = revision;
        ClassroomMember recipient = member;
        var existing = recipient == null
            ? assignments.findFirstByWorksheetRevision_IdAndUser_IdAndRevokedAtIsNullOrderByAssignedAtDesc(
                pinnedRevision.getId(), user.getId())
            : assignments.findFirstByWorksheetRevision_IdAndUser_IdAndClassroom_IdAndRevokedAtIsNullOrderByAssignedAtDesc(
                pinnedRevision.getId(), user.getId(), recipient.getClassroom().getId());
        WorksheetAssignment assignment = existing
            .orElseGet(() -> assignments.save(
                new WorksheetAssignment(UUID.randomUUID(), pinnedRevision,
                    recipient == null ? null : recipient.getClassroom(), user)));

        return JoinWorksheetResponse.from(responseMapper.toResponse(pinnedRevision), assignment.getId());
    }

    private WorksheetRevision publishNonEmpty(Worksheet worksheet) {
        WorksheetRevision revision = revisions.publish(worksheet);
        if (revisionItems.countByRevision_Id(revision.getId()) == 0) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                "A worksheet must contain at least one item before it can be shared.");
        }
        return revision;
    }

    private Worksheet requireOwned(Long worksheetId, Long userId) {
        return worksheets.findByIdAndUser_Id(worksheetId, userId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Worksheet not found."));
    }

    private String nextCode() {
        String code;
        do {
            code = codes.generate();
        } while (worksheets.existsByShareCode(code));
        return code;
    }

    private String normalize(String code) {
        if (code == null || code.isBlank()) throw codeNotFound();
        return code.strip().toUpperCase(Locale.ROOT);
    }

    private void requireRole(User user, UserRole role) {
        if (user.getRole() != role) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                "This account does not have permission for this action.");
        }
    }

    private ResponseStatusException codeNotFound() {
        return new ResponseStatusException(HttpStatus.NOT_FOUND, "Worksheet code not found.");
    }
}
