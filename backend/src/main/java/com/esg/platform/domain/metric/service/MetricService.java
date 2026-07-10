package com.esg.platform.domain.metric.service;

import com.esg.platform.domain.metric.dto.MetricResponse;
import com.esg.platform.domain.metric.dto.MetricUpdateRequest;
import com.esg.platform.domain.metric.entity.DataStatus;
import com.esg.platform.domain.metric.entity.EsgMetricData;
import com.esg.platform.domain.metric.mapper.MetricMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class MetricService {

    private final MetricMapper metricMapper;

    /**
     * 필터 조건에 따른 ESG 데이터 목록 조회
     */
    public List<MetricResponse> getMetrics(String category, Integer year, DataStatus status) {
        return metricMapper.findMetricsByFilters(category, year, status);
    }

    /**
     * 특정 데이터 상세 정보 조회
     */
    public MetricResponse getMetricDetail(Long id) {
        return metricMapper.findMetricsByFilters(null, null, null)
                .stream()
                .filter(m -> m.id().equals(id))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("해당 데이터를 찾을 수 없습니다. ID: " + id));
    }

    /**
     * 데이터 수정 (수치 및 증빙자료 업데이트)
     */
    @Transactional
    public void updateMetric(Long id, MetricUpdateRequest request) {
        EsgMetricData data = metricMapper.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("데이터가 존재하지 않습니다."));
        
        data.setNumericalValue(request.value());
        data.setEvidenceFileUrl(request.evidenceFileUrl());
        
        metricMapper.updateMetricData(data);
    }

    /**
     * 승인 요청 처리
     */
    @Transactional
    public void requestApproval(Long id) {
        metricMapper.updateStatus(id, DataStatus.PENDING, null, null);
    }

    /**
     * 최종 승인 또는 반려 처리 (관리자 권한)
     */
    @Transactional
    public void decideApproval(Long id, DataStatus decision, String comment, Integer approverId) {
        metricMapper.updateStatus(id, decision, approverId, comment);
    }
}
