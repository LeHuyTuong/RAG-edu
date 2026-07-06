package com.example.historyrag.infrastructure.file;

import com.example.historyrag.exception.InvalidRequestException;
import com.example.historyrag.feature.setting.SettingService;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.ByteArrayInputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Arrays;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class LocalFileStorageService implements FileStorageService {

    private final Path root;
    private final Path internalRoot;
    private final SettingService settingService;
    private final PdfWatermarkService pdfWatermarkService;

    public LocalFileStorageService(
            @Value("${app.upload.base-path:./uploads}") String basePath,
            @Value("${app.upload.internal-base-path:./uploads}") String internalBasePath,
            SettingService settingService,
            PdfWatermarkService pdfWatermarkService) {
        this.root = Paths.get(basePath).toAbsolutePath().normalize();
        this.internalRoot = Paths.get(internalBasePath).toAbsolutePath().normalize();
        this.settingService = settingService;
        this.pdfWatermarkService = pdfWatermarkService;
    }

    @PostConstruct
    void init() throws IOException {
        Files.createDirectories(root);
    }

    @Override
    public StoredFile store(MultipartFile file) {
        var config = settingService.getConfig();
        int maxSizeMb;
        try {
            maxSizeMb = Integer.parseInt(config.maxSizeMb());
        } catch (NumberFormatException e) {
            maxSizeMb = 20;
        }
        long maxSizeBytes = (long) maxSizeMb * 1024 * 1024;

        if (file.getSize() > maxSizeBytes) {
            throw new InvalidRequestException(
                    "File vượt quá dung lượng cho phép (" + maxSizeMb + " MB). Kích thước file: " +
                            (file.getSize() / (1024 * 1024)) + " MB");
        }

        String originalFilename = file.getOriginalFilename();
        String ext = extractExtension(originalFilename);

        Set<String> allowed = Arrays.stream(config.allowedTypes().split(","))
                .map(String::trim)
                .map(String::toLowerCase)
                .collect(Collectors.toSet());
        if (!allowed.contains(ext)) {
            throw new InvalidRequestException(
                    "Định dạng file không được hỗ trợ: ." + ext + ". Các định dạng được phép: " + config.allowedTypes());
        }

        byte[] bytes;
        try {
            bytes = file.getBytes();
        } catch (IOException e) {
            throw new InvalidRequestException("Không thể đọc file upload: " + e.getMessage());
        }

        if ("pdf".equals(ext) && pdfWatermarkService.hasPublicDownloadWatermark(bytes)) {
            throw new InvalidRequestException(
                    "Tài liệu này là bản tải xuống có watermark từ thư viện public, không thể upload lại làm tài liệu riêng.");
        }

        String storedName = UUID.randomUUID() + "." + ext;
        Path target = root.resolve(storedName);
        try {
            Files.copy(new ByteArrayInputStream(bytes), target, StandardCopyOption.REPLACE_EXISTING);
        } catch (IOException e) {
            throw new InvalidRequestException("Không thể lưu file: " + e.getMessage());
        }
        return new StoredFile(storedName, file.getSize(), ext);
    }

    @Override
    public String resolveInternalPath(String storedName) {
        if (storedName == null || storedName.isBlank()) {
            throw new InvalidRequestException("Tên file lưu trữ không hợp lệ");
        }
        Path target = internalRoot.resolve(storedName).normalize();
        if (!target.startsWith(internalRoot)) {
            throw new InvalidRequestException("Tên file lưu trữ không hợp lệ");
        }
        return target.toString();
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
