package com.worksheet.worksheet;

import com.worksheet.assignment.WorksheetAssignmentRepository;
import com.worksheet.auth.User;
import com.worksheet.auth.UserRepository;
import com.worksheet.worksheet.item.WorksheetItemResponse;
import com.worksheet.worksheet.item.WorksheetItemService;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import java.util.List;

@Service
public class WorksheetService {
    private final WorksheetRepository repository;
    private final WorksheetItemService itemService;
    private final UserRepository userRepository;
    private final WorksheetAssignmentRepository assignmentRepository;

    public WorksheetService(WorksheetRepository repository, WorksheetItemService itemService, UserRepository userRepository, WorksheetAssignmentRepository assignmentRepository) {
        this.repository = repository;
        this.itemService = itemService;
        this.userRepository = userRepository;
        this.assignmentRepository = assignmentRepository;
    }

    @Transactional
    public WorksheetResponse create(Long userId, CreateWorksheetRequest request) {
        String name = request.name() == null ? "" : request.name().trim();
        if(name.isEmpty()) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Worksheet name is required.");

        User user = userRepository.findById(userId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Please log in."));
        Worksheet worksheet = repository.save(new Worksheet(name, user));
        return toResponse(worksheet, List.of());
    }

    @Transactional(readOnly = true)
    public List<WorksheetResponse> getAll(Long userId) {
        return repository.findByUser_Id(userId).stream()
            .map(worksheet -> toResponse(worksheet, itemService.getAll(worksheet.getId(), userId)))
            .toList();
    }

    @Transactional(readOnly = true)
    public WorksheetResponse getById(Long id, Long userId) {
        Worksheet worksheet = requireOwned(id, userId);
        return toResponse(worksheet, itemService.getAll(id, userId));
    }

    @Transactional
    public WorksheetResponse update(Long id, Long userId, CreateWorksheetRequest request) {
        String name = request.name() == null ? "" : request.name().trim();
        if (name.isEmpty()) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Worksheet name is required.");
        Worksheet worksheet = requireOwned(id, userId);
        worksheet.setName(name);
        return toResponse(repository.save(worksheet), itemService.getAll(id, userId));
    }

    @Transactional
    public void delete(Long id, Long userId) {
        if(assignmentRepository.existsByWorksheetRevision_Worksheet_Id(id)) {
            requireOwned(id, userId);
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Assigned worksheets cannot be deleted.");
        }
        repository.delete(requireOwned(id, userId));
    }

    private Worksheet requireOwned(Long id, Long userId) {
        return repository.findByIdAndUser_Id(id, userId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Worksheet not found."));
    }

    private WorksheetResponse toResponse(Worksheet worksheet, List<WorksheetItemResponse> items) {
        return new WorksheetResponse(worksheet.getId(), worksheet.getName(), worksheet.getCreatedAt(), worksheet.getUpdatedAt(), items);
    }
}
