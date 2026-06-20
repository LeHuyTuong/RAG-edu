package com.example.historyrag.feature.folder.dto;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record FolderChatRequest(
        @NotBlank(message = "Câu hỏi không được để trống")
        @Size(max = 2000, message = "Câu hỏi tối đa 2000 ký tự")
        String question,

        @Min(value = 1) @Max(value = 20)
        Integer topK,

        @DecimalMin("0.0") @DecimalMax("1.0")
        Double temperature
) {
}
