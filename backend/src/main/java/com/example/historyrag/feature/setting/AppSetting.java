package com.example.historyrag.feature.setting;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "setting")
public class AppSetting {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "setting_id")
    private Integer id;

    @Column(name = "allowed_types", nullable = false)
    private String allowedTypes;

    @Column(name = "max_size_mb", nullable = false)
    private Integer maxSizeMb;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @PrePersist
    @PreUpdate
    void stamp() {
        this.updatedAt = Instant.now();
    }
}
