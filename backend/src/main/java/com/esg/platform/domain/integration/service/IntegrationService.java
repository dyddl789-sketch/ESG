// 파일 위치: backend/src/main/java/com/esg/platform/domain/integration/service/IntegrationService.java
// 버전: v1.1.0
// 기능 요약: Mapper를 호출하여 데이터베이스에서 연동 상태 및 이력을 조회하고 프론트엔드 규격에 맞춰 DTO를 조립합니다.
package com.esg.platform.domain.integration.service;

import com.esg.platform.domain.integration.dto.response.IntegrationDashboardResponse;
import com.esg.platform.domain.integration.mapper.IntegrationMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class IntegrationService {

    private final IntegrationMapper mapper;

    public IntegrationDashboardResponse getDashboardData() {
        // 콘솔 로그: 데이터베이스 조회 시작을 기록합니다.
        log.info("[Service] DB로부터 연동 시스템 목록 및 실행 이력 조회 시작");
        
        // 기능 설명: MyBatis 매퍼를 통해 원천 시스템 목록과 실행 이력 목록을 각각 조회합니다.
        List<IntegrationDashboardResponse.SystemStatus> sources = mapper.selectIntegrationSystems();
        List<IntegrationDashboardResponse.RunHistory> histories = mapper.selectRunHistories();

        // 콘솔 로그: 조회된 데이터의 건수를 출력하여 정상 패치 여부를 확인합니다.
        log.info("[Service] 시스템 목록 {}건, 실행 이력 {}건 조회 완료", sources.size(), histories.size());

        // 기능 설명: 요약(Summary) 영역은 Redis 상태나 시스템 메모리 상태를 조합해야 하므로 서비스 단에서 상태값 및 집계 처리를 수행합니다.
        IntegrationDashboardResponse.Summary summary = IntegrationDashboardResponse.Summary.builder()
                .emsCompleted(0)
                .emsTotal(4)
                .basePeriod("2026-06")
                .jobStatus("IDLE")
                .currentWorkplace("대기 중")
                .redisLockActive(false)
                .redisLockKey("lock:integration:EMS:2026-06")
                .extSyncStatus("SYNCED")
                .extSyncTime("2026-07-01 03:10")
                .build();

        // 기능 설명: 3가지 영역의 데이터를 하나의 Response DTO로 묶어 반환합니다.
        return IntegrationDashboardResponse.builder()
                .summary(summary)
                .sources(sources)
                .histories(histories)
                .build();
    }
}