import { useMemo } from "react";
import { useAuth } from "../../../app/providers/AuthProvider";
import { ROLES } from "../../../app/config/roles";
import { useDemoData } from "../../../app/providers/DemoDataProvider";
import PageHeader from "../../../shared/components/PageHeader";
import Card from "../../../shared/components/Card";
import Button from "../../../shared/components/Button";
import DataTable from "../../../shared/components/DataTable";
import StatusBadge from "../../../shared/components/StatusBadge";

const number = (value, digits = 0) => Number(value || 0).toLocaleString("ko-KR", {
  minimumFractionDigits: digits,
  maximumFractionDigits: digits,
});

export default function IntegrationPage() {
  const { user } = useAuth();
  const canManage = user.role === ROLES.COMPANY_MANAGER;
  const {
    db,
    generateEmsSource,
    collectAllEms,
    retryEmsWorkplace,
    resetDemo,
  } = useDemoData();

  const collection = db.emsCollection;
  const isProcessing = collection.jobStatus === "PROCESSING";
  const completed = db.emsWorkplaces.filter((item) => item.collectionStatus === "SUCCESS");
  const sourceReady = db.emsWorkplaces.filter((item) => item.sourceStatus === "READY").length;
  const collectionRate = Math.round((completed.length / db.emsWorkplaces.length) * 100);
  const totalUsage = completed.reduce((sum, item) => sum + item.usage, 0);
  const totalEmission = completed.reduce((sum, item) => sum + item.emission, 0);
  const totalProduction = completed.reduce((sum, item) => sum + item.production, 0);
  const intensity = totalProduction ? totalUsage / totalProduction : 0;

  const steps = useMemo(() => [
    { label: "원천 데이터 확인", done: collection.sourceGenerated },
    { label: "Redis 중복 실행 잠금", done: isProcessing || collection.jobStatus === "COMPLETED" },
    { label: "사업장 코드·단위 검증", done: collection.progress >= 25 },
    { label: "ESG 공통 형식 변환", done: collection.progress >= 50 },
    { label: "Scope 2 계산", done: collection.progress >= 75 },
    { label: "잠정 집계 갱신", done: collection.progress === 100 },
  ], [collection.jobStatus, collection.progress, collection.sourceGenerated, isProcessing]);

  const workplaceColumns = [
    { key: "facilityName", label: "사업장", render: (value, row) => <><strong>{value}</strong><small className="cell-sub">{row.sourceRecordId}</small></> },
    { key: "usage", label: "EMS 전력 사용량", render: (value) => `${number(value)} kWh` },
    { key: "production", label: "생산량", render: (value) => `${number(value)} ton` },
    { key: "intensity", label: "전력 원단위", render: (value) => `${number(value, 1)} kWh/ton` },
    { key: "sourceStatus", label: "원천 데이터", render: (value) => <StatusBadge status={value} label={value === "READY" ? "생성 완료" : "미생성"} /> },
    { key: "collectionStatus", label: "수집 상태", render: (value) => <StatusBadge status={value} /> },
    { key: "emission", label: "Scope 2 잠정값", render: (value, row) => row.collectionStatus === "SUCCESS" ? `${number(value, 2)} tCO₂eq` : "-" },
    { key: "collectedAt", label: "수집 시각" },
    {
      key: "id",
      label: "관리",
      render: (value, row) => (
        <Button
          variant="outline"
          size="sm"
          disabled={!canManage || !collection.sourceGenerated || isProcessing}
          onClick={(event) => {
            event.stopPropagation();
            retryEmsWorkplace(value);
          }}
        >
          {row.collectionStatus === "SUCCESS" ? "개별 재수집" : "개별 수집"}
        </Button>
      ),
    },
  ];

  const historyColumns = [
    { key: "id", label: "실행 번호" },
    { key: "basePeriod", label: "기준월" },
    { key: "triggerType", label: "실행 유형", render: (value) => value === "SCHEDULED" ? "자동 스케줄러" : "수동 즉시 실행" },
    { key: "startedAt", label: "시작 시각" },
    { key: "completedAt", label: "완료 시각" },
    { key: "total", label: "전체" },
    { key: "success", label: "성공" },
    { key: "error", label: "오류" },
    { key: "status", label: "결과", render: (value) => <StatusBadge status={value} /> },
  ];

  return (
    <div className="page-stack">
      <PageHeader
        breadcrumbs={["데이터 관리", "EMS 월간 수집"]}
        eyebrow="MANUFACTURING ESG DATA PIPELINE"
        title="EMS 월간 자동 수집"
        description="실제 운영은 매월 자동 실행되며, 시연에서는 동일한 수집 서비스를 즉시 실행합니다."
        actions={canManage ? <Button variant="outline" onClick={resetDemo} disabled={isProcessing}>시연 초기화</Button> : <span className="verified-role">조회 전용</span>}
      />

      <section className="ems-control-panel">
        <div className="ems-control-copy">
          <span className="control-kicker">{collection.basePeriod} 월간 수집</span>
          <h2>전체 사업장 EMS 데이터를 한 번에 수집합니다.</h2>
          <p>본사·부산공장·울산공장·창원공장의 전력 데이터를 검증하고 Scope 2 잠정값까지 계산합니다.</p>
          <div className="schedule-pills">
            <span>자동 실행 <b>{collection.schedule}</b></span>
            <span>다음 실행 <b>{collection.nextScheduledRun}</b></span>
            <span>대상 사업장 <b>{db.emsWorkplaces.length}개</b></span>
          </div>
          <div className="ems-actions">
            <Button variant="light" onClick={generateEmsSource} disabled={!canManage || isProcessing}>
              {collection.sourceGenerated ? "원천 데이터 다시 생성" : "시연용 원천 데이터 생성"}
            </Button>
            <Button onClick={collectAllEms} disabled={!canManage || isProcessing || !collection.sourceGenerated}>
              {isProcessing ? `${collection.currentWorkplace || "사업장"} 수집 중` : "자동 수집 즉시 실행"}
            </Button>
          </div>
        </div>
        <div className="redis-lock-card">
          <div className="redis-lock-head">
            <span className={`lock-dot ${collection.redisLock.active ? "active" : ""}`} />
            <div><b>Redis 분산 락</b><small>{collection.redisLock.active ? "수집 작업 보호 중" : "실행 대기"}</small></div>
          </div>
          <code>{collection.redisLock.key}</code>
          <div className="lock-meta"><span>상태</span><b>{collection.redisLock.active ? "LOCKED" : "UNLOCKED"}</b></div>
          <div className="lock-meta"><span>TTL</span><b>{collection.redisLock.active ? `${collection.redisLock.ttl}초` : "-"}</b></div>
          <p>반복 클릭과 다중 서버의 월간 수집 중복 실행을 차단합니다.</p>
        </div>
      </section>

      <div className="summary-grid four">
        <article className="collection-stat"><span>원천 데이터 준비</span><strong>{sourceReady}/{db.emsWorkplaces.length}</strong><small>{collection.sourceGeneratedAt || "아직 생성되지 않음"}</small></article>
        <article className="collection-stat"><span>사업장 수집률</span><strong>{collectionRate}%</strong><small>{completed.length}개 사업장 수집 완료</small></article>
        <article className="collection-stat"><span>월간 잠정 전력</span><strong>{number(totalUsage / 1000, 1)}</strong><small>MWh · 수집 완료 사업장 기준</small></article>
        <article className="collection-stat"><span>Scope 2 잠정값</span><strong>{number(totalEmission, 2)}</strong><small>tCO₂eq · 승인 전 내부값</small></article>
      </div>

      <Card title="수집 처리 단계" description="백엔드는 전체 작업을 처리하고, 화면은 사업장별 결과와 단계 진행률을 시각화합니다.">
        <div className="integration-progress">
          <div className="progress-track"><i style={{ width: `${collection.progress}%` }} /></div>
          <div className="progress-label"><b>{collection.progress}%</b><span>{isProcessing ? `${collection.currentWorkplace} 데이터를 처리하고 있습니다.` : collection.jobStatus === "COMPLETED" ? "전체 수집과 잠정 집계가 완료되었습니다." : "원천 데이터를 생성한 뒤 자동 수집을 실행하세요."}</span></div>
          <div className="step-grid">{steps.map((step, index) => <article key={step.label} className={step.done ? "done" : ""}><span>{step.done ? "✓" : index + 1}</span><b>{step.label}</b></article>)}</div>
        </div>
      </Card>

      <Card
        title="사업장별 EMS 수집 현황"
        description="같은 기준월의 사업장 데이터를 독립적으로 관리하고, 모두 수집되면 월간 검토가 가능합니다."
        action={<StatusBadge status={collectionRate === 100 ? "COMPLETED" : "INCOMPLETE"} />}
      >
        <DataTable rows={db.emsWorkplaces} columns={workplaceColumns} />
      </Card>

      <div className="two-cols ems-result-layout">
        <Card title="기업 전체 잠정 집계" description="사업장 데이터가 들어올 때마다 내부 관리자 화면에서 즉시 갱신됩니다.">
          <div className="provisional-result">
            <div><span>수집 범위</span><strong>{completed.length}/{db.emsWorkplaces.length} 사업장</strong></div>
            <div><span>전력 원단위</span><strong>{number(intensity, 1)} kWh/ton</strong></div>
            <div><span>공식 확정 여부</span><strong className={collectionRate === 100 ? "ready-text" : "warning-text"}>{collectionRate === 100 ? "관리자 검토 가능" : "확정 불가"}</strong></div>
          </div>
          <p className="provisional-note">현재 화면은 권한별 조회 화면이며, 최종 승인된 데이터만 공식 보고서와 외부 공개 자료에 반영됩니다.</p>
        </Card>
        <Card title="수집 기술 구성" description="EMS 수집 자체와 Redis의 역할을 분리했습니다.">
          <div className="tech-flow">
            <article><b>Spring Scheduler</b><span>매월 자동 실행</span></article><i>→</i>
            <article><b>Spring Boot</b><span>검증·정규화·계산</span></article><i>→</i>
            <article><b>PostgreSQL</b><span>원본·결과·이력 저장</span></article><i>+</i>
            <article><b>Redis</b><span>락·캐시 보조</span></article>
          </div>
        </Card>
      </div>

      <Card title="EMS 연동 실행 이력" description="자동 실행과 시연용 수동 실행을 구분해 기록합니다.">
        <DataTable rows={db.integrationRuns} columns={historyColumns} />
      </Card>
    </div>
  );
}
