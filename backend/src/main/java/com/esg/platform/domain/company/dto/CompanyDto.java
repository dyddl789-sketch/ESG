package com.esg.platform.domain.company.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

@Data
public class CompanyDto {
    private Long id;
    private String name;
    private String industry;
    private String scale;

    @JsonProperty("business_number")
    private String businessNumber;

    private String representative;
}