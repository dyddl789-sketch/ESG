package com.esg.platform.domain.metric.mapper;

import com.esg.platform.domain.metric.dto.MetricResponse;
import com.esg.platform.domain.metric.entity.EsgMetricData;
import com.esg.platform.domain.metric.entity.DataStatus;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;
import java.util.Optional;

@Mapper
public interface MetricMapper {

    /**
     * ESG 데이터 리스트 조회 (필터 적용)
     * @param category 환경/사회/거버넌스 카테고리
     * @param year 보고 연도
     * @param status 승인 상태
     */
    List<MetricResponse> findMetricsByFilters(
        @Param("category") String category,
        @Param("year") Integer year,
        @Param("status") DataStatus status
    );

    /**
     * 특정 데이터 상세 조회
     */
    Optional<EsgMetricData> findById(@Param("id") Long id);

    /**
     * 데이터 수정 (수치, 증빙파일 등)
     */
    int updateMetricData(EsgMetricData data);

    /**
     * 데이터 상태 변경 (승인 요청, 최종 승인, 반려 등)
     */
    int updateStatus(
        @Param("id") Long id, 
        @Param("status") DataStatus status,
        @Param("approverId") Integer approverId,
        @Param("rejectReason") String rejectReason
    );

    /**
     * 최근 5개월간의 수치 변화 조회 (차트용)
     */
    List<java.math.BigDecimal> findRecentValues(
        @Param("indicatorId") Integer indicatorId,
        @Param("facilityId") Integer facilityId,
        @Param("limit") int limit
    );
}
