import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useEsgData } from "../../../app/providers/EsgDataProvider";
import PageHeader from "../../../shared/components/PageHeader";
import Card from "../../../shared/components/Card";
import DataTable from "../../../shared/components/DataTable";
import StatusBadge from "../../../shared/components/StatusBadge";

export default function ApprovalListPage() {
  // 💡 실시간 데이터 동기화를 위해 refreshMetrics(또는 fetch 데이터 훅) 추가 활용
  const { metrics, loading, refreshMetrics } = useEsgData();
  const navigate = useNavigate();

  // 목록 페이지로 진입할 때마다 백엔드로부터 최신 결재 현황 상태를 강제로 새로고침
  useEffect(() => {
    if (refreshMetrics) {
      refreshMetrics();
    }
  }, []);

  // 승인 대기(PENDING) 상태인 데이터만 필터링
  const rows = metrics.filter(m => m.status === "PENDING");

  // 오늘 날짜 기준 통계 및 실시간 누적 수치 집계
  const stats = {
    pending: rows.length,
    todayApproved: metrics.filter(m => m.status === "APPROVED").length,
    todayRejected: metrics.filter(m => m.status === "REJECTED").length
  };

  if (loading) {
    return <div className="page-stack"><p style={{ padding: "40px", textAlign: "center" }}>승인 대기 목록을 불러오는 중입니다...</p></div>;
  }

  return (
    <div className="page-stack">
      <PageHeader
        breadcrumbs={["시스템 개요", "승인 관리"]}
        title="ESG 데이터 승인 관리"
        description="기업 ESG 관리자가 요청한 지표와 증빙자료를 최종 검토합니다."
      />

      <div className="approval-summary" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "20px", marginBottom: "20px" }}>
        <article className="stat-card" style={{ background: "#fff", padding: "20px", borderRadius: "8px", border: "1px solid #eee" }}>
          <span style={{ color: "#666", fontSize: "14px" }}>승인 대기</span>
          <strong style={{ display: "block", fontSize: "24px", color: "#1f6b46" }}>{stats.pending}건</strong>
        </article>
        <article className="stat-card" style={{ background: "#fff", padding: "20px", borderRadius: "8px", border: "1px solid #eee" }}>
          <span style={{ color: "#666", fontSize: "14px" }}>누적 승인</span>
          <strong style={{ display: "block", fontSize: "24px", color: "#2563eb" }}>{stats.todayApproved}건</strong>
        </article>
        <article className="stat-card" style={{ background: "#fff", padding: "20px", borderRadius: "8px", border: "1px solid #eee" }}>
          <span style={{ color: "#666", fontSize: "14px" }}>누적 반려</span>
          <strong style={{ display: "block", fontSize: "24px", color: "#d14b43" }}>{stats.todayRejected}건</strong>
        </article>
      </div>

      <Card title="승인 요청 목록">
        <DataTable
          rows={rows}
          // 클릭 시 테이블 행 고유 id 기반으로 상세 페이지 라우팅 이동
          onRowClick={(r) => navigate(`/admin/approvals/${r.id}`)}
          columns={[
            {
              key: "period",
              label: "기준기간",
              render: (v, r) => `${r.reportingYear}년 ${r.periodValue}${r.periodType === "MONTHLY" ? "월" : "분기"}`
            },
            { key: "category", label: "영역" },
            {
              key: "title",
              label: "지표명",
              render: (v, r) => (
                <>
                  <strong>{v}</strong>
                  <small className="cell-sub" style={{ display: "block", color: "#999", fontSize: "12px" }}>{r.indicatorCode}</small>
                </>
              )
            },
            { key: "facility", label: "사업장", render: v => v || "본사 공통" },
            {
              key: "value",
              label: "제출 실적",
              render: (v, r) => `${v?.toLocaleString() || "-"} ${r.unit || ""}`
            },
            { key: "inputUser", label: "요청자" },
            {
              key: "status",
              label: "상태",
              render: v => <StatusBadge status={v} />
            }
          ]}
        />
        {rows.length === 0 && (
          <p style={{ textAlign: "center", padding: "40px", color: "#999" }}>현재 승인 대기 중인 데이터가 없습니다.</p>
        )}
      </Card>
    </div>
  );
}
