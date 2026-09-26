package com.worksheet.minigame;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MiniGameDefinitionAssetRepository extends JpaRepository<MiniGameDefinitionAsset, Long> {
    List<MiniGameDefinitionAsset> findByDefinition_IdOrderByAssetKey(Long definitionId);
    boolean existsByAsset_Id(Long assetId);
    void deleteByDefinition_Id(Long definitionId);
}
