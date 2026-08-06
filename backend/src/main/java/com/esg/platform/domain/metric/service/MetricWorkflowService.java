package com.esg.platform.domain.metric.service;

import java.time.YearMonth;
import java.util.List;
import java.util.Locale;

import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.esg.platform.domain.auditlog.event.AuditLogChangedEvent;
import com.esg.platform.domain.metric.dto.MetricBatchResult;
import com.esg.platform.domain.metric.dto.MetricDto;
import com.esg.platform.domain.metric.mapper.MetricMapper;
import com.esg.platform.global.cache.EsgCacheService;
import com.esg.platform.global.exception.BusinessException;
import com.esg.platform.global.exception.ErrorCode;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
public class MetricWorkflowService {

    private static final Long COMPANY_ID = 1L;
    private final MetricMapper metricMapper;
    private final EsgCacheService cacheService;
    private final EsgScoreCalculationService scoreCalculationService;
    private final ApplicationEventPublisher eventPublisher;

    @Transactional(readOnly = true)
    public List<MetricDto> getMetrics(
            Integer year,
            String period,
            String category,
            String status,
            Long facilityId,
            String search,
            boolean approvedOnly,
            boolean publishedOnly) {
        return metricMapper.findMetrics(
                COMPANY_ID,
                year,
                normalizeOptionalPeriod(period),
                normalizeOptional(category),
                normalizeOptional(status),
                facilityId,
                trimToNull(search),
                approvedOnly,
                publishedOnly);
    }

    @Transactional(readOnly = true)
    public List<String> getAvailablePeriods(
            Long companyId,
            String category,
            String status,
            Long facilityId,
            boolean approvedOnly,
            boolean publishedOnly,
            boolean benchmarkReady) {
        Long resolvedCompanyId = companyId == null ? COMPANY_ID : companyId;
        List<String> periods = metricMapper.findAvailablePeriods(
                resolvedCompanyId,
                normalizeOptional(category),
                normalizeOptional(status),
                facilityId,
                approvedOnly,
                publishedOnly,
                benchmarkReady);
        log.debug("[ESG_PERIOD] 조회 companyId={} category={} status={} facilityId={} approvedOnly={} publishedOnly={} benchmarkReady={} count={}",
                resolvedCompanyId, category, status, facilityId, approvedOnly, publishedOnly, benchmarkReady, periods.size());
        return periods;
    }

    @Transactional(readOnly = true)
    public MetricDto getMetric(Long id, boolean approvedOnly) {
        MetricDto metric = requireMetric(id);
        if (approvedOnly) {
            boolean approved = "APPROVED".equals(metric.getStatus());
            boolean publishedPeriod = approved && metricMapper.isPublishedPeriod(
                    COMPANY_ID,
                    metric.getYear(),
                    metric.getPeriodType(),
                    metric.getPeriodValue());
            if (!publishedPeriod) {
                throw new BusinessException(ErrorCode.FORBIDDEN);
            }
        }
        metric.setHistory(metricMapper.findHistory(id));
        return metric;
    }

    @Transactional
    public MetricDto requestApproval(Long id, Long userId) {
        MetricDto metric = requireMetric(id);
        if (!List.of("DRAFT", "REJECTED").contains(metric.getStatus())) {
            throw new BusinessException(
                    ErrorCode.INVALID_WORKFLOW_STATUS,
                    "작성 중이거나 반려된 데이터만 승인 요청할 수 있습니다.");
        }
        if (metric.getEvidence() == null || metric.getEvidence().isBlank()) {
            throw new BusinessException(ErrorCode.INVALID_INPUT, "승인 요청 전에 사업장 ESG 내역 PDF를 첨부해 주세요.");
        }

        String fromStatus = metric.getStatus();
        int updated = metricMapper.updateMetricStatus(
                COMPANY_ID,
                id,
                List.of("DRAFT", "REJECTED"),
                "PENDING",
                userId,
                null);
        if (updated == 0) {
            throw new BusinessException(ErrorCode.INVALID_WORKFLOW_STATUS);
        }

        metricMapper.insertHistory(
                id,
                "REJECTED".equals(fromStatus) ? "RESUBMIT" : "REQUEST_APPROVAL",
                fromStatus,
                "PENDING",
                "등록값과 증빙자료를 확인하여 최종 승인을 요청했습니다.",
                userId);
        publishAuditChanged(metric, "APPROVAL_REQUESTED");

        cacheService.evictCompanyAfterCommit(COMPANY_ID);
        log.info("[ESG_APPROVAL] 승인 요청 metricId={} period={} category={} facilityId={} userId={}",
                id, metric.getPeriod(), metric.getCategory(), metric.getFacilityId(), userId);
        return getMetric(id, false);
    }

    @Transactional
    public MetricDto approve(Long id, Long userId) {
        MetricDto metric = requireMetric(id);
        int updated = metricMapper.updateMetricStatus(
                COMPANY_ID,
                id,
                List.of("PENDING"),
                "APPROVED",
                userId,
                null);
        if (updated == 0) {
            throw new BusinessException(
                    ErrorCode.INVALID_WORKFLOW_STATUS,
                    "승인 대기 데이터만 최종 승인할 수 있습니다.");
        }

        metricMapper.insertHistory(
                id,
                "APPROVE",
                "PENDING",
                "APPROVED",
                "등록값과 증빙자료를 확인하여 최종 승인했습니다.",
                userId);
        scoreCalculationService.refreshScore(COMPANY_ID, metric.getPeriod());
        publishAuditChanged(metric, "FINAL_APPROVED");
        cacheService.evictCompanyAfterCommit(COMPANY_ID);

        log.info("[ESG_APPROVAL] 최종 승인 metricId={} period={} category={} facilityId={} approverUserId={}",
                id, metric.getPeriod(), metric.getCategory(), metric.getFacilityId(), userId);
        return getMetric(id, false);
    }

    @Transactional
    public MetricDto reject(Long id, String reason, Long userId) {
        MetricDto metric = requireMetric(id);
        String normalizedReason = trimToNull(reason);
        if (normalizedReason == null) {
            throw new BusinessException(ErrorCode.INVALID_INPUT, "반려 사유를 입력해 주세요.");
        }

        int updated = metricMapper.updateMetricStatus(
                COMPANY_ID,
                id,
                List.of("PENDING"),
                "REJECTED",
                userId,
                normalizedReason);
        if (updated == 0) {
            throw new BusinessException(
                    ErrorCode.INVALID_WORKFLOW_STATUS,
                    "승인 대기 데이터만 반려할 수 있습니다.");
        }

        metricMapper.insertHistory(
                id,
                "REJECT",
                "PENDING",
                "REJECTED",
                normalizedReason,
                userId);
        scoreCalculationService.refreshScore(COMPANY_ID, metric.getPeriod());
        publishAuditChanged(metric, "REJECTED");
        cacheService.evictCompanyAfterCommit(COMPANY_ID);

        log.info("[ESG_APPROVAL] 반려 metricId={} period={} category={} facilityId={} approverUserId={} reasonLength={}",
                id, metric.getPeriod(), metric.getCategory(), metric.getFacilityId(), userId, normalizedReason.length());
        return getMetric(id, false);
    }

    @Transactional
    public MetricBatchResult requestApprovalBatch(String rawPeriod, String rawCategory, Long userId) {
        String period = normalizePeriod(rawPeriod);
        String category = normalizeOptional(rawCategory);
        List<Long> ids = metricMapper.findMetricIdsForBatch(
                COMPANY_ID,
                period,
                category,
                List.of("DRAFT", "REJECTED"));
        for (Long id : ids) {
            requestApproval(id, userId);
        }
        return new MetricBatchResult(
                period,
                category,
                ids.size(),
                ids.isEmpty() ? "NO_DATA" : "PENDING",
                ids.isEmpty() ? "승인 요청할 데이터가 없습니다." : "조회 조건의 데이터를 승인 요청했습니다.");
    }

    @Transactional
    public MetricBatchResult approveBatch(String rawPeriod, String rawCategory, Long userId) {
        String period = normalizePeriod(rawPeriod);
        String category = normalizeOptional(rawCategory);
        List<Long> ids = metricMapper.findMetricIdsForBatch(
                COMPANY_ID,
                period,
                category,
                List.of("PENDING"));
        for (Long id : ids) {
            approve(id, userId);
        }
        return new MetricBatchResult(
                period,
                category,
                ids.size(),
                ids.isEmpty() ? "NO_DATA" : "APPROVED",
                ids.isEmpty() ? "승인 대기 데이터가 없습니다." : "조회 조건의 데이터를 최종 승인했습니다.");
    }

    private MetricDto requireMetric(Long id) {
        MetricDto metric = metricMapper.findById(COMPANY_ID, id);
        if (metric == null) {
            throw new BusinessException(ErrorCode.ESG_METRIC_NOT_FOUND);
        }
        return metric;
    }

    private void publishAuditChanged(MetricDto metric, String action) {
        eventPublisher.publishEvent(new AuditLogChangedEvent(
                COMPANY_ID,
                metric.getId(),
                action,
                metric.getPeriod(),
                metric.getCategory(),
                metric.getFacilityId()));
    }

    private String normalizePeriod(String period) {
        try {
            return YearMonth.parse(period).toString();
        } catch (RuntimeException exception) {
            throw new BusinessException(ErrorCode.INVALID_INPUT, "기준월은 YYYY-MM 형식이어야 합니다.");
        }
    }

    private String normalizeOptionalPeriod(String period) {
        return period == null || period.isBlank() ? null : normalizePeriod(period);
    }

    private String normalizeOptional(String value) {
        return value == null || value.isBlank() ? null : value.trim().toUpperCase(Locale.ROOT);
    }

    private String trimToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
