package com.esg.platform.domain.benchmark.dto;

import java.math.BigDecimal;

import lombok.Data;

@Data
public class InternalBenchmarkAggregate {
    private BigDecimal electricityMwh;
    private BigDecimal shipmentHundredMillionKrw;
    private BigDecimal scope2Tco2eq;
    private Integer matchedFacilityMonths;
}
