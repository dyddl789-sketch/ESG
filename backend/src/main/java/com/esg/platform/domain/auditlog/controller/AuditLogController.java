package com.esg.platform.domain.auditlog.controller;

import java.time.LocalDate;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.esg.platform.domain.auditlog.dto.AuditLogPageResponse;
import com.esg.platform.domain.auditlog.service.AuditLogService;

@RestController
@RequestMapping("/api/audit-logs")
@PreAuthorize("hasRole('SYSTEM_ADMIN')")
public class AuditLogController {

    private final AuditLogService auditLogService;

    public AuditLogController(AuditLogService auditLogService) {
        this.auditLogService = auditLogService;
    }

    @GetMapping
    public ResponseEntity<AuditLogPageResponse> getAuditLogs(
            @RequestParam(name = "page", defaultValue = "0") int page,
            @RequestParam(name = "size", defaultValue = "50") int size,
            @RequestParam(name = "facilityId", required = false) Long facilityId,
            @RequestParam(name = "indicatorId", required = false) Long indicatorId,
            @RequestParam(name = "action", required = false) String action,
            @RequestParam(name = "fromDate", required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @RequestParam(name = "toDate", required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate) {

        return ResponseEntity.ok(auditLogService.getAuditLogs(
                page,
                size,
                facilityId,
                indicatorId,
                action,
                fromDate,
                toDate));
    }
}
