// 파일 위치: backend/src/main/java/com/esg/platform/domain/integration/dto/response/IntegrationDashboardResponse.java
// 버전: v1.1.0
// 기능 요약: 연동 모니터링 대시보드 화면에 필요한 3가지 영역(요약, 원천 시스템, 실행 이력)의 데이터를 한 번에 반환하는 통합 DTO
package com.esg.platform.domain.integration.dto.response;

import lombok.Builder;
import lombok.Getter;
import java.util.List;

@Getter
@Builder
public class IntegrationDashboardResponse {
    private Summary summary;
    private List<SystemStatus> sources;
    private List<RunHistory> histories;

    @Getter
    @Builder
    public static class Summary {
        private int emsCompleted;
        private int emsTotal;
        private String basePeriod;
        private String jobStatus;
        private String currentWorkplace;
        private boolean redisLockActive;
        private String redisLockKey;
        private String extSyncStatus;
        private String extSyncTime;
    }

    @Getter
    @Builder
    public static class SystemStatus {
        private String id;
        private String name;
        private String description;
        private String schedule;
        private String lastRun;
        private int newCount;
        private int duplicateCount;
        private int errorCount;
        private String status;
    }

    @Getter
    @Builder
    public static class RunHistory {
        private String id;
        private String source;
        private String basePeriod;
        private String triggerType;
        private String startedAt;
        private String completedAt;
        private int success;
        private int error;
        private String status;
    }
}