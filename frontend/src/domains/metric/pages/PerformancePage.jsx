import { useMemo, useState } from "react";
import { Line } from "react-chartjs-2";
import { useDemoData } from "../../../app/providers/DemoDataProvider";
import PageHeader from "../../../shared/components/PageHeader";
import Card from "../../../shared/components/Card";
import Tabs from "../../../shared/components/Tabs";
import DataTable from "../../../shared/components/DataTable";
import StatusBadge from "../../../shared/components/StatusBadge";

const configs = {
  ENVIRONMENT: { label: "환경(E)", codes: ["E-POWER-001", "E-SCOPE2-002"] },
  SOCIAL: { label: "사회(S)", codes: ["S-SAFE-001", "S-TRAIN-002", "S-RISK-003", "S-TURN-004"] },
  GOVERNANCE: { label: "거버넌스(G)", codes: ["G-BOARD-001", "G-OUTSIDE-002", "G-ETHICS-003"] },
};

const latestByCode = (metrics, codes) => codes.map((code) => [...metrics].reverse().find((item) => item.indicatorCode === code)).filter(Boolean);
const formatValue = (metric) => `${Number(metric.value || 0).toLocaleString("ko-KR", { maximumFractionDigits: 2 })} ${metric.unit}`;

export default function PerformancePage() {
  const { db } = useDemoData();
  const [tab, setTab] = useState("ENVIRONMENT");
  const latest = useMemo(() => latestByCode(db.metrics, configs[tab].codes), [db.metrics, tab]);
  const selected = latest[0];
  const rows = db.metrics.filter((item) => item.category === tab).slice().reverse();
  const chart = selected ? {
    labels: selected.months.map((_, index) => `${index + 1}월`),
    datasets: [{ label: `${selected.title} (${selected.unit})`, data: selected.months, borderColor: "#2a7d55", backgroundColor: "rgba(42,125,85,.12)", fill: true, tension: .3 }],
  } : null;

  return (
    <div className="page-stack">
      <PageHeader
        breadcrumbs={["성과·보고", "ESG 실적 조회"]}
        title="ESG 실적 조회"
        description="내부 화면에는 최신 잠정값까지 즉시 반영하고, 상태를 구분해 승인 여부를 확인합니다."
      />
      <Tabs value={tab} onChange={setTab} items={Object.entries(configs).map(([value, config]) => ({ value, label: config.label }))} />

      <div className={`performance-cards performance-${tab.toLowerCase()}`}>
        {latest.map((metric) => (
          <article key={metric.indicatorCode}>
            <div className="performance-card-head"><span>{metric.title}</span><StatusBadge status={metric.status} /></div>
            <strong>{formatValue(metric)}</strong>
            <small>{metric.period} · {metric.status === "APPROVED" ? "공식 확정값" : "내부 잠정값"}</small>
          </article>
        ))}
      </div>

      <Card title={selected ? `${selected.title} 추이` : "핵심 지표 추이"} description="수집 완료 시 해당 기간의 최신 값이 차트 마지막 구간에 추가됩니다.">
        <div className="chart-box">{chart ? <Line data={chart} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: "bottom" } } }} /> : <p>수집된 데이터가 없습니다.</p>}</div>
      </Card>

      <Card title="지표별 잠정·승인 데이터" description="승인 완료 데이터만 외부 사용자 대시보드와 공식 보고서에 반영됩니다.">
        <DataTable rows={rows} columns={[
          { key: "indicatorCode", label: "지표코드" },
          { key: "title", label: "지표명" },
          { key: "period", label: "기준기간" },
          { key: "source", label: "원천 시스템" },
          { key: "value", label: "실적", render: (_, row) => formatValue(row) },
          { key: "status", label: "상태", render: (value) => <StatusBadge status={value} /> },
        ]} />
      </Card>
    </div>
  );
}
