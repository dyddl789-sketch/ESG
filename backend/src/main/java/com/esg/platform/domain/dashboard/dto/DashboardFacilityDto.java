package com.esg.platform.domain.dashboard.dto;

import java.math.BigDecimal;

import lombok.Data;

@Data
public class DashboardFacilityDto {
    private Long facilityId;
    private String facilityName;
    private String facilityType;
    private String address;
    private Double latitude;
    private Double longitude;
    private BigDecimal electricityUsageKwh;
    private BigDecimal scope2Tco2eq;
    private BigDecimal injuryRate;
    private BigDecimal trainingCompletionRate;
    private BigDecimal hazardActionRate;
    private BigDecimal turnoverRate;
}
