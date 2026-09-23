package com.worksheet.worksheet.result;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface WorksheetResultRepository extends JpaRepository<WorksheetResult, Long> {
    List<WorksheetResult> findByWorksheet_IdOrderByCompletedAtDesc(Long worksheetId);
}