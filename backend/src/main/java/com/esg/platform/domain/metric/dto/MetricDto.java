package com.esg.platform.domain.metric.dto;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;

import lombok.Data;

@Data
public class MetricDto {
    private Long id;
    private Long companyId;
    private Long facilityId;
    private String facility;
    private String facilityType;
    private String category;
    private String subCategory;
    private String indicatorCode;
    private String title;
    private Integer year;
    private String period;
    private BigDecimal activityValue;
    private BigDecimal value;
    private String textValue;
    private String unit;
    private String source;
    private String method;
    private String status;
    private String evidence;
    private String aiStatus;
    private String risk;
    private String aiFinding;
    private String aiModel;
    private String assignee;
    private String approver;
    private String rejectReason;
    private String additionalInfo;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;
    private List<MetricHistoryDto> history;
}
