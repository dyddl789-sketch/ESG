package com.esg.platform.domain.metric.controller;

import com.esg.platform.domain.metric.dto.MetricResponse;
import com.esg.platform.domain.metric.dto.MetricUpdateRequest;
import com.esg.platform.domain.metric.entity.DataStatus;
import com.esg.platform.domain.metric.service.MetricService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

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
     * PATCH /esg/metrics/{id}/decide
     * (프론트엔드 요구사항에 따라 /approve, /reject로 나누거나 통합 가능)
     */
    @PatchMapping("/{id}/decide")
    public ResponseEntity<Void> decideApproval(
            @PathVariable Long id,
            @RequestParam("decision") DataStatus decision, // 1. 바인딩 명시 보완
            @RequestParam(value = "comment", required = false) String comment,
            @RequestParam("approverId") Integer approverId) {
        
        // 2. 잘못된 결재 상태(DRAFT 등)가 요청으로 들어오는 것을 방어
        if (decision == DataStatus.DRAFT || decision == DataStatus.PENDING) {
            throw new IllegalArgumentException("결정 상태는 APPROVED(승인) 또는 REJECTED(반려)만 가능합니다.");
        }
        
        metricService.decideApproval(id, decision, comment, approverId);
        return ResponseEntity.noContent().build();
    }
}
