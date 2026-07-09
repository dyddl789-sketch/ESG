import apiClient from "../../../shared/api/apiClient";

export const reportApi = {
  // 작성된 보고서 목록 조회
  list: () => apiClient.get("/reports"),
  
  // 최종 보고서 메타데이터(제목, 본문 HTML, PDF URL 등) 저장
  // (Spring Boot 백엔드의 POST /api/reports 에 대응됨)
  generate: (data) => apiClient.post("/reports", data)
};