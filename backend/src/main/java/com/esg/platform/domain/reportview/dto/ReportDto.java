package com.esg.platform.domain.reportview.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;
import java.time.OffsetDateTime;

@Data
public class ReportDto {
    private Long id;
    private String title;
    private String version;

    @JsonProperty("file_url")
    private String fileUrl;

    @JsonProperty("created_at")
    private OffsetDateTime createdAt;
}