package com.esg.platform.domain.metric.controller;

import java.util.List;
import java.util.Map;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.esg.platform.domain.member.entity.UserRole;
import com.esg.platform.domain.metric.dto.IndicatorResponse;
import com.esg.platform.domain.metric.dto.MetricBatchResult;
import com.esg.platform.domain.metric.dto.MetricCreateRequest;
import com.esg.platform.domain.metric.dto.MetricDto;
import com.esg.platform.domain.metric.service.MetricService;
import com.esg.platform.domain.metric.service.MetricWorkflowService;
import com.esg.platform.global.response.ApiResponse;
import com.esg.platform.global.security.EsgUserPrincipal;

@RestController
@RequestMapping("/api/esg/metrics")
public class MetricController {

    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(MetricController.class);

    private final MetricWorkflowService workflowService;
    private final MetricService metricService;

    public MetricController(MetricWorkflowService workflowService, MetricService metricService) {
        this.workflowService = workflowService;
        this.metricService = metricService;
    }

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

    @GetMapping("/periods")
    @PreAuthorize("hasAnyRole('SYSTEM_ADMIN', 'COMPANY_MANAGER', 'EXTERNAL_USER')")
    public ApiResponse<List<String>> getAvailablePeriods(
            @RequestParam(name = "category", required = false) String category,
            @RequestParam(name = "status", required = false) String status,
            @RequestParam(name = "facilityId", required = false) Long facilityId,
            @RequestParam(name = "approvedOnly", defaultValue = "false") boolean approvedOnly,
            @RequestParam(name = "benchmarkReady", defaultValue = "false") boolean benchmarkReady,
            @AuthenticationPrincipal EsgUserPrincipal principal) {
        boolean resolvedApprovedOnly = approvedOnly || isExternal(principal);
        return ApiResponse.ok(workflowService.getAvailablePeriods(
                resolveCompanyId(principal),
                category,
                status,
                facilityId,
                resolvedApprovedOnly,
                benchmarkReady));
    }

    @GetMapping("/indicators")
    @PreAuthorize("hasAnyRole('SYSTEM_ADMIN', 'COMPANY_MANAGER')")
    public ApiResponse<List<IndicatorResponse>> getIndicators() {
        return ApiResponse.ok(metricService.getIndicators());
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('SYSTEM_ADMIN', 'COMPANY_MANAGER', 'EXTERNAL_USER')")
    public ApiResponse<MetricDto> getMetric(
            @PathVariable(name = "id") Long id,
            @AuthenticationPrincipal EsgUserPrincipal principal) {
        return ApiResponse.ok(workflowService.getMetric(id, isExternal(principal)));
    }

    @PostMapping
    @PreAuthorize("hasRole('COMPANY_MANAGER')")
    public ApiResponse<Map<String, Long>> createMetric(
            @RequestBody MetricCreateRequest request,
            @AuthenticationPrincipal EsgUserPrincipal principal) {
        Long userId = principal.getUser().getId();
        Integer companyId = principal.getUser().getCompanyId() == null
                ? 1
                : principal.getUser().getCompanyId().intValue();
        Long metricId = metricService.createMetric(request, companyId, userId.intValue());
        if (Boolean.TRUE.equals(request.submitForApproval())) {
            workflowService.requestApproval(metricId, userId);
        }
        log.info("[ESG_METRIC] 지표 등록 metricId={} companyId={} userId={} submit={}",
                metricId, companyId, userId, Boolean.TRUE.equals(request.submitForApproval()));
        return ApiResponse.ok(Map.of("id", metricId));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('COMPANY_MANAGER')")
    public ApiResponse<MetricDto> updateMetric(
            @PathVariable(name = "id") Long id,
            @RequestBody MetricCreateRequest request,
            @AuthenticationPrincipal EsgUserPrincipal principal) {
        Long userId = principal.getUser().getId();
        metricService.updateMetric(id, request, userId.intValue());
        if (Boolean.TRUE.equals(request.submitForApproval())) {
            return ApiResponse.ok(workflowService.requestApproval(id, userId));
        }
        return ApiResponse.ok(workflowService.getMetric(id, false));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('COMPANY_MANAGER')")
    public ApiResponse<Void> deleteRejectedMetric(
            @PathVariable(name = "id") Long id,
            @AuthenticationPrincipal EsgUserPrincipal principal) {
        metricService.removeRejectedMetric(id, principal.getUser().getId());
        return ApiResponse.ok();
    }

    @PatchMapping("/{id}/request-approval")
    @PreAuthorize("hasRole('COMPANY_MANAGER')")
    public ApiResponse<MetricDto> requestApproval(
            @PathVariable(name = "id") Long id,
            @AuthenticationPrincipal EsgUserPrincipal principal) {
        return ApiResponse.ok(workflowService.requestApproval(id, principal.getUser().getId()));
    }

    @PatchMapping("/batch/request-approval")
    @PreAuthorize("hasRole('COMPANY_MANAGER')")
    public ApiResponse<MetricBatchResult> requestApprovalBatch(
            @RequestParam(name = "period") String period,
            @RequestParam(name = "category", required = false) String category,
            @AuthenticationPrincipal EsgUserPrincipal principal) {
        return ApiResponse.ok(workflowService.requestApprovalBatch(period, category, principal.getUser().getId()));
    }

    private Long resolveCompanyId(EsgUserPrincipal principal) {
        if (principal == null || principal.getUser() == null || principal.getUser().getCompanyId() == null) {
            return 1L;
        }
        return principal.getUser().getCompanyId();
    }

    private boolean isExternal(EsgUserPrincipal principal) {
        return principal != null && principal.getUser().getRole() == UserRole.EXTERNAL_USER;
    }
}
