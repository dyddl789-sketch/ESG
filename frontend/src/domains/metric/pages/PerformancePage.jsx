import { useCallback, useEffect, useMemo, useState } from "react";
import { Line } from "react-chartjs-2";
import Swal from "sweetalert2";
import PageHeader from "../../../shared/components/PageHeader";
import Card from "../../../shared/components/Card";
import Button from "../../../shared/components/Button";
import Tabs from "../../../shared/components/Tabs";
import DataTable from "../../../shared/components/DataTable";
import StatusBadge from "../../../shared/components/StatusBadge";
import { metricApi } from "../api/metricApi";
import { apiErrorMessage, formatNumber } from "../../../shared/utils/esgFormat";

const configs = {
  ENVIRONMENT: { label: "환경(E)", aggregate: "sum" },
  SOCIAL: { label: "사회(S)", aggregate: "average" },
  GOVERNANCE: { label: "거버넌스(G)", aggregate: "average" },
};

const aggregateRows = (rows, mode) => {
  const grouped = new Map();
  rows.forEach((row) => {
    const key = `${row.period}:${row.indicatorCode}`;
    const current = grouped.get(key) || { ...row, values: [] };
    if (row.value !== null && row.value !== undefined) current.values.push(Number(row.value));
    grouped.set(key, current);
  });
  return [...grouped.values()].map((row) => {
    const value = row.values.length === 0
      ? null
      : mode === "sum"
        ? row.values.reduce((sum, item) => sum + item, 0)
        : row.values.reduce((sum, item) => sum + item, 0) / row.values.length;
    return { ...row, value };
  });
};

export default function PerformancePage() {
  const [tab, setTab] = useState("ENVIRONMENT");
  const [year, setYear] = useState(2026);
  const [search, setSearch] = useState("");
  const [rows, setRows] = useState([]);
  const [selectedCode, setSelectedCode] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await metricApi.list({ year, category: tab, status: "APPROVED", ...(search.trim() ? { search: search.trim() } : {}) });
      setRows(data || []);
    } catch (error) {
      Swal.fire("조회 실패", apiErrorMessage(error), "error");
    } finally {
      setLoading(false);
    }
  }, [search, tab, year]);

  useEffect(() => { load(); }, [load]);

  const aggregated = useMemo(() => aggregateRows(rows, configs[tab].aggregate), [rows, tab]);
  const indicators = useMemo(() => {
    const map = new Map();
    aggregated.forEach((row) => map.set(row.indicatorCode, { code: row.indicatorCode, title: row.title, unit: row.unit }));
    return [...map.values()];
  }, [aggregated]);

  useEffect(() => {
    if (!indicators.some((indicator) => indicator.code === selectedCode)) setSelectedCode(indicators[0]?.code || "");
  }, [indicators, selectedCode]);

  const latestCards = useMemo(() => indicators.map((indicator) => {
    const values = aggregated.filter((row) => row.indicatorCode === indicator.code).sort((a, b) => a.period.localeCompare(b.period));
    return values.at(-1);
  }).filter(Boolean), [aggregated, indicators]);

  const selectedRows = useMemo(() => aggregated
    .filter((row) => row.indicatorCode === selectedCode)
    .sort((a, b) => a.period.localeCompare(b.period)), [aggregated, selectedCode]);

  const chart = selectedRows.length ? {
    labels: selectedRows.map((row) => `${Number(row.period.slice(5))}월`),
    datasets: [{
      label: `${selectedRows[0].title} (${selectedRows[0].unit || ""})`,
      data: selectedRows.map((row) => row.value),
      borderColor: "#2a7d55",
      backgroundColor: "rgba(42,125,85,.12)",
      fill: true,
      tension: 0.3,
    }],
  } : null;

  return (
    <div className="page-stack">
      <PageHeader
        breadcrumbs={["성과·보고", "ESG 실적 조회"]}
        eyebrow="APPROVED ESG PERFORMANCE"
        title="ESG 실적 조회"
        description="최종 승인된 DB 데이터만 월별 공식 실적으로 조회합니다."
      />

      <Tabs value={tab} onChange={setTab} items={Object.entries(configs).map(([value, config]) => ({ value, label: config.label }))} />

      <Card className="filter-card" title="조회 조건" description="연도·지표·검색어로 승인 완료 실적을 조회할 수 있습니다.">
        <div className="esg-filter-grid">
          <label><span>기준연도</span><select value={year} onChange={(event) => setYear(Number(event.target.value))}><option value={2026}>2026년</option><option value={2025}>2025년</option></select></label>
          <label><span>추이 지표</span><select value={selectedCode} onChange={(event) => setSelectedCode(event.target.value)}><option value="">전체</option>{indicators.map((indicator) => <option key={indicator.code} value={indicator.code}>{indicator.title}</option>)}</select></label>
          <label className="filter-search"><span>검색</span><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="지표명·코드·사업장" /></label>
          <div className="filter-actions"><Button variant="outline" onClick={() => { setYear(2026); setSearch(""); }}>초기화</Button><Button onClick={load}>검색</Button></div>
        </div>
      </Card>

      <div className={`performance-cards performance-${tab.toLowerCase()}`}>
        {latestCards.map((metric) => (
          <article key={metric.indicatorCode}>
            <div className="performance-card-head"><span>{metric.title}</span><StatusBadge status="APPROVED" /></div>
            <strong>{metric.value === null ? metric.textValue || "-" : `${formatNumber(metric.value, 2)} ${metric.unit || ""}`}</strong>
            <small>{metric.period} · 최종 승인 확정값</small>
          </article>
        ))}
      </div>

      <Card title={selectedRows[0] ? `${selectedRows[0].title} 월별 추이` : "핵심 지표 월별 추이"} description="사업장 합계 또는 평균으로 집계한 승인 완료 데이터입니다.">
        <div className="chart-box">{loading ? <p>데이터를 불러오는 중입니다.</p> : chart ? <Line data={chart} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: "bottom" } } }} /> : <p>승인 완료 데이터가 없습니다.</p>}</div>
      </Card>

      <Card title="승인 완료 지표 상세" description="사업장별 실제값과 승인 상태를 확인합니다.">
        <DataTable rows={rows} columns={[
          { key: "period", label: "기준월" },
          { key: "indicatorCode", label: "지표코드" },
          { key: "title", label: "지표명" },
          { key: "facility", label: "사업장" },
          { key: "source", label: "원천 시스템" },
          { key: "value", label: "실제값", render: (value, row) => value === null || value === undefined ? row.textValue || "-" : `${formatNumber(value, 2)} ${row.unit || ""}` },
          { key: "status", label: "상태", render: (value) => <StatusBadge status={value} /> },
        ]} emptyText="조건에 맞는 승인 완료 데이터가 없습니다." />
      </Card>
    </div>
  );
}
