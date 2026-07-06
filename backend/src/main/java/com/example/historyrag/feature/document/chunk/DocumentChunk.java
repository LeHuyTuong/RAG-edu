package com.example.historyrag.feature.document.chunk;

import com.example.historyrag.feature.document.Document;
import com.example.historyrag.shared.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(
        name = "document_chunk",
        uniqueConstraints = @UniqueConstraint(name = "uq_document_chunk_index", columnNames = {"document_id", "chunk_index"}))
public class DocumentChunk extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "chunk_id")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "document_id", nullable = false)
    private Document document;

    @Column(name = "source_id", nullable = false)
    private Long sourceId;

    @Column(name = "source_type", nullable = false, length = 30)
    private String sourceType;

    @Column(name = "chunk_index", nullable = false)
    private Integer chunkIndex;

    @Column(name = "qdrant_point_id", length = 120)
    private String qdrantPointId;

    @Column(name = "content_hash", length = 128)
    private String contentHash;

    @Column(name = "content_preview", columnDefinition = "TEXT")
    private String contentPreview;

    @Column(name = "token_count")
    private Integer tokenCount;

    @Column(name = "page_number")
    private Integer pageNumber;
}
