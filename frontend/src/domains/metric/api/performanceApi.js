// 파일 위치: src/domains/metric/api/performanceApi.js
// 기능 요약: 승인 완료 ESG 실적과 연도별 거버넌스 목표값을 조회합니다.
import apiClient from "../../../shared/api/apiClient";

const unwrap = (response) => response.data?.data ?? response.data;

export const performanceApi = {
  // 기존 화면들이 Axios response 형식을 사용하므로 반환 구조를 유지합니다.
  getPerformanceMetrics: async (year = 2026) => {
    console.log(`[API Request] ESG 실적 데이터 조회 시작 - 기준 연도: ${year}`);

    const response = await apiClient.get("/performance", { params: { year } });

    console.log("[API Response] ESG 실적 데이터 조회 완료:", response);
    return response;
  },

  getGovernanceTargets: async (year) =>
    unwrap(
      await apiClient.get("/performance/governance-targets", {
        params: year ? { year } : {},
      }),
    ),
};
