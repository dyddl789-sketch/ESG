package com.esg.platform.domain.auditlog.service;

import com.esg.platform.domain.auditlog.dto.AuditLogResponse;
import com.esg.platform.domain.auditlog.mapper.AuditLogMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AuditLogService {

    private final AuditLogMapper auditLogMapper;

    /**
     * 최종 공시 확정된 공정 감사 로그 목록 반환
     */
    public List<AuditLogResponse> getApprovedAuditLogs() {
        return auditLogMapper.findApprovedAuditLogs();
    }
}
