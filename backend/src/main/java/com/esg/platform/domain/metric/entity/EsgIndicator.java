package com.esg.platform.domain.metric.entity;

import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EsgIndicator {
    private Long id;
    private EsgCategory category;
    private String subCategory;
    private String indicatorCode;
    private String title;
    private IndicatorValueType valueType;
    private String description;
    private String unit;
    private Boolean isActive;
}
