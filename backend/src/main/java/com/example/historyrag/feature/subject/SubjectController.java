package com.example.historyrag.feature.subject;

import com.example.historyrag.shared.ApiResponse;
import com.example.historyrag.feature.subject.dto.CreateSubjectRequest;
import com.example.historyrag.feature.subject.dto.SubjectResponse;
import com.example.historyrag.feature.subject.dto.UpdateSubjectRequest;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.util.List;

@RestController
@RequestMapping("/api/v1/subjects")
public class SubjectController {

    private final SubjectService subjectService;

    public SubjectController(SubjectService subjectService) {
        this.subjectService = subjectService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<SubjectsListResponse>> findAll(
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "1") int page,
            @RequestParam(name = "limit", defaultValue = "20") int limit) {
        Page<SubjectResponse> pageResult = subjectService.findAll(
                search, PageRequest.of(page - 1, limit, Sort.by("name")));
        SubjectsListResponse response = new SubjectsListResponse(
                pageResult.getContent(),
                new SubjectsListResponse.PaginationMeta(
                        pageResult.getNumber() + 1,
                        pageResult.getSize(),
                        pageResult.getTotalElements(),
                        pageResult.getTotalPages()
                )
        );
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<SubjectResponse>> findById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(subjectService.findById(id)));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<SubjectResponse>> create(
            @Valid @RequestBody CreateSubjectRequest request) {
        SubjectResponse response = subjectService.create(request);
        URI location = URI.create("/api/v1/subjects/" + response.id());
        return ResponseEntity.created(location)
                .body(ApiResponse.created("Tạo môn học thành công", response));
    }

    @PatchMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<SubjectResponse>> update(
            @PathVariable Long id,
            @Valid @RequestBody UpdateSubjectRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Cập nhật môn học thành công", subjectService.update(id, request)));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        subjectService.delete(id);
        return ResponseEntity.ok(ApiResponse.success("Xóa môn học thành công", null));
    }

    public record SubjectsListResponse(
            List<SubjectResponse> subjects,
            PaginationMeta pagination
    ) {
        public record PaginationMeta(int page, int limit, long total, int totalPages) {}
    }
}
