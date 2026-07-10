package com.esg.platform.domain.esgindicator.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

@Data
public class IndicatorDto {
    private Long id;
    private String category;

    @JsonProperty("sub_category")
    private String subCategory;

    @JsonProperty("indicator_code")
    private String indicatorCode;

    private String title;

    @JsonProperty("value_type")
    private String valueType;

    private String description;
    private String unit;

    @JsonProperty("is_active")
    private Boolean isActive;
}