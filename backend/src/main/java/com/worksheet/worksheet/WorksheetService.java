package com.worksheet.worksheet;

import com.worksheet.auth.User;
import com.worksheet.auth.UserRepository;
import com.worksheet.worksheet.item.WorksheetItemResponse;
import com.worksheet.worksheet.item.WorksheetItemService;
import com.worksheet.worksheet.revision.WorksheetRevisionRepository;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class WorksheetService {
    private final WorksheetRepository worksheets;
    private final WorksheetItemService items;
    private final UserRepository users;
    private final WorksheetRevisionRepository revisions;

    public WorksheetService(WorksheetRepository worksheets, WorksheetItemService items,
                            UserRepository users, WorksheetRevisionRepository revisions) {
        this.worksheets = worksheets;
        this.items = items;
        this.users = users;
        this.revisions = revisions;
    }

    @Transactional
    public WorksheetResponse create(Long userId, CreateWorksheetRequest request) {
        String name = requireName(request.name());
        User user = users.findById(userId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Please log in."));
        return toResponse(worksheets.save(new Worksheet(name, user)), List.of());
    }

    @Transactional(readOnly = true)
    public List<WorksheetResponse> getAll(Long userId) {
        return worksheets.findByUser_Id(userId).stream()
            .map(worksheet -> toResponse(worksheet, items.getAll(worksheet.getId(), userId)))
            .toList();
    }

    @Transactional(readOnly = true)
    public WorksheetResponse getById(Long id, Long userId) {
        Worksheet worksheet = requireOwned(id, userId);
        return toResponse(worksheet, items.getAll(id, userId));
    }

    @Transactional
    public WorksheetResponse update(Long id, Long userId, CreateWorksheetRequest request) {
        Worksheet worksheet = requireOwned(id, userId);
        worksheet.setName(requireName(request.name()));
        return toResponse(worksheets.save(worksheet), items.getAll(id, userId));
    }

    @Transactional
    public void delete(Long id, Long userId) {
        Worksheet worksheet = requireOwned(id, userId);
        if (revisions.existsByWorksheet_Id(id)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                "Published worksheets cannot be deleted.");
        }
        worksheets.delete(worksheet);
    }

    private Worksheet requireOwned(Long id, Long userId) {
        return worksheets.findByIdAndUser_Id(id, userId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Worksheet not found."));
    }

    private String requireName(String value) {
        String name = value == null ? "" : value.strip();
        if (name.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Worksheet name is required.");
        }
        if (name.length() > 150) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                "Worksheet name must contain at most 150 characters.");
        }
        return name;
    }

    private WorksheetResponse toResponse(Worksheet worksheet, List<WorksheetItemResponse> items) {
        return new WorksheetResponse(worksheet.getId(), worksheet.getName(), worksheet.getCreatedAt(),
            worksheet.getUpdatedAt(), items);
    }
}
