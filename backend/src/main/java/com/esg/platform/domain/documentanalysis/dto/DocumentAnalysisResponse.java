package com.esg.platform.domain.documentanalysis.dto;

import java.math.BigDecimal;
import lombok.*;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DocumentAnalysisResponse {
    private Long id;                  // 등록 후 돌려받을 esg_metric_data.id
    private Integer indicatorId;      // 평가지표 ID (이사회 참석률 등)
    private Integer facilityId;       // 사업장 ID
    private Integer reportingYear;    // 보고 연도 (2026)
    private String periodType;        // YEARLY 등
    private Integer periodValue;      // 기간 인덱스 (1)
    
    // 프론트엔드 연동용 정형 데이터 명세
    private String type;              // 문서 유형 ("이사회 회의록")
    private String date;              // 회의일 ("2026-06-24")
    private Integer total;            // 전체 이사 수
    private Integer attended;         // 참석 이사 수
    private BigDecimal rate;          // 수치형 측정값 매핑 (numerical_value)
    private String agenda;            // 안건 내용 (additional_info 보관용)

    // 💡 AI 텍스트 풀이 및 사용자가 최종 수정한 비고문 (text_value)
    private String aiExplanation; 
    
    private String fileUrl;           // 업로드 완료된 증빙 파일 경로
    private Boolean submitForApproval;// true면 등록 즉시 PENDING(결재상신), false면 DRAFT(임시저장)
}
