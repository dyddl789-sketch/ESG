package com.esg.platform.domain.auditlog.mapper;

import java.time.LocalDate;
import java.util.List;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import com.esg.platform.domain.auditlog.dto.AuditLogResponse;

@Mapper
public interface AuditLogMapper {

    List<AuditLogResponse> findAuditLogs(
            @Param("facilityId") Long facilityId,
            @Param("indicatorId") Long indicatorId,
            @Param("actionCode") String actionCode,
            @Param("fromDate") LocalDate fromDate,
            @Param("toDate") LocalDate toDate,
            @Param("size") int size,
            @Param("offset") int offset);

    long countAuditLogs(
            @Param("facilityId") Long facilityId,
            @Param("indicatorId") Long indicatorId,
            @Param("actionCode") String actionCode,
            @Param("fromDate") LocalDate fromDate,
            @Param("toDate") LocalDate toDate);
}
