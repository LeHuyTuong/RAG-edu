package com.example.historyrag.feature.audit;

import com.example.historyrag.shared.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "document_download")
public class DownloadEvent extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "download_id", nullable = false)
    private Long id;

    @Column(name = "document_id", nullable = false)
    private Long documentId;

    @Column(name = "user_id")
    private Long userId;

    @Column(name = "downloader_email", length = 255)
    private String downloaderEmail;

    @Column(name = "watermarked", nullable = false)
    private Boolean watermarked;

    @Column(name = "ip_address", length = 45)
    private String ipAddress;

    @Column(name = "downloaded_at", nullable = false)
    private Instant downloadedAt;
}
