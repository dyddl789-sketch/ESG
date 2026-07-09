// 파일 위치: src/main/java/com/esg/platform/domain/report/dto/response/ReportResponse.java
// 버전: v1.0.0
// 기능 요약: 데이터베이스에서 생성 및 조회된 리포트(GeneratedReport) 엔티티 데이터를 클라이언트(프론트엔드)로 전달하기 위해 변환하는 응답용 DTO 객체입니다.
package com.esg.platform.domain.report.dto.response;

import com.esg.platform.domain.report.entity.GeneratedReport;
import lombok.Builder;
import lombok.Getter;
import java.time.LocalDateTime;

@Getter
@Builder
public class ReportResponse {
    
    // 기능 설명: 생성된 리포트의 데이터베이스 고유 식별자입니다.
    private Long id;
    
    // 기능 설명: 리포트 생성 시 기반이 된 템플릿의 고유 식별자입니다.
    private Long templateId;
    
    // 기능 설명: 작성 뷰에서 사용자가 직접 입력한 리포트의 제목입니다.
    private String title;
    
    // 기능 설명: 에디터에서 작성되어 데이터베이스에 저장된 리포트의 HTML 본문 내용입니다.
    private String content;
    
    // 기능 설명: 생성된 리포트의 버전 정보(예: v1.0)입니다.
    private String version;
    
    // 기능 설명: 클라이언트에서 PDF로 변환 후 스토리지에 저장하여 반환받은 파일 접근 URL입니다.
    private String fileUrl;
    
    // 기능 설명: 생성된 리포트의 외부 공개 여부 상태입니다.
    private Boolean isPublic;
    
    // 기능 설명: 해당 리포트를 최종 생성하고 저장한 사용자의 고유 식별자입니다.
    private Long generatedBy;
    
    // 기능 설명: 데이터베이스에 리포트가 최초 생성 및 저장된 일시입니다.
    private LocalDateTime createdAt;

    // 기능 설명: GeneratedReport 엔티티 객체를 매개변수로 받아 ReportResponse DTO 객체로 매핑 및 변환하여 반환하는 정적 팩토리 메서드입니다.
    public static ReportResponse from(GeneratedReport entity) {
        // 객체 매핑 전 엔티티 데이터가 정상적으로 전달되었는지 확인하기 위한 콘솔 로그를 출력합니다.
        System.out.println("[ReportResponse] GeneratedReport 엔티티를 ReportResponse DTO로 매핑 시작. 대상 리포트 ID: " + entity.getId());
        
        ReportResponse response = ReportResponse.builder()
                .id(entity.getId())
                .templateId(entity.getTemplateId())
                .title(entity.getTitle())
                .content(entity.getContent())
                .version(entity.getVersion())
                .fileUrl(entity.getFileUrl())
                .isPublic(entity.getIsPublic())
                .generatedBy(entity.getGeneratedBy())
                .createdAt(entity.getCreatedAt())
                .build();
                
        // 객체 매핑이 안전하게 완료되었음을 알리고 매핑된 제목 데이터를 확인하기 위한 콘솔 로그를 출력합니다.
        System.out.println("[ReportResponse] GeneratedReport 엔티티 DTO 매핑 완료. 매핑된 리포트 제목: " + response.getTitle());
        
        return response;
    }
}