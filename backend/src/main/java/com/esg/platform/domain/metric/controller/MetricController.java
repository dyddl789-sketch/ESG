package com.esg.platform.domain.metric.controller;

import java.util.List;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.esg.platform.domain.member.entity.UserRole;
import com.esg.platform.domain.metric.dto.MetricBatchResult;
import com.esg.platform.domain.metric.dto.MetricDto;
import com.esg.platform.domain.metric.service.MetricWorkflowService;
import com.esg.platform.global.response.ApiResponse;
import com.esg.platform.global.security.EsgUserPrincipal;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/esg/metrics")
@RequiredArgsConstructor
public class MetricController {

    private final MetricWorkflowService workflowService;

    @GetMapping
    @PreAuthorize("hasAnyRole('SYSTEM_ADMIN', 'COMPANY_MANAGER', 'EXTERNAL_USER')")
    public ApiResponse<List<MetricDto>> getMetrics(
            @RequestParam(name = "year", required = false) Integer year,
            @RequestParam(name = "period", required = false) String period,
            @RequestParam(name = "category", required = false) String category,
            @RequestParam(name = "status", required = false) String status,
            @RequestParam(name = "facilityId", required = false) Long facilityId,
            @RequestParam(name = "search", required = false) String search,
            @AuthenticationPrincipal EsgUserPrincipal principal) {
        return ApiResponse.ok(workflowService.getMetrics(
                year, period, category, status, facilityId, search, isExternal(principal)));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('SYSTEM_ADMIN', 'COMPANY_MANAGER', 'EXTERNAL_USER')")
    public ApiResponse<MetricDto> getMetric(
            @PathVariable(name = "id") Long id,
            @AuthenticationPrincipal EsgUserPrincipal principal) {
        return ApiResponse.ok(workflowService.getMetric(id, isExternal(principal)));
    }

    @PostMapping("/{id}/ai-analysis")
    @PreAuthorize("hasAnyRole('SYSTEM_ADMIN', 'COMPANY_MANAGER')")
    public ApiResponse<MetricDto> analyze(
            @PathVariable(name = "id") Long id,
            @AuthenticationPrincipal EsgUserPrincipal principal) {
        return ApiResponse.ok(workflowService.analyze(id, principal.getUser().getId()));
    }

    @PatchMapping("/{id}/request-approval")
    @PreAuthorize("hasRole('COMPANY_MANAGER')")
    public ApiResponse<MetricDto> requestApproval(
            @PathVariable(name = "id") Long id,
            @AuthenticationPrincipal EsgUserPrincipal principal) {
        return ApiResponse.ok(workflowService.requestApproval(id, principal.getUser().getId()));
    }

    @PostMapping("/batch/ai-analysis")
    @PreAuthorize("hasAnyRole('SYSTEM_ADMIN', 'COMPANY_MANAGER')")
    public ApiResponse<MetricBatchResult> analyzeBatch(
            @RequestParam(name = "period") String period,
            @RequestParam(name = "category", required = false) String category,
            @AuthenticationPrincipal EsgUserPrincipal principal) {
        return ApiResponse.ok(workflowService.analyzeBatch(period, category, principal.getUser().getId()));
    }

    @PatchMapping("/batch/request-approval")
    @PreAuthorize("hasRole('COMPANY_MANAGER')")
    public ApiResponse<MetricBatchResult> requestApprovalBatch(
            @RequestParam(name = "period") String period,
            @RequestParam(name = "category", required = false) String category,
            @AuthenticationPrincipal EsgUserPrincipal principal) {
        return ApiResponse.ok(workflowService.requestApprovalBatch(period, category, principal.getUser().getId()));
    }

    private boolean isExternal(EsgUserPrincipal principal) {
        return principal != null && principal.getUser().getRole() == UserRole.EXTERNAL_USER;
    }
}
