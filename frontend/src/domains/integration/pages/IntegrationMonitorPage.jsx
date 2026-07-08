import { useDemoData } from "../../../app/providers/DemoDataProvider";
import PageHeader from "../../../shared/components/PageHeader";
import Card from "../../../shared/components/Card";
import DataTable from "../../../shared/components/DataTable";
import StatusBadge from "../../../shared/components/StatusBadge";

export default function IntegrationMonitorPage() {
  const { db } = useDemoData();
  const collection = db.emsCollection;
  const completed = db.emsWorkplaces.filter((item) => item.collectionStatus === "SUCCESS").length;

  const sourceColumns = [
    { key: "name", label: "원천 시스템", render: (value, row) => <><strong>{value}</strong><small className="cell-sub">{row.description}</small></> },
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
    { key: "triggerType", label: "실행 유형", render: (value) => value === "SCHEDULED" ? "자동" : "수동" },
    { key: "startedAt", label: "시작 시각" },
    { key: "completedAt", label: "완료 시각" },
    { key: "success", label: "성공" },
    { key: "error", label: "오류" },
    { key: "status", label: "결과", render: (value) => <StatusBadge status={value} /> },
  ];

  return (
    <div className="page-stack">
      <PageHeader
        breadcrumbs={["운영 관리", "연동 모니터링"]}
        title="외부 시스템 연동 모니터링"
        description="시스템 총괄 관리자는 수집 실행 상태와 오류·중복 이력을 조회합니다."
      />
      <div className="summary-grid four">
        <article className="collection-stat"><span>EMS 사업장 수집</span><strong>{completed}/{db.emsWorkplaces.length}</strong><small>{collection.basePeriod} 기준</small></article>
        <article className="collection-stat"><span>현재 작업 상태</span><strong>{collection.jobStatus}</strong><small>{collection.currentWorkplace || "대기 중"}</small></article>
        <article className="collection-stat"><span>Redis Lock</span><strong>{collection.redisLock.active ? "LOCKED" : "FREE"}</strong><small>{collection.redisLock.key}</small></article>
        <article className="collection-stat"><span>최근 외부데이터 갱신</span><strong>{db.externalBenchmarks.status}</strong><small>{db.externalBenchmarks.lastSyncedAt}</small></article>
      </div>
      <Card title="원천 시스템 운영 상태"><DataTable rows={db.integrations} columns={sourceColumns} rowKey="id" /></Card>
      <Card title="연동 실행 이력" description="자동 스케줄러와 관리자 수동 실행 결과를 함께 확인합니다."><DataTable rows={db.integrationRuns} columns={historyColumns} /></Card>
    </div>
  );
}
