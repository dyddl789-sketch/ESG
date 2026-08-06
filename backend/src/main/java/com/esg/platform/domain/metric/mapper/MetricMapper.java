package com.esg.platform.domain.metric.mapper;

import java.math.BigDecimal;
import java.util.List;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import com.esg.platform.domain.metric.dto.IndicatorResponse;
import com.esg.platform.domain.metric.dto.MetricCompletionDto;
import com.esg.platform.domain.metric.dto.MetricDto;
import com.esg.platform.domain.metric.dto.MetricHistoryDto;
import com.esg.platform.domain.metric.dto.MetricScoreValueDto;
import com.esg.platform.domain.metric.entity.EsgMetricData;

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
            @Param("approvedOnly") boolean approvedOnly,
            @Param("publishedOnly") boolean publishedOnly);

    List<String> findAvailablePeriods(
            @Param("companyId") Long companyId,
            @Param("category") String category,
            @Param("status") String status,
            @Param("facilityId") Long facilityId,
            @Param("approvedOnly") boolean approvedOnly,
            @Param("publishedOnly") boolean publishedOnly,
            @Param("benchmarkReady") boolean benchmarkReady);

    MetricDto findById(@Param("companyId") Long companyId, @Param("id") Long id);

    boolean isPublishedPeriod(
            @Param("companyId") Long companyId,
            @Param("year") Integer year,
            @Param("periodType") String periodType,
            @Param("periodValue") Integer periodValue);

    EsgMetricData findEntityById(@Param("id") Long id);

    List<MetricHistoryDto> findHistory(@Param("metricId") Long metricId);

    int insertMetricData(EsgMetricData data);

    int updateMetricData(EsgMetricData data);

    int deleteRejectedMetric(@Param("id") Long id);

    List<IndicatorResponse> findActiveIndicators();

    Integer findIndicatorIdByCode(@Param("indicatorCode") String indicatorCode);

    String findIndicatorCodeById(@Param("indicatorId") Integer indicatorId);

    Integer findHeadquartersFacilityId(@Param("companyId") Long companyId);

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

    List<Long> findMetricIdsForBatch(
            @Param("companyId") Long companyId,
            @Param("period") String period,
            @Param("category") String category,
            @Param("statuses") List<String> statuses);

    int countApprovedForPeriod(@Param("companyId") Long companyId, @Param("period") String period);

    List<MetricScoreValueDto> findScoreValues(@Param("companyId") Long companyId, @Param("period") String period);

    MetricCompletionDto findCompletion(
            @Param("companyId") Long companyId,
            @Param("period") String period);

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
            @Param("gScore") BigDecimal gScore,
            @Param("environmentComplete") boolean environmentComplete,
            @Param("socialComplete") boolean socialComplete,
            @Param("governanceComplete") boolean governanceComplete,
            @Param("overallComplete") boolean overallComplete);

    int deleteScore(@Param("companyId") Long companyId, @Param("year") int year, @Param("month") int month);

    int countApprovedEvidenceByUrl(@Param("fileUrl") String fileUrl);
}
