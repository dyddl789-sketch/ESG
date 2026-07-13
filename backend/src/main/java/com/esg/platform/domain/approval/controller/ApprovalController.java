package com.esg.platform.domain.approval.controller;

import java.util.List;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.esg.platform.domain.approval.dto.RejectRequest;
import com.esg.platform.domain.metric.dto.MetricBatchResult;
import com.esg.platform.domain.metric.dto.MetricDto;
import com.esg.platform.domain.metric.service.MetricWorkflowService;
import com.esg.platform.global.response.ApiResponse;
import com.esg.platform.global.security.EsgUserPrincipal;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/approvals")
@RequiredArgsConstructor
@PreAuthorize("hasRole('SYSTEM_ADMIN')")
public class ApprovalController {

    private final MetricWorkflowService workflowService;

    @GetMapping
    public ApiResponse<List<MetricDto>> getPending(
            @RequestParam(name = "period", required = false) String period,
            @RequestParam(name = "category", required = false) String category,
            @RequestParam(name = "facilityId", required = false) Long facilityId,
            @RequestParam(name = "search", required = false) String search) {
        return ApiResponse.ok(workflowService.getMetrics(
                null, period, category, "PENDING", facilityId, search, false));
    }

    @PatchMapping("/{id}/approve")
    public ApiResponse<MetricDto> approve(
            @PathVariable(name = "id") Long id,
            @AuthenticationPrincipal EsgUserPrincipal principal) {
        return ApiResponse.ok(workflowService.approve(id, principal.getUser().getId()));
    }

    @PatchMapping("/{id}/reject")
    public ApiResponse<MetricDto> reject(
            @PathVariable(name = "id") Long id,
            @Valid @RequestBody RejectRequest request,
            @AuthenticationPrincipal EsgUserPrincipal principal) {
        return ApiResponse.ok(workflowService.reject(id, request.reason(), principal.getUser().getId()));
    }

    @PatchMapping("/batch/approve")
    public ApiResponse<MetricBatchResult> approveBatch(
            @RequestParam(name = "period") String period,
            @RequestParam(name = "category", required = false) String category,
            @AuthenticationPrincipal EsgUserPrincipal principal) {
        return ApiResponse.ok(workflowService.approveBatch(period, category, principal.getUser().getId()));
    }
}
