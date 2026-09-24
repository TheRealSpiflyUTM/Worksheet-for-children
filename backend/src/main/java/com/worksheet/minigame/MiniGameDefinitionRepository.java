package com.worksheet.minigame;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
import java.util.List;

public interface MiniGameDefinitionRepository extends JpaRepository<MiniGameDefinition, Long> {
    boolean existsByTypeIgnoreCaseAndVersion(String type, int version);
    Optional<MiniGameDefinition> findByIdAndOwner_Id(Long id, Long ownerId);
    List<MiniGameDefinition> findByActiveTrueOrderByTypeAscVersionDesc();
}
