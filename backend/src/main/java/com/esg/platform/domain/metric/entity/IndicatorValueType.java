package com.esg.platform.domain.metric.entity;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum IndicatorValueType {
    QUANTITATIVE("정량"),
    QUALITATIVE("정성");

    private final String description;
}
