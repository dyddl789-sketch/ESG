package com.esg.platform.domain.company.dto;

import java.time.LocalDate;
import java.time.OffsetDateTime;

import com.fasterxml.jackson.annotation.JsonProperty;

public class CompanyDto {
    private Long id;
    private String name;
    private String industry;
    private String scale;

    @JsonProperty("business_number")
    private String businessNumber;

    private String representative;

    @JsonProperty("founded_on")
    private LocalDate foundedOn;

    @JsonProperty("business_type")
    private String businessType;

    @JsonProperty("business_item")
    private String businessItem;

    @JsonProperty("representative_phone")
    private String representativePhone;

    @JsonProperty("representative_email")
    private String representativeEmail;

    @JsonProperty("operation_status")
    private String operationStatus;

    @JsonProperty("created_at")
    private OffsetDateTime createdAt;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getIndustry() { return industry; }
    public void setIndustry(String industry) { this.industry = industry; }
    public String getScale() { return scale; }
    public void setScale(String scale) { this.scale = scale; }
    public String getBusinessNumber() { return businessNumber; }
    public void setBusinessNumber(String businessNumber) { this.businessNumber = businessNumber; }
    public String getRepresentative() { return representative; }
    public void setRepresentative(String representative) { this.representative = representative; }
    public LocalDate getFoundedOn() { return foundedOn; }
    public void setFoundedOn(LocalDate foundedOn) { this.foundedOn = foundedOn; }
    public String getBusinessType() { return businessType; }
    public void setBusinessType(String businessType) { this.businessType = businessType; }
    public String getBusinessItem() { return businessItem; }
    public void setBusinessItem(String businessItem) { this.businessItem = businessItem; }
    public String getRepresentativePhone() { return representativePhone; }
    public void setRepresentativePhone(String representativePhone) { this.representativePhone = representativePhone; }
    public String getRepresentativeEmail() { return representativeEmail; }
    public void setRepresentativeEmail(String representativeEmail) { this.representativeEmail = representativeEmail; }
    public String getOperationStatus() { return operationStatus; }
    public void setOperationStatus(String operationStatus) { this.operationStatus = operationStatus; }
    public OffsetDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(OffsetDateTime createdAt) { this.createdAt = createdAt; }
}
