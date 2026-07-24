package com.esg.platform.domain.company.dto;

import java.time.LocalDate;
import java.time.OffsetDateTime;

import com.fasterxml.jackson.annotation.JsonProperty;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

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

    @DecimalMin(value = "0", inclusive = false, message = "계약전력은 0보다 커야 합니다.")
    @JsonProperty("contract_power_kw")
    private Double contractPowerKw;

    @Size(max = 100, message = "담당자명은 100자 이하여야 합니다.")
    @JsonProperty("manager_name")
    private String managerName;

    @Size(max = 50, message = "담당자 연락처는 50자 이하여야 합니다.")
    @JsonProperty("manager_phone")
    private String managerPhone;

    @JsonProperty("is_active")
    private Boolean active;

    @JsonProperty("operation_start_date")
    private LocalDate operationStartDate;

    @JsonProperty("operation_end_date")
    private LocalDate operationEndDate;

    @JsonProperty("created_at")
    private OffsetDateTime createdAt;

    private Double latitude;
    private Double longitude;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getFacilityName() { return facilityName; }
    public void setFacilityName(String facilityName) { this.facilityName = facilityName; }
    public String getFacilityType() { return facilityType; }
    public void setFacilityType(String facilityType) { this.facilityType = facilityType; }
    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }
    public Double getContractPowerKw() { return contractPowerKw; }
    public void setContractPowerKw(Double contractPowerKw) { this.contractPowerKw = contractPowerKw; }
    public String getManagerName() { return managerName; }
    public void setManagerName(String managerName) { this.managerName = managerName; }
    public String getManagerPhone() { return managerPhone; }
    public void setManagerPhone(String managerPhone) { this.managerPhone = managerPhone; }
    public Boolean getActive() { return active; }
    public void setActive(Boolean active) { this.active = active; }
    public LocalDate getOperationStartDate() { return operationStartDate; }
    public void setOperationStartDate(LocalDate operationStartDate) { this.operationStartDate = operationStartDate; }
    public LocalDate getOperationEndDate() { return operationEndDate; }
    public void setOperationEndDate(LocalDate operationEndDate) { this.operationEndDate = operationEndDate; }
    public OffsetDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(OffsetDateTime createdAt) { this.createdAt = createdAt; }
    public Double getLatitude() { return latitude; }
    public void setLatitude(Double latitude) { this.latitude = latitude; }
    public Double getLongitude() { return longitude; }
    public void setLongitude(Double longitude) { this.longitude = longitude; }
}
