package com.example.historyrag.feature.audit;

import org.springframework.data.jpa.repository.JpaRepository;

public interface DownloadEventRepository extends JpaRepository<DownloadEvent, Long> {
}
