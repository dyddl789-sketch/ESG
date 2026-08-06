package com.esg.platform.domain.dashboard.dto;

import java.util.List;

import com.esg.platform.domain.metric.dto.MetricCompletionDto;

public record DashboardSummaryDto(
        int year,
        String latestApprovedPeriod,
        String latestCollectedPeriod,
        String pendingPeriod,
        int pendingApprovalCount,
        MetricCompletionDto completion,
        DashboardScoreDto score,
        List<DashboardScoreDto> scoreTrend,
        List<DashboardKpiDto> kpis,
        List<DashboardFacilityDto> facilities,
        String evaluationName,
        String evaluationVersion,
        String disclaimer
) {
}
