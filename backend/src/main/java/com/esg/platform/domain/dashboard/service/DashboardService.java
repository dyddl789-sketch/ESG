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

    public DashboardSummaryDto getSummary(int year, Integer month, Long facilityId) {
        String approvedPeriod = dashboardMapper.findApprovedPeriod(COMPANY_ID, year, month, facilityId);
        DashboardScoreDto score = approvedPeriod == null
                ? null
                : dashboardMapper.findScore(COMPANY_ID, year, month == null
                        ? Integer.valueOf(approvedPeriod.substring(5, 7))
                        : month);
        List<DashboardKpiDto> kpis = approvedPeriod == null
                ? List.of()
                : dashboardMapper.findKpis(COMPANY_ID, approvedPeriod, facilityId);
        for (DashboardKpiDto kpi : kpis) {
            kpi.setChangeRate(calculateChange(kpi.getValue(), kpi.getPreviousValue()));
        }

        DashboardSummaryDto result = new DashboardSummaryDto(
                year,
                approvedPeriod,
                dashboardMapper.findLatestRegisteredPeriod(COMPANY_ID, year, facilityId),
                dashboardMapper.findPendingPeriod(COMPANY_ID, year, facilityId),
                dashboardMapper.countPendingApprovals(COMPANY_ID, facilityId),
                score,
                dashboardMapper.findScoreTrend(COMPANY_ID, year, month),
                kpis,
                approvedPeriod == null
                        ? List.of()
                        : dashboardMapper.findFacilityComparison(COMPANY_ID, approvedPeriod, facilityId),
                dashboardMapper.findEvaluationName(COMPANY_ID, year),
                dashboardMapper.findEvaluationVersion(COMPANY_ID, year),
                dashboardMapper.findEvaluationDisclaimer(COMPANY_ID, year));

        log.debug("[ESG_DASHBOARD] 조회 year={} month={} facilityId={} approvedPeriod={} registeredPeriod={} pendingCount={}",
                year, month, facilityId, result.latestApprovedPeriod(), result.latestCollectedPeriod(),
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
