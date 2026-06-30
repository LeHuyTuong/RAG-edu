package com.example.historyrag.feature.document;

import com.example.historyrag.shared.BaseEntity;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.*;

import java.time.Instant;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "document")
public class Document extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "document_id", nullable = false)
    private Long id;

    @Size(max = 500)
    @NotNull
    @Column(name = "title", nullable = false, length = 500)
    private String title;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "file_url", length = 2000)
    private String fileUrl;

    @Column(name = "public_id", length = 500)
    private String publicId;

    @Column(name = "size_in_bytes")
    private Long sizeInBytes;

    @Column(name = "format", length = 20)
    private String format;

    @Column(name = "resource_type", length = 20)
    private String resourceType;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private DocumentStatus status;

    @Column(name = "folder_id")
    private Long folderId;

    @NotNull
    @Column(name = "owner_id", nullable = false)
    private Long ownerId;

    @Column(name = "is_public", nullable = false)
    private Boolean isPublic;

    @Column(name = "page_count")
    private Integer pageCount;

    @Column(name = "chunk_count")
    private Integer chunkCount;

    @Column(name = "uploaded_at", updatable = false)
    private Instant uploadedAt;

    @Column(name = "subject_id")
    private Long subjectId;

    @Column(name = "review_reason", columnDefinition = "TEXT")
    private String reviewReason;

    @Column(name = "reviewed_by_id")
    private Long reviewedById;

    @Column(name = "reviewed_at")
    private Instant reviewedAt;

    @Column(name = "share_token", unique = true, length = 36)
    private String shareToken;

    @Column(name = "share_enabled", nullable = false)
    @Builder.Default
    private Boolean shareEnabled = false;
}
