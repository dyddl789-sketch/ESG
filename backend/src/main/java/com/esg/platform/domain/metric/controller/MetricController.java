package com.esg.platform.domain.metric.controller;

import java.net.URI;
import java.util.List;
import java.util.Map;

import org.springframework.http.ResponseEntity;
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

import com.esg.platform.domain.metric.dto.IndicatorResponse;
import com.esg.platform.domain.metric.dto.MetricCreateRequest;
import com.esg.platform.domain.metric.dto.MetricResponse;
import com.esg.platform.domain.metric.entity.DataStatus;
import com.esg.platform.domain.metric.service.MetricService;
import com.esg.platform.global.security.EsgUserPrincipal;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/esg/metrics") 
@RequiredArgsConstructor
public class MetricController {

    private final MetricService metricService;

    /**
     * ESG 데이터 목록 조회 (필터: 카테고리, 연도, 상태)
     * GET /api/esg/metrics?category=ENVIRONMENT&year=2026&status=PENDING
     */
    @GetMapping
    public ResponseEntity<List<MetricResponse>> getMetrics(
            @RequestParam(name = "category", required = false) String category,
            @RequestParam(name = "year", required = false) Integer year,
            @RequestParam(name = "status", required = false) DataStatus status) {
        
        List<MetricResponse> metrics = metricService.getMetrics(category, year, status);
        return ResponseEntity.ok(metrics);
    }

    /**
     * ESG 데이터 등록
     * POST /api/esg/metrics
     * - submitForApproval=true면 등록과 동시에 승인 요청(PENDING)
     */
    @PostMapping
    public ResponseEntity<Map<String, Long>> createMetric(
            @RequestBody MetricCreateRequest request,
            @AuthenticationPrincipal EsgUserPrincipal principal) {

        Integer companyId = principal.getUser().getCompanyId() != null
                ? principal.getUser().getCompanyId().intValue()
                : 1; 
        Integer inputUserId = principal.getUser().getId().intValue();

        Long newId = metricService.createMetric(request, companyId, inputUserId);
        return ResponseEntity.created(URI.create("/api/esg/metrics/" + newId))
                .body(Map.of("id", newId));
    }

    /**
     * 활성 지표 마스터 목록 조회 (등록 폼 드롭다운용)
     * GET /api/esg/metrics/indicators
     */
    @GetMapping("/indicators")
    public ResponseEntity<List<IndicatorResponse>> getIndicators() {
        return ResponseEntity.ok(metricService.getIndicators());
    }

    /**
     * 특정 ESG 데이터 상세 조회
     * GET /api/esg/metrics/{id}
     */
    @GetMapping("/{id}")
    public ResponseEntity<MetricResponse> getMetricDetail(@PathVariable(name = "id") Long id) {
        MetricResponse detail = metricService.getMetricDetail(id);
        return ResponseEntity.ok(detail);
    }

    /**
     * ESG 데이터 수정
     * PUT /api/esg/metrics/{id}
     */
    @PutMapping("/{id}")
    public ResponseEntity<Void> updateMetric(
            @PathVariable(name = "id") Long id,
            @RequestBody MetricCreateRequest request) { // 💡 프론트엔드가 던지는 폼 페이로드 수신
        
        metricService.updateMetric(id, request); // 💡 2단계의 고도화 서비스 로직 트리거 실행
        return ResponseEntity.ok().build();
    }

    /**
     * 승인 요청 처리
     * PATCH /api/esg/metrics/{id}/request-approval
     */
    @PatchMapping("/{id}/request-approval")
    public ResponseEntity<Void> requestApproval(@PathVariable(name = "id") Long id) {
        metricService.requestApproval(id);
        return ResponseEntity.noContent().build();
    }

    /**
     * 최종 승인/반려 결정 (관리자 전용)
     * PATCH /api/esg/metrics/{id}/decide
     */
    @PatchMapping("/{id}/decide")
    public ResponseEntity<Void> decideApproval(
            @PathVariable(name = "id") Long id,
            @RequestParam("decision") DataStatus decision,
            @RequestParam(value = "comment", required = false) String comment,
            @AuthenticationPrincipal EsgUserPrincipal principal) {

        if (decision == DataStatus.DRAFT || decision == DataStatus.PENDING) {
            throw new IllegalArgumentException("결정 상태는 APPROVED(승인) 또는 REJECTED(반려)만 가능합니다.");
        }

        if (decision == DataStatus.REJECTED && (comment == null || comment.isBlank())) {
            throw new IllegalArgumentException("반려 시 사유를 입력해야 합니다.");
        }

        Integer approverId = principal.getUser().getId().intValue();
        metricService.decideApproval(id, decision, comment, approverId);
        return ResponseEntity.noContent().build();
    }

    /*
     * 반려(REJECTED) 상태인 지표 데이터 단건 삭제 API
     * 최종 결합 경로: DELETE /api/esg/metrics/{id}
     */
    @DeleteMapping("/{id}") // 💡 절대경로 기법인 /api/metrics/ 를 과감히 걷어내고, 클래스 공통 주소인 /api/esg/metrics/{id} 규칙으로 완벽히 통일시킵니다.
    public ResponseEntity<Void> deleteMetric(@PathVariable(name = "id") Long id) {
        metricService.removeRejectedMetric(id); 
        return ResponseEntity.ok().build();
    }
}
