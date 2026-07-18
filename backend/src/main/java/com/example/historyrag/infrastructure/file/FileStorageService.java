package com.example.historyrag.infrastructure.file;

import org.springframework.web.multipart.MultipartFile;

public interface FileStorageService {

    StoredFile store(MultipartFile file);

    String resolveInternalPath(String storedName);

    void delete(String storedName);
}
