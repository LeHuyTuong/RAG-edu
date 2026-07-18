package com.example.historyrag.feature.audit;

import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;

@Service
@RequiredArgsConstructor
public class DownloadAuditService {

    private static final Logger log = LoggerFactory.getLogger(DownloadAuditService.class);

    private final DownloadEventRepository downloadEventRepository;

    @Transactional
    public void record(Long documentId, Long userId, String downloaderEmail,
                       boolean watermarked, String ipAddress) {
        DownloadEvent event = DownloadEvent.builder()
                .documentId(documentId)
                .userId(userId)
                .downloaderEmail(downloaderEmail)
                .watermarked(watermarked)
                .ipAddress(ipAddress)
                .downloadedAt(Instant.now())
                .build();
        downloadEventRepository.save(event);
        log.debug("DownloadEvent recorded: docId={}, userId={}, watermarked={}", documentId, userId, watermarked);
    }
}
