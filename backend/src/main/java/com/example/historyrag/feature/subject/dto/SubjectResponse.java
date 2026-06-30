package com.example.historyrag.feature.subject.dto;

import com.example.historyrag.feature.subject.Subject;

import java.time.Instant;

public record SubjectResponse(
        Long id,
        String name,
        String code,
        Instant createdAt,
        Instant updatedAt
) {
    public static SubjectResponse fromEntity(Subject subject) {
        return new SubjectResponse(
                subject.getId(),
                subject.getName(),
                subject.getCode(),
                subject.getCreatedAt(),
                subject.getUpdatedAt()
        );
    }
}
