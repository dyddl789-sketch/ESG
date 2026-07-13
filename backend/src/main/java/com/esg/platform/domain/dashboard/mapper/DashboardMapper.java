package com.esg.platform.domain.dashboard.mapper;

import java.util.List;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import com.esg.platform.domain.dashboard.dto.DashboardFacilityDto;
import com.esg.platform.domain.dashboard.dto.DashboardKpiDto;
import com.esg.platform.domain.dashboard.dto.DashboardScoreDto;

@Mapper
public interface DashboardMapper {
    DashboardScoreDto findLatestScore(@Param("companyId") Long companyId, @Param("year") int year);

    List<DashboardScoreDto> findScoreTrend(@Param("companyId") Long companyId, @Param("year") int year);

    String findLatestCollectedPeriod(@Param("companyId") Long companyId, @Param("year") int year);

    String findPendingPeriod(@Param("companyId") Long companyId, @Param("year") int year);

    int countPendingApprovals(@Param("companyId") Long companyId);

    List<DashboardKpiDto> findKpis(@Param("companyId") Long companyId, @Param("period") String period);

    List<DashboardFacilityDto> findFacilityComparison(@Param("companyId") Long companyId, @Param("period") String period);

    String findEvaluationName(@Param("companyId") Long companyId, @Param("year") int year);

    String findEvaluationVersion(@Param("companyId") Long companyId, @Param("year") int year);

    String findEvaluationDisclaimer(@Param("companyId") Long companyId, @Param("year") int year);
}
