package com.esg.platform.domain.company.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;
import java.time.LocalDateTime;

@Data
public class FacilityDto {
    private Long id;

    @JsonProperty("facility_name")
    private String facilityName;

    @JsonProperty("facility_type")
    private String facilityType;

    private String address;

    @JsonProperty("contract_power_kw")
    private Double contractPowerKw;

    @JsonProperty("created_at")
    private LocalDateTime createdAt;
}