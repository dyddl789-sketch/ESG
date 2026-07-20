import { useEffect, useMemo, useState } from "react";
import { Line } from "react-chartjs-2";
import { useNavigate } from "react-router-dom";
import PageHeader from "../../../shared/components/PageHeader";
import Card from "../../../shared/components/Card";
import Button from "../../../shared/components/Button";
import Tabs from "../../../shared/components/Tabs";
import DataTable from "../../../shared/components/DataTable";
import StatusBadge from "../../../shared/components/StatusBadge";
import { performanceApi } from "../api/performanceApi";

const YEAR_OPTIONS = [2026, 2025, 2024];

const configs = {
  ENVIRONMENT: { label: "환경(E)", codes: ["IND_E_ELEC", "IND_E_SCOPE2"] },
  SOCIAL: {
    label: "사회(S)",
    codes: ["IND_S_INJURY_RATE", "IND_S_SAFETY_EDU", "IND_S_RISK_ACTION", "IND_S_TURNOVER"],
  },
  GOVERNANCE: { label: "거버넌스(G)", codes: ["IND_G_ATTENDANCE", "IND_G_OUTSIDE", "IND_G_ETHICS_EDU"] },
};

const latestByCode = (metrics, codes) =>
  codes.map((code) => metrics.find((item) => item.indicatorCode === code)).filter(Boolean);

const formatValue = (metric) => {
  if (metric?.value === null || metric?.value === undefined) return "-";
  return `${Number(metric.value).toLocaleString("ko-KR", { maximumFractionDigits: 2 })} ${metric.unit || ""}`.trim();
};

function CopyIcon({ onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title="실적 텍스트 복사"
      aria-label="실적 텍스트 복사"
      style={{ border: 0, background: "transparent", padding: 2, cursor: "pointer", color: "#94a3b8" }}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
      </svg>
    </button>
  );
}

export default function PerformancePage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState("ENVIRONMENT");
  const [year, setYear] = useState(2026);
  const [metrics, setMetrics] = useState([]);
  const [prevYearMetrics, setPrevYearMetrics] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let active = true;

    const fetchMetrics = async () => {
      setIsLoading(true);
      setErrorMessage("");
      try {
        const [currentResponse, previousResponse] = await Promise.all([
          performanceApi.getPerformanceMetrics(year),
          performanceApi.getPerformanceMetrics(year - 1),
        ]);

        if (!active) return;
        setMetrics(currentResponse.data?.data || currentResponse.data || []);
        setPrevYearMetrics(previousResponse.data?.data || previousResponse.data || []);
      } catch (error) {
        if (!active) return;
        console.error("ESG 승인 실적 조회 실패", error);
        setErrorMessage("최종 승인된 ESG 실적을 불러오지 못했습니다.");
        setMetrics([]);
        setPrevYearMetrics([]);
      } finally {
        if (active) setIsLoading(false);
      }
    };

    void fetchMetrics();
    return () => {
      active = false;
    };
  }, [year]);

  const categoryMetrics = useMemo(
    () => metrics.filter((item) => item.category === tab && item.status === "APPROVED"),
    [metrics, tab],
  );

  const latest = useMemo(
    () => latestByCode(categoryMetrics, configs[tab].codes),
    [categoryMetrics, tab],
  );

  const selected = latest[0];
  const chart = selected?.months
    ? {
        labels: selected.months.map((_, index) => `${index + 1}월`),
        datasets: [
          {
            label: `${selected.title} (${selected.unit || ""})`,
            data: selected.months,
            borderColor: "#2a7d55",
            backgroundColor: "rgba(42,125,85,.12)",
            fill: true,
            tension: 0.3,
            spanGaps: false,
          },
        ],
      }
    : null;

  const getYoY = (indicatorCode, currentMonths) => {
    if (!currentMonths) return null;

    let latestMonthIndex = -1;
    for (let index = 11; index >= 0; index -= 1) {
      if (currentMonths[index] !== null && currentMonths[index] !== undefined) {
        latestMonthIndex = index;
        break;
      }
    }
    if (latestMonthIndex < 0) return null;

    const previousMetric = prevYearMetrics.find(
      (item) => item.indicatorCode === indicatorCode && item.status === "APPROVED",
    );
    const previousValue = previousMetric?.months?.[latestMonthIndex];
    const currentValue = currentMonths[latestMonthIndex];
    if (previousValue === null || previousValue === undefined || Number(previousValue) === 0) return null;

    const rate = ((Number(currentValue) - Number(previousValue)) / Number(previousValue)) * 100;
    const lowerIsBetter = ["IND_E_ELEC", "IND_E_SCOPE2", "IND_S_INJURY_RATE", "IND_S_TURNOVER"].includes(indicatorCode);
    const improved = lowerIsBetter ? rate < 0 : rate > 0;
    const color = rate === 0 ? "#64748b" : improved ? "#2563eb" : "#dc2626";
    const symbol = rate > 0 ? "▲" : rate < 0 ? "▼" : "-";

    return (
      <span style={{ fontSize: "13px", fontWeight: 600, color, marginLeft: "12px" }}>
        {symbol} {Math.abs(rate).toFixed(1)}% <small style={{ color: "#94a3b8" }}>전년 동월 대비</small>
      </span>
    );
  };

  const handleCopy = async (metric) => {
    const text = `[${metric.period}] ${metric.title}: ${formatValue(metric)}`;
    await navigator.clipboard.writeText(text);
    window.alert(`클립보드에 복사되었습니다.\n\n${text}`);
  };

  const handleExportCsv = () => {
    const headers = ["지표코드", "지표명", "기준기간", "원천 시스템", "실적", "상태"];
    const rows = categoryMetrics.map((row) => [
      row.indicatorCode,
      row.title,
      row.period,
      row.source,
      formatValue(row),
      row.status,
    ]);
    const escape = (value) => `"${String(value ?? "").replaceAll('"', '""')}"`;
    const csv = `\uFEFF${[headers, ...rows].map((row) => row.map(escape).join(",")).join("\n")}`;
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `ESG_승인실적_${year}_${tab}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="page-stack">
      <PageHeader
        breadcrumbs={["성과·보고", "ESG 실적 조회"]}
        eyebrow="APPROVED ESG PERFORMANCE"
        title="ESG 실적 조회"
        description="최종 승인된 DB 데이터만 연도별·월별 공식 실적으로 조회합니다."
        actions={(
          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            <Button variant="outline" onClick={handleExportCsv} disabled={!categoryMetrics.length}>CSV 다운로드</Button>
            <Button onClick={() => navigate(`/manager/reports?year=${year}`)}>리포트 작성</Button>
          </div>
        )}
      />

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "16px", flexWrap: "wrap" }}>
        <Tabs
          value={tab}
          onChange={setTab}
          items={Object.entries(configs).map(([value, config]) => ({ value, label: config.label }))}
        />
        <label style={{ display: "flex", alignItems: "center", gap: "8px", fontWeight: 600 }}>
          <span>기준연도</span>
          <select value={year} onChange={(event) => setYear(Number(event.target.value))}>
            {YEAR_OPTIONS.map((option) => <option key={option} value={option}>{option}년 실적</option>)}
          </select>
        </label>
      </div>

      {isLoading ? (
        <div className="page-loading">승인 완료 실적을 집계하는 중입니다.</div>
      ) : errorMessage ? (
        <Card><p className="warning-text">{errorMessage}</p></Card>
      ) : (
        <>
          <div className={`performance-cards performance-${tab.toLowerCase()}`}>
            {latest.map((metric) => (
              <article key={metric.indicatorCode}>
                <div className="performance-card-head">
                  <span style={{ display: "flex", alignItems: "center" }}>
                    {metric.title}
                    <CopyIcon onClick={() => void handleCopy(metric)} />
                  </span>
                  <StatusBadge status="APPROVED" />
                </div>
                <div style={{ display: "flex", alignItems: "baseline", marginTop: "6px" }}>
                  <strong>{formatValue(metric)}</strong>
                  {getYoY(metric.indicatorCode, metric.months)}
                </div>
                <small>{metric.period} · 최종 승인 확정값</small>
              </article>
            ))}
          </div>

          <Card
            title={selected ? `${year}년 ${selected.title} 승인 실적 추이` : `${year}년 핵심 지표 추이`}
            description="승인 완료된 월만 차트에 반영됩니다."
          >
            <div className="chart-box">
              {chart ? (
                <Line data={chart} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: "bottom" } } }} />
              ) : (
                <p className="empty-copy">해당 연도에 승인 완료된 월별 데이터가 없습니다.</p>
              )}
            </div>
          </Card>

          <Card title="지표별 최종 승인 데이터" description="이 목록과 동일한 확정 실적만 리포트 빌더로 전달됩니다.">
            <DataTable
              rows={categoryMetrics}
              columns={[
                { key: "indicatorCode", label: "지표코드" },
                { key: "title", label: "지표명" },
                { key: "period", label: "최신 승인기간" },
                { key: "source", label: "원천 시스템" },
                { key: "value", label: "실적", render: (_, row) => formatValue(row) },
                { key: "status", label: "상태", render: () => <StatusBadge status="APPROVED" /> },
              ]}
              emptyText={`${year}년 ${configs[tab].label} 승인 완료 실적이 없습니다.`}
            />
          </Card>
        </>
      )}
    </div>
  );
}
