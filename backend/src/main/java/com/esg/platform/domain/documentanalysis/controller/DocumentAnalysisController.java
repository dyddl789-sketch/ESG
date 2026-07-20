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
import com.esg.platform.global.response.ApiResponse;
import com.esg.platform.global.security.EsgUserPrincipal;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/document-analysis")
@RequiredArgsConstructor
public class DocumentAnalysisController {

    private final DocumentAnalysisService documentAnalysisService;

    @PostMapping("/helper")
    @PreAuthorize("hasAnyRole('COMPANY_MANAGER', 'SYSTEM_ADMIN')")
    public ApiResponse<DocumentAnalysisResponse> getAiHelperData(
            @RequestParam(name = "fileUrl") String fileUrl) {
        return ApiResponse.ok(documentAnalysisService.generateAiHelperData(fileUrl));
    }

    @PostMapping("/submit")
    @PreAuthorize("hasRole('COMPANY_MANAGER')")
    public ApiResponse<Map<String, Object>> submitFinalMetric(
            @RequestBody DocumentAnalysisResponse request,
            @AuthenticationPrincipal EsgUserPrincipal principal) {
        Integer companyId = principal.getUser().getCompanyId() == null
                ? 1
                : principal.getUser().getCompanyId().intValue();
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
