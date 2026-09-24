package com.worksheet.minigame.asset;

import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MiniGameAssetRepository extends JpaRepository<MiniGameAsset, Long> {
    Optional<MiniGameAsset> findByIdAndOwner_Id(Long id, Long ownerId);
    Optional<MiniGameAsset> findByIdAndStatus(Long id, MiniGameAssetStatus status);
}
