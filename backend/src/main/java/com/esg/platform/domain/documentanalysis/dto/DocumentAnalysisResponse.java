package com.esg.platform.domain.documentanalysis.dto;

import java.math.BigDecimal;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DocumentAnalysisResponse {
    private Long id;
    private Integer indicatorId;
    private Integer facilityId;
    private String facilityName;
    private String facilityEvidence;
    private String facilityMatchStatus;
    private Integer reportingYear;
    private String periodType;
    private Integer periodValue;
    private String type;
    private String detectedCategory;
    private String date;
    private Integer total;
    private Integer attended;
    private BigDecimal rate;
    private BigDecimal electricityUsageKwh;
    private BigDecimal shipmentAmountMillionKrw;
    private String shipmentUnit;
    private BigDecimal confidence;
    private String agenda;
    private String aiExplanation;
    private String fileUrl;
    private Boolean submitForApproval;
    private BigDecimal value;
    private String textValue;
}
