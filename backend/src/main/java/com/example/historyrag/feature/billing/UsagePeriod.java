package com.example.historyrag.feature.billing;

import com.example.historyrag.shared.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.Instant;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "usage_period")
public class UsagePeriod extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "usage_period_id")
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "subscription_id")
    private UserSubscription subscription;

    @Column(name = "period_start", nullable = false)
    private Instant periodStart;

    @Column(name = "period_end", nullable = false)
    private Instant periodEnd;

    @Column(name = "chat_limit", nullable = false)
    private Integer chatLimit;

    @Column(name = "chat_used", nullable = false)
    private Integer chatUsed;

    @Column(name = "document_limit", nullable = false)
    private Integer documentLimit;

    @Column(name = "document_used", nullable = false)
    private Integer documentUsed;

    @Column(name = "storage_mb_limit", nullable = false)
    private Integer storageMbLimit;

    @Column(name = "storage_mb_used", nullable = false)
    private Integer storageMbUsed;
}
