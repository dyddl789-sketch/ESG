package com.esg.platform.domain.metric.service;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.esg.platform.domain.metric.dto.IndicatorResponse;
import com.esg.platform.domain.metric.dto.MetricCreateRequest;
import com.esg.platform.domain.metric.entity.DataStatus;
import com.esg.platform.domain.metric.entity.EsgMetricData;
import com.esg.platform.domain.metric.entity.PeriodType;
import com.esg.platform.domain.metric.mapper.MetricMapper;
import com.esg.platform.global.exception.BusinessException;
import com.esg.platform.global.exception.ErrorCode;


@Service
@Transactional(readOnly = true)
public class MetricService {

    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(MetricService.class);

    private final MetricMapper metricMapper;

    public MetricService(MetricMapper metricMapper) {
        this.metricMapper = metricMapper;
    }

    @Transactional
    public Long createMetric(MetricCreateRequest request, Integer companyId, Integer inputUserId) {
        validate(request);
        String indicatorCode = metricMapper.findIndicatorCodeById(request.indicatorId());
        validateShipment(indicatorCode, request.shipmentAmount());
        EsgMetricData data = EsgMetricData.builder()
                .companyId(companyId)
                .facilityId(request.facilityId())
                .indicatorId(request.indicatorId())
                .reportingYear(request.reportingYear())
                .periodType(parsePeriodType(request.periodType()))
                .periodValue(request.periodValue())
                .numericalValue(request.value())
                .shipmentAmountMillionKrw(normalizeShipment(indicatorCode, request.shipmentAmount()))
                .textValue(trimToNull(request.textValue()))
                .evidenceFileUrl(trimToNull(request.evidenceFileUrl()))
                .status(DataStatus.DRAFT)
                .dataSourceType("MANUAL")
                .inputUserId(inputUserId)
                .build();
        metricMapper.insertMetricData(data);
        metricMapper.insertHistory(data.getId(), "CREATE", null, "DRAFT",
                "기업 ESG 관리자가 지표 실적을 신규 등록했습니다.", Long.valueOf(inputUserId));
        log.info("[ESG_METRIC] 지표 데이터 임시저장 metricId={} companyId={} indicatorId={} userId={}",
                data.getId(), companyId, request.indicatorId(), inputUserId);
        return data.getId();
    }

    @Transactional
    public void updateMetric(Long id, MetricCreateRequest request, Integer inputUserId) {
        validate(request);
        String indicatorCode = metricMapper.findIndicatorCodeById(request.indicatorId());
        validateShipment(indicatorCode, request.shipmentAmount());
        EsgMetricData current = requireEntity(id);
        if (current.getStatus() == DataStatus.PENDING || current.getStatus() == DataStatus.APPROVED) {
            throw new BusinessException(ErrorCode.INVALID_WORKFLOW_STATUS,
                    "승인 대기 또는 승인 완료 데이터는 수정할 수 없습니다.");
        }
        DataStatus previousStatus = current.getStatus();
        current.setIndicatorId(request.indicatorId());
        current.setFacilityId(request.facilityId());
        current.setReportingYear(request.reportingYear());
        current.setPeriodType(parsePeriodType(request.periodType()));
        current.setPeriodValue(request.periodValue());
        current.setNumericalValue(request.value());
        current.setShipmentAmountMillionKrw(normalizeShipment(indicatorCode, request.shipmentAmount()));
        current.setTextValue(trimToNull(request.textValue()));
        current.setEvidenceFileUrl(trimToNull(request.evidenceFileUrl()));
        current.setStatus(DataStatus.DRAFT);
        current.setInputUserId(inputUserId);
        current.setRejectReason(null);
        metricMapper.updateMetricData(current);
        metricMapper.insertHistory(id, "UPDATE", previousStatus.name(), "DRAFT",
                "기업 ESG 관리자가 지표 실적과 증빙자료를 수정했습니다.", Long.valueOf(inputUserId));
        log.info("[ESG_METRIC] 지표 데이터 수정 metricId={} indicatorId={} userId={}", id, request.indicatorId(), inputUserId);
    }

    @Transactional
    public void removeRejectedMetric(Long id, Long userId) {
        EsgMetricData current = requireEntity(id);
        if (current.getStatus() != DataStatus.REJECTED) {
            throw new BusinessException(ErrorCode.INVALID_WORKFLOW_STATUS, "반려된 데이터만 삭제할 수 있습니다.");
        }
        int deleted = metricMapper.deleteRejectedMetric(id);
        if (deleted == 0) {
            throw new BusinessException(ErrorCode.INVALID_WORKFLOW_STATUS);
        }
        log.info("[ESG_METRIC] 반려 지표 삭제 metricId={} userId={}", id, userId);
    }

    public List<IndicatorResponse> getIndicators() {
        return metricMapper.findActiveIndicators();
    }

    private EsgMetricData requireEntity(Long id) {
        EsgMetricData data = metricMapper.findEntityById(id);
        if (data == null) {
            throw new BusinessException(ErrorCode.ESG_METRIC_NOT_FOUND);
        }
        return data;
    }

    private void validate(MetricCreateRequest request) {
        if (request == null || request.indicatorId() == null) {
            throw new BusinessException(ErrorCode.INVALID_INPUT, "지표를 선택해 주세요.");
        }
        if (request.reportingYear() == null || request.periodValue() == null) {
            throw new BusinessException(ErrorCode.INVALID_INPUT, "보고 연도와 기간을 입력해 주세요.");
        }
        if (request.value() == null && trimToNull(request.textValue()) == null) {
            throw new BusinessException(ErrorCode.INVALID_INPUT, "정량 수치 또는 정성 내용을 입력해 주세요.");
        }
    }

    private void validateShipment(String indicatorCode, java.math.BigDecimal shipmentAmount) {
        if ("IND_E_ELEC".equals(indicatorCode)
                && (shipmentAmount == null || shipmentAmount.signum() <= 0)) {
            throw new BusinessException(
                    ErrorCode.INVALID_INPUT,
                    "전력 사용량 등록 시 해당 사업장·기간의 출하액(백만원)을 입력해 주세요.");
        }
    }

    private java.math.BigDecimal normalizeShipment(String indicatorCode, java.math.BigDecimal shipmentAmount) {
        if (!"IND_E_ELEC".equals(indicatorCode) || shipmentAmount == null) {
            return null;
        }
        return shipmentAmount.stripTrailingZeros();
    }

    private PeriodType parsePeriodType(String value) {
        try {
            return value == null || value.isBlank() ? PeriodType.MONTHLY : PeriodType.valueOf(value.trim().toUpperCase());
        } catch (IllegalArgumentException exception) {
            throw new BusinessException(ErrorCode.INVALID_INPUT, "지원하지 않는 보고 주기입니다.");
        }
    }

    private String trimToNull(String value) {
        if (value == null || value.trim().isEmpty()) {
            return null;
        }
        return value.trim();
    }
}
