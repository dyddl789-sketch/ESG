package com.esg.platform.domain.benchmark.service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.Objects;
import java.util.stream.Stream;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.esg.platform.domain.benchmark.dto.ExternalBenchmarkResponse;
import com.esg.platform.domain.benchmark.dto.ExternalBenchmarkSyncRun;
import com.esg.platform.domain.benchmark.dto.ExternalBenchmarkValue;
import com.esg.platform.domain.benchmark.dto.InternalBenchmarkAggregate;
import com.esg.platform.domain.benchmark.mapper.ExternalBenchmarkMapper;
import com.esg.platform.domain.benchmark.service.PublicDataBenchmarkClient.FetchedValue;
import com.esg.platform.global.exception.BusinessException;
import com.esg.platform.global.exception.ErrorCode;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
public class ExternalBenchmarkService {

    private static final BigDecimal HUNDRED = BigDecimal.valueOf(100);

    private final ExternalBenchmarkMapper mapper;
    private final PublicDataBenchmarkClient publicDataClient;
    private final ExternalBenchmarkPersistenceService persistenceService;

    @Value("${external-api.benchmark.base-year:2021}")
    private int externalBaseYear;

    @Value("${external-api.benchmark.industry-code:C303}")
    private String industryCode;

    @Value("${external-api.benchmark.industry-name:자동차 신품 부품 제조업}")
    private String industryName;

    public ExternalBenchmarkResponse synchronize(Integer companyId, Integer userId) {
        Long runId = persistenceService.startRun(companyId, userId, externalBaseYear, industryCode);
        try {
            FetchedValue electricity = publicDataClient.fetchKea(
                    externalBaseYear, industryCode, "STD", "ELECTRICITY");
            FetchedValue greenhouseGas = publicDataClient.fetchKea(
                    externalBaseYear, industryCode, "GHG", "GHG");
            FetchedValue shipment = publicDataClient.fetchKosisShipment(externalBaseYear, industryCode);
            persistenceService.saveSuccess(
                    runId,
                    companyId,
                    externalBaseYear,
                    industryCode,
                    industryName,
                    List.of(electricity, greenhouseGas, shipment));
            log.info("[EXTERNAL_BENCHMARK] 동기화 완료 runId={} companyId={} baseYear={} industry={}",
                    runId, companyId, externalBaseYear, industryCode);
            return getBenchmark(companyId, null);
        } catch (RuntimeException exception) {
            persistenceService.saveFailure(runId, exception.getMessage());
            log.warn("[EXTERNAL_BENCHMARK] 동기화 실패 runId={} companyId={} reason={}",
                    runId, companyId, exception.getMessage());
            throw exception;
        }
    }

    @Transactional(readOnly = true)
    public ExternalBenchmarkResponse getBenchmark(Integer companyId, Integer requestedInternalYear) {
        ExternalBenchmarkSyncRun latestRun = mapper.findLatestRun(companyId);
        ExternalBenchmarkValue electricity = mapper.findValue(
                companyId, externalBaseYear, industryCode, "ELECTRICITY");
        ExternalBenchmarkValue greenhouseGas = mapper.findValue(
                companyId, externalBaseYear, industryCode, "GHG");
        ExternalBenchmarkValue shipment = mapper.findValue(
                companyId, externalBaseYear, industryCode, "SHIPMENT");

        Integer internalYear = requestedInternalYear != null
                ? requestedInternalYear
                : mapper.findLatestInternalYear(companyId);
        Integer throughMonth = internalYear == null
                ? null
                : mapper.findLatestComparableMonth(companyId, internalYear);
        InternalBenchmarkAggregate internal = throughMonth == null
                ? null
                : mapper.findInternalAggregate(companyId, internalYear, throughMonth);

        BigDecimal internalElectricityIntensity = divide(
                internal == null ? null : internal.getElectricityMwh(),
                internal == null ? null : internal.getShipmentHundredMillionKrw());
        BigDecimal internalCarbonIntensity = divide(
                internal == null ? null : internal.getScope2Tco2eq(),
                internal == null ? null : internal.getShipmentHundredMillionKrw());
        BigDecimal externalElectricityIntensity = divide(
                valueOf(electricity), valueOf(shipment));
        BigDecimal externalCarbonIntensity = divide(
                valueOf(greenhouseGas), valueOf(shipment));

        String sourceUpdatedAt = Stream.of(electricity, greenhouseGas, shipment)
                .filter(Objects::nonNull)
                .map(ExternalBenchmarkValue::getSourceUpdatedAt)
                .filter(Objects::nonNull)
                .max(String::compareTo)
                .orElse(null);

        String status = latestRun == null ? "NOT_SYNCED" : latestRun.getStatus();
        return ExternalBenchmarkResponse.builder()
                .status(status)
                .lastSyncedAt(latestRun == null ? null : latestRun.getCompletedAt())
                .lastErrorMessage(latestRun == null ? null : latestRun.getErrorMessage())
                .externalBaseYear(externalBaseYear)
                .industryCode(industryCode)
                .industryName(industryName)
                .externalPeriodLabel(externalBaseYear + "년 연간 공공통계")
                .sourceLabel("한국에너지공단 · KOSIS")
                .sourceUpdatedAt(sourceUpdatedAt)
                .internalBaseYear(internalYear)
                .internalThroughMonth(throughMonth)
                .internalPeriodLabel(internalYear == null || throughMonth == null
                        ? "비교 가능한 승인 데이터 없음"
                        : internalYear + "년 1~" + throughMonth + "월 승인완료 누적")
                .provisional(throughMonth != null && throughMonth < 12)
                .internalElectricityMwh(internal == null ? null : internal.getElectricityMwh())
                .internalShipmentHundredMillionKrw(internal == null ? null : internal.getShipmentHundredMillionKrw())
                .internalScope2Tco2eq(internal == null ? null : internal.getScope2Tco2eq())
                .internalElectricityIntensity(internalElectricityIntensity)
                .externalElectricityIntensity(externalElectricityIntensity)
                .electricityImprovementPercent(improvement(externalElectricityIntensity, internalElectricityIntensity))
                .internalCarbonIntensity(internalCarbonIntensity)
                .externalCarbonIntensity(externalCarbonIntensity)
                .carbonImprovementPercent(improvement(externalCarbonIntensity, internalCarbonIntensity))
                .electricityUnit("MWh/출하액 1억원")
                .carbonUnit("tCO2eq/출하액 1억원")
                .methodologyNote("외부 기준은 2021년 C303 연간 공공통계이며, 내부 값은 전력·Scope 2·출하액이 모두 승인된 최신 월까지 누적한 잠정 비교입니다.")
                .build();
    }

    private BigDecimal valueOf(ExternalBenchmarkValue value) {
        return value == null ? null : value.getNormalizedValue();
    }

    private BigDecimal divide(BigDecimal numerator, BigDecimal denominator) {
        if (numerator == null || denominator == null || denominator.signum() <= 0) {
            return null;
        }
        return numerator.divide(denominator, 4, RoundingMode.HALF_UP);
    }

    private BigDecimal improvement(BigDecimal external, BigDecimal internal) {
        if (external == null || internal == null || external.signum() == 0) {
            return null;
        }
        return external.subtract(internal)
                .divide(external, 6, RoundingMode.HALF_UP)
                .multiply(HUNDRED)
                .setScale(2, RoundingMode.HALF_UP);
    }
}
