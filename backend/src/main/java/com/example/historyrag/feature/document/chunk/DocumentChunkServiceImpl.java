package com.example.historyrag.feature.document.chunk;

import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class DocumentChunkServiceImpl implements DocumentChunkService {

    private final DocumentChunkRepository repository;

    @Override
    @Transactional
    public void deleteByDocumentId(Long documentId) {
        repository.deleteByDocumentId(documentId);
    }

    @Override
    @Transactional(readOnly = true)
    public List<DocumentChunk> findByDocumentIdOrderByChunkIndexAsc(Long documentId) {
        return repository.findByDocumentIdOrderByChunkIndexAsc(documentId);
    }

    @Override
    @Transactional
    public void saveAll(Iterable<DocumentChunk> chunks) {
        repository.saveAll(chunks);
    }
}
