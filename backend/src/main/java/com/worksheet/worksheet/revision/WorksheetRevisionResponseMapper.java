package com.worksheet.worksheet.revision;

import com.worksheet.worksheet.Worksheet;
import com.worksheet.worksheet.WorksheetResponse;
import com.worksheet.worksheet.item.WorksheetItemResponse;
import java.util.List;
import org.springframework.stereotype.Component;

@Component
public class WorksheetRevisionResponseMapper {
    private final WorksheetRevisionItemRepository revisionItems;

    public WorksheetRevisionResponseMapper(WorksheetRevisionItemRepository revisionItems) {
        this.revisionItems = revisionItems;
    }

    public WorksheetResponse toResponse(WorksheetRevision revision) {
        Worksheet worksheet = revision.getWorksheet();
        List<WorksheetItemResponse> items = revisionItems
            .findByRevision_IdOrderByOrderIndex(revision.getId()).stream()
            .map(item -> new WorksheetItemResponse(item.getId(), worksheet.getId(),
                item.getMiniGameDefinition().getId(), item.getOrderIndex(), item.getConfiguration()))
            .toList();

        return new WorksheetResponse(worksheet.getId(), revision.getNameSnapshot(),
            worksheet.getCreatedAt(), revision.getPublishedAt(), items);
    }
}
