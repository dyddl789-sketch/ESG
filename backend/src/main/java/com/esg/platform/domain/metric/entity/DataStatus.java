package com.esg.platform.domain.metric.entity;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public enum DataStatus {
    DRAFT("작성 중"),
    PENDING("승인 대기"),
    APPROVED("승인 완료"),
    REJECTED("반려");

    private final String description;
}
