package com.example.historyrag.feature.document;

import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.PredicateSpecification;

import java.util.ArrayList;
import java.util.List;

public class DocumentSpecification {

    private DocumentSpecification() {}

    public static PredicateSpecification<Document> build(
            String search, Long folderId, Long subjectId, DocumentStatus status, Long ownerId) {
        return (root, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (search != null && !search.isBlank()) {
                String like = "%" + search.trim() + "%";
                predicates.add(cb.like(cb.lower(root.get("title")), like.toLowerCase()));
            }

            if (folderId != null) {
                predicates.add(cb.equal(root.get("folderId"), folderId));
            }

            if (subjectId != null) {
                predicates.add(cb.equal(root.get("subjectId"), subjectId));
            }

            if (status != null) {
                predicates.add(cb.equal(root.get("status"), status));
            }

            if (ownerId != null) {
                predicates.add(cb.equal(root.get("ownerId"), ownerId));
            }

            // Only exclude SOFT_DELETED when NOT explicitly filtering for them
            if (status != DocumentStatus.SOFT_DELETED) {
                predicates.add(cb.notEqual(root.get("status"), DocumentStatus.SOFT_DELETED));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}
