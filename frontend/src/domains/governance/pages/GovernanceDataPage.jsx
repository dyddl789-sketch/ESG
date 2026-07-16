import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import Swal from "sweetalert2";
import PageHeader from "../../../shared/components/PageHeader";
import Card from "../../../shared/components/Card";
import Button from "../../../shared/components/Button";
import DataTable from "../../../shared/components/DataTable";
import { metricApi } from "../../metric/api/metricApi";
import { firstEvidence, latestApprovalDate, metricNumber, metricValueMap } from "../../metric/utils/approvedMetricView";
import { apiErrorMessage, formatDateTime, formatNumber, periodOf } from "../../../shared/utils/esgFormat";
import { fileApi } from "../../../shared/api/fileApi";

const defaultFilters = { year: 2026, month: 5 };
const indicatorLabels = { IND_G_ATTENDANCE: "이사회 참석률", IND_G_OUTSIDE: "사외이사 비율", IND_G_ETHICS_EDU: "윤리교육 이수율" };
const initialFiltersFrom = (params) => ({
  year: Number(params.get("year")) || defaultFilters.year,
  month: Number(params.get("month")) || defaultFilters.month,
});

export default function GovernanceDataPage() {
  const [searchParams] = useSearchParams();
  const selectedIndicator = searchParams.get("indicator") || "";
  const [filters, setFilters] = useState(() => initialFiltersFrom(searchParams));
  const [metrics, setMetrics] = useState([]);
  const [loading, setLoading] = useState(true);
  const period = periodOf(filters.year, filters.month);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setMetrics(await metricApi.list({ period, category: "GOVERNANCE", status: "APPROVED" }) || []);
    } catch (error) {
      Swal.fire("조회 실패", apiErrorMessage(error, "거버넌스 확정 실적을 불러오지 못했습니다."), "error");
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => { void Promise.resolve().then(load); }, [load]);

  const row = useMemo(() => {
    if (!metrics.length) return null;
    const values = metricValueMap(metrics);
    return {
      id: "governance",
      scope: metrics[0]?.facility || "기업 본사",
      attendance: metricNumber(values.IND_G_ATTENDANCE),
      outside: metricNumber(values.IND_G_OUTSIDE),
      ethics: metricNumber(values.IND_G_ETHICS_EDU),
      approvedAt: latestApprovalDate(metrics),
      evidence: firstEvidence(metrics),
    };
  }, [metrics]);

  const columns = [
    { key: "scope", label: "관리 기준" },
    { key: "attendance", label: "이사회 참석률", render: (value) => value === null ? "-" : `${formatNumber(value, 1)}%` },
    { key: "outside", label: "사외이사 비율", render: (value) => value === null ? "-" : `${formatNumber(value, 1)}%` },
    { key: "ethics", label: "윤리교육 이수율", render: (value) => value === null ? "-" : `${formatNumber(value, 1)}%` },
    { key: "approvedAt", label: "최종 승인일", render: (value) => formatDateTime(value) },
    { key: "evidence", label: "증빙 PDF", render: (value) => value ? <button type="button" className="text-link" onClick={() => fileApi.open(value)}>보기</button> : "-" },
  ];

  return (
    <div className="page-stack esg-domain-page">
      <PageHeader breadcrumbs={["ESG 실적", "거버넌스"]} eyebrow="GOVERNANCE PERFORMANCE" title="거버넌스 실적" description="최종 승인된 기업·본사 단위 거버넌스 ESG 확정값을 조회합니다." />
      {selectedIndicator && <div className="selected-indicator-notice"><strong>{indicatorLabels[selectedIndicator] || selectedIndicator}</strong><span>대시보드에서 선택한 지표와 동일한 기준월로 조회했습니다.</span></div>}
      <section className="workflow-strip"><span>ESG 데이터 등록</span><i>→</i><span>승인 요청</span><i>→</i><strong>최종 승인</strong><i>→</i><span>거버넌스 실적 자동 반영</span></section>
      <Card className="filter-card" title="조회 조건" description="거버넌스 지표는 기업·본사 기준으로 조회합니다.">
        <div className="esg-filter-grid">
          <label><span>기준연도</span><select value={filters.year} onChange={(event) => setFilters({ ...filters, year: Number(event.target.value) })}><option value={2026}>2026년</option><option value={2025}>2025년</option></select></label>
          <label><span>기준월</span><select value={filters.month} onChange={(event) => setFilters({ ...filters, month: Number(event.target.value) })}>{Array.from({ length: 12 }, (_, index) => <option key={index + 1} value={index + 1}>{index + 1}월</option>)}</select></label>
          <div className="filter-actions"><Button variant="outline" onClick={() => setFilters(defaultFilters)}>초기화</Button><Button onClick={load}>조회</Button></div>
        </div>
      </Card>
      <div className="summary-card-grid three">
        <article className={selectedIndicator === "IND_G_ATTENDANCE" ? "is-highlighted" : ""}><span>이사회 참석률</span><strong>{row ? formatNumber(row.attendance, 1) : "-"}</strong><small>%</small></article>
        <article className={selectedIndicator === "IND_G_OUTSIDE" ? "is-highlighted" : ""}><span>사외이사 비율</span><strong>{row ? formatNumber(row.outside, 1) : "-"}</strong><small>%</small></article>
        <article className={selectedIndicator === "IND_G_ETHICS_EDU" ? "is-highlighted" : ""}><span>윤리교육 이수율</span><strong>{row ? formatNumber(row.ethics, 1) : "-"}</strong><small>%</small></article>
      </div>
      <Card title={`${period} 거버넌스 확정 실적`} description="ESG 데이터 관리 또는 문서·AI 분석에서 등록되어 최종 승인된 값만 표시됩니다.">
        {loading ? <div className="data-loading">거버넌스 확정 실적을 불러오는 중입니다.</div> : <DataTable rows={row ? [row] : []} columns={columns} emptyText="선택한 기간에 승인 완료된 거버넌스 데이터가 없습니다." />}
      </Card>
    </div>
  );
}
