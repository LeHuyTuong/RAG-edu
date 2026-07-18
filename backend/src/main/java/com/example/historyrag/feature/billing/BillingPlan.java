package com.example.historyrag.feature.billing;

import com.example.historyrag.shared.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "billing_plan")
public class BillingPlan extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "plan_id")
    private Long id;

    @Column(name = "code", nullable = false, unique = true, length = 50)
    private String code;

    @Column(name = "name", nullable = false, length = 120)
    private String name;

    @Column(name = "description", length = 500)
    private String description;

    @Column(name = "price_vnd", nullable = false)
    private Integer priceVnd;

    @Column(name = "billing_cycle", nullable = false, length = 20)
    private String billingCycle;

    @Column(name = "chat_credits_per_month", nullable = false)
    private Integer chatCreditsPerMonth;

    @Column(name = "document_quota", nullable = false)
    private Integer documentQuota;

    @Column(name = "storage_mb", nullable = false)
    private Integer storageMb;

    @Column(name = "max_file_size_mb", nullable = false)
    private Integer maxFileSizeMb;

    @Column(name = "display_order", nullable = false)
    private Integer displayOrder;

    @Column(name = "active", nullable = false)
    private Boolean active;
}
