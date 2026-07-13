import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { useAuth } from "../../../app/providers/AuthProvider";
import { ROLES } from "../../../app/config/roles";
import PageHeader from "../../../shared/components/PageHeader";
import Card from "../../../shared/components/Card";
import Tabs from "../../../shared/components/Tabs";
import Button from "../../../shared/components/Button";
import MetricSummaryPanel from "../components/MetricSummaryPanel";
import MetricDataGrid from "../components/MetricDataGrid";
import companyApi from "../../company/api/companyApi";
import { metricApi } from "../api/metricApi";
import { apiErrorMessage, periodOf } from "../../../shared/utils/esgFormat";

const statusLabels = { ALL: "전체", DRAFT: "검토 중", PENDING: "승인 대기", REJECTED: "반려", APPROVED: "승인 완료" };
const initialFilters = { year: 2026, month: 6, category: "", facilityId: "", status: "ALL", search: "" };

export default function MetricListPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isManager = user?.role === ROLES.COMPANY_MANAGER;
  const [filters, setFilters] = useState(initialFilters);
  const [rows, setRows] = useState([]);
  const [allRows, setAllRows] = useState([]);
  const [facilities, setFacilities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const period = periodOf(filters.year, filters.month);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        period,
        ...(filters.category ? { category: filters.category } : {}),
        ...(filters.facilityId ? { facilityId: filters.facilityId } : {}),
        ...(filters.status !== "ALL" ? { status: filters.status } : {}),
        ...(filters.search.trim() ? { search: filters.search.trim() } : {}),
      };
      const [metrics, allMetrics, facilityResponse] = await Promise.all([
        metricApi.list(params),
        metricApi.list({ period }),
        companyApi.getFacilities(),
      ]);
      setRows(metrics || []);
      setAllRows(allMetrics || []);
      setFacilities(facilityResponse?.data || []);
    } catch (error) {
      Swal.fire("조회 실패", apiErrorMessage(error), "error");
    } finally {
      setLoading(false);
    }
  }, [filters.category, filters.facilityId, filters.search, filters.status, period]);

  useEffect(() => { load(); }, [load]);

  const tabs = useMemo(() => Object.entries(statusLabels).map(([status, label]) => ({
    value: status,
    label,
    count: status === "ALL" ? allRows.length : allRows.filter((metric) => metric.status === status).length,
  })), [allRows]);

  const runBatch = async (type) => {
    const label = type === "AI" ? "AI 일괄 분석" : "승인 일괄 요청";
    const result = await Swal.fire({
      title: `${period} ${label}`,
      text: filters.category ? `${filters.category} 영역의 현재 처리 가능한 지표를 일괄 처리합니다.` : "현재 월의 처리 가능한 전체 지표를 일괄 처리합니다.",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: label,
      cancelButtonText: "취소",
    });
    if (!result.isConfirmed) return;

    setProcessing(true);
    try {
      const response = type === "AI"
        ? await metricApi.analyzeBatch(period, filters.category || undefined)
        : await metricApi.requestApprovalBatch(period, filters.category || undefined);
      await Swal.fire("처리 완료", `${response?.processedCount || 0}건을 처리했습니다.`, "success");
      await load();
    } catch (error) {
      Swal.fire("처리 실패", apiErrorMessage(error), "error");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="page-stack metric-management-page">
      <PageHeader breadcrumbs={["데이터 관리", "ESG 데이터 관리"]} eyebrow="ESG METRIC CONTROL" title="ESG 데이터 관리" description="환경·사회·거버넌스에서 반영된 월별 지표를 AI 분석하고 승인 요청합니다." actions={isManager ? <><Button variant="outline" disabled={processing} onClick={() => runBatch("AI")}>AI 일괄 분석</Button><Button disabled={processing} onClick={() => runBatch("REQUEST")}>승인 일괄 요청</Button></> : null} />

      <section className="metric-flow-banner"><span>원천 데이터</span><i>→</i><span>ESG 반영</span><i>→</i><strong>AI 분석·승인 요청</strong><i>→</i><span>최종 승인</span><i>→</i><span>대시보드·보고서</span></section>

      <Tabs items={tabs} value={filters.status} onChange={(status) => setFilters({ ...filters, status })} />
      <MetricSummaryPanel metrics={allRows} />

      <Card title="검색 및 필터" description="기준월·ESG 영역·사업장·상태·지표명으로 조회할 수 있습니다.">
        <div className="esg-filter-grid metric-filters">
          <label><span>기준연도</span><select value={filters.year} onChange={(e) => setFilters({ ...filters, year: Number(e.target.value) })}><option value={2026}>2026년</option><option value={2025}>2025년</option></select></label>
          <label><span>기준월</span><select value={filters.month} onChange={(e) => setFilters({ ...filters, month: Number(e.target.value) })}>{Array.from({ length: 12 }, (_, index) => <option key={index + 1} value={index + 1}>{index + 1}월</option>)}</select></label>
          <label><span>ESG 영역</span><select value={filters.category} onChange={(e) => setFilters({ ...filters, category: e.target.value })}><option value="">전체 영역</option><option value="ENVIRONMENT">환경</option><option value="SOCIAL">사회</option><option value="GOVERNANCE">거버넌스</option></select></label>
          <label><span>사업장</span><select value={filters.facilityId} onChange={(e) => setFilters({ ...filters, facilityId: e.target.value })}><option value="">전체 사업장</option>{facilities.map((facility) => <option key={facility.id} value={facility.id}>{facility.facility_name}</option>)}</select></label>
          <label className="filter-search"><span>검색</span><input value={filters.search} onChange={(e) => setFilters({ ...filters, search: e.target.value })} placeholder="지표명·코드·사업장 검색" /></label>
          <div className="filter-actions"><Button variant="outline" onClick={() => setFilters(initialFilters)}>초기화</Button><Button onClick={load}>검색</Button></div>
        </div>
      </Card>

      <Card title={`${period} ESG 지표`} description={`DB 기준 데이터 ${rows.length}건`}>
        {loading ? <div className="data-loading">ESG 지표를 불러오는 중입니다.</div> : <MetricDataGrid rows={rows} onRowClick={(row) => navigate(`/manager/metrics/${row.id}`)} />}
      </Card>
    </div>
  );
}
