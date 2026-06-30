package com.example.historyrag.feature.subject;

import com.example.historyrag.exception.DuplicateResourceException;
import com.example.historyrag.exception.ResourceNotFoundException;
import com.example.historyrag.feature.subject.dto.CreateSubjectRequest;
import com.example.historyrag.feature.subject.dto.SubjectResponse;
import com.example.historyrag.feature.subject.dto.UpdateSubjectRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import jakarta.persistence.criteria.Predicate;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class SubjectServiceImpl implements SubjectService {

    private static final Logger log = LoggerFactory.getLogger(SubjectServiceImpl.class);

    private final SubjectRepository subjectRepository;

    @Override
    @Transactional(readOnly = true)
    public Page<SubjectResponse> findAll(String search, Pageable pageable) {
        if (search != null && !search.isBlank()) {
            String like = "%" + search.trim() + "%";
            return subjectRepository.findAll((root, query, cb) -> {
                Predicate nameLike = cb.like(cb.lower(root.get("name")), like.toLowerCase());
                Predicate codeLike = cb.like(cb.lower(root.get("code")), like.toLowerCase());
                return cb.or(nameLike, codeLike);
            }, pageable).map(SubjectResponse::fromEntity);
        }
        return subjectRepository.findAll(pageable)
                .map(SubjectResponse::fromEntity);
    }

    @Override
    @Transactional(readOnly = true)
    public SubjectResponse findById(Long id) {
        Subject subject = subjectRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Subject", "id", id));
        return SubjectResponse.fromEntity(subject);
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<SubjectResponse> findOptionalById(Long id) {
        return subjectRepository.findById(id).map(SubjectResponse::fromEntity);
    }

    @Override
    @Transactional(readOnly = true)
    public long countAll() {
        return subjectRepository.count();
    }

    @Override
    @Transactional
    public SubjectResponse create(CreateSubjectRequest request) {
        if (subjectRepository.existsByCode(request.code())) {
            throw new DuplicateResourceException("Subject", "code", request.code());
        }

        Subject subject = new Subject();
        subject.setName(request.name());
        subject.setCode(request.code());

        Subject saved = subjectRepository.save(subject);
        log.info("Subject created: id={}, code={}", saved.getId(), saved.getCode());
        return SubjectResponse.fromEntity(saved);
    }

    @Override
    @Transactional
    public SubjectResponse update(Long id, UpdateSubjectRequest request) {
        Subject subject = subjectRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Subject", "id", id));

        if (request.name() != null) {
            subject.setName(request.name());
        }
        if (request.code() != null) {
            if (!request.code().equals(subject.getCode()) && subjectRepository.existsByCode(request.code())) {
                throw new DuplicateResourceException("Subject", "code", request.code());
            }
            subject.setCode(request.code());
        }

        Subject saved = subjectRepository.save(subject);
        log.info("Subject updated: id={}", id);
        return SubjectResponse.fromEntity(saved);
    }

    @Override
    @Transactional
    public void delete(Long id) {
        Subject subject = subjectRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Subject", "id", id));
        subjectRepository.delete(subject);
        log.info("Subject deleted: id={}", id);
    }
}
