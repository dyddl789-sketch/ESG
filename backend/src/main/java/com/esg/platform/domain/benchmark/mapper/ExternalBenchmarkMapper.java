package com.esg.platform.domain.benchmark.mapper;

import java.util.List;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import com.esg.platform.domain.benchmark.dto.ExternalBenchmarkSyncRun;
import com.esg.platform.domain.benchmark.dto.ExternalBenchmarkValue;
import com.esg.platform.domain.benchmark.dto.InternalBenchmarkAggregate;

@Mapper
public interface ExternalBenchmarkMapper {

    void insertSyncRun(ExternalBenchmarkSyncRun run);

    void completeSyncRun(
            @Param("id") Long id,
            @Param("status") String status,
            @Param("errorMessage") String errorMessage);

    void upsertValue(ExternalBenchmarkValue value);

    ExternalBenchmarkValue findValue(
            @Param("companyId") Integer companyId,
            @Param("baseYear") Integer baseYear,
            @Param("industryCode") String industryCode,
            @Param("metricCode") String metricCode);

    ExternalBenchmarkSyncRun findLatestRun(@Param("companyId") Integer companyId);

    List<Integer> findInternalYears(@Param("companyId") Integer companyId);

    Integer findLatestComparableMonth(
            @Param("companyId") Integer companyId,
            @Param("year") Integer year);

    InternalBenchmarkAggregate findInternalAggregate(
            @Param("companyId") Integer companyId,
            @Param("year") Integer year,
            @Param("throughMonth") Integer throughMonth);
}
