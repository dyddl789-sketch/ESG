import React from "react";
import { Radar, Line } from "react-chartjs-2";
import "../../../shared/chart/registerChart";
import EmptyState from "../../../shared/components/EmptyState";

/**
 * [신규 생성] PerformancePage가 import하지만 존재하지 않아 빌드가 깨지던 컴포넌트.
 * - type="radar": 카테고리(E/S/G)별 승인 완료율 레이더 차트
 * - type="line" : months 배열(최근 수개월 수치)이 있는 지표의 월별 추이 라인 차트
 * 백엔드가 months를 아직 채워주지 않는 경우(EmptyState)도 방어 처리한다.
 */

const CATEGORY_LABELS = { ENVIRONMENT: "환경(E)", SOCIAL: "사회(S)", GOVERNANCE: "거버넌스(G)" };
const LINE_COLORS = ["#1f6b46", "#2f80ed", "#d14b43", "#9b51e0", "#f2994a"];

function buildRadarData(metrics) {
  const categories = ["ENVIRONMENT", "SOCIAL", "GOVERNANCE"];
  const rates = categories.map((cat) => {
    const items = metrics.filter((m) => m.category === cat);
    if (items.length === 0) return 0;
    const approved = items.filter((m) => m.status === "APPROVED").length;
    return Math.round((approved / items.length) * 100);
  });

  return {
    labels: categories.map((c) => CATEGORY_LABELS[c]),
    datasets: [
      {
        label: "승인 완료율 (%)",
        data: rates,
        backgroundColor: "rgba(31, 107, 70, 0.18)",
        borderColor: "#1f6b46",
        pointBackgroundColor: "#1f6b46",
        borderWidth: 2,
      },
    ],
  };
}

function buildLineData(metrics) {
  // months 배열이 존재하는 지표만 라인 차트 대상으로 사용
  const withMonths = metrics.filter((m) => Array.isArray(m.months) && m.months.length > 0);
  if (withMonths.length === 0) return null;

  const maxLen = Math.max(...withMonths.map((m) => m.months.length));
  const labels = Array.from({ length: maxLen }, (_, i) => `M-${maxLen - 1 - i}`);

  return {
    labels,
    datasets: withMonths.slice(0, 5).map((m, idx) => ({
      label: `${m.title} (${m.unit || ""})`,
      data: m.months.map((v) => Number(v)),
      borderColor: LINE_COLORS[idx % LINE_COLORS.length],
      backgroundColor: "transparent",
      tension: 0.3,
      pointRadius: 3,
    })),
  };
}

export default function PerformanceCharts({ type = "line", metrics = [] }) {
  const list = Array.isArray(metrics) ? metrics : [];

  if (list.length === 0) {
    return <EmptyState title="표시할 데이터가 없습니다" description="최종 승인된 지표 데이터가 있으면 차트가 표시됩니다." />;
  }

  if (type === "radar") {
    return (
      <div style={{ height: 300 }}>
        <Radar
          data={buildRadarData(list)}
          options={{
            responsive: true,
            maintainAspectRatio: false,
            scales: { r: { min: 0, max: 100, ticks: { stepSize: 20 } } },
          }}
        />
      </div>
    );
  }

  const lineData = buildLineData(list);
  if (!lineData) {
    return <EmptyState title="월별 추이 데이터가 없습니다" description="월별 승인 실적이 등록된 지표가 없습니다." />;
  }

  return (
    <div style={{ height: 300 }}>
      <Line
        data={lineData}
        options={{
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { position: "bottom" } },
        }}
      />
    </div>
  );
}
