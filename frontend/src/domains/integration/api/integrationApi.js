import apiClient from "../../../shared/api/apiClient";

export const integrationApi = {
  getDashboard: async () => {
    // 콘솔 로그: API 호출 시작 및 변경된 요청 경로를 명시적으로 출력합니다.
    console.log("[API Request] 외부 시스템 연동 모니터링 데이터 조회 시작 (경로: /integrations/dashboard)");
    
    // 기능 설명: apiClient의 baseURL('/api') 뒤에 붙는 엔드포인트에서 'admin/'을 제거하여 컨트롤러 매핑 주소와 일치시킵니다.
    const response = await apiClient.get("/integrations/dashboard");
    
    // 콘솔 로그: API 응답 결과를 확인합니다.
    console.log("[API Response] 외부 시스템 연동 모니터링 데이터 수신 완료:", response);
    return response;
  }
};