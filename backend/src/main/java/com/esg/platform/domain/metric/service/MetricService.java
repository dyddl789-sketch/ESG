package com.esg.platform.domain.metric.service;

import com.esg.platform.domain.metric.dto.IndicatorResponse;
import com.esg.platform.domain.metric.dto.MetricCreateRequest;
import com.esg.platform.domain.metric.dto.MetricResponse;
import com.esg.platform.domain.metric.entity.DataStatus;
import com.esg.platform.domain.metric.entity.EsgMetricData;
import com.esg.platform.domain.metric.entity.PeriodType;
import com.esg.platform.domain.metric.mapper.MetricMapper;
import lombok.RequiredArgsConstructor; // 💡 [완치] @RequiredArgsConstructor 에러를 해결하는 핵심 롬복 임포트
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
                .filter(m -> m.getId().equals(id))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("해당 데이터를 찾을 수 없습니다. ID: " + id));
    }

    @Transactional
    public void updateMetric(Long id, MetricCreateRequest request) {
        EsgMetricData data = metricMapper.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("데이터가 존재하지 않습니다."));
        
        data.setId(id);
        data.setIndicatorId(request.indicatorId());
        data.setFacilityId(request.facilityId());
        data.setReportingYear(request.reportingYear());
        
        // 💡 [해결 핵심] 문자열로 들어온 주기를 엔티티 타입인 PeriodType 이넘으로 안전하게 변환 주입!
        if (request.periodType() != null && !request.periodType().isBlank()) {
            data.setPeriodType(PeriodType.valueOf(request.periodType().toUpperCase().trim()));
        }
        data.setPeriodValue(request.periodValue());

        // 수치, 비고, 파일 경로 저장 원천 보장
        data.setNumericalValue(request.value());
        data.setTextValue(request.textValue()); 
        data.setEvidenceFileUrl(request.evidenceFileUrl());
        
        boolean isSubmitClick = Boolean.TRUE.equals(request.submitForApproval());

        if (DataStatus.REJECTED == data.getStatus() && isSubmitClick) {
            data.setStatus(DataStatus.PENDING);
            metricMapper.resubmitRejectedMetric(data);
        } else {
            if (isSubmitClick) {
                data.setStatus(DataStatus.PENDING);
            } else {
                data.setStatus(DataStatus.DRAFT);
            }
            metricMapper.updateMetricData(data);
        }
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

    /**
     * 지정한 ID의 메트릭 데이터를 데이터베이스에서 완전히 삭제 (반려 데이터 파기용)
     */
    @Transactional
    public void removeRejectedMetric(Long id) {
        metricMapper.deleteMetricById(id);
    }
}
