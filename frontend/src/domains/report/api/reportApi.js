// 파일 위치: src/domains/report/api/reportApi.js
import apiClient from "../../../shared/api/apiClient";

export const reportApi = { 
  generate: (data) => apiClient.post("/reports", data),
  getTemplates: () => apiClient.get("/reports/templates"),
  getFacilities: () => apiClient.get("/reports/facilities"),
  getMetrics: (year) => apiClient.get(`/reports/metrics?year=${year}`), // [추가] 신규 엔드포인트 호출
  getReports: () => apiClient.get("/reports"),
  togglePublic: (id, isPublic) => apiClient.patch(`/reports/${id}/public?isPublic=${isPublic}`),
  deleteReport: (id) => apiClient.delete(`/reports/${id}`),
};