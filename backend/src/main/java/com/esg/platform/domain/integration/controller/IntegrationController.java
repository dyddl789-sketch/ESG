// 파일 위치: backend/src/main/java/com/esg/platform/domain/integration/controller/IntegrationController.java
// 버전: v1.1.0
// 기능 요약: 외부 시스템 연동 모니터링 API 엔드포인트를 제공합니다.
package com.esg.platform.domain.integration.controller;

import com.esg.platform.domain.integration.dto.response.IntegrationDashboardResponse;
import com.esg.platform.domain.integration.service.IntegrationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/integrations")
@RequiredArgsConstructor
public class IntegrationController {

    private final IntegrationService integrationService;

    @GetMapping("/dashboard")
    public ResponseEntity<Map<String, Object>> getIntegrationDashboard() {
        // 콘솔 로그: 대시보드 데이터 조회 API 호출을 기록합니다.
        log.info("[Controller] 외부 시스템 연동 모니터링 대시보드 데이터 조회 요청 수신");
        
        // 기능 설명: 서비스 계층을 호출하여 대시보드 조립 데이터를 가져옵니다.
        IntegrationDashboardResponse data = integrationService.getDashboardData();
        
        // 콘솔 로그: 데이터 반환 전 정상 처리 완료를 알립니다.
        log.info("[Controller] 연동 모니터링 대시보드 데이터 반환 완료");
        return ResponseEntity.ok(Map.of("data", data));
    }
}