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
import { comparison, evidenceCount, metricMap, metricsAt, previousPeriod, sum, valueOf } from "../../metric/utils/domainPerformance";
import EvidenceModal from "../../metric/components/EvidenceModal";
import DomainTrendChart from "../../metric/components/DomainTrendChart";
import { apiErrorMessage, formatDateTime, formatNumber, periodOf } from "../../../shared/utils/esgFormat";

const now = new Date();
const defaultFilters = { year: now.getFullYear(), month: now.getMonth() + 1, facilityId: "", search: "" };
const labels = { IND_E_ELEC: "전력 사용량 증빙", IND_E_SCOPE2: "Scope 2 배출량 증빙", IND_E_SHIPMENT: "출하액 증빙" };
const lowerCodes = new Set(["electricity", "scope2", "electricityIntensity", "carbonIntensity"]);
const numberText = (value, digits = 2) => value == null ? "계산 불가" : formatNumber(value, digits);

const aggregateEnvironment = (metrics) => {
  const electricityMetrics = metrics.filter((metric) => metric.indicatorCode === "IND_E_ELEC");
  const scopeMetrics = metrics.filter((metric) => metric.indicatorCode === "IND_E_SCOPE2");
  const electricity = sum(electricityMetrics.map(valueOf));
  const shipment = sum(electricityMetrics.map((metric) => metric.shipmentAmountMillionKrw == null ? null : Number(metric.shipmentAmountMillionKrw)));
  const scope2 = sum(scopeMetrics.map(valueOf));
  return {
    electricity, shipment, scope2,
    electricityIntensity: electricity != null && shipment > 0 ? electricity / (shipment * 10) : null,
    carbonIntensity: scope2 != null && shipment > 0 ? scope2 * 100 / shipment : null,
  };
};

export default function IntegrationPage() {
  const [searchParams] = useSearchParams();
  const selectedIndicator = searchParams.get("indicator") || "";
  const [filters, setFilters] = useState({
    year: Number(searchParams.get("year")) || defaultFilters.year,
    month: Number(searchParams.get("month")) || defaultFilters.month,
    facilityId: searchParams.get("facilityId") || "", search: "",
  });
  const [facilities, setFacilities] = useState([]);
  const [allMetrics, setAllMetrics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [volumeMetric, setVolumeMetric] = useState("electricity");
  const [intensityMetric, setIntensityMetric] = useState("electricityIntensity");
  const [evidenceTarget, setEvidenceTarget] = useState(null);
  const { years, monthsByYear, latestPeriod, loading: periodLoading } = useMetricPeriods({ approvedOnly: true, category: "ENVIRONMENT", facilityId: filters.facilityId });
  const resolved = resolvePeriodSelection(filters, years, monthsByYear);
  const selectedYear = periodLoading ? filters.year : resolved.year;
  const selectedMonth = periodLoading ? filters.month : resolved.month;
  const period = periodOf(selectedYear, selectedMonth);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [facilityResponse, approved] = await Promise.all([
        companyApi.getFacilities(), metricApi.list({ category: "ENVIRONMENT", status: "APPROVED" }),
      ]);
      setFacilities(facilityResponse?.data || []); setAllMetrics(approved || []);
    } catch (error) { Swal.fire("조회 실패", apiErrorMessage(error, "환경 확정 실적을 불러오지 못했습니다."), "error"); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void Promise.resolve().then(load); }, [load]);

  const scopedMetrics = useMemo(() => filters.facilityId ? allMetrics.filter((metric) => String(metric.facilityId) === String(filters.facilityId)) : allMetrics, [allMetrics, filters.facilityId]);
  const currentMetrics = useMemo(() => metricsAt(scopedMetrics, period), [period, scopedMetrics]);
  const priorPeriod = useMemo(() => previousPeriod(scopedMetrics, period), [period, scopedMetrics]);
  const previousMetrics = useMemo(() => metricsAt(scopedMetrics, priorPeriod), [priorPeriod, scopedMetrics]);
  const totals = useMemo(() => aggregateEnvironment(currentMetrics), [currentMetrics]);
  const previousTotals = useMemo(() => aggregateEnvironment(previousMetrics), [previousMetrics]);

  const rows = useMemo(() => facilities
    .filter((facility) => !filters.facilityId || String(facility.id) === String(filters.facilityId))
    .map((facility) => {
      const related = currentMetrics.filter((metric) => String(metric.facilityId) === String(facility.id));
      const values = metricMap(related);
      const electricity = valueOf(values.IND_E_ELEC);
      const shipment = values.IND_E_ELEC?.shipmentAmountMillionKrw == null ? null : Number(values.IND_E_ELEC.shipmentAmountMillionKrw);
      const scope2 = valueOf(values.IND_E_SCOPE2);
      const previousRelated = previousMetrics.filter((metric) => String(metric.facilityId) === String(facility.id));
      const previous = aggregateEnvironment(previousRelated);
      const electricityIntensity = electricity != null && shipment > 0 ? electricity / (shipment * 10) : null;
      const carbonIntensity = scope2 != null && shipment > 0 ? scope2 * 100 / shipment : null;
      const shipmentEvidence = shipment != null && values.IND_E_ELEC ? {
        ...values.IND_E_ELEC,
        id: `${values.IND_E_ELEC.id}-shipment`,
        indicatorCode: "IND_E_SHIPMENT",
        title: "출하액",
        value: shipment,
        unit: "백만원",
      } : null;
      const metricsForEvidence = [values.IND_E_ELEC, shipmentEvidence, values.IND_E_SCOPE2].filter(Boolean);
      return {
        id: facility.id, facilityName: facilityNameOf(facility), facilityType: facilityTypeOf(facility),
        electricity, shipment, scope2,
        electricityIntensity,
        carbonIntensity,
        change: comparison(electricityIntensity ?? carbonIntensity ?? electricity, previous.electricityIntensity ?? previous.carbonIntensity ?? previous.electricity, true),
        previous, metrics: metricsForEvidence, evidenceCount: evidenceCount(metricsForEvidence),
        electricityApprovedAt: values.IND_E_ELEC?.updatedAt, scope2ApprovedAt: values.IND_E_SCOPE2?.updatedAt,
      };
    })
    .filter((row) => [row.electricity, row.scope2, row.shipment].some((value) => value != null)
      && (!filters.search.trim() || row.facilityName.toLowerCase().includes(filters.search.trim().toLowerCase()))), [currentMetrics, facilities, filters.facilityId, filters.search, previousMetrics]);

  const monthly = useMemo(() => (monthsByYear[selectedYear] || []).map((month) => {
    const monthMetrics = scopedMetrics.filter((metric) => metric.period === periodOf(selectedYear, month));
    return { month, ...aggregateEnvironment(monthMetrics) };
  }), [monthsByYear, scopedMetrics, selectedYear]);

  const cards = [
    ["승인 사업장", rows.length, null, `${period} 기준`, null],
    ["전력 사용량", totals.electricity, "kWh", comparison(totals.electricity, previousTotals.electricity, true), "electricity"],
    ["Scope 2 배출량", totals.scope2, "tCO₂eq", comparison(totals.scope2, previousTotals.scope2, true), "scope2"],
    ["출하액", totals.shipment, "백만원", comparison(totals.shipment, previousTotals.shipment), "shipment"],
    ["전력 원단위", totals.electricityIntensity, "MWh/억원", comparison(totals.electricityIntensity, previousTotals.electricityIntensity, true), "electricityIntensity"],
    ["탄소 원단위", totals.carbonIntensity, "tCO₂eq/억원", comparison(totals.carbonIntensity, previousTotals.carbonIntensity, true), "carbonIntensity"],
  ];

  const columns = [
    { key: "facilityName", label: "사업장", render: (value, row) => <div><strong>{value}</strong><small className="cell-sub">{row.facilityType === "HQ" ? "본사" : "공장"}</small></div> },
    { key: "electricity", label: "전력 사용량", render: (value) => value == null ? "-" : `${formatNumber(value)} kWh` },
    { key: "shipment", label: "출하액", render: (value) => value == null ? "-" : `${formatNumber(value, 2)} 백만원` },
    { key: "scope2", label: "Scope 2", render: (value) => value == null ? "-" : `${formatNumber(value, 3)} tCO₂eq` },
    { key: "electricityIntensity", label: "전력 원단위", render: (value) => value == null ? <span className="calculation-unavailable">계산 불가</span> : `${formatNumber(value, 3)} MWh/억원` },
    { key: "carbonIntensity", label: "탄소 원단위", render: (value) => value == null ? <span className="calculation-unavailable">계산 불가</span> : `${formatNumber(value, 3)} tCO₂eq/억원` },
    { key: "change", label: "직전 승인월 대비", render: (value) => <span className={`trend-${value?.tone || "neutral"}`}>{value?.label || "비교 없음"}</span> },
    { key: "electricityApprovedAt", label: "승인일", render: (value, row) => <div><small>전력 {formatDateTime(value)}</small><small className="cell-sub">Scope2 {formatDateTime(row.scope2ApprovedAt)}</small></div> },
    { key: "evidenceCount", label: "증빙", render: (value) => <span className={value ? "evidence-count" : "evidence-missing"}>{value ? `증빙 ${value}건` : "미등록"}</span> },
    { key: "details", label: "상세보기", render: (_, row) => <button type="button" className="text-link" onClick={() => setEvidenceTarget(row)}>값·증빙 보기</button> },
  ];

  const reset = () => { const fallback = latestPeriod || defaultFilters; setFilters({ ...defaultFilters, ...fallback }); };
  const volumeMeta = { electricity: ["전력 사용량", "kWh"], scope2: ["Scope 2 배출량", "tCO₂eq"], shipment: ["출하액", "백만원"] };
  const intensityMeta = { electricityIntensity: ["전력 원단위", "MWh/억원"], carbonIntensity: ["탄소 원단위", "tCO₂eq/억원"] };

  return (
    <div className="page-stack esg-domain-page environment-performance-page">
      <PageHeader breadcrumbs={["ESG 실적", "환경"]} eyebrow="ENVIRONMENT PERFORMANCE" title="환경 실적" description="최종 승인된 환경 실적과 원단위, 실제 증빙문서를 조회합니다." />
      {selectedIndicator && <div className="selected-indicator-notice"><strong>{labels[selectedIndicator] || selectedIndicator}</strong><span>대시보드에서 선택한 지표 기준으로 이동했습니다.</span></div>}
      <Card className="filter-card" title="조회 조건" description="실제 승인 데이터가 존재하는 연도·월만 선택할 수 있습니다."><div className="esg-filter-grid">
        <label><span>기준연도</span><select value={selectedYear} onChange={(event) => { const year = Number(event.target.value); setFilters((current) => ({ ...current, year, month: (monthsByYear[year] || []).at(-1) || current.month })); }} disabled={periodLoading}>{years.map((year) => <option key={year} value={year}>{year}년</option>)}</select></label>
        <label><span>기준월</span><select value={selectedMonth} onChange={(event) => setFilters((current) => ({ ...current, year: selectedYear, month: Number(event.target.value) }))}>{(monthsByYear[selectedYear] || []).map((month) => <option key={month} value={month}>{month}월</option>)}</select></label>
        <label><span>사업장</span><select value={filters.facilityId} onChange={(event) => setFilters((current) => ({ ...current, facilityId: event.target.value }))}><option value="">전체 사업장</option>{facilities.map((facility) => <option key={facility.id} value={facility.id}>{facilityNameOf(facility)}</option>)}</select></label>
        <label className="filter-search"><span>검색</span><input value={filters.search} onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value }))} placeholder="사업장명" /></label>
        <div className="filter-actions"><Button variant="outline" onClick={reset}>초기화</Button><Button onClick={load}>조회</Button></div>
      </div></Card>

      <div className="summary-card-grid six">{cards.map(([title, value, unit, change, code]) => <article key={title} className={selectedIndicator && code && selectedIndicator.includes(code === "electricity" ? "ELEC" : code === "scope2" ? "SCOPE2" : "NONE") ? "is-highlighted" : ""}><span>{title}</span><strong>{typeof value === "number" ? numberText(value, code?.includes("Intensity") ? 3 : 2) : value}</strong>{unit && <small>{unit}</small>}{change && <p className={change.tone}>{change.label}{priorPeriod ? ` · ${priorPeriod} 대비` : ""}</p>}</article>)}</div>

      <div className="two-cols domain-chart-grid">
        <Card title="월별 환경 총량 추이" action={<div className="mini-tabs">{Object.entries(volumeMeta).map(([key, [label]]) => <button type="button" className={volumeMetric === key ? "active" : ""} key={key} onClick={() => setVolumeMetric(key)}>{label}</button>)}</div>}><DomainTrendChart labels={monthly.map((item) => `${item.month}월`)} datasets={[{ label: volumeMeta[volumeMetric][0], data: monthly.map((item) => item[volumeMetric]), borderColor: "#2d7d50", backgroundColor: "rgba(45,125,80,.12)", fill: true, tension: .3 }]} unit={volumeMeta[volumeMetric][1]} lowerIsBetter={lowerCodes.has(volumeMetric)} /></Card>
        <Card title="월별 환경 원단위 추이" action={<div className="mini-tabs">{Object.entries(intensityMeta).map(([key, [label]]) => <button type="button" className={intensityMetric === key ? "active" : ""} key={key} onClick={() => setIntensityMetric(key)}>{label}</button>)}</div>}><DomainTrendChart labels={monthly.map((item) => `${item.month}월`)} datasets={[{ label: intensityMeta[intensityMetric][0], data: monthly.map((item) => item[intensityMetric]), borderColor: "#397ba4", backgroundColor: "rgba(57,123,164,.1)", fill: true, tension: .3 }]} unit={intensityMeta[intensityMetric][1]} lowerIsBetter /></Card>
      </div>

      <Card title="사업장별 원단위 비교" description="낮은 사업장부터 비교하여 개선 우선순위를 확인합니다."><DomainTrendChart type="bar" labels={[...rows].sort((a, b) => (a[intensityMetric] ?? Infinity) - (b[intensityMetric] ?? Infinity)).map((row) => row.facilityName)} datasets={[{ label: intensityMeta[intensityMetric][0], data: [...rows].sort((a, b) => (a[intensityMetric] ?? Infinity) - (b[intensityMetric] ?? Infinity)).map((row) => row[intensityMetric]), backgroundColor: "rgba(45,125,80,.65)" }]} unit={intensityMeta[intensityMetric][1]} lowerIsBetter height={260} /></Card>

      <Card title={`${period} 환경 확정 실적`} description="값·승인일·실제 증빙을 지표별로 연결해 표시합니다.">{loading ? <div className="data-loading">환경 확정 실적을 불러오는 중입니다.</div> : <DataTable rows={rows} columns={columns} emptyText="선택한 기간에 승인 완료된 환경 데이터가 없습니다." />}</Card>
      {evidenceTarget && <EvidenceModal title={`${evidenceTarget.facilityName} · ${period} 환경 증빙`} metrics={evidenceTarget.metrics} labels={labels} onClose={() => setEvidenceTarget(null)} />}
    </div>
  );
}
