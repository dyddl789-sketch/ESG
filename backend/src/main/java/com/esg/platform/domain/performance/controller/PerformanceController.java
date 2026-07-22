package com.esg.platform.domain.performance.controller;

import java.util.List;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.esg.platform.domain.performance.dto.response.PerformanceResponse;
import com.esg.platform.domain.performance.service.PerformanceService;
import com.esg.platform.global.security.EsgUserPrincipal;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@RestController
@RequestMapping("/api/performance")
@RequiredArgsConstructor
public class PerformanceController {

    private final PerformanceService performanceService;

    @GetMapping
    @PreAuthorize("hasAnyRole('SYSTEM_ADMIN', 'COMPANY_MANAGER')")
    public ResponseEntity<Map<String, Object>> getPerformanceList(
            @RequestParam(name = "year", defaultValue = "2026") int year,
            @AuthenticationPrincipal EsgUserPrincipal principal) {

        Long companyId = principal.getUser().getCompanyId() == null
                ? 1L
                : principal.getUser().getCompanyId();

        log.info("[PERFORMANCE] 승인 실적 조회 companyId={} year={} loginId={}",
                companyId, year, principal.getUsername());

        List<PerformanceResponse> data = performanceService.getPerformanceList(companyId, year);
        return ResponseEntity.ok(Map.of("data", data));
    }
    @GetMapping("/governance-targets")
    @PreAuthorize("hasAnyRole('SYSTEM_ADMIN', 'COMPANY_MANAGER', 'EXTERNAL_USER')")
    public ResponseEntity<Map<String, Object>> getGovernanceTargets(
            @RequestParam(name = "year", defaultValue = "2026") int year,
            @AuthenticationPrincipal EsgUserPrincipal principal) {

        Long companyId = principal.getUser().getCompanyId() == null
                ? 1L
                : principal.getUser().getCompanyId();

        log.info("[PERFORMANCE_TARGET] 거버넌스 목표 API companyId={} year={} loginId={}",
                companyId, year, principal.getUsername());

        List<Map<String, Object>> data = performanceService.getGovernanceTargets(companyId, year);
        return ResponseEntity.ok(Map.of("data", data));
    }

}