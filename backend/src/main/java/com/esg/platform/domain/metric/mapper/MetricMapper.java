package com.esg.platform.domain.metric.mapper;

import com.esg.platform.domain.metric.dto.IndicatorResponse;
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
     * 특정 데이터 상세 조회 (Optional 상자로 안전하게 설계된 표준 명세)
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

    /**
     * [신규] ESG 데이터 등록 (useGeneratedKeys로 id 자동 반환)
     */
    int insertMetricData(EsgMetricData data);

    /**
     * [신규] 활성화된 지표 마스터 목록 조회 (등록 폼 드롭다운용)
     */
    List<IndicatorResponse> findActiveIndicators();
    
    /**
     * 지정한 ID의 메트릭 데이터를 데이터베이스에서 완전히 삭제 (반려 데이터 파기용)
     */
    void deleteMetricById(@Param("id") Long id);
    
    /**
     * [신규 단독 개설] 반려된 지표 실적 재제출용 전용 메서드 
     * - 예전 반려 사유 의견을 NULL로 클리어 처리하고 상태를 PENDING으로 자동 전환
     */
    void resubmitRejectedMetric(EsgMetricData metricData);

}
