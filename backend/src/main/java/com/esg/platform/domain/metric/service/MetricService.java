package com.esg.platform.domain.metric.service;

import com.esg.platform.domain.metric.dto.IndicatorResponse;
import com.esg.platform.domain.metric.dto.MetricCreateRequest;
import com.esg.platform.domain.metric.dto.MetricResponse;
import com.esg.platform.domain.metric.dto.MetricUpdateRequest;
import com.esg.platform.domain.metric.entity.DataStatus;
import com.esg.platform.domain.metric.entity.EsgMetricData;
import com.esg.platform.domain.metric.entity.PeriodType;
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
        
        // 1. 기존 정량 데이터 수치 업데이트 (유지)
        data.setNumericalValue(request.value());
        
        // 2. [보완] 누락되었던 정성 데이터(텍스트형) 업데이트 반영
        data.setTextValue(request.textValue()); 
        
        // 3. 기존 증빙파일 URL 업데이트 (유지)
        data.setEvidenceFileUrl(request.evidenceFileUrl());
        
        // 4. [보완] 반려 사유나 의견(comment)이 유입되었을 경우 rejectReason에 바인딩
        if (request.comment() != null) {
            data.setRejectReason(request.comment());
        }
        
        metricMapper.updateMetricData(data);
    }

    /**
     * [신규] ESG 데이터 등록
     * - submitForApproval=true면 등록과 동시에 승인 요청(PENDING) 상태로 생성
     * - companyId / inputUserId는 인증 정보에서 전달받아 서버가 직접 설정 (위변조 방지)
     */
    @Transactional
    public Long createMetric(MetricCreateRequest request, Integer companyId, Integer inputUserId) {
        if (request.indicatorId() == null) {
            throw new IllegalArgumentException("지표를 선택해주세요.");
        }
        if (request.reportingYear() == null || request.periodValue() == null) {
            throw new IllegalArgumentException("보고 연도와 기간을 입력해주세요.");
        }
        if (request.value() == null && (request.textValue() == null || request.textValue().isBlank())) {
            throw new IllegalArgumentException("측정값 또는 내용을 입력해주세요.");
        }

        PeriodType periodType = request.periodType() == null || request.periodType().isBlank()
                ? PeriodType.MONTHLY
                : PeriodType.valueOf(request.periodType());

        boolean submit = Boolean.TRUE.equals(request.submitForApproval());

        EsgMetricData data = EsgMetricData.builder()
                .companyId(companyId)
                .facilityId(request.facilityId())
                .indicatorId(request.indicatorId())
                .reportingYear(request.reportingYear())
                .periodType(periodType)
                .periodValue(request.periodValue())
                .numericalValue(request.value())
                .textValue(request.textValue())
                .evidenceFileUrl(request.evidenceFileUrl())
                .status(submit ? DataStatus.PENDING : DataStatus.DRAFT)
                .dataSourceType("MANUAL")
                .inputUserId(inputUserId)
                .build();

        metricMapper.insertMetricData(data);
        return data.getId();
    }

    /**
     * [신규] 활성 지표 마스터 목록 조회 (등록 폼 드롭다운용)
     */
    public List<IndicatorResponse> getIndicators() {
        return metricMapper.findActiveIndicators();
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
