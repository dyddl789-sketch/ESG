package com.esg.platform.domain.metric.service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.YearMonth;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.esg.platform.domain.metric.dto.MetricBatchResult;
import com.esg.platform.domain.metric.dto.MetricDto;
import com.esg.platform.domain.metric.dto.MetricScoreValueDto;
import com.esg.platform.domain.metric.mapper.MetricMapper;
import com.esg.platform.global.exception.BusinessException;
import com.esg.platform.global.exception.ErrorCode;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
public class MetricWorkflowService {

    private static final Long COMPANY_ID = 1L;
    private static final BigDecimal HUNDRED = BigDecimal.valueOf(100);

    private final MetricMapper metricMapper;

    @Transactional(readOnly = true)
    public List<MetricDto> getMetrics(
            Integer year,
            String period,
            String category,
            String status,
            Long facilityId,
            String search,
            boolean approvedOnly) {
        return metricMapper.findMetrics(
                COMPANY_ID,
                year,
                normalizeOptionalPeriod(period),
                normalizeOptional(category),
                normalizeOptional(status),
                facilityId,
                trimToNull(search),
                approvedOnly);
    }

    @Transactional(readOnly = true)
    public List<String> getAvailablePeriods(
            Long companyId,
            String category,
            String status,
            Long facilityId,
            boolean approvedOnly,
            boolean benchmarkReady) {
        Long resolvedCompanyId = companyId == null ? COMPANY_ID : companyId;
        List<String> periods = metricMapper.findAvailablePeriods(
                resolvedCompanyId,
                normalizeOptional(category),
                normalizeOptional(status),
                facilityId,
                approvedOnly,
                benchmarkReady);
        log.debug("[ESG_PERIOD] 조회 companyId={} category={} status={} facilityId={} approvedOnly={} benchmarkReady={} count={}",
                resolvedCompanyId, category, status, facilityId, approvedOnly, benchmarkReady, periods.size());
        return periods;
    }

    @Transactional(readOnly = true)
    public MetricDto getMetric(Long id, boolean approvedOnly) {
        MetricDto metric = requireMetric(id);
        if (approvedOnly && !"APPROVED".equals(metric.getStatus())) {
            throw new BusinessException(ErrorCode.FORBIDDEN);
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
        refreshScore(metric.getPeriod());

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
        refreshScore(metric.getPeriod());

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

    private void refreshScore(String period) {
        YearMonth yearMonth = YearMonth.parse(period);
        if (metricMapper.countApprovedForPeriod(COMPANY_ID, period) == 0) {
            metricMapper.deleteScore(COMPANY_ID, yearMonth.getYear(), yearMonth.getMonthValue());
            return;
        }

        Map<String, MetricScoreValueDto> values = new LinkedHashMap<>();
        for (MetricScoreValueDto row : metricMapper.findScoreValues(COMPANY_ID, period)) {
            values.put(row.getIndicatorCode(), row);
        }

        BigDecimal currentElectricity = total(values, "IND_E_ELEC");
        BigDecimal previousElectricity = metricMapper.findPreviousApprovedTotal(COMPANY_ID, period, "IND_E_ELEC");
        BigDecimal currentScope2 = total(values, "IND_E_SCOPE2");
        BigDecimal previousScope2 = metricMapper.findPreviousApprovedTotal(COMPANY_ID, period, "IND_E_SCOPE2");
        BigDecimal eScore = weightedAverage(
                List.of(trendScore(currentElectricity, previousElectricity), trendScore(currentScope2, previousScope2)),
                List.of(BigDecimal.valueOf(50), BigDecimal.valueOf(50)));

        BigDecimal sScore = weightedAverage(
                List.of(
                        lowerIsBetter(avg(values, "IND_S_INJURY_RATE"), BigDecimal.valueOf(0.20)),
                        higherIsBetter(avg(values, "IND_S_SAFETY_EDU"), BigDecimal.valueOf(95)),
                        higherIsBetter(avg(values, "IND_S_RISK_ACTION"), BigDecimal.valueOf(90)),
                        lowerIsBetter(avg(values, "IND_S_TURNOVER"), BigDecimal.valueOf(2))),
                List.of(BigDecimal.TEN, BigDecimal.TEN, BigDecimal.TEN, BigDecimal.valueOf(5)));

        BigDecimal gScore = weightedAverage(
                List.of(
                        higherIsBetter(avg(values, "IND_G_ATTENDANCE"), BigDecimal.valueOf(90)),
                        higherIsBetter(avg(values, "IND_G_OUTSIDE"), BigDecimal.valueOf(37.5)),
                        higherIsBetter(avg(values, "IND_G_ETHICS_EDU"), BigDecimal.valueOf(95))),
                List.of(BigDecimal.valueOf(40), BigDecimal.valueOf(20), BigDecimal.valueOf(40)));

        BigDecimal totalScore = eScore.multiply(BigDecimal.valueOf(0.40))
                .add(sScore.multiply(BigDecimal.valueOf(0.35)))
                .add(gScore.multiply(BigDecimal.valueOf(0.25)))
                .setScale(2, RoundingMode.HALF_UP);

        metricMapper.upsertScore(
                COMPANY_ID,
                yearMonth.getYear(),
                yearMonth.getMonthValue(),
                totalScore,
                eScore,
                sScore,
                gScore);
        log.info("[ESG_SCORE] 승인 데이터 기반 내부 ESG 지수 갱신 period={} total={} e={} s={} g={}",
                period, totalScore, eScore, sScore, gScore);
    }

    private BigDecimal trendScore(BigDecimal current, BigDecimal previous) {
        if (current == null) {
            return BigDecimal.ZERO;
        }
        if (previous == null || previous.signum() <= 0) {
            return BigDecimal.valueOf(85);
        }
        BigDecimal rate = previous.subtract(current)
                .divide(previous, 6, RoundingMode.HALF_UP)
                .multiply(HUNDRED);
        return clamp(BigDecimal.valueOf(85).add(rate.multiply(BigDecimal.valueOf(2))));
    }

    private BigDecimal avg(Map<String, MetricScoreValueDto> values, String code) {
        MetricScoreValueDto row = values.get(code);
        return row == null ? null : row.getAverageValue();
    }

    private BigDecimal total(Map<String, MetricScoreValueDto> values, String code) {
        MetricScoreValueDto row = values.get(code);
        return row == null ? null : row.getTotalValue();
    }

    private BigDecimal higherIsBetter(BigDecimal actual, BigDecimal target) {
        if (actual == null || target == null || target.signum() <= 0) {
            return BigDecimal.ZERO;
        }
        return clamp(actual.divide(target, 6, RoundingMode.HALF_UP).multiply(HUNDRED));
    }

    private BigDecimal lowerIsBetter(BigDecimal actual, BigDecimal target) {
        if (actual == null) {
            return BigDecimal.ZERO;
        }
        if (actual.signum() <= 0 || actual.compareTo(target) <= 0) {
            return HUNDRED;
        }
        return clamp(target.divide(actual, 6, RoundingMode.HALF_UP).multiply(HUNDRED));
    }

    private BigDecimal weightedAverage(List<BigDecimal> scores, List<BigDecimal> weights) {
        BigDecimal total = BigDecimal.ZERO;
        BigDecimal weightTotal = BigDecimal.ZERO;
        for (int index = 0; index < scores.size(); index++) {
            total = total.add(scores.get(index).multiply(weights.get(index)));
            weightTotal = weightTotal.add(weights.get(index));
        }
        return weightTotal.signum() == 0
                ? BigDecimal.ZERO
                : total.divide(weightTotal, 2, RoundingMode.HALF_UP);
    }

    private BigDecimal clamp(BigDecimal value) {
        if (value == null || value.signum() < 0) {
            return BigDecimal.ZERO;
        }
        return value.min(HUNDRED).setScale(2, RoundingMode.HALF_UP);
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
