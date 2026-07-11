package com.example.historyrag.feature.document;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

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

    List<Document> findByStatusAndAiReviewStatus(DocumentStatus status, String aiReviewStatus);

    boolean existsByIdAndOwnerIdAndStatusNot(Long id, Long ownerId, DocumentStatus status);

    long countByIdInAndStatusNot(List<Long> ids, DocumentStatus status);

    long countByIdInAndOwnerIdAndStatusNot(List<Long> ids, Long ownerId, DocumentStatus status);

    @Query("SELECT COUNT(d) FROM Document d WHERE d.id IN :ids AND d.ownerId = :ownerId AND d.status <> 'SOFT_DELETED' AND d.status <> 'FAILED'")
    long countValidByIdInAndOwnerId(@Param("ids") List<Long> ids, @Param("ownerId") Long ownerId);

    @Query("SELECT COUNT(d) FROM Document d WHERE d.id IN :ids AND d.status = 'READY' AND d.chunkCount > 0")
    long countReadyForAiByIdIn(@Param("ids") List<Long> ids);

    @Query("SELECT COUNT(d) FROM Document d WHERE d.id IN :ids AND d.ownerId = :ownerId AND d.status = 'READY' AND d.chunkCount > 0")
    long countReadyForAiByIdInAndOwnerId(@Param("ids") List<Long> ids, @Param("ownerId") Long ownerId);

    Optional<Document> findFirstByContentHashAndOwnerIdNotAndStatusNot(String contentHash, Long ownerId, DocumentStatus status);
}
