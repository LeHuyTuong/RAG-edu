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

    private final BillingPlanService planService;
    private final UserSubscriptionService subscriptionService;
    private final UsagePeriodService usagePeriodService;
    private final UsageEventService usageEventService;

    public BillingServiceImpl(
            BillingPlanService planService,
            UserSubscriptionService subscriptionService,
            UsagePeriodService usagePeriodService,
            UsageEventService usageEventService) {
        this.planService = planService;
        this.subscriptionService = subscriptionService;
        this.usagePeriodService = usagePeriodService;
        this.usageEventService = usageEventService;
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
        BillingPlan plan = planService.findByCodeAndActiveTrue(planCode)
                .orElseThrow(() -> new ResourceNotFoundException("BillingPlan", "code", planCode));

        Instant now = Instant.now();
        List<UserSubscription> activeSubscriptions = subscriptionService.findByUserIdAndStatus(userId, BillingConstants.STATUS_ACTIVE);
        for (UserSubscription subscription : activeSubscriptions) {
            subscription.setStatus(BillingConstants.STATUS_CANCELLED);
        }
        if (!activeSubscriptions.isEmpty()) {
            subscriptionService.saveAll(activeSubscriptions);
        }

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
        subscription = subscriptionService.save(subscription);

        UsagePeriod usage = createUsagePeriod(userId, subscription);
        return toSummary(subscription, usage);
    }

    @Override
    @Transactional
    public void consumeChatCredit(Long userId, String description) {
        UserSubscription subscription = getOrCreateActiveSubscription(userId);
        UsagePeriod usage = getOrCreateCurrentUsageForUpdate(userId, subscription);

        if (usage.getChatUsed() >= usage.getChatLimit()) {
            throw new QuotaExceededException("Bạn đã dùng hết lượt hỏi AI của gói hiện tại. Vui lòng mua hoặc nâng cấp gói.");
        }

        usage.setChatUsed(usage.getChatUsed() + 1);
        usagePeriodService.save(usage);

        UsageEvent event = new UsageEvent();
        event.setUserId(userId);
        event.setUsagePeriod(usage);
        event.setEventType(BillingConstants.CHAT_EVENT_TYPE);
        event.setAmount(1);
        event.setDescription(description);
        usageEventService.save(event);
    }

    @Override
    @Transactional
    public void consumeDocumentQuota(Long userId, String description, long sizeInBytes) {
        UserSubscription subscription = getOrCreateActiveSubscription(userId);
        UsagePeriod usage = getOrCreateCurrentUsageForUpdate(userId, subscription);

        if (usage.getDocumentUsed() >= usage.getDocumentLimit()) {
            throw new QuotaExceededException("Bạn đã tải lên tối đa số lượng tài liệu của gói hiện tại. Vui lòng nâng cấp gói.");
        }

        int fileSizeMb = Math.max(1, (int) Math.ceil(sizeInBytes / 1048576.0));
        
        if (usage.getStorageMbUsed() + fileSizeMb > usage.getStorageMbLimit()) {
            throw new QuotaExceededException("Bạn đã dùng hết dung lượng lưu trữ của gói hiện tại. Vui lòng nâng cấp gói.");
        }

        usage.setDocumentUsed(usage.getDocumentUsed() + 1);
        usage.setStorageMbUsed(usage.getStorageMbUsed() + fileSizeMb);
        usagePeriodService.save(usage);

        UsageEvent event = new UsageEvent();
        event.setUserId(userId);
        event.setUsagePeriod(usage);
        event.setEventType("DOCUMENT_UPLOAD");
        event.setAmount(fileSizeMb);
        event.setDescription(description);
        usageEventService.save(event);
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
        return subscriptionService
                .findActiveSubscription(userId, now)
                .orElseGet(() -> createFreeSubscription(userId));
    }

    private UserSubscription createFreeSubscription(Long userId) {
        BillingPlan freePlan = planService.findByCodeAndActiveTrue(BillingConstants.FREE_PLAN_CODE)
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
        return subscriptionService.save(subscription);
    }

    private UsagePeriod getOrCreateCurrentUsage(Long userId, UserSubscription subscription) {
        Instant now = Instant.now();
        return usagePeriodService
                .findCurrentUsage(userId, now, now)
                .orElseGet(() -> createUsagePeriod(userId, subscription));
    }

    // Dùng riêng cho consumeChatCredit/consumeDocumentQuota: khóa SELECT ... FOR UPDATE ở
    // tầng DB nên request thứ 2 phải đợi transaction của request thứ 1 commit xong mới được
    // đọc, đóng được race condition kiểu "đọc số đếm cũ rồi cùng tăng" khi nhiều request tới
    // gần như đồng thời lúc quota sắp cạn.
    private UsagePeriod getOrCreateCurrentUsageForUpdate(Long userId, UserSubscription subscription) {
        Instant now = Instant.now();
        List<UsagePeriod> locked = usagePeriodService.lockCurrentUsageForUpdate(userId, now);
        if (!locked.isEmpty()) {
            return locked.get(0);
        }
        return createUsagePeriod(userId, subscription);
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
        return usagePeriodService.save(usage);
    }

    private BillingSummaryResponse toSummary(UserSubscription subscription, UsagePeriod usage) {
        return new BillingSummaryResponse(
                toSubscriptionResponse(subscription),
                toUsageResponse(usage),
                planService.findByActiveTrueOrderByDisplayOrderAsc()
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
