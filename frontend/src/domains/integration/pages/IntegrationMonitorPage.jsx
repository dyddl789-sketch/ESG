// 파일 위치: src/domains/admin/pages/IntegrationMonitorPage.jsx
// 버전: v2.0.0
// 기능 요약: 더미 데이터를 걷어내고 백엔드 API를 통해 실제 연동 시스템 상태와 실행 이력을 렌더링하도록 변경합니다.
import React, { useState, useEffect } from "react";
import PageHeader from "../../../shared/components/PageHeader";
import Card from "../../../shared/components/Card";
import DataTable from "../../../shared/components/DataTable";
import StatusBadge from "../../../shared/components/StatusBadge";
import { integrationApi } from "../api/integrationApi";

export default function IntegrationMonitorPage() {
  const [dashboardData, setDashboardData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // 기능 설명: 컴포넌트 마운트 시 백엔드 API를 호출하여 대시보드 전체 데이터를 가져옵니다.
  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setIsLoading(true);
        console.log("[Render] IntegrationMonitorPage 마운트 - API 호출 시작");
        const response = await integrationApi.getDashboard();
        const data = response.data?.data || response.data;
        setDashboardData(data);
      } catch (error) {
        console.error("연동 모니터링 데이터를 불러오는 데 실패했습니다:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  const sourceColumns = [
    { key: "name", label: "원천 시스템", render: (value, row) => <><strong>{value}</strong><br/><small style={{ color: "#64748b" }}>{row.description}</small></> },
    { key: "schedule", label: "운영 스케줄" },
    { key: "lastRun", label: "마지막 실행" },
    { key: "newCount", label: "신규" },
    { key: "duplicateCount", label: "중복" },
    { key: "errorCount", label: "오류" },
    { key: "status", label: "상태", render: (value) => <StatusBadge status={value} /> },
  ];

  const historyColumns = [
    { key: "id", label: "실행 번호" },
    { key: "source", label: "시스템" },
    { key: "basePeriod", label: "기준기간" },
    { key: "triggerType", label: "실행 유형", render: (value) => value === "AUTO" ? "자동" : "수동" },
    { key: "startedAt", label: "시작 시각" },
    { key: "completedAt", label: "완료 시각" },
    { key: "success", label: "성공" },
    { key: "error", label: "오류" },
    { key: "status", label: "결과", render: (value) => <StatusBadge status={value} /> },
  ];

  return (
    <div className="page-stack">
      {console.log("[Render] PageHeader 컴포넌트 렌더링")}
      <PageHeader
        breadcrumbs={["운영 관리", "연동 모니터링"]}
        title="외부 시스템 연동 모니터링"
        description="시스템 총괄 관리자는 수집 실행 상태와 오류·중복 이력을 조회합니다."
      />
      
      {isLoading || !dashboardData ? (
        <div style={{ padding: "80px", textAlign: "center", color: "#64748b" }}>시스템 상태를 조회하고 있습니다...</div>
      ) : (
        <>
          {console.log("[Render] Summary Grid 렌더링")}
          <div className="summary-grid four">
            <article className="collection-stat">
              <span>EMS 사업장 수집</span>
              <strong>{dashboardData.summary.emsCompleted}/{dashboardData.summary.emsTotal}</strong>
              <small>{dashboardData.summary.basePeriod} 기준</small>
            </article>
            <article className="collection-stat">
              <span>현재 작업 상태</span>
              <strong>{dashboardData.summary.jobStatus}</strong>
              <small>{dashboardData.summary.currentWorkplace || "대기 중"}</small>
            </article>
            <article className="collection-stat">
              <span>Redis Lock</span>
              <strong>{dashboardData.summary.redisLockActive ? "LOCKED" : "FREE"}</strong>
              <small>{dashboardData.summary.redisLockKey}</small>
            </article>
            <article className="collection-stat">
              <span>최근 외부데이터 갱신</span>
              <strong>{dashboardData.summary.extSyncStatus}</strong>
              <small>{dashboardData.summary.extSyncTime}</small>
            </article>
          </div>

          {console.log("[Render] 원천 시스템 테이블 및 연동 실행 이력 테이블 렌더링")}
          <Card title="원천 시스템 운영 상태">
            <DataTable rows={dashboardData.sources} columns={sourceColumns} rowKey="id" />
          </Card>
          
          <Card title="연동 실행 이력" description="자동 스케줄러와 관리자 수동 실행 결과를 함께 확인합니다.">
            <DataTable rows={dashboardData.histories} columns={historyColumns} rowKey="id" />
          </Card>
        </>
      )}
    </div>
  );
}