// 파일 위치: backend/src/main/java/com/esg/platform/domain/integration/mapper/IntegrationMapper.java
// 버전: v1.1.0
// 기능 요약: 연동 시스템 및 실행 이력 조회를 위한 MyBatis 매퍼 인터페이스
package com.esg.platform.domain.integration.mapper;

import com.esg.platform.domain.integration.dto.response.IntegrationDashboardResponse;
import org.apache.ibatis.annotations.Mapper;
import java.util.List;

@Mapper
public interface IntegrationMapper {
    // 기능 설명: integration_systems 테이블에서 시스템 상태 목록을 조회합니다.
    List<IntegrationDashboardResponse.SystemStatus> selectIntegrationSystems();
    
    // 기능 설명: integration_run_histories 테이블에서 시스템 연동 배치 실행 이력을 조회합니다.
    List<IntegrationDashboardResponse.RunHistory> selectRunHistories();
}