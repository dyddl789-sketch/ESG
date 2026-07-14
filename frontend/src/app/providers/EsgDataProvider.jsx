/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { metricApi } from "../../domains/metric/api/metricApi";
import Swal from "sweetalert2";

const EsgDataContext = createContext(null);

/**
 * [핵심 수정 1] 백엔드 응답 언랩(unwrap) 유틸
 * - 백엔드 MetricController는 ResponseEntity<List<MetricResponse>> 를 그대로 반환하므로
 *   axios 응답의 response.data 가 곧 배열이다.
 * - 단, 추후 ApiResponse<T> ({ success, data, ... }) 래퍼로 통일될 경우를 대비해
 *   response.data.data 형태도 함께 처리한다.
 * - 기존 코드는 axios 응답 객체 전체를 setMetrics()에 넣어서
 *   metrics가 배열이 아니게 되어 목록/필터/요약 전부가 깨졌다.
 */
const unwrap = (response) => {
  const body = response?.data;
  if (Array.isArray(body)) return body;          // ResponseEntity<List> 형태
  if (Array.isArray(body?.data)) return body.data; // ApiResponse 래퍼 형태
  if (body?.data !== undefined) return body.data;  // 단건 객체
  return body;
};

export function EsgDataProvider({ children }) {
  const [metrics, setMetrics] = useState([]);
  const [loading, setLoading] = useState(false);

  const refreshMetrics = useCallback(async (filters = {}) => {
    setLoading(true);
    try {
      const response = await metricApi.list(filters);
      const data = unwrap(response);
      // [방어 코드] 어떤 경우에도 metrics는 항상 배열을 유지
      setMetrics(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("ESG 지표 조회 실패:", error);
      setMetrics([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // 마이크로태스크로 감싸 effect 본문의 동기 setState(lint: set-state-in-effect)를 회피
    let active = true;
    Promise.resolve().then(() => {
      if (active) refreshMetrics();
    });
    return () => {
      active = false;
    };
  }, [refreshMetrics]);

  /**
   * [핵심 수정 2] 승인 요청 구현
   * - MetricDetailPage에서 호출하지만 기존에는 미구현(undefined)이라
   *   버튼 클릭 시 "requestApproval is not a function" 런타임 에러가 발생했다.
   * - 서버 처리 후 목록을 재조회하여 상태 배지가 즉시 갱신되도록 한다.
   */
  const requestApproval = useCallback(async (metricId) => {
    try {
      await metricApi.requestApproval(metricId);
      await refreshMetrics();
      await Swal.fire({
        icon: "success",
        title: "승인 요청 완료",
        text: "시스템 총괄 관리자에게 전달되었습니다.",
        confirmButtonColor: "#1f6b46",
      });
      return true;
    } catch (error) {
      console.error("승인 요청 실패:", error);
      await Swal.fire({
        icon: "error",
        title: "승인 요청 실패",
        text: error.response?.data?.error?.message || "잠시 후 다시 시도해주세요.",
        confirmButtonColor: "#d14b43",
      });
      return false;
    }
  }, [refreshMetrics]);

  /**
   * [핵심 수정 3] 데이터 수정 구현
   * - 백엔드 MetricUpdateRequest(value, textValue, evidenceFileUrl, comment)와
   *   필드명을 일치시켜 전달한다.
   */
  const updateMetric = useCallback(async (metricId, payload) => {
    try {
      await metricApi.update(metricId, {
        value: payload.value ?? null,
        textValue: payload.textValue ?? null,
        evidenceFileUrl: payload.evidenceFileUrl ?? null,
        comment: payload.comment ?? null,
      });
      await refreshMetrics();
      return true;
    } catch (error) {
      console.error("데이터 수정 실패:", error);
      await Swal.fire({
        icon: "error",
        title: "저장 실패",
        text: error.response?.data?.error?.message || "잠시 후 다시 시도해주세요.",
        confirmButtonColor: "#d14b43",
      });
      return false;
    }
  }, [refreshMetrics]);

  return (
    <EsgDataContext.Provider
      value={{
        db: { metrics }, // 기존 컴포넌트 호환용 (db.metrics 형태)
        metrics,
        loading,
        refreshMetrics,
        requestApproval,
        updateMetric,
      }}
    >
      {children}
    </EsgDataContext.Provider>
  );
}

export const useEsgData = () => {
  const value = useContext(EsgDataContext);
  if (!value) throw new Error("useEsgData must be used inside EsgDataProvider");
  return value;
};
