package com.esg.platform.domain.metric.controller;

import com.esg.platform.domain.metric.dto.IndicatorResponse;
import com.esg.platform.domain.metric.dto.MetricCreateRequest;
import com.esg.platform.domain.metric.dto.MetricResponse;
import com.esg.platform.domain.metric.dto.MetricUpdateRequest;
import com.esg.platform.domain.metric.entity.DataStatus;
import com.esg.platform.domain.metric.service.MetricService;
import com.esg.platform.global.security.EsgUserPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/esg/metrics") // [수정] 앞에 /api를 추가
@RequiredArgsConstructor
public class MetricController {

    private final MetricService metricService;

    /**
     * ESG 데이터 목록 조회 (필터: 카테고리, 연도, 상태)
     * GET /esg/metrics?category=ENVIRONMENT&year=2026&status=PENDING
     */
    @GetMapping
    public ResponseEntity<List<MetricResponse>> getMetrics(
            @RequestParam(required = false) String category,
            @RequestParam(required = false) Integer year,
            @RequestParam(required = false) DataStatus status) {
        
        List<MetricResponse> metrics = metricService.getMetrics(category, year, status);
        return ResponseEntity.ok(metrics);
    }

    /**
     * [신규] ESG 데이터 등록
     * POST /api/esg/metrics
     * - submitForApproval=true면 등록과 동시에 승인 요청(PENDING)
     * - companyId / inputUserId는 인증 토큰에서 추출 (프론트 입력값 신뢰하지 않음)
     */
    @PostMapping
    public ResponseEntity<Map<String, Long>> createMetric(
            @RequestBody MetricCreateRequest request,
            @AuthenticationPrincipal EsgUserPrincipal principal) {

        Integer companyId = principal.getUser().getCompanyId() != null
                ? principal.getUser().getCompanyId().intValue()
                : 1; // 단일 기업 모델 폴백 (CompanyService.COMPANY_ID와 동일)
        Integer inputUserId = principal.getUser().getId().intValue();

        Long newId = metricService.createMetric(request, companyId, inputUserId);
        return ResponseEntity.created(URI.create("/api/esg/metrics/" + newId))
                .body(Map.of("id", newId));
    }

    /**
     * [신규] 활성 지표 마스터 목록 조회 (등록 폼 드롭다운용)
     * GET /api/esg/metrics/indicators
     */
    @GetMapping("/indicators")
    public ResponseEntity<List<IndicatorResponse>> getIndicators() {
        return ResponseEntity.ok(metricService.getIndicators());
    }

    /**
     * 특정 ESG 데이터 상세 조회
     * GET /esg/metrics/{id}
     */
    @GetMapping("/{id}")
    public ResponseEntity<MetricResponse> getMetricDetail(@PathVariable Long id) {
        MetricResponse detail = metricService.getMetricDetail(id);
        return ResponseEntity.ok(detail);
    }

    /**
     * ESG 데이터 수정
     * PUT /esg/metrics/{id}
     */
    @PutMapping("/{id}")
    public ResponseEntity<Void> updateMetric(
            @PathVariable Long id,
            @RequestBody MetricUpdateRequest request) {
        
        metricService.updateMetric(id, request);
        return ResponseEntity.noContent().build();
    }

    /**
     * 승인 요청 처리
     * PATCH /esg/metrics/{id}/request-approval
     */
    @PatchMapping("/{id}/request-approval")
    public ResponseEntity<Void> requestApproval(@PathVariable Long id) {
        metricService.requestApproval(id);
        return ResponseEntity.noContent().build();
    }

    /**
     * 최종 승인/반려 결정 (관리자 전용)
     * PATCH /api/esg/metrics/{id}/decide
     * [개선] approverId를 프론트 파라미터가 아닌 인증 토큰에서 추출하도록 변경
     *        (결재자 위변조 방지). comment는 반려 사유로 사용된다.
     */
    @PatchMapping("/{id}/decide")
    public ResponseEntity<Void> decideApproval(
            @PathVariable Long id,
            @RequestParam("decision") DataStatus decision,
            @RequestParam(value = "comment", required = false) String comment,
            @AuthenticationPrincipal EsgUserPrincipal principal) {

        // 잘못된 결재 상태(DRAFT 등)가 요청으로 들어오는 것을 방어
        if (decision == DataStatus.DRAFT || decision == DataStatus.PENDING) {
            throw new IllegalArgumentException("결정 상태는 APPROVED(승인) 또는 REJECTED(반려)만 가능합니다.");
        }

        // 반려 시 사유 필수 검증
        if (decision == DataStatus.REJECTED && (comment == null || comment.isBlank())) {
            throw new IllegalArgumentException("반려 시 사유를 입력해야 합니다.");
        }

        Integer approverId = principal.getUser().getId().intValue();
        metricService.decideApproval(id, decision, comment, approverId);
        return ResponseEntity.noContent().build();
    }
}
