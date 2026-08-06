package com.esg.platform.domain.dashboard.service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.esg.platform.domain.dashboard.dto.DashboardKpiDto;
import com.esg.platform.domain.dashboard.dto.DashboardScoreDto;
import com.esg.platform.domain.dashboard.dto.DashboardSummaryDto;
import com.esg.platform.domain.dashboard.mapper.DashboardMapper;
import com.esg.platform.domain.metric.dto.MetricCompletionDto;
import com.esg.platform.domain.metric.mapper.MetricMapper;
import com.esg.platform.domain.metric.service.EsgScoreCalculationService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
public class DashboardService {

    private static final Long COMPANY_ID = 1L;

    private final DashboardMapper dashboardMapper;
    private final MetricMapper metricMapper;
    private final EsgScoreCalculationService scoreCalculationService;

    @Transactional
    public DashboardSummaryDto getSummary(int year, Integer month, Long facilityId, boolean publishedOnly) {
        String latestApprovedPeriod = dashboardMapper.findApprovedPeriod(COMPANY_ID, year, month, facilityId);
        MetricCompletionDto latestCompletion = MetricCompletionDto.empty();
        if (latestApprovedPeriod != null) {
            latestCompletion = scoreCalculationService.refreshScore(COMPANY_ID, latestApprovedPeriod);
        }

        String displayPeriod = publishedOnly
                ? dashboardMapper.findPublishedPeriod(COMPANY_ID, year, month)
                : latestApprovedPeriod;
        MetricCompletionDto completion = displayPeriod == null
                ? MetricCompletionDto.empty()
                : displayPeriod.equals(latestApprovedPeriod)
                        ? latestCompletion
                        : metricMapper.findCompletion(COMPANY_ID, displayPeriod);
        if (completion == null) {
            completion = MetricCompletionDto.empty();
        }

        Integer displayMonth = displayPeriod == null
                ? null
                : Integer.valueOf(displayPeriod.substring(5, 7));
        DashboardScoreDto score = displayPeriod == null
                ? null
                : dashboardMapper.findScore(COMPANY_ID, year, displayMonth);
        List<DashboardKpiDto> kpis = displayPeriod == null
                ? List.of()
                : dashboardMapper.findKpis(COMPANY_ID, displayPeriod, facilityId);
        for (DashboardKpiDto kpi : kpis) {
            kpi.setChangeRate(calculateChange(kpi.getValue(), kpi.getPreviousValue()));
        }

        DashboardSummaryDto result = new DashboardSummaryDto(
                year,
                displayPeriod,
                dashboardMapper.findLatestRegisteredPeriod(COMPANY_ID, year, facilityId),
                dashboardMapper.findPendingPeriod(COMPANY_ID, year, facilityId),
                dashboardMapper.countPendingApprovals(COMPANY_ID, facilityId),
                completion,
                score,
                dashboardMapper.findScoreTrend(COMPANY_ID, year, month, publishedOnly),
                kpis,
                displayPeriod == null
                        ? List.of()
                        : dashboardMapper.findFacilityComparison(COMPANY_ID, displayPeriod, facilityId),
                dashboardMapper.findEvaluationName(COMPANY_ID, year),
                dashboardMapper.findEvaluationVersion(COMPANY_ID, year),
                dashboardMapper.findEvaluationDisclaimer(COMPANY_ID, year));

        log.debug(
                "[ESG_DASHBOARD] 조회 year={} month={} facilityId={} publishedOnly={} latestApproved={} displayPeriod={} completion={}/{} pendingCount={}",
                year,
                month,
                facilityId,
                publishedOnly,
                latestApprovedPeriod,
                displayPeriod,
                completion.getTotalApproved(),
                completion.getTotalRequired(),
                result.pendingApprovalCount());
        return result;
    }

    private BigDecimal calculateChange(BigDecimal current, BigDecimal previous) {
        if (current == null || previous == null || previous.signum() == 0) {
            return null;
        }
        return current.subtract(previous)
                .divide(previous.abs(), 6, RoundingMode.HALF_UP)
                .multiply(BigDecimal.valueOf(100))
                .setScale(2, RoundingMode.HALF_UP);
    }
}
