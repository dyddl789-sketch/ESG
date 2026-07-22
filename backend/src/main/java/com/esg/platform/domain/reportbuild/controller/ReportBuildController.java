package com.esg.platform.domain.reportbuild.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.esg.platform.domain.reportbuild.dto.request.ReportCreateRequest;
import com.esg.platform.domain.reportbuild.dto.response.ReportBuildResponse;
import com.esg.platform.domain.reportbuild.dto.response.ReportMetricResponse;
import com.esg.platform.domain.reportbuild.dto.response.ReportTemplateResponse;
import com.esg.platform.domain.reportbuild.service.ReportBuildService;
import com.esg.platform.global.exception.BusinessException;
import com.esg.platform.global.exception.ErrorCode;
import com.esg.platform.global.security.EsgUserPrincipal;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@RestController
@RequestMapping("/api/reports")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('SYSTEM_ADMIN', 'COMPANY_MANAGER')")
public class ReportBuildController {

    private final ReportBuildService reportService;

    @PostMapping
    public ResponseEntity<ReportBuildResponse> createReport(
            @Valid @RequestBody ReportCreateRequest request,
            @AuthenticationPrincipal EsgUserPrincipal principal) {

        Long userId = requireUserId(principal);
        Long companyId = requireCompanyId(principal);

        log.info("[REPORT] 보고서 저장 요청 companyId={} userId={} targetYear={} templateId={}",
                companyId, userId, request.getTargetYear(), request.getTemplateId());

        ReportBuildResponse response = reportService.createReport(request, userId, companyId);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/templates")
    public ResponseEntity<List<ReportTemplateResponse>> getTemplates() {
        return ResponseEntity.ok(reportService.getTemplates());
    }

    @GetMapping("/facilities")
    public ResponseEntity<List<String>> getFacilities(
            @AuthenticationPrincipal EsgUserPrincipal principal) {
        return ResponseEntity.ok(reportService.getFacilities(requireCompanyId(principal)));
    }

    // [신규 추가] 리포트 전용 실적 데이터를 내려주는 API 엔드포인트 매핑
    @GetMapping("/metrics")
    public ResponseEntity<List<ReportMetricResponse>> getReportMetrics(
            @RequestParam(name = "year", defaultValue = "2026") int year,
            @AuthenticationPrincipal EsgUserPrincipal principal) {
        return ResponseEntity.ok(reportService.getReportMetrics(requireCompanyId(principal), year));
    }

    @GetMapping
    public ResponseEntity<List<ReportBuildResponse>> getGeneratedReports(
            @AuthenticationPrincipal EsgUserPrincipal principal) {
        return ResponseEntity.ok(reportService.getGeneratedReports(requireCompanyId(principal)));
    }

    @PatchMapping("/{id}/public")
    public ResponseEntity<Void> togglePublicStatus(
            @PathVariable("id") Long id,
            @RequestParam("isPublic") Boolean isPublic,
            @AuthenticationPrincipal EsgUserPrincipal principal) {
        reportService.togglePublicStatus(id, isPublic, requireCompanyId(principal));
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteReport(
            @PathVariable("id") Long id,
            @AuthenticationPrincipal EsgUserPrincipal principal) {
        reportService.deleteReport(id, requireCompanyId(principal));
        return ResponseEntity.noContent().build();
    }

    private Long requireUserId(EsgUserPrincipal principal) {
        if (principal == null || principal.getUser() == null || principal.getUser().getId() == null) {
            throw new BusinessException(ErrorCode.UNAUTHORIZED);
        }
        return principal.getUser().getId();
    }

    private Long requireCompanyId(EsgUserPrincipal principal) {
        if (principal == null || principal.getUser() == null) {
            throw new BusinessException(ErrorCode.UNAUTHORIZED);
        }
        if (principal.getUser().getCompanyId() == null) {
            throw new BusinessException(ErrorCode.FORBIDDEN, "소속 기업 정보가 없는 계정은 보고서를 관리할 수 없습니다.");
        }
        return principal.getUser().getCompanyId();
    }
}
