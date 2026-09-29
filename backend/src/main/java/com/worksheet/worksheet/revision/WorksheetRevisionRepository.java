package com.worksheet.worksheet.revision;

import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface WorksheetRevisionRepository extends JpaRepository<WorksheetRevision, Long> {
    boolean existsByWorksheet_Id(Long worksheetId);
    Optional<WorksheetRevision> findByWorksheet_IdAndContentHash(Long worksheetId, String contentHash);
    Optional<WorksheetRevision> findFirstByWorksheet_IdOrderByRevisionNumberDesc(Long worksheetId);
}
