package com.esg.platform.domain.auditlog.service;

import java.time.LocalDate;
import java.util.Locale;
import java.util.Set;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import com.esg.platform.domain.auditlog.dto.AuditLogPageResponse;
import com.esg.platform.domain.auditlog.mapper.AuditLogMapper;
import com.esg.platform.global.exception.BusinessException;
import com.esg.platform.global.exception.ErrorCode;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Service
@Transactional(readOnly = true)
public class AuditLogService {

    private static final Logger log = LoggerFactory.getLogger(AuditLogService.class);

    private static final int DEFAULT_PAGE_SIZE = 50;
    private static final Set<Integer> ALLOWED_PAGE_SIZES = Set.of(20, 50, 100);
    private static final Set<String> ALLOWED_ACTION_CODES = Set.of(
            "DATA_CREATED",
            "DATA_UPDATED",
            "APPROVAL_REQUESTED",
            "APPROVAL_CANCELED",
            "FINAL_APPROVED",
            "REJECTED",
            "DELETED");

    private final AuditLogMapper auditLogMapper;

    public AuditLogService(AuditLogMapper auditLogMapper) {
        this.auditLogMapper = auditLogMapper;
    }

    public AuditLogPageResponse getAuditLogs(
            int requestedPage,
            int requestedSize,
            Long facilityId,
            Long indicatorId,
            String requestedActionCode,
            LocalDate fromDate,
            LocalDate toDate) {

        int page = Math.max(requestedPage, 0);
        int size = ALLOWED_PAGE_SIZES.contains(requestedSize) ? requestedSize : DEFAULT_PAGE_SIZE;
        String actionCode = normalizeActionCode(requestedActionCode);

        if (fromDate != null && toDate != null && fromDate.isAfter(toDate)) {
            throw new BusinessException(ErrorCode.INVALID_INPUT, "조회 시작일은 종료일보다 늦을 수 없습니다.");
        }

        long totalElements = auditLogMapper.countAuditLogs(
                facilityId,
                indicatorId,
                actionCode,
                fromDate,
                toDate);
        int totalPages = totalElements == 0 ? 0 : (int) Math.ceil((double) totalElements / size);
        int offset = page * size;

        var content = auditLogMapper.findAuditLogs(
                facilityId,
                indicatorId,
                actionCode,
                fromDate,
                toDate,
                size,
                offset);

        log.debug(
                "[AUDIT] 감사 로그 조회 page={} size={} facilityId={} indicatorId={} action={} fromDate={} toDate={} resultCount={} total={}",
                page,
                size,
                facilityId,
                indicatorId,
                actionCode,
                fromDate,
                toDate,
                content.size(),
                totalElements);

        return new AuditLogPageResponse(content, page, size, totalElements, totalPages);
    }

    private String normalizeActionCode(String requestedActionCode) {
        if (!StringUtils.hasText(requestedActionCode)) {
            return null;
        }

        String normalized = requestedActionCode.trim().toUpperCase(Locale.ROOT);
        if (!ALLOWED_ACTION_CODES.contains(normalized)) {
            throw new BusinessException(ErrorCode.INVALID_INPUT, "지원하지 않는 감사 작업 유형입니다.");
        }
        return normalized;
    }
}
