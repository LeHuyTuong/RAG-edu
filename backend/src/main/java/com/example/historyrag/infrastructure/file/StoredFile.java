package com.example.historyrag.infrastructure.file;

public record StoredFile(
        String storedName,
        long sizeInBytes,
        String format
) {
}
