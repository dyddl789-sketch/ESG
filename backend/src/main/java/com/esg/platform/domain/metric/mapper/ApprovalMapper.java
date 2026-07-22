package com.esg.platform.domain.metric.mapper;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

@Mapper
public interface ApprovalMapper {

    /**
     * 1. 단건 데이터의 현재 상태 조회 (결재 정합성 검증용)
     */
    String findStatusById(@Param("id") Long id);

    /**
     * 2. 단건 데이터의 결재 상태(APPROVED/REJECTED), 총괄관리자 ID, 반려 사유 업데이트
     */
    void updateApprovalStatus(
        @Param("id") Long id, 
        @Param("status") String status, 
        @Param("approverId") Long approverId, 
        @Param("rejectReason") String rejectReason
    );
    
}
