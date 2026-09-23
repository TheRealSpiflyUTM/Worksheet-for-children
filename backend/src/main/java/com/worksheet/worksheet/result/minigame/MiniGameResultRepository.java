package com.worksheet.worksheet.result.minigame;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface MiniGameResultRepository extends JpaRepository<MiniGameResult, Long> {
    List<MiniGameResult> findByWorksheetResult_IdOrderByWorksheetItem_OrderIndex(Long worksheetResultId);
}