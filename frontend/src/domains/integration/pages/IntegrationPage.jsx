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
const indicatorLabels = { IND_E_ELEC: "전력 사용량", IND_E_SCOPE2: "Scope 2 온실가스 배출량" };

const initialFiltersFrom = (params) => ({
  year: Number(params.get("year")) || defaultFilters.year,
  month: Number(params.get("month")) || defaultFilters.month,
  facilityId: params.get("facilityId") || "",
  search: "",
});

export default function IntegrationPage() {
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
        metricApi.list({ period, category: "ENVIRONMENT", status: "APPROVED", ...(filters.facilityId ? { facilityId: filters.facilityId } : {}) }),
      ]);
      setFacilities(facilityResponse?.data || []);
      setMetrics(approvedMetrics || []);
    } catch (error) {
      Swal.fire("조회 실패", apiErrorMessage(error, "환경 확정 실적을 불러오지 못했습니다."), "error");
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
        electricity: metricNumber(values.IND_E_ELEC),
        shipment: values.IND_E_ELEC?.shipmentAmountMillionKrw == null
          ? null
          : Number(values.IND_E_ELEC.shipmentAmountMillionKrw),
        scope2: metricNumber(values.IND_E_SCOPE2),
        approvedAt: latestApprovalDate(related),
        evidence: firstEvidence(related),
      };
    })
    .filter((row) => {
      const keyword = filters.search.trim().toLowerCase();
      return (row.electricity !== null || row.scope2 !== null)
        && (!keyword || row.facilityName.toLowerCase().includes(keyword));
    }), [facilities, filters.facilityId, filters.search, metrics]);

  const totals = useMemo(() => ({
    electricity: rows.reduce((sum, row) => sum + Number(row.electricity || 0), 0),
    shipment: rows.reduce((sum, row) => sum + Number(row.shipment || 0), 0),
    scope2: rows.reduce((sum, row) => sum + Number(row.scope2 || 0), 0),
  }), [rows]);

  const columns = [
    { key: "facilityName", label: "사업장", render: (value, row) => <div><strong>{value}</strong><small className="cell-sub">{row.facilityType === "HQ" ? "본사" : "공장"}</small></div> },
    { key: "electricity", label: "전력 사용량", render: (value) => value === null ? "-" : `${formatNumber(value)} kWh` },
    { key: "shipment", label: "출하액", render: (value) => value === null ? "-" : `${formatNumber(value, 2)} 백만원` },
    { key: "scope2", label: "Scope 2", render: (value) => value === null ? "-" : `${formatNumber(value, 2)} tCO₂eq` },
    { key: "approvedAt", label: "최종 승인일", render: (value) => formatDateTime(value) },
    { key: "evidence", label: "증빙 PDF", render: (value) => value ? <button type="button" className="text-link" onClick={(event) => { event.stopPropagation(); fileApi.open(value); }}>보기</button> : "-" },
  ];

  const resetFilters = () => setFilters(defaultFilters);

  return (
    <div className="page-stack esg-domain-page">
      <PageHeader breadcrumbs={["ESG 실적", "환경"]} eyebrow="ENVIRONMENT PERFORMANCE" title="환경 실적" description="최종 승인된 사업장별 환경 ESG 확정값을 조회합니다." />
      {selectedIndicator && <div className="selected-indicator-notice"><strong>{indicatorLabels[selectedIndicator] || selectedIndicator}</strong><span>대시보드에서 선택한 지표와 동일한 기준월·사업장으로 조회했습니다.</span></div>}
      <section className="workflow-strip"><span>ESG 데이터 등록</span><i>→</i><span>승인 요청</span><i>→</i><strong>최종 승인</strong><i>→</i><span>환경 실적 자동 반영</span></section>
      <Card className="filter-card" title="조회 조건" description="기준 기간과 사업장을 선택해 승인 완료된 실적을 조회합니다.">
        <div className="esg-filter-grid">
          <label><span>기준연도</span><select value={filters.year} onChange={(event) => setFilters({ ...filters, year: Number(event.target.value) })}><option value={2026}>2026년</option><option value={2025}>2025년</option></select></label>
          <label><span>기준월</span><select value={filters.month} onChange={(event) => setFilters({ ...filters, month: Number(event.target.value) })}>{Array.from({ length: 12 }, (_, index) => <option key={index + 1} value={index + 1}>{index + 1}월</option>)}</select></label>
          <label><span>사업장</span><select value={filters.facilityId} onChange={(event) => setFilters({ ...filters, facilityId: event.target.value })}><option value="">전체 사업장</option>{facilities.map((facility) => <option key={facility.id} value={facility.id}>{facilityNameOf(facility)}</option>)}</select></label>
          <label className="filter-search"><span>검색</span><input value={filters.search} onChange={(event) => setFilters({ ...filters, search: event.target.value })} placeholder="사업장명" /></label>
          <div className="filter-actions"><Button variant="outline" onClick={resetFilters}>초기화</Button><Button onClick={load}>조회</Button></div>
        </div>
      </Card>
      <div className="summary-card-grid four">
        <article><span>승인 사업장</span><strong>{rows.length}</strong><small>{period} 기준</small></article>
        <article className={selectedIndicator === "IND_E_ELEC" ? "is-highlighted" : ""}><span>전력 사용량</span><strong>{formatNumber(totals.electricity)}</strong><small>kWh</small></article>
        <article><span>출하액</span><strong>{formatNumber(totals.shipment, 2)}</strong><small>백만원</small></article>
        <article className={selectedIndicator === "IND_E_SCOPE2" ? "is-highlighted" : ""}><span>Scope 2</span><strong>{formatNumber(totals.scope2, 2)}</strong><small>tCO₂eq</small></article>
      </div>
      <Card title={`${period} 환경 확정 실적`} description="ESG 데이터 관리에서 등록되어 최종 승인된 값만 표시됩니다.">
        {loading ? <div className="data-loading">환경 확정 실적을 불러오는 중입니다.</div> : <DataTable rows={rows} columns={columns} emptyText="선택한 기간에 승인 완료된 환경 데이터가 없습니다." />}
      </Card>
    </div>
  );
}
