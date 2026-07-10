package com.esg.platform.domain.esgscore.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

@Data
public class ScoreDto {
    private Long id;

    @JsonProperty("reporting_year")
    private Integer reportingYear;

    @JsonProperty("reporting_period")
    private String reportingPeriod;

    @JsonProperty("period_value")
    private Integer periodValue;

    @JsonProperty("total_score")
    private Double totalScore;

    @JsonProperty("e_score")
    private Double eScore;

    @JsonProperty("s_score")
    private Double sScore;

    @JsonProperty("g_score")
    private Double gScore;
}