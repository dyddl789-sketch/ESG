package com.esg.platform.domain.auditlog.dto;

public record AuditLogResponse(
        Long id,
        String at,
        String reporter,
        String approver,
        String action,
        String actionCode,
        Long facilityId,
        String facility,
        Long indicatorId,
        String target,
        String detail
) {
}
