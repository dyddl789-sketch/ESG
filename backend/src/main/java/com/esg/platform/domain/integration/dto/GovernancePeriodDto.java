package com.esg.platform.domain.integration.dto;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

import lombok.Data;

@Data
public class GovernancePeriodDto {
    private Long id;
    private Long companyId;
    private Long headquartersFacilityId;
    private String headquartersName;
    private String basePeriod;
    private String boardMeetingStatus;
    private Integer boardMeetingCount;
    private Integer totalDirectorSeats;
    private Integer attendedDirectorSeats;
    private Integer totalDirectors;
    private Integer outsideDirectors;
    private Integer ethicsTargetCount;
    private Integer ethicsCompletedCount;
    private BigDecimal boardAttendanceRate;
    private BigDecimal outsideDirectorRate;
    private BigDecimal ethicsCompletionRate;
    private String validationStatus;
    private String collectionStatus;
    private String reflectionStatus;
    private String approvalStatus;
    private OffsetDateTime collectedAt;
    private OffsetDateTime reflectedAt;
    private OffsetDateTime approvedAt;
}
