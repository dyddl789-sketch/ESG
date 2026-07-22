// 파일 위치: src/main/java/com/esg/platform/domain/reportbuild/dto/response/ReportMetricResponse.java
package com.esg.platform.domain.reportbuild.dto.response;

import lombok.Builder;
import lombok.Getter;
import java.math.BigDecimal;

@Getter
@Builder
public class ReportMetricResponse {
    private Long id;
    private String indicatorCode;
    private String title;
    private String category;
    private String unit;
    private Integer periodValue;
    private BigDecimal numericalValue;
    private String status;
    private Integer reportingYear;
    private String facilityName;
    private String additionalInfo;
}