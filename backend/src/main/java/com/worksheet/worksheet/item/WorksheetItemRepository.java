package com.worksheet.worksheet.item;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface WorksheetItemRepository extends JpaRepository<WorksheetItem, Long> {
    List<WorksheetItem> findByWorksheet_IdOrderByOrderIndex(Long worksheetId);
}