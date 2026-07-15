package com.esg.platform.domain.documentanalysis.controller;

import com.esg.platform.domain.documentanalysis.dto.DocumentAnalysisResponse;
import com.esg.platform.domain.documentanalysis.service.DocumentAnalysisService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/document-analysis")
@RequiredArgsConstructor
public class DocumentAnalysisController {

    private final DocumentAnalysisService documentAnalysisService;

    /**
     * 1. 파일 업로드 후 AI 프리필 예측값 요청 API
     */
    @PostMapping("/helper")
    public ResponseEntity<DocumentAnalysisResponse> getAiHelperData(@RequestParam("fileUrl") String fileUrl) {
        DocumentAnalysisResponse helperData = documentAnalysisService.generateAiHelperData(fileUrl);
        return ResponseEntity.ok(helperData);
    }

    /**
     * 2. 사용자가 최종 점검 수정한 데이터를 결재선에 상신하거나 임시저장(DRAFT) 처리하는 통합 API
     * (인증 토큰 등에서 파싱한 companyId=1, userId=2 임시 세팅 예시)
     */
    @PostMapping("/submit")
    public ResponseEntity<Map<String, Object>> submitFinalMetric(@RequestBody DocumentAnalysisResponse request) {
        // 실제 상용 시 시큐리티 컨텍스트 유저 정보 매핑 필요
        Integer mockCompanyId = 1;
        Integer mockUserId = 2;
        
        Long generatedId = documentAnalysisService.processUserFinalSubmission(request, mockCompanyId, mockUserId);
        
        return ResponseEntity.ok(Map.of(
            "success", true,
            "metricDataId", generatedId,
            "message", Boolean.TRUE.equals(request.getSubmitForApproval()) ? "결재 신청 완료" : "작성중(DRAFT) 저장 완료"
        ));
    }
}
