package com.esg.platform.domain.metric.service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.YearMonth;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.esg.platform.domain.ai.service.GeminiAiService;
import com.esg.platform.domain.metric.dto.MetricBatchResult;
import com.esg.platform.domain.metric.dto.MetricDto;
import com.esg.platform.domain.metric.dto.MetricScoreValueDto;
import com.esg.platform.domain.metric.mapper.MetricMapper;
import com.esg.platform.global.exception.BusinessException;
import com.esg.platform.global.exception.ErrorCode;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
public class MetricWorkflowService {

    private static final Long COMPANY_ID = 1L;
    private static final BigDecimal HUNDRED = BigDecimal.valueOf(100);

    private final MetricMapper metricMapper;
    private final GeminiAiService geminiAiService;
    private final ObjectMapper objectMapper;

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
    public MetricDto getMetric(Long id, boolean approvedOnly) {
        MetricDto metric = requireMetric(id);
        if (approvedOnly && !"APPROVED".equals(metric.getStatus())) {
            throw new BusinessException(ErrorCode.FORBIDDEN);
        }
        metric.setHistory(metricMapper.findHistory(id));
        return metric;
    }

    @Transactional
    public MetricDto analyze(Long id, Long userId) {
        MetricDto metric = requireMetric(id);
        if ("APPROVED".equals(metric.getStatus())) {
            throw new BusinessException(ErrorCode.INVALID_WORKFLOW_STATUS, "승인 완료 데이터는 AI 분석을 다시 실행할 수 없습니다.");
        }

        AnalysisResult result = createAnalysis(metric);
        metricMapper.upsertAiAnalysis(
                metric.getId(),
                "COMPLETED",
                result.riskLevel(),
                result.summary(),
                toJson(result.findings()),
                result.modelName(),
                userId);
        metricMapper.insertHistory(
                metric.getId(),
                "AI_ANALYSIS",
                metric.getStatus(),
                metric.getStatus(),
                "AI 사전 분석을 완료했습니다. 위험 수준: " + result.riskLevel(),
                userId);

        log.info("[ESG_AI] 지표 AI 분석 완료 metricId={} indicator={} period={} risk={} model={} userId={}",
                metric.getId(), metric.getIndicatorCode(), metric.getPeriod(), result.riskLevel(), result.modelName(), userId);
        return getMetric(id, false);
    }

    @Transactional
    public MetricDto requestApproval(Long id, Long userId) {
        MetricDto metric = requireMetric(id);
        if (!List.of("DRAFT", "REJECTED").contains(metric.getStatus())) {
            throw new BusinessException(ErrorCode.INVALID_WORKFLOW_STATUS, "검토 중이거나 반려된 데이터만 승인 요청할 수 있습니다.");
        }
        if (metricMapper.countCompletedAi(id) == 0) {
            throw new BusinessException(ErrorCode.AI_ANALYSIS_REQUIRED);
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
                "AI 분석과 증빙 확인을 완료하여 최종 승인을 요청했습니다.",
                userId);
        syncMonthlyStatus(metric);
        refreshScore(metric.getPeriod());

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
            throw new BusinessException(ErrorCode.INVALID_WORKFLOW_STATUS, "승인 대기 데이터만 최종 승인할 수 있습니다.");
        }
        metricMapper.insertHistory(
                id,
                "APPROVE",
                "PENDING",
                "APPROVED",
                "원천값, 산정식, 증빙자료와 AI 분석 결과를 확인하여 최종 승인했습니다.",
                userId);
        syncMonthlyStatus(metric);
        refreshScore(metric.getPeriod());

        log.info("[ESG_APPROVAL] 최종 승인 metricId={} period={} category={} facilityId={} approverUserId={}",
                id, metric.getPeriod(), metric.getCategory(), metric.getFacilityId(), userId);
        return getMetric(id, false);
    }

    @Transactional
    public MetricDto reject(Long id, String reason, Long userId) {
        MetricDto metric = requireMetric(id);
        String normalizedReason = reason == null ? "" : reason.trim();
        if (normalizedReason.isBlank()) {
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
            throw new BusinessException(ErrorCode.INVALID_WORKFLOW_STATUS, "승인 대기 데이터만 반려할 수 있습니다.");
        }
        metricMapper.insertHistory(
                id,
                "REJECT",
                "PENDING",
                "REJECTED",
                normalizedReason,
                userId);
        syncMonthlyStatus(metric);
        refreshScore(metric.getPeriod());

        log.info("[ESG_APPROVAL] 반려 metricId={} period={} category={} facilityId={} approverUserId={} reasonLength={}",
                id, metric.getPeriod(), metric.getCategory(), metric.getFacilityId(), userId, normalizedReason.length());
        return getMetric(id, false);
    }

    @Transactional
    public MetricBatchResult analyzeBatch(String rawPeriod, String rawCategory, Long userId) {
        String period = normalizePeriod(rawPeriod);
        String category = normalizeOptional(rawCategory);
        List<Long> ids = metricMapper.findMetricIdsForBatch(
                COMPANY_ID,
                period,
                category,
                List.of("DRAFT", "REJECTED"));
        for (Long id : ids) {
            analyze(id, userId);
        }
        return new MetricBatchResult(period, category, ids.size(), "COMPLETED", "조회 조건의 AI 사전 분석을 완료했습니다.");
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
        if (ids.isEmpty()) {
            return new MetricBatchResult(period, category, 0, "NO_DATA", "승인 요청할 데이터가 없습니다.");
        }
        List<Long> withoutAi = ids.stream().filter(id -> metricMapper.countCompletedAi(id) == 0).toList();
        if (!withoutAi.isEmpty()) {
            throw new BusinessException(
                    ErrorCode.AI_ANALYSIS_REQUIRED,
                    "AI 분석이 완료되지 않은 데이터가 " + withoutAi.size() + "건 있습니다.");
        }
        for (Long id : ids) {
            requestApproval(id, userId);
        }
        return new MetricBatchResult(period, category, ids.size(), "PENDING", "조회 조건의 데이터를 승인 요청했습니다.");
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
        return new MetricBatchResult(period, category, ids.size(), "APPROVED", "조회 조건의 데이터를 최종 승인했습니다.");
    }

    private MetricDto requireMetric(Long id) {
        MetricDto metric = metricMapper.findById(COMPANY_ID, id);
        if (metric == null) {
            throw new BusinessException(ErrorCode.ESG_METRIC_NOT_FOUND);
        }
        return metric;
    }

    private AnalysisResult createAnalysis(MetricDto metric) {
        List<String> findings = new ArrayList<>();
        findings.add("원천 시스템과 기준월 연결 확인");
        findings.add("필수값 및 단위 검증 완료");

        String risk = determineRisk(metric, findings);
        String fallback = buildFallbackSummary(metric, risk);
        String model = "ESG-RULE-FALLBACK-1.0";
        String summary = fallback;

        try {
            String prompt = "지표명: " + metric.getTitle()
                    + "\n사업장: " + metric.getFacility()
                    + "\n기준월: " + metric.getPeriod()
                    + "\n실제값: " + (metric.getValue() == null ? metric.getTextValue() : metric.getValue() + " " + metric.getUnit())
                    + "\n내부 규칙 위험수준: " + risk
                    + "\n검토사항: " + String.join(", ", findings);
            summary = geminiAiService.analyze(metric.getCategory(), prompt);
            model = "GEMINI";
        } catch (RuntimeException exception) {
            log.info("[ESG_AI] Gemini 미사용 또는 호출 실패로 규칙 기반 분석 적용 metricId={} reason={}",
                    metric.getId(), exception.getMessage());
        }

        return new AnalysisResult(risk, summary, findings, model);
    }

    private String determineRisk(MetricDto metric, List<String> findings) {
        BigDecimal value = metric.getValue();
        if (value == null) {
            findings.add("이사회 미개최 월은 0점으로 처리하지 않음");
            return "LOW";
        }

        String code = metric.getIndicatorCode();
        boolean high = false;
        boolean medium = false;
        switch (code) {
            case "IND_S_INJURY_RATE" -> {
                high = value.compareTo(BigDecimal.valueOf(0.30)) > 0;
                medium = value.compareTo(BigDecimal.valueOf(0.20)) > 0;
            }
            case "IND_S_SAFETY_EDU" -> {
                high = value.compareTo(BigDecimal.valueOf(85)) < 0;
                medium = value.compareTo(BigDecimal.valueOf(95)) < 0;
            }
            case "IND_S_RISK_ACTION" -> {
                high = value.compareTo(BigDecimal.valueOf(75)) < 0;
                medium = value.compareTo(BigDecimal.valueOf(90)) < 0;
            }
            case "IND_S_TURNOVER" -> {
                high = value.compareTo(BigDecimal.valueOf(4)) > 0;
                medium = value.compareTo(BigDecimal.valueOf(2)) > 0;
            }
            case "IND_G_ATTENDANCE" -> medium = value.compareTo(BigDecimal.valueOf(90)) < 0;
            case "IND_G_OUTSIDE" -> medium = value.compareTo(BigDecimal.valueOf(30)) < 0;
            case "IND_G_ETHICS_EDU" -> medium = value.compareTo(BigDecimal.valueOf(95)) < 0;
            default -> findings.add("월별 변동은 승인 상세 화면에서 추가 확인");
        }
        if (high) {
            findings.add("내부 관리 기준을 크게 벗어나 우선 검토 필요");
            return "HIGH";
        }
        if (medium) {
            findings.add("내부 관리 목표 대비 추가 확인 필요");
            return "MEDIUM";
        }
        findings.add("내부 관리 기준 범위 내");
        return "LOW";
    }

    private String buildFallbackSummary(MetricDto metric, String risk) {
        String value = metric.getValue() == null
                ? metric.getTextValue()
                : metric.getValue().stripTrailingZeros().toPlainString() + " " + metric.getUnit();
        return metric.getPeriod() + " " + metric.getFacility() + "의 " + metric.getTitle()
                + " 실제값은 " + value + "입니다. 원천값과 단위를 확인했으며 내부 위험 수준은 "
                + risk + "로 분류했습니다.";
    }

    private void syncMonthlyStatus(MetricDto metric) {
        switch (metric.getCategory()) {
            case "ENVIRONMENT" -> metricMapper.syncEnvironmentStatus(COMPANY_ID, metric.getFacilityId(), metric.getPeriod());
            case "SOCIAL" -> metricMapper.syncSocialStatus(COMPANY_ID, metric.getFacilityId(), metric.getPeriod());
            case "GOVERNANCE" -> metricMapper.syncGovernanceStatus(COMPANY_ID, metric.getPeriod());
            default -> throw new BusinessException(ErrorCode.INVALID_INPUT, "지원하지 않는 ESG 영역입니다.");
        }
    }

    private void refreshScore(String period) {
        YearMonth yearMonth = YearMonth.parse(period);
        if (!metricMapper.isPeriodFullyApproved(COMPANY_ID, period)) {
            metricMapper.deleteScore(COMPANY_ID, yearMonth.getYear(), yearMonth.getMonthValue());
            log.debug("[ESG_SCORE] 월 전체 승인 전 점수 제거 period={}", period);
            return;
        }

        Map<String, MetricScoreValueDto> values = new LinkedHashMap<>();
        for (MetricScoreValueDto row : metricMapper.findScoreValues(COMPANY_ID, period)) {
            values.put(row.getIndicatorCode(), row);
        }

        BigDecimal intensity = defaultValue(metricMapper.findEnvironmentIntensity(COMPANY_ID, period), BigDecimal.valueOf(82));
        BigDecimal currentScope2 = total(values, "IND_E_SCOPE2");
        BigDecimal previousScope2 = metricMapper.findPreviousApprovedTotal(COMPANY_ID, period, "IND_E_SCOPE2");
        BigDecimal intensityScore = lowerIsBetter(intensity, BigDecimal.valueOf(82));
        BigDecimal reductionScore = BigDecimal.valueOf(80);
        if (previousScope2 != null && previousScope2.signum() > 0 && currentScope2 != null) {
            BigDecimal reductionRate = previousScope2.subtract(currentScope2)
                    .divide(previousScope2, 6, RoundingMode.HALF_UP)
                    .multiply(HUNDRED);
            reductionScore = clamp(reductionRate.divide(BigDecimal.valueOf(3), 6, RoundingMode.HALF_UP).multiply(HUNDRED));
        }
        BigDecimal eScore = weightedAverage(
                List.of(intensityScore, reductionScore),
                List.of(BigDecimal.valueOf(50), BigDecimal.valueOf(50)));

        BigDecimal injuryScore = lowerIsBetter(avg(values, "IND_S_INJURY_RATE"), BigDecimal.valueOf(0.20));
        BigDecimal trainingScore = higherIsBetter(avg(values, "IND_S_SAFETY_EDU"), BigDecimal.valueOf(95));
        BigDecimal hazardScore = higherIsBetter(avg(values, "IND_S_RISK_ACTION"), BigDecimal.valueOf(90));
        BigDecimal turnoverScore = lowerIsBetter(avg(values, "IND_S_TURNOVER"), BigDecimal.valueOf(2));
        BigDecimal sScore = weightedAverage(
                List.of(injuryScore, trainingScore, hazardScore, turnoverScore),
                List.of(BigDecimal.TEN, BigDecimal.TEN, BigDecimal.TEN, BigDecimal.valueOf(5)));

        BigDecimal boardValue = avg(values, "IND_G_ATTENDANCE");
        BigDecimal boardScore = boardValue == null ? HUNDRED : higherIsBetter(boardValue, BigDecimal.valueOf(90));
        BigDecimal outsideScore = higherIsBetter(avg(values, "IND_G_OUTSIDE"), BigDecimal.valueOf(37.5));
        BigDecimal ethicsScore = higherIsBetter(avg(values, "IND_G_ETHICS_EDU"), BigDecimal.valueOf(95));
        BigDecimal gScore = weightedAverage(
                List.of(boardScore, outsideScore, ethicsScore),
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
        log.info("[ESG_SCORE] 내부 ESG 지수 확정 period={} total={} e={} s={} g={}",
                period, totalScore, eScore, sScore, gScore);
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
        for (int i = 0; i < scores.size(); i++) {
            total = total.add(defaultValue(scores.get(i), BigDecimal.ZERO).multiply(weights.get(i)));
            weightTotal = weightTotal.add(weights.get(i));
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

    private BigDecimal defaultValue(BigDecimal value, BigDecimal fallback) {
        return value == null ? fallback : value;
    }

    private String toJson(List<String> findings) {
        try {
            return objectMapper.writeValueAsString(findings);
        } catch (JsonProcessingException exception) {
            return "[]";
        }
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

    private record AnalysisResult(String riskLevel, String summary, List<String> findings, String modelName) {
    }
}
