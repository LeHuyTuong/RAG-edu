package com.example.historyrag.feature.subject;

import org.springframework.data.jpa.repository.JpaRepository;

public interface SubjectRepository extends JpaRepository<Subject, Long>, org.springframework.data.jpa.repository.JpaSpecificationExecutor<Subject> {
    boolean existsByCode(String code);
}
