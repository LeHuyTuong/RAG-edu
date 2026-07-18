package com.example.historyrag.feature.folder;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.util.List;
import java.util.Optional;

public interface FolderRepository extends JpaRepository<Folder, Long>, JpaSpecificationExecutor<Folder> {

    List<Folder> findByOwnerIdOrderByCreatedAtDesc(Long ownerId);

    boolean existsByIdAndOwnerId(Long id, Long ownerId);

    long countByOwnerId(Long ownerId);

    Optional<Folder> findByShareTokenAndShareEnabledTrue(String shareToken);
}
