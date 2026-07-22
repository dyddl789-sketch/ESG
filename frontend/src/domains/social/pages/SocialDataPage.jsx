import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import Swal from "sweetalert2";
import PageHeader from "../../../shared/components/PageHeader";
import Card from "../../../shared/components/Card";
import Button from "../../../shared/components/Button";
import DataTable from "../../../shared/components/DataTable";
import companyApi from "../../company/api/companyApi";
import { metricApi } from "../../metric/api/metricApi";
import { resolvePeriodSelection, useMetricPeriods } from "../../metric/hooks/useMetricPeriods";
import { facilityNameOf, facilityTypeOf } from "../../metric/utils/approvedMetricView";
import { average, comparison, evidenceCount, metricMap, metricsAt, previousPeriod, valueOf } from "../../metric/utils/domainPerformance";
import EvidenceModal from "../../metric/components/EvidenceModal";
import DomainTrendChart from "../../metric/components/DomainTrendChart";
import { apiErrorMessage, formatDateTime, formatNumber, periodOf } from "../../../shared/utils/esgFormat";

const now = new Date();
const definitions = {
  IND_S_INJURY_RATE: { label: "산업재해율", key: "injuryRate", lower: true },
  IND_S_RISK_ACTION: { label: "위험요인 개선 조치율", key: "actionRate", lower: false },
  IND_S_SAFETY_EDU: { label: "안전교육 이수율", key: "trainingRate", lower: false },
  IND_S_TURNOVER: { label: "퇴사율", key: "turnoverRate", lower: true },
};
const evidenceLabels = Object.fromEntries(Object.entries(definitions).map(([code, item]) => [code, `${item.label} 증빙`]));
const aggregate = (metrics) => Object.fromEntries(Object.entries(definitions).map(([code, item]) => [item.key, average(metrics.filter((metric) => metric.indicatorCode === code).map(valueOf))]));

export default function SocialDataPage() {
  const [searchParams] = useSearchParams();
  const selectedIndicator = searchParams.get("indicator") || "";
  const [filters, setFilters] = useState({ year: Number(searchParams.get("year")) || now.getFullYear(), month: Number(searchParams.get("month")) || now.getMonth() + 1, facilityId: searchParams.get("facilityId") || "", search: "" });
  const [facilities, setFacilities] = useState([]);
  const [allMetrics, setAllMetrics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [trendCode, setTrendCode] = useState(selectedIndicator && definitions[selectedIndicator] ? selectedIndicator : "IND_S_INJURY_RATE");
  const [compareCode, setCompareCode] = useState("IND_S_SAFETY_EDU");
  const [evidenceTarget, setEvidenceTarget] = useState(null);
  const { years, monthsByYear, latestPeriod, loading: periodLoading } = useMetricPeriods({ approvedOnly: true, category: "SOCIAL", facilityId: filters.facilityId });
  const resolved = resolvePeriodSelection(filters, years, monthsByYear);
  const year = periodLoading ? filters.year : resolved.year;
  const month = periodLoading ? filters.month : resolved.month;
  const period = periodOf(year, month);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [facilityResponse, approved] = await Promise.all([companyApi.getFacilities(), metricApi.list({ category: "SOCIAL", status: "APPROVED" })]);
      setFacilities(facilityResponse?.data || []); setAllMetrics(approved || []);
    } catch (error) { Swal.fire("조회 실패", apiErrorMessage(error, "사회 확정 실적을 불러오지 못했습니다."), "error"); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void Promise.resolve().then(load); }, [load]);

  const scoped = useMemo(() => filters.facilityId ? allMetrics.filter((metric) => String(metric.facilityId) === String(filters.facilityId)) : allMetrics, [allMetrics, filters.facilityId]);
  const current = useMemo(() => metricsAt(scoped, period), [period, scoped]);
  const priorPeriod = useMemo(() => previousPeriod(scoped, period), [period, scoped]);
  const previous = useMemo(() => metricsAt(scoped, priorPeriod), [priorPeriod, scoped]);
  const totals = useMemo(() => aggregate(current), [current]);
  const previousTotals = useMemo(() => aggregate(previous), [previous]);

  const rows = useMemo(() => facilities
    .filter((facility) => !filters.facilityId || String(facility.id) === String(filters.facilityId))
    .map((facility) => {
      const related = current.filter((metric) => String(metric.facilityId) === String(facility.id));
      const map = metricMap(related);
      const prevRelated = previous.filter((metric) => String(metric.facilityId) === String(facility.id));
      return {
        id: facility.id, facilityName: facilityNameOf(facility), facilityType: facilityTypeOf(facility),
        injuryRate: valueOf(map.IND_S_INJURY_RATE), actionRate: valueOf(map.IND_S_RISK_ACTION),
        trainingRate: valueOf(map.IND_S_SAFETY_EDU), turnoverRate: valueOf(map.IND_S_TURNOVER),
        previous: aggregate(prevRelated), metrics: Object.keys(definitions).map((code) => map[code]).filter(Boolean),
        evidenceCount: evidenceCount(Object.values(map)),
        approvedAt: related.map((metric) => metric.updatedAt).filter(Boolean).sort().at(-1),
      };
    })
    .filter((row) => Object.values(definitions).some((definition) => row[definition.key] != null)
      && (!filters.search.trim() || row.facilityName.toLowerCase().includes(filters.search.trim().toLowerCase()))), [current, facilities, filters.facilityId, filters.search, previous]);

  const monthly = useMemo(() => (monthsByYear[year] || []).map((value) => ({ month: value, ...aggregate(scoped.filter((metric) => metric.period === periodOf(year, value))) })), [monthsByYear, scoped, year]);
  const trendDefinition = definitions[trendCode];
  const compareDefinition = definitions[compareCode];
  const rankedRows = useMemo(() => {
    const validRows = rows.filter((row) => Number.isFinite(Number(row[compareDefinition.key])));
    const ordered = [...validRows].sort((left, right) => compareDefinition.lower
      ? Number(left[compareDefinition.key]) - Number(right[compareDefinition.key])
      : Number(right[compareDefinition.key]) - Number(left[compareDefinition.key]));
    const bestId = ordered[0]?.id;
    const watchId = ordered.length > 1 ? ordered.at(-1)?.id : null;
    return rows.map((row) => ({
      ...row,
      selectedChange: comparison(row[compareDefinition.key], row.previous?.[compareDefinition.key], compareDefinition.lower),
      managementStatus: row.id === bestId ? "EXCELLENT" : row.id === watchId ? "WATCH" : "NORMAL",
    }));
  }, [compareDefinition.key, compareDefinition.lower, rows]);

  const columns = [
    { key: "facilityName", label: "사업장", render: (value, row) => <div><strong>{value}</strong><small className="cell-sub">{row.facilityType === "HQ" ? "본사" : "공장"}</small></div> },
    ...Object.values(definitions).map((definition) => ({ key: definition.key, label: definition.label, render: (value) => value == null ? "-" : `${formatNumber(value, 2)}%` })),
    { key: "selectedChange", label: `${compareDefinition.label} 직전 대비`, render: (value) => <span className={`trend-${value?.tone || "neutral"}`}>{value?.label || "비교 없음"}</span> },
    { key: "managementStatus", label: "관리 판정", render: (value) => <span className={`performance-status performance-status-${String(value).toLowerCase()}`}>{value === "EXCELLENT" ? "우수" : value === "WATCH" ? "주의" : "관찰"}</span> },
    { key: "approvedAt", label: "최종 승인", render: (value) => formatDateTime(value) },
    { key: "evidenceCount", label: "증빙", render: (value) => <span className={value ? "evidence-count" : "evidence-missing"}>{value ? `증빙 ${value}건` : "미등록"}</span> },
    { key: "details", label: "상세보기", render: (_, row) => <button type="button" className="text-link" onClick={() => setEvidenceTarget(row)}>값·증빙 보기</button> },
  ];

  return (
    <div className="page-stack esg-domain-page social-performance-page">
      <PageHeader breadcrumbs={["ESG 실적", "사회"]} eyebrow="SOCIAL PERFORMANCE" title="사회 실적" description="최종 승인된 사회 핵심지표의 변화와 실제 증빙문서를 조회합니다." />
      {selectedIndicator && <div className="selected-indicator-notice"><strong>{definitions[selectedIndicator]?.label || selectedIndicator}</strong><span>대시보드에서 선택한 지표와 동일한 기간으로 이동했습니다.</span></div>}
      <Card className="filter-card" title="조회 조건" description="승인 완료된 실제 연도·월과 사업장을 기준으로 조회합니다."><div className="esg-filter-grid">
        <label><span>기준연도</span><select value={year} onChange={(event) => { const next = Number(event.target.value); setFilters((currentFilter) => ({ ...currentFilter, year: next, month: (monthsByYear[next] || []).at(-1) || currentFilter.month })); }}>{years.map((item) => <option key={item} value={item}>{item}년</option>)}</select></label>
        <label><span>기준월</span><select value={month} onChange={(event) => setFilters((currentFilter) => ({ ...currentFilter, year, month: Number(event.target.value) }))}>{(monthsByYear[year] || []).map((item) => <option key={item} value={item}>{item}월</option>)}</select></label>
        <label><span>사업장</span><select value={filters.facilityId} onChange={(event) => setFilters((currentFilter) => ({ ...currentFilter, facilityId: event.target.value }))}><option value="">전체 사업장</option>{facilities.map((facility) => <option key={facility.id} value={facility.id}>{facilityNameOf(facility)}</option>)}</select></label>
        <label className="filter-search"><span>검색</span><input value={filters.search} onChange={(event) => setFilters((currentFilter) => ({ ...currentFilter, search: event.target.value }))} placeholder="사업장명" /></label>
        <div className="filter-actions"><Button variant="outline" onClick={() => setFilters({ ...(latestPeriod || { year: now.getFullYear(), month: now.getMonth() + 1 }), facilityId: "", search: "" })}>초기화</Button><Button onClick={load}>조회</Button></div>
      </div></Card>

      <div className="summary-card-grid four">{Object.entries(definitions).map(([code, definition]) => { const change = comparison(totals[definition.key], previousTotals[definition.key], definition.lower); return <article key={code} className={selectedIndicator === code ? "is-highlighted" : ""}><span>{definition.label}</span><strong>{totals[definition.key] == null ? "-" : formatNumber(totals[definition.key], 2)}</strong><small>% · {period}</small><p className={change.tone}>{change.label}{priorPeriod ? ` · ${priorPeriod} 대비` : ""}</p></article>; })}</div>

      <div className="two-cols domain-chart-grid">
        <Card title="월별 사회 지표 추이" action={<select className="compact-select" value={trendCode} onChange={(event) => setTrendCode(event.target.value)}>{Object.entries(definitions).map(([code, item]) => <option key={code} value={code}>{item.label}</option>)}</select>}><DomainTrendChart labels={monthly.map((item) => `${item.month}월`)} datasets={[{ label: trendDefinition.label, data: monthly.map((item) => item[trendDefinition.key]), borderColor: "#3a7c9e", backgroundColor: "rgba(58,124,158,.1)", fill: true, tension: .3 }]} unit="%" lowerIsBetter={trendDefinition.lower} /></Card>
        <Card title="사업장별 비교" action={<select className="compact-select" value={compareCode} onChange={(event) => setCompareCode(event.target.value)}>{Object.entries(definitions).map(([code, item]) => <option key={code} value={code}>{item.label}</option>)}</select>}><DomainTrendChart type="bar" labels={[...rankedRows].sort((a, b) => compareDefinition.lower ? (a[compareDefinition.key] ?? Infinity) - (b[compareDefinition.key] ?? Infinity) : (b[compareDefinition.key] ?? -Infinity) - (a[compareDefinition.key] ?? -Infinity)).map((row) => row.facilityName)} datasets={[{ label: compareDefinition.label, data: [...rankedRows].sort((a, b) => compareDefinition.lower ? (a[compareDefinition.key] ?? Infinity) - (b[compareDefinition.key] ?? Infinity) : (b[compareDefinition.key] ?? -Infinity) - (a[compareDefinition.key] ?? -Infinity)).map((row) => row[compareDefinition.key]), backgroundColor: "rgba(58,124,158,.65)" }]} unit="%" lowerIsBetter={compareDefinition.lower} /></Card>
      </div>

      <Card title={`${period} 사회 확정 실적`} description="4개 사회 지표와 지표별 실제 PDF 증빙을 조회합니다.">{loading ? <div className="data-loading">사회 확정 실적을 불러오는 중입니다.</div> : <DataTable rows={rankedRows} columns={columns} emptyText="선택한 기간에 승인 완료된 사회 데이터가 없습니다." />}</Card>
      {evidenceTarget && <EvidenceModal title={`${evidenceTarget.facilityName} · ${period} 사회 증빙`} metrics={evidenceTarget.metrics} labels={evidenceLabels} onClose={() => setEvidenceTarget(null)} />}
    </div>
  );
}
