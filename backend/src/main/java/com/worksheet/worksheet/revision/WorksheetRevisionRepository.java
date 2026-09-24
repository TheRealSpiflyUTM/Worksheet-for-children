package com.worksheet.worksheet.revision;

import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface WorksheetRevisionRepository extends JpaRepository<WorksheetRevision, Long> {
    Optional<WorksheetRevision> findByWorksheet_IdAndContentHash(Long worksheetId, String contentHash);
    Optional<WorksheetRevision> findFirstByWorksheet_IdOrderByRevisionNumberDesc(Long worksheetId);
}
