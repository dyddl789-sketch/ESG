import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import Swal from "sweetalert2";
import PageHeader from "../../../shared/components/PageHeader";
import Card from "../../../shared/components/Card";
import Button from "../../../shared/components/Button";
import DataTable from "../../../shared/components/DataTable";
import { metricApi } from "../../metric/api/metricApi";
import { performanceApi } from "../../metric/api/performanceApi";
import companyApi from "../../company/api/companyApi";
import { resolvePeriodSelection, useMetricPeriods } from "../../metric/hooks/useMetricPeriods";
import { average, comparison, evidenceCount, metricsAt, previousPeriod, valueOf } from "../../metric/utils/domainPerformance";
import EvidenceModal from "../../metric/components/EvidenceModal";
import DomainTrendChart from "../../metric/components/DomainTrendChart";
import { apiErrorMessage, formatDateTime, formatNumber, periodOf } from "../../../shared/utils/esgFormat";

const now = new Date();
const COMPANY_WIDE_CODES = new Set(["IND_G_ATTENDANCE", "IND_G_OUTSIDE"]);
const definitions = {
  IND_G_ATTENDANCE: { label: "이사회 참석률", scope: "전체 · 기업 기준" },
  IND_G_OUTSIDE: { label: "사외이사 비율", scope: "전체 · 기업 기준" },
  IND_G_ETHICS_EDU: { label: "윤리교육 이수율", scope: "사업장별" },
};
const evidenceLabels = Object.fromEntries(Object.entries(definitions).map(([code, item]) => [code, `${item.label} 증빙`]));
const metricFacilityId = (metric) => metric?.facilityId ?? metric?.facility_id ?? null;
const aggregate = (metrics) => Object.fromEntries(Object.keys(definitions).map((code) => [
  code,
  average(metrics.filter((metric) => metric.indicatorCode === code).map(valueOf)),
]));

export default function GovernanceDataPage() {
  const [searchParams] = useSearchParams();
  const selectedIndicator = searchParams.get("indicator") || "";
  const [filters, setFilters] = useState({
    year: Number(searchParams.get("year")) || now.getFullYear(),
    month: Number(searchParams.get("month")) || now.getMonth() + 1,
    facilityId: searchParams.get("facilityId") || "",
  });
  const [allMetrics, setAllMetrics] = useState([]);
  const [targets, setTargets] = useState([]);
  const [facilities, setFacilities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [evidenceTarget, setEvidenceTarget] = useState(null);
  const { years, monthsByYear, latestPeriod, loading: periodLoading } = useMetricPeriods({
    approvedOnly: true,
    category: "GOVERNANCE",
  });
  const resolved = resolvePeriodSelection(filters, years, monthsByYear);
  const year = periodLoading ? filters.year : resolved.year;
  const month = periodLoading ? filters.month : resolved.month;
  const period = periodOf(year, month);

  const load = useCallback(async () => {
    if (periodLoading) return;
    setLoading(true);
    try {
      const [approved, targetRows, facilityResponse] = await Promise.all([
        metricApi.list({ category: "GOVERNANCE", status: "APPROVED" }),
        performanceApi.getGovernanceTargets(year),
        companyApi.getFacilities(),
      ]);
      setAllMetrics(approved || []);
      setTargets(targetRows || []);
      setFacilities(facilityResponse?.data?.data || facilityResponse?.data || []);
    } catch (error) {
      Swal.fire("조회 실패", apiErrorMessage(error, "거버넌스 확정 실적을 불러오지 못했습니다."), "error");
    } finally {
      setLoading(false);
    }
  }, [periodLoading, year]);

  useEffect(() => { void Promise.resolve().then(load); }, [load]);

  const selectedFacility = useMemo(
    () => facilities.find((facility) => String(facility.id) === String(filters.facilityId)),
    [facilities, filters.facilityId],
  );

  const scopedMetrics = useMemo(() => allMetrics.filter((metric) => {
    if (COMPANY_WIDE_CODES.has(metric.indicatorCode)) {
      return metricFacilityId(metric) == null;
    }
    if (metric.indicatorCode !== "IND_G_ETHICS_EDU") return false;
    return !filters.facilityId || String(metricFacilityId(metric)) === String(filters.facilityId);
  }), [allMetrics, filters.facilityId]);

  const current = useMemo(() => metricsAt(scopedMetrics, period), [scopedMetrics, period]);
  const priorPeriod = useMemo(() => previousPeriod(scopedMetrics, period), [scopedMetrics, period]);
  const previous = useMemo(() => metricsAt(scopedMetrics, priorPeriod), [scopedMetrics, priorPeriod]);
  const totals = useMemo(() => aggregate(current), [current]);
  const previousTotals = useMemo(() => aggregate(previous), [previous]);
  const targetMap = useMemo(() => Object.fromEntries(targets.map((target) => [target.indicatorCode, Number(target.targetValue)])), [targets]);

  const monthly = useMemo(() => (monthsByYear[year] || []).map((value) => ({
    month: value,
    ...aggregate(scopedMetrics.filter((metric) => metric.period === periodOf(year, value))),
  })), [monthsByYear, scopedMetrics, year]);

  const rows = useMemo(() => Object.entries(definitions).map(([code, definition]) => {
    const metrics = current.filter((metric) => metric.indicatorCode === code);
    const previousValue = previousTotals[code];
    const currentValue = totals[code];
    const target = targetMap[code] ?? null;
    const change = comparison(currentValue, previousValue, false);
    const scope = code === "IND_G_ETHICS_EDU"
      ? (selectedFacility
        ? `${selectedFacility.facility_name || selectedFacility.facilityName} 기준`
        : "전체 사업장 승인값 평균")
      : definition.scope;
    return {
      id: code,
      code,
      label: definition.label,
      scope,
      value: currentValue,
      previousValue,
      target,
      achievement: currentValue != null && target > 0 ? (currentValue / target) * 100 : null,
      change,
      approvedAt: metrics.map((metric) => metric.updatedAt).filter(Boolean).sort().at(-1),
      metrics,
      evidenceCount: evidenceCount(metrics),
    };
  }), [current, previousTotals, selectedFacility, targetMap, totals]);

  const columns = [
    { key: "scope", label: "관리 기준", render: (value, row) => <div><strong>{value}</strong><small className="cell-sub">{row.label}</small></div> },
    { key: "value", label: "확정값", render: (value) => value == null ? "-" : `${formatNumber(value, 2)}%` },
    { key: "previousValue", label: "직전 승인월", render: (value, row) => <div>{value == null ? "-" : `${formatNumber(value, 2)}%`}<small className={`cell-sub trend-${row.change.tone}`}>{row.change.label}</small></div> },
    { key: "target", label: "관리 목표", render: (value, row) => <div>{value == null ? "미설정" : `${formatNumber(value, 2)}%`}<small className="cell-sub">{row.achievement == null ? "달성률 계산 불가" : `달성률 ${formatNumber(row.achievement, 1)}%`}</small></div> },
    { key: "approvedAt", label: "최종 승인", render: (value) => formatDateTime(value) },
    { key: "evidenceCount", label: "증빙", render: (value) => <span className={value ? "evidence-count" : "evidence-missing"}>{value ? `증빙 ${value}건` : "미등록"}</span> },
    { key: "details", label: "상세보기", render: (_, row) => <button type="button" className="text-link" onClick={() => setEvidenceTarget(row)}>값·증빙 보기</button> },
  ];

  const reset = () => setFilters({
    ...(latestPeriod || { year: now.getFullYear(), month: now.getMonth() + 1 }),
    facilityId: "",
  });

  return (
    <div className="page-stack esg-domain-page governance-performance-page">
      <PageHeader breadcrumbs={["ESG 실적", "거버넌스"]} eyebrow="GOVERNANCE PERFORMANCE" title="거버넌스 실적" description="이사회 참석률·사외이사 비율은 기업 공통으로, 윤리교육 이수율은 사업장별로 조회합니다." />
      {selectedIndicator && <div className="selected-indicator-notice"><strong>{definitions[selectedIndicator]?.label || selectedIndicator}</strong><span>대시보드에서 선택한 지표와 동일한 기간으로 이동했습니다.</span></div>}

      <Card className="filter-card" title="조회 조건" description="사업장을 변경해도 기업 공통 지표는 유지되고 윤리교육 이수율만 해당 사업장 값으로 변경됩니다.">
        <div className="esg-filter-grid governance-filter-grid">
          <label><span>기준연도</span><select value={year} onChange={(event) => { const next = Number(event.target.value); setFilters((currentFilter) => ({ ...currentFilter, year: next, month: (monthsByYear[next] || []).at(-1) || currentFilter.month })); }} disabled={periodLoading || !years.length}>{years.map((item) => <option key={item} value={item}>{item}년</option>)}</select></label>
          <label><span>기준월</span><select value={month} onChange={(event) => setFilters((currentFilter) => ({ ...currentFilter, year, month: Number(event.target.value) }))} disabled={periodLoading || !(monthsByYear[year] || []).length}>{(monthsByYear[year] || []).map((item) => <option key={item} value={item}>{item}월</option>)}</select></label>
          <label><span>사업장</span><select value={filters.facilityId} onChange={(event) => setFilters((currentFilter) => ({ ...currentFilter, facilityId: event.target.value }))}><option value="">전체 사업장</option>{facilities.map((facility) => <option key={facility.id} value={facility.id}>{facility.facility_name || facility.facilityName}</option>)}</select></label>
          <div className="filter-actions"><Button variant="outline" onClick={reset}>초기화</Button><Button onClick={load} disabled={periodLoading}>조회</Button></div>
        </div>
      </Card>

      <div className="summary-card-grid three governance-kpi-grid">
        {Object.entries(definitions).map(([code, definition]) => {
          const currentValue = totals[code];
          const target = targetMap[code];
          const change = comparison(currentValue, previousTotals[code], false);
          const scopeText = code === "IND_G_ETHICS_EDU"
            ? (selectedFacility ? selectedFacility.facility_name || selectedFacility.facilityName : "전체 사업장 평균")
            : "기업 공통";
          return <article key={code} className={selectedIndicator === code ? "is-highlighted" : ""}>
            <span>{definition.label}</span>
            <strong>{currentValue == null ? "-" : formatNumber(currentValue, 2)}</strong>
            <small>% · {period} · {scopeText}</small>
            <p className={change.tone}>{change.label}{priorPeriod ? ` · ${priorPeriod} 대비` : ""}</p>
            <div className="target-progress"><div><span>목표 {target == null ? "미설정" : `${formatNumber(target, 1)}%`}</span><b>{currentValue != null && target > 0 ? `${formatNumber((currentValue / target) * 100, 0)}% 달성` : "-"}</b></div><i><em style={{ width: `${currentValue != null && target > 0 ? Math.min(100, (currentValue / target) * 100) : 0}%` }} /></i></div>
          </article>;
        })}
      </div>

      <Card title="월별 거버넌스 지표 추이" description="기업 공통 지표와 선택한 사업장의 윤리교육 승인값 변화를 함께 비교합니다.">
        <DomainTrendChart
          labels={monthly.map((item) => `${item.month}월`)}
          datasets={[
            { label: "이사회 참석률", data: monthly.map((item) => item.IND_G_ATTENDANCE), borderColor: "#2d7b62", backgroundColor: "rgba(45,123,98,.08)", tension: .3 },
            { label: "사외이사 비율", data: monthly.map((item) => item.IND_G_OUTSIDE), borderColor: "#6d6ab5", backgroundColor: "rgba(109,106,181,.08)", tension: .3 },
            { label: "윤리교육 이수율", data: monthly.map((item) => item.IND_G_ETHICS_EDU), borderColor: "#b97835", backgroundColor: "rgba(185,120,53,.08)", tension: .3 },
          ]}
          unit="%"
        />
      </Card>

      <Card title={`${period} 거버넌스 확정 실적`} description="신규 사업장에 과거 윤리교육 데이터가 없어도 같은 기간의 기업 공통 이사회 지표는 계속 표시됩니다.">
        {loading ? <div className="data-loading">거버넌스 확정 실적을 불러오는 중입니다.</div> : <DataTable rows={rows.filter((row) => row.value != null || row.metrics.length)} columns={columns} emptyText="선택한 기간에 승인 완료된 거버넌스 데이터가 없습니다." />}
      </Card>

      {evidenceTarget && <EvidenceModal title={`${evidenceTarget.label} · ${period} 증빙`} metrics={evidenceTarget.metrics} labels={evidenceLabels} onClose={() => setEvidenceTarget(null)} />}
    </div>
  );
}
