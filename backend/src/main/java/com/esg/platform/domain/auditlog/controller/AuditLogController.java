package com.esg.platform.domain.auditlog.controller;

import com.esg.platform.domain.auditlog.dto.AuditLogResponse;
import com.esg.platform.domain.auditlog.service.AuditLogService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/audit-logs") // 💡 프론트엔드가 호출할 유연한 인프라 공용 API 주소 정의
public class AuditLogController {

    private final AuditLogService auditLogService;

    /**
     * 💡 [최종 동기화] 프론트엔드 DataTable 컴포넌트의 데이터 갈아끼우기용 실시간 리얼 DB API 데이터 배포
     */
    @GetMapping
    public ResponseEntity<List<AuditLogResponse>> getAllApprovedLogs() {
        List<AuditLogResponse> logs = auditLogService.getApprovedAuditLogs();
        return ResponseEntity.ok(logs);
    }
}
