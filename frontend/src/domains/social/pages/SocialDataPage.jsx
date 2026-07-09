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

export default function SocialDataPage() {
  const { user } = useAuth();
  const canManage = user.role === ROLES.COMPANY_MANAGER;
  const {
    db,
    generateSocialSource,
    collectSocialData,
    analyzeRisk,
    confirmRiskAnalysis,
    completeRiskAction,
  } = useDemoData();

  const collection = db.socialCollection;
  const isProcessing = collection.jobStatus === "PROCESSING";
  const completed = db.socialWorkplaces.filter((item) => item.collectionStatus === "SUCCESS");
  const sourceReady = db.socialWorkplaces.filter((item) => item.sourceStatus === "READY").length;
  const collectionRate = Math.round((completed.length / db.socialWorkplaces.length) * 100);

  const totals = useMemo(() => completed.reduce((acc, item) => ({
    avgEmployees: acc.avgEmployees + item.avgEmployees,
    exits: acc.exits + item.exits,
    totalHours: acc.totalHours + item.totalHours,
    incidents: acc.incidents + item.incidents,
    trainingTarget: acc.trainingTarget + item.trainingTarget,
    trainingCompleted: acc.trainingCompleted + item.trainingCompleted,
    hazardsTotal: acc.hazardsTotal + item.hazardsTotal,
    hazardsCompleted: acc.hazardsCompleted + item.hazardsCompleted,
  }), { avgEmployees: 0, exits: 0, totalHours: 0, incidents: 0, trainingTarget: 0, trainingCompleted: 0, hazardsTotal: 0, hazardsCompleted: 0 }), [completed]);

  const injuryRate = totals.totalHours ? (totals.incidents / totals.totalHours) * 200000 : 0;
  const trainingRate = totals.trainingTarget ? (totals.trainingCompleted / totals.trainingTarget) * 100 : 0;
  const hazardRate = totals.hazardsTotal ? (totals.hazardsCompleted / totals.hazardsTotal) * 100 : 0;
  const turnoverRate = totals.avgEmployees ? (totals.exits / totals.avgEmployees) * 100 : 0;

  const workplaceColumns = [
    { key: "facilityName", label: "사업장" },
    { key: "incidents", label: "재해 건수", render: (value) => `${value}건` },
    { key: "totalHours", label: "총 근로시간", render: (value) => `${number(value)}시간` },
    { key: "trainingCompleted", label: "안전교육", render: (value, row) => `${value}/${row.trainingTarget}명` },
    { key: "hazardsCompleted", label: "위험요인 조치", render: (value, row) => `${value}/${row.hazardsTotal}건` },
    { key: "exits", label: "퇴사자", render: (value) => `${value}명` },
    { key: "sourceStatus", label: "원천 데이터", render: (value) => <StatusBadge status={value} label={value === "READY" ? "생성 완료" : "미생성"} /> },
    { key: "collectionStatus", label: "수집 상태", render: (value) => <StatusBadge status={value} /> },
    { key: "collectedAt", label: "수집 시각" },
  ];

  const riskColumns = [
    { key: "facilityName", label: "사업장" },
    { key: "title", label: "위험요인", render: (value, row) => <><strong>{value}</strong><small className="cell-sub">{row.description}</small></> },
    { key: "aiType", label: "AI 분류" },
    { key: "aiSeverity", label: "위험도", render: (value) => <span className={`risk-level risk-${value}`}>{value}</span> },
    { key: "analysisStatus", label: "AI 상태", render: (value) => <StatusBadge status={value} label={value === "WAITING" ? "분석 대기" : value === "PROCESSING" ? "분석 중" : "분석 완료"} /> },
    { key: "actionStatus", label: "조치 상태", render: (value) => <StatusBadge status={value === "COMPLETED" ? "COMPLETED" : "INCOMPLETE"} label={value === "COMPLETED" ? "조치 완료" : "조치 필요"} /> },
    {
      key: "id",
      label: "관리",
      render: (value, row) => (
        <div className="table-actions">
          <Button variant="outline" size="sm" disabled={!canManage || collection.aiJob.active || row.analysisStatus === "COMPLETED"} onClick={() => analyzeRisk(value)}>AI 분석</Button>
          <Button variant="light" size="sm" disabled={!canManage || row.analysisStatus !== "COMPLETED" || row.confirmed} onClick={() => confirmRiskAnalysis(value)}>담당자 확정</Button>
          <Button size="sm" disabled={!canManage || !row.confirmed || row.actionStatus === "COMPLETED"} onClick={() => completeRiskAction(value)}>조치 완료</Button>
        </div>
      ),
    },
  ];

  return (
    <div className="page-stack">
      <PageHeader
        breadcrumbs={["데이터 관리", "사회 데이터"]}
        eyebrow="SOCIAL DATA PIPELINE"
        title="사회 데이터 수집·안전관리"
        description="인사·안전·교육 데이터를 수집해 제조업 핵심 사회 지표 4개를 계산합니다."
      />

      <section className="domain-control-panel social-panel">
        <div>
          <span className="control-kicker">{collection.basePeriod} 사회 데이터</span>
          <h2>산업안전과 고용 안정성을 중심으로 관리합니다.</h2>
          <p>산업재해율, 안전교육 이수율, 위험요인 개선 조치율, 퇴사율만 핵심 지표로 사용합니다.</p>
          <div className="schedule-pills">
            <span>자동 실행 <b>{collection.schedule}</b></span>
            <span>대상 사업장 <b>{db.socialWorkplaces.length}개</b></span>
            <span>대시보드 캐시 <b>{collection.cacheStatus}</b></span>
          </div>
          <div className="ems-actions">
            <Button variant="light" onClick={generateSocialSource} disabled={!canManage || isProcessing}>사회 원천 데이터 생성</Button>
            <Button onClick={collectSocialData} disabled={!canManage || isProcessing || !collection.sourceGenerated}>
              {isProcessing ? `${collection.currentWorkplace || "사업장"} 수집 중` : "사회 데이터 즉시 수집"}
            </Button>
          </div>
        </div>
        <div className="redis-lock-card">
          <div className="redis-lock-head"><span className={`lock-dot ${collection.redisLock.active ? "active" : ""}`} /><div><b>Redis 수집 락</b><small>인사·안전·교육 중복 수집 방지</small></div></div>
          <code>{collection.redisLock.key}</code>
          <div className="lock-meta"><span>상태</span><b>{collection.redisLock.active ? "LOCKED" : "UNLOCKED"}</b></div>
          <div className="lock-meta"><span>진행률</span><b>{collection.progress}%</b></div>
          <div className="lock-meta"><span>캐시</span><b>{collection.cacheStatus}</b></div>
        </div>
      </section>

      <div className="summary-grid four">
        <article className="collection-stat"><span>산업재해율</span><strong>{number(injuryRate, 2)}</strong><small>건/20만 근로시간</small></article>
        <article className="collection-stat"><span>안전교육 이수율</span><strong>{number(trainingRate, 1)}%</strong><small>{totals.trainingCompleted}/{totals.trainingTarget}명</small></article>
        <article className="collection-stat"><span>위험요인 개선 조치율</span><strong>{number(hazardRate, 1)}%</strong><small>{totals.hazardsCompleted}/{totals.hazardsTotal}건</small></article>
        <article className="collection-stat"><span>퇴사율</span><strong>{number(turnoverRate, 1)}%</strong><small>퇴사 {totals.exits}명 / 평균 재직 {totals.avgEmployees}명</small></article>
      </div>

      <Card title="사업장별 사회 데이터 수집 현황" description={`원천 데이터 ${sourceReady}/${db.socialWorkplaces.length} · 수집률 ${collectionRate}%`} action={<StatusBadge status={collectionRate === 100 ? "COMPLETED" : "INCOMPLETE"} />}>
        <DataTable rows={db.socialWorkplaces} columns={workplaceColumns} />
      </Card>

      <div className="two-cols social-ai-layout">
        <Card title="AI 위험요인 분석" description="AI는 위험 유형·위험도·개선 조치 초안을 추천하고 담당자가 최종 확정합니다.">
          <div className="ai-job-box">
            <div><span className={`lock-dot ${collection.aiJob.active ? "active" : ""}`} /><b>{collection.aiJob.message}</b></div>
            <code>{collection.aiJob.key || "job:ai-risk-analysis:{riskId}"}</code>
            <div className="progress-track"><i style={{ width: `${collection.aiJob.progress}%` }} /></div>
            <small>처리 중 상태는 Redis, 확정된 AI 결과는 PostgreSQL에 저장하는 구조입니다.</small>
          </div>
        </Card>
        <Card title="사회 지표 반영 원칙" description="수집·조치 결과가 바뀌면 잠정 통계와 캐시를 함께 갱신합니다.">
          <div className="logic-list">
            <article><b>정해진 계산식</b><span>재해율·교육 이수율·퇴사율은 AI가 아닌 서비스 로직으로 계산</span></article>
            <article><b>AI 보조</b><span>위험요인 설명을 분류하고 개선 조치 초안만 생성</span></article>
            <article><b>승인 전 잠정값</b><span>기업 ESG 관리자만 확인하고 일반 사용자에게는 비공개</span></article>
          </div>
        </Card>
      </div>

      <Card title="위험요인 개선 조치" description="AI 분석 결과를 담당자가 확인한 후 조치 완료 처리하면 개선 조치율이 즉시 재계산됩니다.">
        <DataTable rows={db.riskItems} columns={riskColumns} />
        {db.riskItems.some((item) => item.analysisStatus === "COMPLETED") && (
          <div className="ai-result-stack">
            {db.riskItems.filter((item) => item.analysisStatus === "COMPLETED").map((item) => (
              <article key={item.id}>
                <div><b>{item.facilityName} · {item.aiType}</b><StatusBadge status={item.confirmed ? "COMPLETED" : "DRAFT"} label={item.confirmed ? "담당자 확정" : "검토 필요"} /></div>
                <p>{item.aiAction}</p>
              </article>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
