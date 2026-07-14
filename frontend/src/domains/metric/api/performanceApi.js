// 파일 위치: src/domains/performance/api/performanceApi.js
// 버전: v1.2.0 
// 기능 요약: 공통 apiClient를 사용하여 백엔드의 ESG 실적 데이터를 조회하는 API 함수 모음
import apiClient from "../../../shared/api/apiClient";

export const performanceApi = { 
  getPerformanceMetrics: async (year = 2026) => {
    console.log(`[API Request] ESG 실적 데이터 조회 시작 - 기준 연도: ${year}`);
    
    const response = await apiClient.get(`/performance?year=${year}`);
    
    console.log("[API Response] ESG 실적 데이터 조회 완료:", response);
    
    return response;
  }
};