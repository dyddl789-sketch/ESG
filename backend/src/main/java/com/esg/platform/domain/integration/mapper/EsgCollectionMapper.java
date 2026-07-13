package com.esg.platform.domain.integration.mapper;

import java.util.List;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import com.esg.platform.domain.integration.dto.CollectionRunDto;
import com.esg.platform.domain.integration.dto.EnvironmentMonthlyDto;
import com.esg.platform.domain.integration.dto.GovernancePeriodDto;
import com.esg.platform.domain.integration.dto.RawDataDto;
import com.esg.platform.domain.integration.dto.SocialMonthlyDto;

@Mapper
public interface EsgCollectionMapper {

    int countFacilities(@Param("companyId") Long companyId);

    void insertRun(CollectionRunDto run);

    void completeRun(
            @Param("id") Long id,
            @Param("status") String status,
            @Param("totalCount") int totalCount,
            @Param("successCount") int successCount,
            @Param("errorCount") int errorCount,
            @Param("errorMessage") String errorMessage);

    int upsertEnvironmentMonthly(@Param("companyId") Long companyId, @Param("basePeriod") String basePeriod);

    int upsertSocialMonthly(@Param("companyId") Long companyId, @Param("basePeriod") String basePeriod);

    int upsertGovernancePeriod(@Param("companyId") Long companyId, @Param("basePeriod") String basePeriod);

    int upsertEnvironmentRaw(@Param("runId") Long runId, @Param("companyId") Long companyId, @Param("basePeriod") String basePeriod);

    int upsertSocialRaw(@Param("runId") Long runId, @Param("companyId") Long companyId, @Param("basePeriod") String basePeriod);

    int upsertGovernanceRaw(@Param("runId") Long runId, @Param("companyId") Long companyId, @Param("basePeriod") String basePeriod);

    List<EnvironmentMonthlyDto> findEnvironmentMonthly(
            @Param("companyId") Long companyId,
            @Param("basePeriod") String basePeriod,
            @Param("facilityId") Long facilityId,
            @Param("search") String search,
            @Param("reflectionStatus") String reflectionStatus,
            @Param("approvalStatus") String approvalStatus,
            @Param("approvedOnly") boolean approvedOnly);

    List<SocialMonthlyDto> findSocialMonthly(
            @Param("companyId") Long companyId,
            @Param("basePeriod") String basePeriod,
            @Param("facilityId") Long facilityId,
            @Param("search") String search,
            @Param("reflectionStatus") String reflectionStatus,
            @Param("approvalStatus") String approvalStatus,
            @Param("approvedOnly") boolean approvedOnly);

    List<GovernancePeriodDto> findGovernancePeriods(
            @Param("companyId") Long companyId,
            @Param("basePeriod") String basePeriod,
            @Param("reflectionStatus") String reflectionStatus,
            @Param("approvalStatus") String approvalStatus,
            @Param("approvedOnly") boolean approvedOnly);

    EnvironmentMonthlyDto findEnvironmentByFacility(
            @Param("companyId") Long companyId,
            @Param("facilityId") Long facilityId,
            @Param("basePeriod") String basePeriod);

    SocialMonthlyDto findSocialByFacility(
            @Param("companyId") Long companyId,
            @Param("facilityId") Long facilityId,
            @Param("basePeriod") String basePeriod);

    GovernancePeriodDto findGovernancePeriod(@Param("companyId") Long companyId, @Param("basePeriod") String basePeriod);

    List<EnvironmentMonthlyDto> findEnvironmentHistory(
            @Param("companyId") Long companyId,
            @Param("facilityId") Long facilityId,
            @Param("year") int year);

    List<SocialMonthlyDto> findSocialHistory(
            @Param("companyId") Long companyId,
            @Param("facilityId") Long facilityId,
            @Param("year") int year);

    List<RawDataDto> findRawData(
            @Param("companyId") Long companyId,
            @Param("facilityId") Long facilityId,
            @Param("domain") String domain,
            @Param("basePeriod") String basePeriod,
            @Param("limit") int limit);

    List<CollectionRunDto> findRuns(
            @Param("companyId") Long companyId,
            @Param("domain") String domain,
            @Param("basePeriod") String basePeriod,
            @Param("limit") int limit);

    int countEnvironmentReflectable(@Param("companyId") Long companyId, @Param("basePeriod") String basePeriod, @Param("facilityId") Long facilityId);

    int countSocialReflectable(@Param("companyId") Long companyId, @Param("basePeriod") String basePeriod, @Param("facilityId") Long facilityId);

    int countGovernanceReflectable(@Param("companyId") Long companyId, @Param("basePeriod") String basePeriod);

    int reflectEnvironmentMetrics(
            @Param("companyId") Long companyId,
            @Param("basePeriod") String basePeriod,
            @Param("facilityId") Long facilityId,
            @Param("userId") Long userId);

    int reflectSocialMetrics(
            @Param("companyId") Long companyId,
            @Param("basePeriod") String basePeriod,
            @Param("facilityId") Long facilityId,
            @Param("userId") Long userId);

    int reflectGovernanceMetrics(
            @Param("companyId") Long companyId,
            @Param("basePeriod") String basePeriod,
            @Param("userId") Long userId);

    int insertReflectionHistory(
            @Param("companyId") Long companyId,
            @Param("basePeriod") String basePeriod,
            @Param("domain") String domain,
            @Param("facilityId") Long facilityId,
            @Param("userId") Long userId);

    int markEnvironmentReflected(@Param("companyId") Long companyId, @Param("basePeriod") String basePeriod, @Param("facilityId") Long facilityId);

    int markSocialReflected(@Param("companyId") Long companyId, @Param("basePeriod") String basePeriod, @Param("facilityId") Long facilityId);

    int markGovernanceReflected(@Param("companyId") Long companyId, @Param("basePeriod") String basePeriod);
}
