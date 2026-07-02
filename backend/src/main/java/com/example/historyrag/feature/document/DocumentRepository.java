package com.example.historyrag.feature.document;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

public interface DocumentRepository extends JpaRepository<Document, Long>, JpaSpecificationExecutor<Document> {

    Optional<Document> findByShareTokenAndShareEnabledTrue(String shareToken);

    long countByOwnerIdAndStatusNot(Long ownerId, DocumentStatus status);

    List<Document> findByFolderIdAndStatusNot(Long folderId, DocumentStatus status);

    long countByFolderIdAndStatusNot(Long folderId, DocumentStatus status);

    List<Document> findByOwnerIdOrderByCreatedAtDesc(Long ownerId);

    List<Document> findByStatus(DocumentStatus status);

    long countByStatus(DocumentStatus status);

    List<Document> findByStatusAndUpdatedAtBefore(DocumentStatus status, Instant cutoff);

    boolean existsByIdAndOwnerIdAndStatusNot(Long id, Long ownerId, DocumentStatus status);

    long countByIdInAndOwnerIdAndStatusNot(List<Long> ids, Long ownerId, DocumentStatus status);
}
