package com.example.historyrag.feature.document;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

import java.time.Instant;
import java.util.List;

public interface DocumentRepository extends JpaRepository<Document, Long>, JpaSpecificationExecutor<Document> {

    long countByOwnerIdAndStatusNot(Long ownerId, DocumentStatus status);

    List<Document> findByFolderIdAndStatusNot(Long folderId, DocumentStatus status);

    long countByFolderIdAndStatusNot(Long folderId, DocumentStatus status);

    List<Document> findByOwnerIdOrderByCreatedAtDesc(Long ownerId);

    long countByStatus(DocumentStatus status);

    List<Document> findByStatusAndUpdatedAtBefore(DocumentStatus status, Instant cutoff);
}
