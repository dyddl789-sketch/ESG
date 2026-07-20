import { Bar } from "react-chartjs-2";
import { useDemoData } from "../../../app/providers/DemoDataProvider";
import PageHeader from "../../../shared/components/PageHeader";
import Card from "../../../shared/components/Card";
import StatCard from "../../../shared/components/StatCard";

const latestApproved = (metrics, code) => [...metrics].reverse().find((item) => item.indicatorCode === code && item.status === "APPROVED");
const format = (metric, digits = 1) => Number(metric?.value || 0).toLocaleString("ko-KR", { maximumFractionDigits: digits });

export default function PublicDashboardPage() {
  const { db } = useDemoData();
  const approved = db.metrics.filter((item) => item.status === "APPROVED");
  const scope2 = latestApproved(db.metrics, "E-SCOPE2-002");
  const training = latestApproved(db.metrics, "S-TRAIN-002");
  const board = latestApproved(db.metrics, "G-BOARD-001");
  const injury = latestApproved(db.metrics, "S-SAFE-001");
  const hazard = latestApproved(db.metrics, "S-RISK-003");
  const turnover = latestApproved(db.metrics, "S-TURN-004");
  const outside = latestApproved(db.metrics, "G-OUTSIDE-002");
  const ethics = latestApproved(db.metrics, "G-ETHICS-003");
  const eScore = 85;
  const sScore = Math.round(((100 - Number(injury?.value || 0) * 18) + Number(training?.value || 0) + Number(hazard?.value || 0) + (100 - Number(turnover?.value || 0) * 5)) / 4);
  const gScore = Math.round((Number(board?.value || 0) + Math.min(100, Number(outside?.value || 0) * 2) + Number(ethics?.value || 0)) / 3);
  const overallScore = Math.round((eScore + sScore + gScore) / 3);
  const chart = { labels: ["2022", "2023", "2024", "2025", "2026"], datasets: [{ label: "ESG 종합점수", data: [67, 71, 76, 79, overallScore], backgroundColor: "#2a7d55", borderRadius: 6 }] };

  return (
    <div className="page-stack">
      <PageHeader breadcrumbs={["공개 ESG 정보", "대시보드"]} title="공개 ESG 대시보드" description="최종 승인된 ESG 확정값만 제공합니다. 승인 대기 또는 반려 데이터는 공개되지 않습니다." />
      <div className="public-hero"><div><span>2026 ESG SCORE</span><strong>{overallScore}</strong><p>에코모빌리티 파츠 주식회사</p></div><div className="public-score-items"><article><b>{eScore}</b><span>환경(E)</span></article><article><b>{sScore}</b><span>사회(S)</span></article><article><b>{gScore}</b><span>거버넌스(G)</span></article></div></div>
      <div className="summary-grid four">
        <StatCard label="승인 공개 지표" value={`${approved.length}건`} helper="검증 완료 데이터" icon="✓" />
        <StatCard label="Scope 2" value={`${format(scope2, 2)}`} helper={`${scope2?.unit ?? "tCO₂eq"} · ${scope2?.period ?? "-"}`} tone="green" icon="E" />
        <StatCard label="안전교육 이수율" value={`${format(training)}%`} helper={training?.period ?? "-"} tone="orange" icon="S" />
        <StatCard label="이사회 참석률" value={`${format(board)}%`} helper={board?.period ?? "-"} tone="blue" icon="G" />
      </div>
      <Card title="연도별 ESG 점수"><div className="chart-box"><Bar data={chart} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, max: 100 } } }} /></div></Card>
    </div>
  );
}
