package com.esg.platform.domain.documentanalysis.controller;

import java.util.Map;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.esg.platform.domain.documentanalysis.dto.DocumentAnalysisResponse;
import com.esg.platform.domain.documentanalysis.service.DocumentAnalysisService;
import com.esg.platform.global.exception.BusinessException;
import com.esg.platform.global.exception.ErrorCode;
import com.esg.platform.global.response.ApiResponse;
import com.esg.platform.global.security.EsgUserPrincipal;

@RestController
@RequestMapping("/api/document-analysis")
public class DocumentAnalysisController {

    private final DocumentAnalysisService documentAnalysisService;

    public DocumentAnalysisController(DocumentAnalysisService documentAnalysisService) {
        this.documentAnalysisService = documentAnalysisService;
    }

    @PostMapping("/helper")
    @PreAuthorize("hasAnyRole('COMPANY_MANAGER', 'SYSTEM_ADMIN')")
    public ApiResponse<DocumentAnalysisResponse> getAiHelperData(
            @RequestParam(name = "fileUrl") String fileUrl,
            @AuthenticationPrincipal EsgUserPrincipal principal) {
        Long companyId = principal == null || principal.getUser() == null
                ? null
                : principal.getUser().getCompanyId();
        Long userId = principal == null || principal.getUser() == null
                ? null
                : principal.getUser().getId();
        return ApiResponse.ok(documentAnalysisService.generateAiHelperData(fileUrl, companyId, userId));
    }

    @PostMapping("/submit")
    @PreAuthorize("hasRole('COMPANY_MANAGER')")
    public ApiResponse<Map<String, Object>> submitFinalMetric(
            @RequestBody DocumentAnalysisResponse request,
            @AuthenticationPrincipal EsgUserPrincipal principal) {
        if (principal == null || principal.getUser() == null || principal.getUser().getCompanyId() == null) {
            throw new BusinessException(ErrorCode.FORBIDDEN, "소속 기업이 확인된 기업 ESG 관리자만 등록할 수 있습니다.");
        }

        Integer companyId = principal.getUser().getCompanyId().intValue();
        Integer userId = principal.getUser().getId().intValue();
        Long generatedId = documentAnalysisService.processUserFinalSubmission(request, companyId, userId);
        return ApiResponse.ok(Map.of(
                "success", true,
                "metricDataId", generatedId,
                "message", Boolean.TRUE.equals(request.getSubmitForApproval())
                        ? "승인 요청이 완료되었습니다."
                        : "작성 중 상태로 저장되었습니다."));
    }
}
