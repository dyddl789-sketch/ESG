package com.esg.platform.domain.reportview.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;
import java.time.OffsetDateTime;

@Data
public class ReportDto {
    private Long id;
    private String title;
    private String version;
    private String content;
    private String scope;

    @JsonProperty("target_year")
    private Integer targetYear;

    @JsonProperty("file_url")
    private String fileUrl;

    @JsonProperty("created_at")
    private OffsetDateTime createdAt;
}