import apiClient from "../../../shared/api/apiClient";

export const metricApi = {
  // ESG 지표 목록 조회 (필터 포함)
  list: (params) => apiClient.get("/esg/metrics", { params }),

  // 특정 지표 상세 조회
  detail: (id) => apiClient.get(`/esg/metrics/${id}`),

  // [신규] ESG 데이터 등록
  create: (data) => apiClient.post("/esg/metrics", data),

  // [신규] 활성 지표 마스터 목록 조회 (등록 폼용)
  getIndicators: () => apiClient.get("/esg/metrics/indicators"),

  // 승인 요청
  requestApproval: (id) => apiClient.patch(`/esg/metrics/${id}/request-approval`),

  // [신규] 승인/반려 결정 (관리자용)
  // decision: 'APPROVED' | 'REJECTED', comment: 반려 사유
  decide: (id, decision, comment) =>
    apiClient.patch(`/esg/metrics/${id}/decide`, null, {
      params: { decision, comment }
    }),

  // 지표 데이터 수정
  update: (id, data) => apiClient.put(`/esg/metrics/${id}`, data),
};
