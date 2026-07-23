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
import com.esg.platform.global.cache.EsgCacheService;
import com.esg.platform.global.exception.BusinessException;
import com.esg.platform.global.exception.ErrorCode;


@Service
@Transactional(readOnly = true)
public class MetricService {

    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(MetricService.class);

    private final MetricMapper metricMapper;
    private final EsgCacheService cacheService;

    public MetricService(MetricMapper metricMapper, EsgCacheService cacheService) {
        this.metricMapper = metricMapper;
        this.cacheService = cacheService;
    }

    @Transactional
    public Long createMetric(MetricCreateRequest request, Integer companyId, Integer inputUserId) {
        validate(request);
        String indicatorCode = metricMapper.findIndicatorCodeById(request.indicatorId());
        validateShipment(indicatorCode, request.shipmentAmount());
        validateFacilityScope(indicatorCode, request.facilityId());
        EsgMetricData data = EsgMetricData.builder()
                .companyId(companyId)
                .facilityId(normalizeFacilityId(indicatorCode, request.facilityId()))
                .indicatorId(request.indicatorId())
                .reportingYear(request.reportingYear())
                .periodType(parsePeriodType(request.periodType()))
                .periodValue(request.periodValue())
                .numericalValue(request.value())
                .shipmentAmountMillionKrw(normalizeShipment(indicatorCode, request.shipmentAmount()))
                .textValue(trimToNull(request.textValue()))
                .evidenceFileUrl(trimToNull(request.evidenceFileUrl()))
                .evidenceOriginalFilename(normalizeEvidenceFilename(request))
                .evidenceContentType(normalizeEvidenceContentType(request))
                .evidenceFileSize(normalizeEvidenceFileSize(request))
                .evidenceUploadedAt(normalizeEvidenceUploadedAt(request))
                .status(DataStatus.DRAFT)
                .dataSourceType("MANUAL")
                .inputUserId(inputUserId)
                .build();
        metricMapper.insertMetricData(data);
        metricMapper.insertHistory(data.getId(), "CREATE", null, "DRAFT",
                "기업 ESG 관리자가 지표 실적을 신규 등록했습니다.", Long.valueOf(inputUserId));
        cacheService.evictCompanyAfterCommit(Long.valueOf(companyId));
        log.info("[ESG_METRIC] 지표 데이터 임시저장 metricId={} companyId={} indicatorId={} userId={}",
                data.getId(), companyId, request.indicatorId(), inputUserId);
        return data.getId();
    }

    @Transactional
    public void updateMetric(Long id, MetricCreateRequest request, Integer inputUserId) {
        validate(request);
        String indicatorCode = metricMapper.findIndicatorCodeById(request.indicatorId());
        validateShipment(indicatorCode, request.shipmentAmount());
        validateFacilityScope(indicatorCode, request.facilityId());
        EsgMetricData current = requireEntity(id);
        if (current.getStatus() == DataStatus.PENDING || current.getStatus() == DataStatus.APPROVED) {
            throw new BusinessException(ErrorCode.INVALID_WORKFLOW_STATUS,
                    "승인 대기 또는 승인 완료 데이터는 수정할 수 없습니다.");
        }
        DataStatus previousStatus = current.getStatus();
        current.setIndicatorId(request.indicatorId());
        current.setFacilityId(normalizeFacilityId(indicatorCode, request.facilityId()));
        current.setReportingYear(request.reportingYear());
        current.setPeriodType(parsePeriodType(request.periodType()));
        current.setPeriodValue(request.periodValue());
        current.setNumericalValue(request.value());
        current.setShipmentAmountMillionKrw(normalizeShipment(indicatorCode, request.shipmentAmount()));
        current.setTextValue(trimToNull(request.textValue()));
        current.setEvidenceFileUrl(trimToNull(request.evidenceFileUrl()));
        current.setEvidenceOriginalFilename(normalizeEvidenceFilename(request));
        current.setEvidenceContentType(normalizeEvidenceContentType(request));
        current.setEvidenceFileSize(normalizeEvidenceFileSize(request));
        current.setEvidenceUploadedAt(normalizeEvidenceUploadedAt(request));
        current.setStatus(DataStatus.DRAFT);
        current.setInputUserId(inputUserId);
        current.setRejectReason(null);
        metricMapper.updateMetricData(current);
        metricMapper.insertHistory(id, "UPDATE", previousStatus.name(), "DRAFT",
                "기업 ESG 관리자가 지표 실적과 증빙자료를 수정했습니다.", Long.valueOf(inputUserId));
        cacheService.evictCompanyAfterCommit(Long.valueOf(current.getCompanyId()));
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
        cacheService.evictCompanyAfterCommit(Long.valueOf(current.getCompanyId()));
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


    private void validateFacilityScope(String indicatorCode, Integer facilityId) {
        if (indicatorCode == null || indicatorCode.isBlank()) {
            throw new BusinessException(ErrorCode.INVALID_INPUT, "등록할 ESG 지표를 확인할 수 없습니다.");
        }
        if (isCompanyWideGovernance(indicatorCode) && facilityId != null) {
            throw new BusinessException(
                    ErrorCode.INVALID_INPUT,
                    "이사회 참석률과 사외이사 비율은 전체·기업 기준으로만 등록할 수 있습니다.");
        }
        if (!isCompanyWideGovernance(indicatorCode) && facilityId == null) {
            throw new BusinessException(
                    ErrorCode.INVALID_INPUT,
                    "해당 ESG 지표를 측정한 사업장을 선택해 등록해야 합니다.");
        }
    }

    private Integer normalizeFacilityId(String indicatorCode, Integer facilityId) {
        return isCompanyWideGovernance(indicatorCode) ? null : facilityId;
    }

    private boolean isCompanyWideGovernance(String indicatorCode) {
        return "IND_G_ATTENDANCE".equals(indicatorCode)
                || "IND_G_OUTSIDE".equals(indicatorCode);
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


    private String normalizeEvidenceFilename(MetricCreateRequest request) {
        if (trimToNull(request.evidenceFileUrl()) == null) {
            return null;
        }
        String filename = trimToNull(request.evidenceOriginalFilename());
        if (filename == null) {
            return null;
        }
        String normalized = filename.replace('\\', '/');
        int separator = normalized.lastIndexOf('/');
        String basename = separator >= 0 ? normalized.substring(separator + 1) : normalized;
        return basename.length() > 512 ? basename.substring(0, 512) : basename;
    }

    private String normalizeEvidenceContentType(MetricCreateRequest request) {
        if (trimToNull(request.evidenceFileUrl()) == null) {
            return null;
        }
        String contentType = trimToNull(request.evidenceContentType());
        if (contentType == null) {
            return null;
        }
        if (!"application/pdf".equalsIgnoreCase(contentType)
                && !"application/octet-stream".equalsIgnoreCase(contentType)) {
            throw new BusinessException(ErrorCode.INVALID_ESG_FILE, "ESG 증빙은 PDF 파일만 등록할 수 있습니다.");
        }
        return "application/pdf";
    }

    private Long normalizeEvidenceFileSize(MetricCreateRequest request) {
        if (trimToNull(request.evidenceFileUrl()) == null) {
            return null;
        }
        Long size = request.evidenceFileSize();
        if (size != null && size < 0) {
            throw new BusinessException(ErrorCode.INVALID_ESG_FILE, "증빙 파일 크기가 올바르지 않습니다.");
        }
        return size;
    }

    private java.time.OffsetDateTime normalizeEvidenceUploadedAt(MetricCreateRequest request) {
        return trimToNull(request.evidenceFileUrl()) == null ? null : request.evidenceUploadedAt();
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
