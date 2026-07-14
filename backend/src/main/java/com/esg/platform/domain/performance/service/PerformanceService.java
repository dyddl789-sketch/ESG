// 파일 위치: D:\Project\ESG\backend\src\main\java\com\esg\platform\domain\performance\service\PerformanceService.java
// 버전: v1.1.0
// 기능 요약: DB에서 조회한 원시 데이터 맵을 프론트엔드 차트용 1~12월 배열 규격으로 가공 및 변환합니다.
package com.esg.platform.domain.performance.service;

import com.esg.platform.domain.performance.dto.response.PerformanceResponse;
import com.esg.platform.domain.performance.mapper.PerformanceMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PerformanceService {

    private final PerformanceMapper mapper;

    public List<PerformanceResponse> getPerformanceList(Long companyId, int year) {
        // 콘솔 로그: 데이터 조회 시작을 알립니다.
        log.info("[Service] ESG 실적 데이터 조회 시작 - companyId: {}, year: {}", companyId, year);
        
        // 기능 설명: 매퍼를 통해 데이터베이스에서 실적 목록을 가져옵니다.
        List<Map<String, Object>> rawData = mapper.selectPerformanceList(companyId, year);
        
        // 콘솔 로그: 조회된 원시 데이터 행(Row) 개수를 출력합니다.
        log.info("[Service] 조회된 원시 데이터 개수: {}", rawData.size());

        // 기능 설명: indicatorCode가 존재하는 데이터만 필터링하여 지표 코드별로 그룹핑합니다. 
        Map<String, List<Map<String, Object>>> groupedByCode = rawData.stream()
                .filter(row -> row.get("indicatorCode") != null)
                .collect(Collectors.groupingBy(row -> row.get("indicatorCode").toString()));

        // 콘솔 로그: 그룹핑된 지표 종류 개수를 출력합니다.
        log.info("[Service] 그룹핑된 지표 종류 개수: {}", groupedByCode.size());

        List<PerformanceResponse> result = new ArrayList<>();

        for (Map.Entry<String, List<Map<String, Object>>> entry : groupedByCode.entrySet()) {
            List<Map<String, Object>> records = entry.getValue();
            BigDecimal[] monthsData = new BigDecimal[12];
            
            // 기능 설명: 오름차순 정렬된 리스트에서 가장 마지막 요소를 최신 데이터로 지정합니다.
            Map<String, Object> latestRecord = records.get(records.size() - 1); 
            
            // 콘솔 로그: 현재 처리 중인 지표 코드를 기록합니다.
            log.info("[Service] 지표 매핑 처리 중 - indicatorCode: {}", entry.getKey());

            // 기능 설명: 그룹 내의 행들을 순회하며 1~12월 배열의 적절한 인덱스에 수치를 삽입합니다.
            for (Map<String, Object> record : records) {
                Object monthObj = record.get("periodValue");
                Object valObj = record.get("numericalValue");
                
                if (monthObj != null && valObj != null) {
                    try {
                        // 기능 설명: ClassCastException 방지를 위해 String 형변환 후 파싱합니다.
                        int month = Integer.parseInt(monthObj.toString());
                        BigDecimal value = new BigDecimal(valObj.toString());
                        
                        if (month >= 1 && month <= 12) {
                            monthsData[month - 1] = value;
                        }
                    } catch (NumberFormatException e) {
                        // 기능 설명: 숫자 파싱 실패 시 로그를 남기고 다음 데이터로 넘어갑니다.
                        log.error("[Service] 데이터 파싱 에러 - periodValue: {}, numericalValue: {}", monthObj, valObj);
                    }
                }
            }

            // 기능 설명: 최신 데이터의 기준 월 텍스트 포맷을 생성합니다.
            Object latestMonthObj = latestRecord.get("periodValue");
            String period = String.valueOf(year);
            if (latestMonthObj != null) {
                try {
                    int latestMonth = Integer.parseInt(latestMonthObj.toString());
                    period = String.format("%d-%02d", year, latestMonth);
                } catch (NumberFormatException e) {
                    log.error("[Service] 기준 연월 포맷팅 에러 - periodValue: {}", latestMonthObj);
                }
            }

            // 기능 설명: 가공된 데이터를 Response DTO로 빌드하여 결과 리스트에 추가합니다.
            result.add(PerformanceResponse.builder()
                    .indicatorCode(entry.getKey())
                    .title(latestRecord.get("title") != null ? latestRecord.get("title").toString() : "")
                    .category(latestRecord.get("category") != null ? latestRecord.get("category").toString() : "")
                    .period(period)
                    .source(latestRecord.get("dataSourceType") != null ? latestRecord.get("dataSourceType").toString() : "")
                    .value(latestRecord.get("numericalValue") != null ? new BigDecimal(latestRecord.get("numericalValue").toString()) : null)
                    .unit(latestRecord.get("unit") != null ? latestRecord.get("unit").toString() : "")
                    .status(latestRecord.get("status") != null ? latestRecord.get("status").toString() : "")
                    .months(Arrays.asList(monthsData))
                    .build());
        }

        // 콘솔 로그: 최종 처리된 응답 객체 리스트의 크기를 알립니다.
        log.info("[Service] ESG 실적 데이터 매핑 완료 - 반환 개수: {}", result.size());
        return result;
    }
}