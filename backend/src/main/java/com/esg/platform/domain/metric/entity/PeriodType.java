package com.esg.platform.domain.metric.entity;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum PeriodType {
    YEARLY("연간"),
    QUARTERLY("분기"),
    MONTHLY("월간");

    private final String description;
}
