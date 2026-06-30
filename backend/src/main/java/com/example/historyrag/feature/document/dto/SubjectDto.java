package com.example.historyrag.feature.document.dto;

import com.example.historyrag.feature.subject.Subject;

public record SubjectDto(
        Long id,
        String name,
        String code
) {
    public static SubjectDto fromEntity(Subject subject) {
        if (subject == null) return null;
        return new SubjectDto(subject.getId(), subject.getName(), subject.getCode());
    }
}
