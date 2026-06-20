package com.example.historyrag.infrastructure.file;

import org.springframework.web.multipart.MultipartFile;

public interface FileStorageService {

    StoredFile store(MultipartFile file);

    void delete(String storedName);
}
