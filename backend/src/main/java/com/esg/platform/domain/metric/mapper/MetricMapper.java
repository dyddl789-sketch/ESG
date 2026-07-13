package com.esg.platform.domain.metric.mapper;

import java.math.BigDecimal;
import java.util.List;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import com.esg.platform.domain.metric.dto.MetricDto;
import com.esg.platform.domain.metric.dto.MetricHistoryDto;
import com.esg.platform.domain.metric.dto.MetricScoreValueDto;

@Mapper
public interface MetricMapper {

    List<MetricDto> findMetrics(
            @Param("companyId") Long companyId,
            @Param("year") Integer year,
            @Param("period") String period,
            @Param("category") String category,
            @Param("status") String status,
            @Param("facilityId") Long facilityId,
            @Param("search") String search,
            @Param("approvedOnly") boolean approvedOnly);

    MetricDto findById(@Param("companyId") Long companyId, @Param("id") Long id);

    List<MetricHistoryDto> findHistory(@Param("metricId") Long metricId);

    int upsertAiAnalysis(
            @Param("metricId") Long metricId,
            @Param("status") String status,
            @Param("riskLevel") String riskLevel,
            @Param("summary") String summary,
            @Param("findings") String findings,
            @Param("modelName") String modelName,
            @Param("userId") Long userId);

    int updateMetricStatus(
            @Param("companyId") Long companyId,
            @Param("id") Long id,
            @Param("fromStatuses") List<String> fromStatuses,
            @Param("toStatus") String toStatus,
            @Param("userId") Long userId,
            @Param("rejectReason") String rejectReason);

    int insertHistory(
            @Param("metricId") Long metricId,
            @Param("actionType") String actionType,
            @Param("fromStatus") String fromStatus,
            @Param("toStatus") String toStatus,
            @Param("comment") String comment,
            @Param("userId") Long userId);

    int countCompletedAi(@Param("metricId") Long metricId);

    List<Long> findMetricIdsForBatch(
            @Param("companyId") Long companyId,
            @Param("period") String period,
            @Param("category") String category,
            @Param("statuses") List<String> statuses);

    int syncEnvironmentStatus(
            @Param("companyId") Long companyId,
            @Param("facilityId") Long facilityId,
            @Param("period") String period);

    int syncSocialStatus(
            @Param("companyId") Long companyId,
            @Param("facilityId") Long facilityId,
            @Param("period") String period);

    int syncGovernanceStatus(
            @Param("companyId") Long companyId,
            @Param("period") String period);

    boolean isPeriodFullyApproved(@Param("companyId") Long companyId, @Param("period") String period);

    List<MetricScoreValueDto> findScoreValues(@Param("companyId") Long companyId, @Param("period") String period);

    BigDecimal findEnvironmentIntensity(@Param("companyId") Long companyId, @Param("period") String period);

    BigDecimal findPreviousApprovedTotal(
            @Param("companyId") Long companyId,
            @Param("period") String period,
            @Param("indicatorCode") String indicatorCode);

    int upsertScore(
            @Param("companyId") Long companyId,
            @Param("year") int year,
            @Param("month") int month,
            @Param("totalScore") BigDecimal totalScore,
            @Param("eScore") BigDecimal eScore,
            @Param("sScore") BigDecimal sScore,
            @Param("gScore") BigDecimal gScore);

    int deleteScore(@Param("companyId") Long companyId, @Param("year") int year, @Param("month") int month);
}
