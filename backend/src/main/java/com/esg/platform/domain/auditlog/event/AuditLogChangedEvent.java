package com.esg.platform.domain.auditlog.event;

import java.time.OffsetDateTime;

public record AuditLogChangedEvent(
        Long companyId,
        Long metricId,
        String action,
        String period,
        String category,
        Long facilityId,
        OffsetDateTime occurredAt) {

    public AuditLogChangedEvent(
            Long companyId,
            Long metricId,
            String action,
            String period,
            String category,
            Long facilityId) {
        this(companyId, metricId, action, period, category, facilityId, OffsetDateTime.now());
    }
}
