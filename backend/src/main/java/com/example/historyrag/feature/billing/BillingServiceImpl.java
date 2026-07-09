package com.example.historyrag.feature.billing;

import com.example.historyrag.exception.QuotaExceededException;
import com.example.historyrag.exception.ResourceNotFoundException;
import com.example.historyrag.feature.billing.dto.BillingPlanResponse;
import com.example.historyrag.feature.billing.dto.BillingSummaryResponse;
import com.example.historyrag.feature.billing.dto.SubscriptionResponse;
import com.example.historyrag.feature.billing.dto.UsageQuotaResponse;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class BillingServiceImpl implements BillingService {

    private final BillingPlanRepository planRepository;
    private final UserSubscriptionRepository subscriptionRepository;
    private final UsagePeriodRepository usagePeriodRepository;
    private final UsageEventRepository usageEventRepository;

    public BillingServiceImpl(
            BillingPlanRepository planRepository,
            UserSubscriptionRepository subscriptionRepository,
            UsagePeriodRepository usagePeriodRepository,
            UsageEventRepository usageEventRepository) {
        this.planRepository = planRepository;
        this.subscriptionRepository = subscriptionRepository;
        this.usagePeriodRepository = usagePeriodRepository;
        this.usageEventRepository = usageEventRepository;
    }

    @Override
    @Transactional
    public BillingSummaryResponse getSummary(Long userId) {
        UserSubscription subscription = getOrCreateActiveSubscription(userId);
        UsagePeriod usage = getOrCreateCurrentUsage(userId, subscription);
        return toSummary(subscription, usage);
    }

    @Override
    @Transactional
    public BillingSummaryResponse demoPurchase(Long userId, String planCode) {
        BillingPlan plan = planRepository.findByCodeAndActiveTrue(planCode)
                .orElseThrow(() -> new ResourceNotFoundException("BillingPlan", "code", planCode));

        Instant now = Instant.now();
        subscriptionRepository.findByUserIdAndStatus(userId, BillingConstants.STATUS_ACTIVE)
                .forEach(subscription -> {
                    subscription.setStatus(BillingConstants.STATUS_CANCELLED);
                    subscriptionRepository.save(subscription);
                });

        UserSubscription subscription = new UserSubscription();
        subscription.setUserId(userId);
        subscription.setPlan(plan);
        subscription.setStatus(BillingConstants.STATUS_ACTIVE);
        subscription.setStartedAt(now);
        subscription.setCurrentPeriodStart(now);
        subscription.setCurrentPeriodEnd(now.plus(
                BillingConstants.SUBSCRIPTION_PERIOD_AMOUNT,
                BillingConstants.SUBSCRIPTION_PERIOD_UNIT));
        subscription.setDemoPaymentReference(BillingConstants.DEMO_PAYMENT_PREFIX + UUID.randomUUID());
        subscription = subscriptionRepository.save(subscription);

        UsagePeriod usage = createUsagePeriod(userId, subscription);
        return toSummary(subscription, usage);
    }

    @Override
    @Transactional
    public void consumeChatCredit(Long userId, String description) {
        UserSubscription subscription = getOrCreateActiveSubscription(userId);
        UsagePeriod usage = getOrCreateCurrentUsage(userId, subscription);

        if (usage.getChatUsed() >= usage.getChatLimit()) {
            throw new QuotaExceededException("Bạn đã dùng hết lượt hỏi AI của gói hiện tại. Vui lòng mua hoặc nâng cấp gói.");
        }

        usage.setChatUsed(usage.getChatUsed() + 1);
        usagePeriodRepository.save(usage);

        UsageEvent event = new UsageEvent();
        event.setUserId(userId);
        event.setUsagePeriod(usage);
        event.setEventType(BillingConstants.CHAT_EVENT_TYPE);
        event.setAmount(1);
        event.setDescription(description);
        usageEventRepository.save(event);
    }

    @Override
    public List<String> getFlowSteps() {
        return List.of(
                "User mở trang Billing",
                "Frontend gọi GET /api/v1/billing/summary",
                "BillingController lấy userId từ JWT",
                "BillingService đọc active subscription và usage period",
                "User chọn gói và xác nhận demo payment",
                "Frontend gọi POST /api/v1/billing/demo-purchase",
                "BillingService hủy subscription cũ, tạo subscription mới và reset quota tháng",
                "Khi user gọi AI chat, RagController gọi BillingService.consumeChatCredit",
                "BillingService kiểm tra quota, ghi usage_event, rồi cho request đi tiếp sang RAG service"
        );
    }

    private UserSubscription getOrCreateActiveSubscription(Long userId) {
        Instant now = Instant.now();
        return subscriptionRepository
                .findFirstByUserIdAndStatusAndCurrentPeriodEndAfterOrderByCreatedAtDesc(
                        userId, BillingConstants.STATUS_ACTIVE, now)
                .orElseGet(() -> createFreeSubscription(userId));
    }

    private UserSubscription createFreeSubscription(Long userId) {
        BillingPlan freePlan = planRepository.findByCodeAndActiveTrue(BillingConstants.FREE_PLAN_CODE)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "BillingPlan", "code", BillingConstants.FREE_PLAN_CODE));
        Instant now = Instant.now();
        UserSubscription subscription = new UserSubscription();
        subscription.setUserId(userId);
        subscription.setPlan(freePlan);
        subscription.setStatus(BillingConstants.STATUS_ACTIVE);
        subscription.setStartedAt(now);
        subscription.setCurrentPeriodStart(now);
        subscription.setCurrentPeriodEnd(now.plus(
                BillingConstants.SUBSCRIPTION_PERIOD_AMOUNT,
                BillingConstants.SUBSCRIPTION_PERIOD_UNIT));
        subscription.setDemoPaymentReference(BillingConstants.AUTO_FREE_PAYMENT_REFERENCE);
        return subscriptionRepository.save(subscription);
    }

    private UsagePeriod getOrCreateCurrentUsage(Long userId, UserSubscription subscription) {
        Instant now = Instant.now();
        return usagePeriodRepository
                .findFirstByUserIdAndPeriodStartLessThanEqualAndPeriodEndAfterOrderByCreatedAtDesc(userId, now, now)
                .orElseGet(() -> createUsagePeriod(userId, subscription));
    }

    private UsagePeriod createUsagePeriod(Long userId, UserSubscription subscription) {
        BillingPlan plan = subscription.getPlan();
        UsagePeriod usage = new UsagePeriod();
        usage.setUserId(userId);
        usage.setSubscription(subscription);
        usage.setPeriodStart(subscription.getCurrentPeriodStart());
        usage.setPeriodEnd(subscription.getCurrentPeriodEnd());
        usage.setChatLimit(plan.getChatCreditsPerMonth());
        usage.setChatUsed(0);
        usage.setDocumentLimit(plan.getDocumentQuota());
        usage.setDocumentUsed(0);
        usage.setStorageMbLimit(plan.getStorageMb());
        usage.setStorageMbUsed(0);
        return usagePeriodRepository.save(usage);
    }

    private BillingSummaryResponse toSummary(UserSubscription subscription, UsagePeriod usage) {
        return new BillingSummaryResponse(
                toSubscriptionResponse(subscription),
                toUsageResponse(usage),
                planRepository.findByActiveTrueOrderByDisplayOrderAsc()
                        .stream()
                        .map(this::toPlanResponse)
                        .toList());
    }

    private SubscriptionResponse toSubscriptionResponse(UserSubscription subscription) {
        return new SubscriptionResponse(
                subscription.getId(),
                subscription.getStatus(),
                subscription.getCurrentPeriodStart(),
                subscription.getCurrentPeriodEnd(),
                toPlanResponse(subscription.getPlan()));
    }

    private UsageQuotaResponse toUsageResponse(UsagePeriod usage) {
        return new UsageQuotaResponse(
                usage.getPeriodStart(),
                usage.getPeriodEnd(),
                usage.getChatLimit(),
                usage.getChatUsed(),
                Math.max(usage.getChatLimit() - usage.getChatUsed(), 0),
                usage.getDocumentLimit(),
                usage.getDocumentUsed(),
                Math.max(usage.getDocumentLimit() - usage.getDocumentUsed(), 0),
                usage.getStorageMbLimit(),
                usage.getStorageMbUsed(),
                Math.max(usage.getStorageMbLimit() - usage.getStorageMbUsed(), 0));
    }

    private BillingPlanResponse toPlanResponse(BillingPlan plan) {
        return new BillingPlanResponse(
                plan.getId(),
                plan.getCode(),
                plan.getName(),
                plan.getDescription(),
                plan.getPriceVnd(),
                plan.getBillingCycle(),
                plan.getChatCreditsPerMonth(),
                plan.getDocumentQuota(),
                plan.getStorageMb(),
                plan.getMaxFileSizeMb(),
                plan.getActive());
    }
}
