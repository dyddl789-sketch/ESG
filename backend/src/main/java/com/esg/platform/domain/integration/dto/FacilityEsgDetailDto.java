package com.esg.platform.domain.integration.dto;

import java.util.List;

import com.esg.platform.domain.company.dto.FacilityDto;

public record FacilityEsgDetailDto(
        FacilityDto facility,
        String selectedPeriod,
        EnvironmentMonthlyDto environment,
        SocialMonthlyDto social,
        GovernancePeriodDto governance,
        List<EnvironmentMonthlyDto> environmentHistory,
        List<SocialMonthlyDto> socialHistory,
        List<RawDataDto> rawData,
        List<CollectionRunDto> collectionRuns
) {
}
