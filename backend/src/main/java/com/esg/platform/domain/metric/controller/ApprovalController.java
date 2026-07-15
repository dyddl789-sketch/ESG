package com.esg.platform.domain.metric.controller;

import com.esg.platform.domain.metric.dto.ApprovalRejectDto;
import com.esg.platform.domain.metric.service.ApprovalService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/approvals")
@RequiredArgsConstructor
// 클래스 레벨에 권한을 부여하여 총괄관리자만 결재 API 엔드포인트에 진입할 수 있도록 제어
@PreAuthorize("hasAnyRole('ROLE_SYSTEM_ADMIN')")
public class ApprovalController {

    private final ApprovalService approvalService;

    /**
     * 1. 단건 최종 승인 처리 (PATCH /api/approvals/{id}/approve)
     */
    @PatchMapping("/{id}/approve")
    public ResponseEntity<Void> approveMetric(@PathVariable(name = "id") Long id) {
        // TODO: 추후 Spring Security Context에서 실제 로그인한 총괄관리자의 ID를 추출하도록 확장 가능
        // 현재는 개발 및 연동 테스트를 위해 테스트용 관리자 유저 ID(2L)로 하드코딩 처리
        Long approverUserId = 2L; 
        
        approvalService.processDecision(id, "APPROVED", null, approverUserId);
        return ResponseEntity.ok().build();
    }

    /**
     * 2. 단건 반려 처리 (PATCH /api/approvals/{id}/reject)
     */
    @PatchMapping("/{id}/reject")
    public ResponseEntity<Void> rejectMetric(
            @PathVariable(name = "id") Long id,
            @RequestBody ApprovalRejectDto rejectDto
    ) {
        // TODO: 동일하게 로그인 세션에서 총괄관리자 ID 추출하도록 확장 가능
        Long approverUserId = 2L;
        
        // DTO에서 프론트엔드가 보낸 comment(반려 사유)를 추출하여 서비스로 전달
        approvalService.processDecision(id, "REJECTED", rejectDto.getComment(), approverUserId);
        return ResponseEntity.ok().build();
    }
}
