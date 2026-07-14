// 파일 위치: src/domains/report/hooks/useReportHistory.js
// 버전: v5.3.0
// 기능 요약: 대외공시 토글 상태 제어 및 보고서 로우를 DB에서 영구히 삭제하는 물리 삭제 요청 로직을 관리합니다.
import { useState } from 'react';
import { reportApi } from '../api/reportApi';

export function useReportHistory() {
  const [viewMode, setViewMode] = useState("WRITE");
  const [historyRows, setHistoryRows] = useState([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);

  /* 기능 설명: 삭제나 상태 변경 후 이력 목록을 최신 상태로 재동기화(Re-fetching)합니다. */
  const fetchReports = async () => {
    setIsHistoryLoading(true);
    try {
      const response = await reportApi.getReports();
      const resData = response.data?.data || response.data;
      setHistoryRows(resData);
    } catch (error) {
      console.error("이력 로드 실패:", error);
    } finally {
      setIsHistoryLoading(false);
    }
  };

  const handleViewModeChange = async (mode) => {
    setViewMode(mode);
    if (mode === "HISTORY") {
      await fetchReports();
    }
  };

  /* 기능 설명: 대외공시 상태 버튼 클릭 시 true/false 상태를 스위칭합니다. */
    const handleTogglePublic = async (id, currentStatus) => {
    try {
        await reportApi.togglePublic(id, !currentStatus);
        await fetchReports();
    } catch (error) {
        // [핵심 보완] 숨겨진 에러의 원인을 콘솔에 강제로 찍어냅니다.
        console.error("🚨 공시 변경 요청 중 진짜 발생한 에러:", error); 
        alert("공시 상태 변경에 실패했습니다.");
    }
    };

  /* 기능 설명: [수정] 소프트 딜리트 방식을 배제하고, 백엔드의 DELETE 매핑 주소로 물리 삭제를 요청합니다. */
  const handlePermanentDelete = async (id) => {
    if (!window.confirm("해당 보고서를 영속 아카이브에서 영구 삭제하시겠습니까?\n삭제된 데이터는 복구할 수 없습니다.")) return;
    try {
      await reportApi.deleteReport(id);
      await fetchReports(); // 갱신
    } catch (error) {
      alert("보고서 삭제 처리 중 오류가 발생했습니다.");
    }
  };

  return {
    viewMode,
    setViewMode,
    historyRows,
    isHistoryLoading,
    handleViewModeChange,
    handleTogglePublic,
    handlePermanentDelete
  };
}