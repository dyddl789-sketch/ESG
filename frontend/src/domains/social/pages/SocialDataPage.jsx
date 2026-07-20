import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import Swal from "sweetalert2";
import PageHeader from "../../../shared/components/PageHeader";
import Card from "../../../shared/components/Card";
import Button from "../../../shared/components/Button";
import DataTable from "../../../shared/components/DataTable";
import companyApi from "../../company/api/companyApi";
import { metricApi } from "../../metric/api/metricApi";
import { firstEvidence, latestApprovalDate, metricNumber, metricValueMap, facilityNameOf, facilityTypeOf } from "../../metric/utils/approvedMetricView";
import { apiErrorMessage, formatDateTime, formatNumber, periodOf } from "../../../shared/utils/esgFormat";
import { fileApi } from "../../../shared/api/fileApi";

const defaultFilters = { year: 2026, month: 5, facilityId: "", search: "" };
const indicatorLabels = {
  IND_S_INJURY_RATE: "산업재해율",
  IND_S_SAFETY_EDU: "안전교육 이수율",
  IND_S_RISK_ACTION: "위험요인 개선 조치율",
  IND_S_TURNOVER: "퇴사율",
};
const initialFiltersFrom = (params) => ({
  year: Number(params.get("year")) || defaultFilters.year,
  month: Number(params.get("month")) || defaultFilters.month,
  facilityId: params.get("facilityId") || "",
  search: "",
});

export default function SocialDataPage() {
  const [searchParams] = useSearchParams();
  const selectedIndicator = searchParams.get("indicator") || "";
  const [filters, setFilters] = useState(() => initialFiltersFrom(searchParams));
  const [facilities, setFacilities] = useState([]);
  const [metrics, setMetrics] = useState([]);
  const [loading, setLoading] = useState(true);
  const period = periodOf(filters.year, filters.month);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [facilityResponse, approvedMetrics] = await Promise.all([
        companyApi.getFacilities(),
        metricApi.list({ period, category: "SOCIAL", status: "APPROVED", ...(filters.facilityId ? { facilityId: filters.facilityId } : {}) }),
      ]);
      setFacilities(facilityResponse?.data || []);
      setMetrics(approvedMetrics || []);
    } catch (error) {
      Swal.fire("조회 실패", apiErrorMessage(error, "사회 확정 실적을 불러오지 못했습니다."), "error");
    } finally {
      setLoading(false);
    }
  }, [filters.facilityId, period]);

  useEffect(() => { void Promise.resolve().then(load); }, [load]);

  const rows = useMemo(() => facilities
    .filter((facility) => !filters.facilityId || String(facility.id) === String(filters.facilityId))
    .map((facility) => {
      const related = metrics.filter((metric) => String(metric.facilityId) === String(facility.id));
      const values = metricValueMap(related);
      return {
        id: facility.id,
        facilityName: facilityNameOf(facility),
        facilityType: facilityTypeOf(facility),
        injuryRate: metricNumber(values.IND_S_INJURY_RATE),
        trainingRate: metricNumber(values.IND_S_SAFETY_EDU),
        actionRate: metricNumber(values.IND_S_RISK_ACTION),
        turnoverRate: metricNumber(values.IND_S_TURNOVER),
        approvedAt: latestApprovalDate(related),
        evidence: firstEvidence(related),
      };
    })
    .filter((row) => {
      const keyword = filters.search.trim().toLowerCase();
      const hasData = [row.injuryRate, row.trainingRate, row.actionRate, row.turnoverRate].some((value) => value !== null);
      return hasData && (!keyword || row.facilityName.toLowerCase().includes(keyword));
    }), [facilities, filters.facilityId, filters.search, metrics]);

  const average = (key) => rows.length ? rows.reduce((sum, row) => sum + Number(row[key] || 0), 0) / rows.length : 0;
  const columns = [
    { key: "facilityName", label: "사업장", render: (value, row) => <div><strong>{value}</strong><small className="cell-sub">{row.facilityType === "HQ" ? "본사" : "공장"}</small></div> },
    { key: "injuryRate", label: "산업재해율", render: (value) => value === null ? "-" : `${formatNumber(value, 2)}%` },
    { key: "trainingRate", label: "안전교육 이수율", render: (value) => value === null ? "-" : `${formatNumber(value, 1)}%` },
    { key: "actionRate", label: "위험요인 개선 조치율", render: (value) => value === null ? "-" : `${formatNumber(value, 1)}%` },
    { key: "turnoverRate", label: "퇴사율", render: (value) => value === null ? "-" : `${formatNumber(value, 2)}%` },
    { key: "approvedAt", label: "최종 승인일", render: (value) => formatDateTime(value) },
    { key: "evidence", label: "증빙 PDF", render: (value) => value ? <button type="button" className="text-link" onClick={() => fileApi.open(value)}>보기</button> : "-" },
  ];

  return (
    <div className="page-stack esg-domain-page">
      <PageHeader breadcrumbs={["ESG 실적", "사회"]} eyebrow="SOCIAL PERFORMANCE" title="사회 실적" description="최종 승인된 사업장별 사회 ESG 핵심지표를 조회합니다." />
      {selectedIndicator && <div className="selected-indicator-notice"><strong>{indicatorLabels[selectedIndicator] || selectedIndicator}</strong><span>대시보드에서 선택한 지표와 동일한 기준월·사업장으로 조회했습니다.</span></div>}
      <section className="workflow-strip"><span>ESG 데이터 등록</span><i>→</i><span>승인 요청</span><i>→</i><strong>최종 승인</strong><i>→</i><span>사회 실적 자동 반영</span></section>
      <Card className="filter-card" title="조회 조건" description="기준 기간과 사업장을 선택해 승인 완료된 실적을 조회합니다.">
        <div className="esg-filter-grid">
          <label><span>기준연도</span><select value={filters.year} onChange={(event) => setFilters({ ...filters, year: Number(event.target.value) })}><option value={2026}>2026년</option><option value={2025}>2025년</option></select></label>
          <label><span>기준월</span><select value={filters.month} onChange={(event) => setFilters({ ...filters, month: Number(event.target.value) })}>{Array.from({ length: 12 }, (_, index) => <option key={index + 1} value={index + 1}>{index + 1}월</option>)}</select></label>
          <label><span>사업장</span><select value={filters.facilityId} onChange={(event) => setFilters({ ...filters, facilityId: event.target.value })}><option value="">전체 사업장</option>{facilities.map((facility) => <option key={facility.id} value={facility.id}>{facilityNameOf(facility)}</option>)}</select></label>
          <label className="filter-search"><span>검색</span><input value={filters.search} onChange={(event) => setFilters({ ...filters, search: event.target.value })} placeholder="사업장명" /></label>
          <div className="filter-actions"><Button variant="outline" onClick={() => setFilters(defaultFilters)}>초기화</Button><Button onClick={load}>조회</Button></div>
        </div>
      </Card>
      <div className="summary-card-grid four">
        <article className={selectedIndicator === "IND_S_INJURY_RATE" ? "is-highlighted" : ""}><span>평균 산업재해율</span><strong>{formatNumber(average("injuryRate"), 2)}</strong><small>%</small></article>
        <article className={selectedIndicator === "IND_S_SAFETY_EDU" ? "is-highlighted" : ""}><span>평균 안전교육 이수율</span><strong>{formatNumber(average("trainingRate"), 1)}</strong><small>%</small></article>
        <article className={selectedIndicator === "IND_S_RISK_ACTION" ? "is-highlighted" : ""}><span>평균 개선 조치율</span><strong>{formatNumber(average("actionRate"), 1)}</strong><small>%</small></article>
        <article className={selectedIndicator === "IND_S_TURNOVER" ? "is-highlighted" : ""}><span>평균 퇴사율</span><strong>{formatNumber(average("turnoverRate"), 2)}</strong><small>%</small></article>
      </div>
      <Card title={`${period} 사회 확정 실적`} description="ESG 데이터 관리에서 등록되어 최종 승인된 값만 표시됩니다.">
        {loading ? <div className="data-loading">사회 확정 실적을 불러오는 중입니다.</div> : <DataTable rows={rows} columns={columns} emptyText="선택한 기간에 승인 완료된 사회 데이터가 없습니다." />}
      </Card>
    </div>
  );
}
