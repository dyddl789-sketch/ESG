package com.esg.platform.domain.integration.dto;

public record ReflectionResponse(
        String domain,
        String basePeriod,
        Long facilityId,
        int reflectedMetricCount,
        String reflectionStatus,
        String approvalStatus
) {
}
