package com.example.historyrag.feature.document.dto;

public record DocumentDownload(
        byte[] content,
        String filename,
        String contentType,
        boolean watermarked
) {
}
