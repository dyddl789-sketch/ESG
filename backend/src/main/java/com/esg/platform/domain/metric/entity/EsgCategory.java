package com.esg.platform.domain.metric.entity;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum EsgCategory {
    ENVIRONMENT("환경"),
    SOCIAL("사회"),
    GOVERNANCE("거버넌스");

    private final String description;
}
