package com.esg.platform.domain.auditlog.dto;

import java.util.List;

public record AuditLogPageResponse(
        List<AuditLogResponse> content,
        int page,
        int size,
        long totalElements,
        int totalPages
) {
}
