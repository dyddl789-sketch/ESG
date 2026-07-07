/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState } from "react";
import Swal from "sweetalert2";
import { initialDb } from "../../mocks/db";

const DemoDataContext = createContext(null);
const clone = (value) => JSON.parse(JSON.stringify(value));

export function DemoDataProvider({ children }) {
  const [db, setDb] = useState(() => clone(initialDb));

  const updateMetric = (metricId, patch, historyEntry) => {
    setDb((current) => ({
      ...current,
      metrics: current.metrics.map((metric) => {
        if (metric.id !== Number(metricId)) return metric;
        return {
          ...metric,
          ...patch,
          history: historyEntry ? [...metric.history, historyEntry] : metric.history,
        };
      }),
    }));
  };

  const requestApproval = async (metricId, user) => {
    updateMetric(metricId, { status: "PENDING" }, {
      at: new Date().toLocaleString("ko-KR", { hour12: false }), user: user.name, action: "승인 요청", comment: "관리자 최종 검토 요청",
    });
    await Swal.fire({ icon: "success", title: "승인 요청 완료", text: "시스템 총괄 관리자에게 전달되었습니다.", confirmButtonColor: "#1f6b46" });
  };

  const decideApproval = async (metricId, decision, user) => {
    let comment = "최종 승인";
    if (decision === "REJECTED") {
      const result = await Swal.fire({
        title: "반려 사유 입력", input: "textarea", inputPlaceholder: "보완이 필요한 내용을 입력하세요.", showCancelButton: true,
        confirmButtonText: "반려", cancelButtonText: "취소", confirmButtonColor: "#d14b43", inputValidator: (value) => !value?.trim() && "반려 사유를 입력하세요.",
      });
      if (!result.isConfirmed) return false;
      comment = result.value;
    }
    updateMetric(metricId, { status: decision }, {
      at: new Date().toLocaleString("ko-KR", { hour12: false }), user: user.name, action: decision === "APPROVED" ? "최종 승인" : "반려", comment,
    });
    await Swal.fire({ icon: decision === "APPROVED" ? "success" : "info", title: decision === "APPROVED" ? "승인 완료" : "반려 완료", confirmButtonColor: "#1f6b46" });
    return true;
  };

  const runIntegration = async (sourceId = "ALL") => {
    const now = new Date().toLocaleString("ko-KR", { hour12: false });
    setDb((current) => ({
      ...current,
      integrations: current.integrations.map((source) => (
        sourceId === "ALL" || source.id === sourceId
          ? { ...source, lastRun: now, status: "NORMAL", errorCount: 0, newCount: source.newCount + 1 }
          : source
      )),
    }));
    await Swal.fire({ icon: "success", title: "연동 완료", text: "원천 데이터 수집·기본 검증·정규화를 완료했습니다.", confirmButtonColor: "#1f6b46" });
  };

  const resetDemo = () => setDb(clone(initialDb));

  const value = { db, updateMetric, requestApproval, decideApproval, runIntegration, resetDemo };
  return <DemoDataContext.Provider value={value}>{children}</DemoDataContext.Provider>;
}

export function useDemoData() {
  const value = useContext(DemoDataContext);
  if (!value) throw new Error("useDemoData must be used inside DemoDataProvider");
  return value;
}
