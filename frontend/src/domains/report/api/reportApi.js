// 파일 위치: src/domains/report/api/reportApi.js
// 버전: v1.1.0
// 기능 요약: 백엔드 DB의 템플릿 목록을 조회하는 getTemplates 메서드를 추가합니다.
import apiClient from "../../../shared/api/apiClient";

export const reportApi = {
  generate: (data) => apiClient.post("/api/reports", data),
  getTemplates: () => apiClient.get("/api/reports/templates"),
};