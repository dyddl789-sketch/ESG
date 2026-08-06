package com.esg.platform.domain.metric.service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.YearMonth;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.esg.platform.domain.metric.dto.MetricCompletionDto;
import com.esg.platform.domain.metric.dto.MetricScoreValueDto;
import com.esg.platform.domain.metric.mapper.MetricMapper;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
public class EsgScoreCalculationService {

    private static final BigDecimal HUNDRED = BigDecimal.valueOf(100);

    private final MetricMapper metricMapper;

    @Transactional
    public MetricCompletionDto refreshScore(Long companyId, String period) {
        YearMonth yearMonth = YearMonth.parse(period);
        MetricCompletionDto completion = metricMapper.findCompletion(companyId, period);
        if (completion == null) {
            completion = MetricCompletionDto.empty();
        }

        if (metricMapper.countApprovedForPeriod(companyId, period) == 0) {
            metricMapper.deleteScore(companyId, yearMonth.getYear(), yearMonth.getMonthValue());
            log.info("[ESG_SCORE] 승인 데이터 없음으로 점수 삭제 companyId={} period={}", companyId, period);
            return completion;
        }

        Map<String, MetricScoreValueDto> values = new LinkedHashMap<>();
        for (MetricScoreValueDto row : metricMapper.findScoreValues(companyId, period)) {
            values.put(row.getIndicatorCode(), row);
        }

        BigDecimal eScore = completion.isEnvironmentComplete()
                ? calculateEnvironmentScore(companyId, period, values)
                : BigDecimal.ZERO;
        BigDecimal sScore = completion.isSocialComplete()
                ? calculateSocialScore(values)
                : BigDecimal.ZERO;
        BigDecimal gScore = completion.isGovernanceComplete()
                ? calculateGovernanceScore(values)
                : BigDecimal.ZERO;
        BigDecimal totalScore = completion.isOverallComplete()
                ? eScore.multiply(BigDecimal.valueOf(0.40))
                        .add(sScore.multiply(BigDecimal.valueOf(0.35)))
                        .add(gScore.multiply(BigDecimal.valueOf(0.25)))
                        .setScale(2, RoundingMode.HALF_UP)
                : BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);

        metricMapper.upsertScore(
                companyId,
                yearMonth.getYear(),
                yearMonth.getMonthValue(),
                totalScore,
                eScore,
                sScore,
                gScore,
                completion.isEnvironmentComplete(),
                completion.isSocialComplete(),
                completion.isGovernanceComplete(),
                completion.isOverallComplete());

        log.info(
                "[ESG_SCORE] 점수 갱신 companyId={} period={} total={} e={} s={} g={} completion={}/{} env={}/{} social={}/{} governance={}/{}",
                companyId,
                period,
                totalScore,
                eScore,
                sScore,
                gScore,
                completion.getTotalApproved(),
                completion.getTotalRequired(),
                completion.getEnvironmentApproved(),
                completion.getEnvironmentRequired(),
                completion.getSocialApproved(),
                completion.getSocialRequired(),
                completion.getGovernanceApproved(),
                completion.getGovernanceRequired());
        return completion;
    }

    private BigDecimal calculateEnvironmentScore(
            Long companyId,
            String period,
            Map<String, MetricScoreValueDto> values) {
        BigDecimal currentElectricity = total(values, "IND_E_ELEC");
        BigDecimal previousElectricity = metricMapper.findPreviousApprovedTotal(companyId, period, "IND_E_ELEC");
        BigDecimal currentScope2 = total(values, "IND_E_SCOPE2");
        BigDecimal previousScope2 = metricMapper.findPreviousApprovedTotal(companyId, period, "IND_E_SCOPE2");
        return weightedAverage(
                List.of(trendScore(currentElectricity, previousElectricity), trendScore(currentScope2, previousScope2)),
                List.of(BigDecimal.valueOf(50), BigDecimal.valueOf(50)));
    }

    private BigDecimal calculateSocialScore(Map<String, MetricScoreValueDto> values) {
        return weightedAverage(
                List.of(
                        lowerIsBetter(avg(values, "IND_S_INJURY_RATE"), BigDecimal.valueOf(0.20)),
                        higherIsBetter(avg(values, "IND_S_SAFETY_EDU"), BigDecimal.valueOf(95)),
                        higherIsBetter(avg(values, "IND_S_RISK_ACTION"), BigDecimal.valueOf(90)),
                        lowerIsBetter(avg(values, "IND_S_TURNOVER"), BigDecimal.valueOf(2))),
                List.of(BigDecimal.TEN, BigDecimal.TEN, BigDecimal.TEN, BigDecimal.valueOf(5)));
    }

    private BigDecimal calculateGovernanceScore(Map<String, MetricScoreValueDto> values) {
        return weightedAverage(
                List.of(
                        higherIsBetter(avg(values, "IND_G_ATTENDANCE"), BigDecimal.valueOf(90)),
                        higherIsBetter(avg(values, "IND_G_OUTSIDE"), BigDecimal.valueOf(37.5)),
                        higherIsBetter(avg(values, "IND_G_ETHICS_EDU"), BigDecimal.valueOf(95))),
                List.of(BigDecimal.valueOf(40), BigDecimal.valueOf(20), BigDecimal.valueOf(40)));
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
}
