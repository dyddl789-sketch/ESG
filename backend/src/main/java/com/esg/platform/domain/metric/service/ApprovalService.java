package com.esg.platform.domain.metric.service;

import com.esg.platform.domain.metric.mapper.ApprovalMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class ApprovalService {

    private final ApprovalMapper approvalMapper;

    /**
     * 총괄관리자의 단건 결재 비즈니스 로직 (승인 또는 반려)
     */
    @Transactional
    public void processDecision(Long id, String decision, String rejectReason, Long approverUserId) {
        // 1. 데이터의 현재 상태를 DB에서 조회
        String currentStatus = approvalMapper.findStatusById(id);
        
        // 2. 존재 유무 검증
        if (currentStatus == null) {
            throw new IllegalArgumentException("존재하지 않는 메트릭 데이터입니다.");
        }
        
        // 3. 결재 정합성 검증 (승인 대기 PENDING 상태일 때만 처리 허용)
        if (!"PENDING".equals(currentStatus)) {
            throw new IllegalStateException("승인 대기(PENDING) 상태인 데이터만 결재 처리가 가능합니다.");
        }

        // 4. 결정에 따른 상태 변수 지정 (APPROVED 또는 REJECTED)
        String finalStatus = "APPROVED".equals(decision) ? "APPROVED" : "REJECTED";
        
        // 5. 승인일 경우 기존에 남아있을 수 있는 반려 사유를 초기화(null) 처리
        String finalRejectReason = "REJECTED".equals(finalStatus) ? rejectReason : null;

        // 6. DB 상태 단건 업데이트 실행
        approvalMapper.updateApprovalStatus(id, finalStatus, approverUserId, finalRejectReason);
    }
}
