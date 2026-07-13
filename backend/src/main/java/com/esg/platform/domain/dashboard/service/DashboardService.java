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

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class DashboardService {

    private static final Long COMPANY_ID = 1L;

    private final DashboardMapper dashboardMapper;

    public DashboardSummaryDto getSummary(int year) {
        DashboardScoreDto latestScore = dashboardMapper.findLatestScore(COMPANY_ID, year);
        String latestApprovedPeriod = latestScore == null ? null : latestScore.getPeriod();
        List<DashboardKpiDto> kpis = latestApprovedPeriod == null
                ? List.of()
                : dashboardMapper.findKpis(COMPANY_ID, latestApprovedPeriod);
        for (DashboardKpiDto kpi : kpis) {
            kpi.setChangeRate(calculateChange(kpi.getValue(), kpi.getPreviousValue()));
        }

        DashboardSummaryDto result = new DashboardSummaryDto(
                year,
                latestApprovedPeriod,
                dashboardMapper.findLatestCollectedPeriod(COMPANY_ID, year),
                dashboardMapper.findPendingPeriod(COMPANY_ID, year),
                dashboardMapper.countPendingApprovals(COMPANY_ID),
                latestScore,
                dashboardMapper.findScoreTrend(COMPANY_ID, year),
                kpis,
                latestApprovedPeriod == null ? List.of() : dashboardMapper.findFacilityComparison(COMPANY_ID, latestApprovedPeriod),
                dashboardMapper.findEvaluationName(COMPANY_ID, year),
                dashboardMapper.findEvaluationVersion(COMPANY_ID, year),
                dashboardMapper.findEvaluationDisclaimer(COMPANY_ID, year));

        log.debug("[ESG_DASHBOARD] 대시보드 조회 year={} latestApproved={} latestCollected={} pendingPeriod={} pendingCount={}",
                year,
                result.latestApprovedPeriod(),
                result.latestCollectedPeriod(),
                result.pendingPeriod(),
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
