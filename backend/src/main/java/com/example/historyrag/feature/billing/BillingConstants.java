package com.example.historyrag.feature.billing;

import java.time.temporal.ChronoUnit;
import java.util.Set;

public final class BillingConstants {

    public static final String STATUS_ACTIVE = "ACTIVE";
    public static final String STATUS_CANCELLED = "CANCELLED";
    public static final String STATUS_REFUNDED = "REFUNDED";
    public static final String FREE_PLAN_CODE = "FREE";
    public static final String CHAT_EVENT_TYPE = "AI_CHAT";
    public static final String DEFAULT_BILLING_CYCLE = "MONTHLY";
    public static final String DEMO_PAYMENT_PREFIX = "DEMO-";
    public static final String AUTO_FREE_PAYMENT_REFERENCE = "AUTO-FREE";
    public static final long SUBSCRIPTION_PERIOD_AMOUNT = 30;
    public static final ChronoUnit SUBSCRIPTION_PERIOD_UNIT = ChronoUnit.DAYS;
    public static final Set<String> SUPPORTED_BILLING_CYCLES = Set.of("MONTHLY", "YEARLY");

    private BillingConstants() {
    }
}
