package com.esg.platform.domain.company.dto;

import java.time.OffsetDateTime;

import com.fasterxml.jackson.annotation.JsonProperty;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class FacilityDto {
    private Long id;

    @NotBlank(message = "사업장명을 입력해 주세요.")
    @Size(max = 255, message = "사업장명은 255자 이하여야 합니다.")
    @JsonProperty("facility_name")
    private String facilityName;

    @NotBlank(message = "사업장 유형을 선택해 주세요.")
    @Size(max = 50, message = "사업장 유형은 50자 이하여야 합니다.")
    @JsonProperty("facility_type")
    private String facilityType;

    @Size(max = 512, message = "주소는 512자 이하여야 합니다.")
    private String address;

    @DecimalMin(value = "0", message = "계약전력은 0 이상이어야 합니다.")
    @JsonProperty("contract_power_kw")
    private Double contractPowerKw;

    @JsonProperty("created_at")
    private OffsetDateTime createdAt;

    private Double latitude;
    private Double longitude;
}
