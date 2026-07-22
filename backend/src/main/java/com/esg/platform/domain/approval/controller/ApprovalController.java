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
import com.esg.platform.domain.notification.service.NotificationService;
import com.esg.platform.global.response.ApiResponse;
import com.esg.platform.global.security.EsgUserPrincipal;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/approvals")
@PreAuthorize("hasRole('SYSTEM_ADMIN')")
public class ApprovalController {

    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(ApprovalController.class);

    private final MetricWorkflowService workflowService;
    private final NotificationService notificationService;

    public ApprovalController(
            MetricWorkflowService workflowService,
            NotificationService notificationService) {
        this.workflowService = workflowService;
        this.notificationService = notificationService;
    }

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
        Long userId = principal.getUser().getId();
        MetricDto approved = workflowService.approve(id, userId);
        notifyApproved(approved, userId);
        return ApiResponse.ok(approved);
    }

    @PatchMapping("/{id}/reject")
    public ApiResponse<MetricDto> reject(
            @PathVariable(name = "id") Long id,
            @Valid @RequestBody RejectRequest request,
            @AuthenticationPrincipal EsgUserPrincipal principal) {
        Long userId = principal.getUser().getId();
        MetricDto rejected = workflowService.reject(id, request.reason(), userId);
        notifyRejected(rejected, userId);
        return ApiResponse.ok(rejected);
    }

    private void notifyApproved(MetricDto metric, Long actorUserId) {
        try {
            notificationService.createApproved(metric, actorUserId);
        } catch (RuntimeException exception) {
            log.warn("[NOTIFICATION] 승인 완료 알림 생성 실패 metricId={} actorUserId={} reason={}",
                    metric == null ? null : metric.getId(), actorUserId, exception.getClass().getSimpleName());
        }
    }

    private void notifyRejected(MetricDto metric, Long actorUserId) {
        try {
            notificationService.createRejected(metric, actorUserId);
        } catch (RuntimeException exception) {
            log.warn("[NOTIFICATION] 반려 알림 생성 실패 metricId={} actorUserId={} reason={}",
                    metric == null ? null : metric.getId(), actorUserId, exception.getClass().getSimpleName());
        }
    }

    @PatchMapping("/batch/approve")
    public ApiResponse<MetricBatchResult> approveBatch(
            @RequestParam(name = "period") String period,
            @RequestParam(name = "category", required = false) String category,
            @AuthenticationPrincipal EsgUserPrincipal principal) {
        return ApiResponse.ok(workflowService.approveBatch(period, category, principal.getUser().getId()));
    }
}
