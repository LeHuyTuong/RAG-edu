package com.example.historyrag.infrastructure.file;

import com.example.historyrag.exception.InvalidRequestException;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.UUID;

@Service
public class LocalFileStorageService implements FileStorageService {

    private final Path root;

    public LocalFileStorageService(@Value("${app.upload.base-path:./uploads}") String basePath) {
        this.root = Paths.get(basePath).toAbsolutePath().normalize();
    }

    @PostConstruct
    void init() throws IOException {
        Files.createDirectories(root);
    }

    @Override
    public StoredFile store(MultipartFile file) {
        String originalFilename = file.getOriginalFilename();
        String ext = extractExtension(originalFilename);
        String storedName = UUID.randomUUID() + "." + ext;
        Path target = root.resolve(storedName);
        try {
            Files.copy(file.getInputStream(), target, StandardCopyOption.REPLACE_EXISTING);
        } catch (IOException e) {
            throw new InvalidRequestException("Không thể lưu file: " + e.getMessage());
        }
        return new StoredFile(storedName, file.getSize(), ext);
    }

    @Override
    public void delete(String storedName) {
        if (storedName == null || storedName.isBlank()) return;
        try {
            Files.deleteIfExists(root.resolve(storedName));
        } catch (IOException ignored) {
        }
    }

    private String extractExtension(String filename) {
        if (filename == null || !filename.contains(".")) return "bin";
        return filename.substring(filename.lastIndexOf('.') + 1).toLowerCase();
    }
}
