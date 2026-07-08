import { Link } from "react-router-dom";
import { Line } from "react-chartjs-2";
import { useDemoData } from "../../../app/providers/DemoDataProvider";
import { getDashboardSummary } from "../api/dashboardApi";
import PageHeader from "../../../shared/components/PageHeader";
import Card from "../../../shared/components/Card";
import StatCard from "../../../shared/components/StatCard";
import StatusBadge from "../../../shared/components/StatusBadge";
import ScoreRing from "../components/ScoreRing";
import CollectionCards from "../components/CollectionCards";

const latestMetric = (metrics, code) => [...metrics].reverse().find((item) => item.indicatorCode === code);
const number = (value, digits = 0) => Number(value || 0).toLocaleString("ko-KR", { minimumFractionDigits: digits, maximumFractionDigits: digits });

export default function ManagerDashboardPage() {
  const { db } = useDemoData();
  const summary = getDashboardSummary(db);
  const scope2 = latestMetric(db.metrics, "E-SCOPE2-002");
  const injury = latestMetric(db.metrics, "S-SAFE-001");
  const board = latestMetric(db.metrics, "G-BOARD-001");
  const environmentalTrend = scope2?.months ?? [464.9, 481.5, 498.4, 507.2, 520.2];
  const chart = {
    labels: environmentalTrend.map((_, index) => `${index + 1}월`),
    datasets: [
      { label: "Scope 2 배출량", data: environmentalTrend, borderColor: "#1f6b46", backgroundColor: "rgba(31,107,70,.12)", fill: true, tension: .35 },
      { label: "감축 목표", data: environmentalTrend.map((_, index) => 530 - index * 8), borderColor: "#d59231", borderDash: [6, 6], tension: .2 },
    ],
  };

  const domainCards = [
    { key: "E", title: "환경·EMS", rate: summary.environmentRate, value: `${number(scope2?.value, 2)} tCO₂eq`, label: "Scope 2 최신 잠정/확정값", to: "/manager/integrations", cache: db.emsCollection.cacheStatus },
    { key: "S", title: "사회·안전", rate: summary.socialRate, value: `${number(injury?.value, 2)} 건/20만시간`, label: "산업재해율 최신값", to: "/manager/social", cache: db.socialCollection.cacheStatus },
    { key: "G", title: "거버넌스", rate: summary.governanceRate, value: `${number(board?.value, 1)}%`, label: "이사회 참석률 최신값", to: "/manager/governance", cache: db.governanceCollection.cacheStatus },
  ];

  return (
    <div className="page-stack">
      <PageHeader
        breadcrumbs={["홈", "ESG 대시보드"]}
        title="ESG 종합 대시보드"
        description="환경·사회·거버넌스의 수집 결과를 즉시 잠정 통계에 반영하고, 승인된 값만 외부에 공개합니다."
        actions={<select className="select"><option>2026년</option><option>2025년</option></select>}
      />

      <section className="domain-overview-grid">
        {domainCards.map((item) => (
          <article key={item.key} className={`domain-overview domain-${item.key.toLowerCase()}`}>
            <div className="domain-overview-head"><span>{item.key}</span><StatusBadge status={item.rate === 100 ? "COMPLETED" : "INCOMPLETE"} /></div>
            <h2>{item.title}</h2>
            <strong>{item.value}</strong>
            <p>{item.label}</p>
            <div className="mini-progress"><i style={{ width: `${item.rate}%` }} /></div>
            <div className="domain-overview-meta"><span>수집률 {item.rate}%</span><span>캐시 {item.cache}</span></div>
            <Link to={item.to}>관리 화면 열기 →</Link>
          </article>
        ))}
      </section>

      <div className="summary-grid">
        <StatCard label="종합 ESG 점수" value={summary.overallScore} helper="수집·성과 기준 동적 계산" icon="ESG" />
        <StatCard label="환경(E)" value={summary.eScore} helper="전력·Scope 2" icon="E" />
        <StatCard label="사회(S)" value={summary.sScore} helper="안전·교육·고용" tone="orange" icon="S" />
        <StatCard label="거버넌스(G)" value={summary.gScore} helper="이사회·윤리" tone="blue" icon="G" />
        <StatCard label="전체 수집률" value={`${summary.totalCollectionRate}%`} helper="E·S·G 평균" tone="purple" icon="↻" />
        <StatCard label="승인 대기" value={`${summary.pending}건`} helper={`반려 ${summary.rejected}건`} tone="red" icon="!" />
      </div>

      <div className="dashboard-cols">
        <Card title="ESG 종합 현황" className="score-card">
          <div className="score-row">
            <ScoreRing score={summary.overallScore} />
            <div className="score-bars">{[["환경", summary.eScore], ["사회", summary.sScore], ["거버넌스", summary.gScore]].map(([label, value]) => <div key={label}><span>{label}<b>{value}</b></span><i><em style={{ width: `${value}%` }} /></i></div>)}</div>
          </div>
        </Card>
        <Card title="월별 Scope 2 배출 추이" description="EMS 수집 후 최신 잠정값까지 차트에 즉시 반영됩니다.">
          <div className="chart-box"><Line data={chart} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: "bottom" } }, scales: { y: { grid: { color: "#edf1ef" } } } }} /></div>
        </Card>
      </div>

      <Card title="외부 시스템 수집 상태" action={<Link className="text-link" to="/manager/integrations">환경 수집 관리 →</Link>}>
        <CollectionCards sources={db.integrations} />
      </Card>
    </div>
  );
}
