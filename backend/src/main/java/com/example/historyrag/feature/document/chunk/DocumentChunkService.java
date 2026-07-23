package com.example.historyrag.feature.document.chunk;

import java.util.List;

public interface DocumentChunkService {
    void deleteByDocumentId(Long documentId);
    List<DocumentChunk> findByDocumentIdOrderByChunkIndexAsc(Long documentId);
    void saveAll(Iterable<DocumentChunk> chunks);
}
