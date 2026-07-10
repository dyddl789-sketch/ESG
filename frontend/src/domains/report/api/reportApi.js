// 파일 위치: src/domains/report/api/reportApi.js
import apiClient from "../../../shared/api/apiClient";

export const reportApi = {
  // baseURL(/api)과 중복되지 않도록 앞의 /api를 모두 제거합니다.
  generate: (data) => apiClient.post("/reports", data),
  getTemplates: () => apiClient.get("/reports/templates"),
};