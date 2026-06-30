package com.example.historyrag.feature.document.dto;

import org.springframework.data.domain.Page;

import java.util.List;

public record DocumentPageResponse(
        List<DocumentResponse> documents,
        PageMeta pagination
) {
    public record PageMeta(
            int page,
            int limit,
            long total,
            int totalPages
    ) {}

    public static DocumentPageResponse from(Page<DocumentResponse> page) {
        PageMeta meta = new PageMeta(
                page.getNumber() + 1,
                page.getSize(),
                page.getTotalElements(),
                page.getTotalPages()
        );
        return new DocumentPageResponse(page.getContent(), meta);
    }
}
