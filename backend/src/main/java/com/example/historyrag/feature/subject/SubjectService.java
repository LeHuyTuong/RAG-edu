package com.example.historyrag.feature.subject;

import com.example.historyrag.feature.subject.dto.CreateSubjectRequest;
import com.example.historyrag.feature.subject.dto.SubjectResponse;
import com.example.historyrag.feature.subject.dto.UpdateSubjectRequest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.Optional;

public interface SubjectService {

    Page<SubjectResponse> findAll(String search, Pageable pageable);

    SubjectResponse findById(Long id);

    Optional<SubjectResponse> findOptionalById(Long id);

    long countAll();

    SubjectResponse create(CreateSubjectRequest request);

    SubjectResponse update(Long id, UpdateSubjectRequest request);

    void delete(Long id);
}
