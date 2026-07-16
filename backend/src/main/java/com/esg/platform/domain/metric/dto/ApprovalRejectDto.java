package com.esg.platform.domain.metric.dto;

import lombok.Getter;
import lombok.Setter;
import lombok.ToString;

@Getter
@Setter
@ToString
public class ApprovalRejectDto {

    // 프론트엔드 { comment: comment }의 key값과 매핑되는 반려 사유 필드
    private String comment;

}
