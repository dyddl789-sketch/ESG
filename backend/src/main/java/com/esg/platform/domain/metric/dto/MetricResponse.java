package com.esg.platform.domain.metric.dto;

import com.esg.platform.domain.metric.entity.DataStatus;
import com.esg.platform.domain.metric.entity.EsgCategory;
import com.esg.platform.domain.metric.entity.PeriodType; // 💡 유저님의 주기 이넘 임포트
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MetricResponse {
    private Long id;
    private EsgCategory category;
    private String subCategory;
    private String indicatorCode;
    private String title;
    private String facility;
    private Integer year;
    private String period;
    private BigDecimal value;
    private BigDecimal shipmentAmountMillionKrw;
    private String unit;
    private String source;
    private String method;
    private DataStatus status;
    private String evidence;
    private String risk;
    private String aiFinding;
    private String assignee;
    
    // 차트 및 이력 데이터 (상세 조회 시에만 채워짐)
    private List<BigDecimal> months;
    private List<MetricHistoryResponse> history;

    // 💡 [최종 종결] 주기 연동 및 정성비고 유실을 완전 진압하는 3대 필드 확정 주입
    private PeriodType periodType;   
    private Integer periodValue;    
    private String textValue;       
}
