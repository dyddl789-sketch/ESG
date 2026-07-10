import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { metricApi } from "../../domains/metric/api/metricApi";
import Swal from "sweetalert2";

const EsgDataContext = createContext(null);

export function EsgDataProvider({ children }) {
  const [metrics, setMetrics] = useState([]);
  const [loading, setLoading] = useState(false);

  const refreshMetrics = useCallback(async (filters = {}) => {
    setLoading(true);
    try {
      const data = await metricApi.list(filters);
      setMetrics(data);
    } catch (error) {
      console.error("실제 API 호출 실패:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshMetrics();
  }, [refreshMetrics]);

  const requestApproval = async (metricId) => {
    try {
      await metricApi.requestApproval(metricId);
      await refreshMetrics();
      Swal.fire({ icon: "success", title: "승인 요청 완료", text: "실제 서버에 승인 요청이 전달되었습니다." });
    } catch (error) {
      Swal.fire({ icon: "error", title: "요청 실패", text: "서버 통신 중 오류가 발생했습니다." });
    }
  };

  const updateMetric = async (metricId, payload) => {
    try {
      await metricApi.update(metricId, payload);
      await refreshMetrics();
      Swal.fire({ icon: "success", title: "수정 완료", text: "실제 서버에 데이터가 저장되었습니다." });
    } catch (error) {
      Swal.fire({ icon: "error", title: "수정 실패", text: "데이터 저장 중 오류가 발생했습니다." });
    }
  };

  return (
    <EsgDataContext.Provider value={{ 
      db: { metrics }, // 기존 컴포넌트 구조 유지를 위해 db 객체로 감쌈
      loading,
      refreshMetrics,
      requestApproval,
      updateMetric
    }}>
      {children}
    </EsgDataContext.Provider>
  );
}

export const useEsgData = () => {
  const context = useContext(EsgDataContext);
  if (!context) throw new Error("useEsgData는 EsgDataProvider 내부에서 사용해야 합니다.");
  return context;
};
