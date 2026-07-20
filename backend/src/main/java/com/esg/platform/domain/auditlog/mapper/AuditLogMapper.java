package com.esg.platform.domain.auditlog.mapper;

import com.esg.platform.domain.auditlog.dto.AuditLogResponse;
import org.apache.ibatis.annotations.Mapper;
import java.util.List;

@Mapper
public interface AuditLogMapper {
    /**
     * 💡 [정합성 보장] 데이터베이스 트리거로 쌓인 데이터 중 APPROVED 이력만 추출합니다.
     */
    List<AuditLogResponse> findApprovedAuditLogs();
}
