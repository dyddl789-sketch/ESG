package com.esg.platform.domain.dashboard.mapper;

import java.util.List;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import com.esg.platform.domain.dashboard.dto.DashboardFacilityDto;
import com.esg.platform.domain.dashboard.dto.DashboardKpiDto;
import com.esg.platform.domain.dashboard.dto.DashboardScoreDto;

@Mapper
public interface DashboardMapper {
    DashboardScoreDto findScore(
            @Param("companyId") Long companyId,
            @Param("year") int year,
            @Param("month") Integer month);

    List<DashboardScoreDto> findScoreTrend(
            @Param("companyId") Long companyId,
            @Param("year") int year,
            @Param("month") Integer month);

    String findApprovedPeriod(
            @Param("companyId") Long companyId,
            @Param("year") int year,
            @Param("month") Integer month,
            @Param("facilityId") Long facilityId);

    String findLatestRegisteredPeriod(
            @Param("companyId") Long companyId,
            @Param("year") int year,
            @Param("facilityId") Long facilityId);

    String findPendingPeriod(
            @Param("companyId") Long companyId,
            @Param("year") int year,
            @Param("facilityId") Long facilityId);

    int countPendingApprovals(
            @Param("companyId") Long companyId,
            @Param("facilityId") Long facilityId);

    List<DashboardKpiDto> findKpis(
            @Param("companyId") Long companyId,
            @Param("period") String period,
            @Param("facilityId") Long facilityId);

    List<DashboardFacilityDto> findFacilityComparison(
            @Param("companyId") Long companyId,
            @Param("period") String period,
            @Param("facilityId") Long facilityId);

    String findEvaluationName(@Param("companyId") Long companyId, @Param("year") int year);

    String findEvaluationVersion(@Param("companyId") Long companyId, @Param("year") int year);

    String findEvaluationDisclaimer(@Param("companyId") Long companyId, @Param("year") int year);
}
