package com.example.historyrag.feature.document;

import java.util.concurrent.ConcurrentHashMap;
import org.springframework.stereotype.Component;

/**
 * Khóa theo content_hash dùng chung giữa DocumentServiceImpl và DocumentIngestListener —
 * cả 2 class đều có thể ingest tài liệu và kiểm tra trùng nội dung (content_hash chỉ có
 * INDEX thường, không có UNIQUE constraint), nên phải dùng chung 1 registry để đảm bảo
 * 2 tài liệu cùng hash được ingest gần như đồng thời không thể cùng SELECT "không thấy
 * nhau" rồi cùng lọt qua bước gắn cờ DANGER, bất kể tài liệu đó được xử lý bởi class nào.
 */
@Component
public class ContentHashLockRegistry {

    private final ConcurrentHashMap<String, Object> locks = new ConcurrentHashMap<>();

    public Object acquire(String contentHash) {
        return locks.computeIfAbsent(contentHash, k -> new Object());
    }

    public void release(String contentHash, Object lock) {
        locks.remove(contentHash, lock);
    }
}
