package com.esg.platform.domain.metric.dto;

import com.esg.platform.domain.metric.entity.EsgCategory;
import com.esg.platform.domain.metric.entity.IndicatorValueType;

/**
 * [신규] 지표 마스터 목록 응답 DTO
 * - 신규 데이터 등록 폼에서 지표 선택 드롭다운을 채우기 위해 사용
 */
public record IndicatorResponse(
    Long id,
    EsgCategory category,
    String subCategory,
    String indicatorCode,
    String title,
    IndicatorValueType valueType,
    String unit
) {}
