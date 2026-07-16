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

const statusLabels = { ALL: "전체", DRAFT: "작성 중", PENDING: "승인 대기", REJECTED: "반려", APPROVED: "승인 완료" };
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
      const [metrics, monthMetrics, facilityResponse] = await Promise.all([
        metricApi.list(params),
        metricApi.list({ period }),
        companyApi.getFacilities(),
      ]);
      setRows(Array.isArray(metrics) ? metrics : []);
      setAllRows(Array.isArray(monthMetrics) ? monthMetrics : []);
      setFacilities(facilityResponse?.data || []);
    } catch (error) {
      Swal.fire("조회 실패", apiErrorMessage(error), "error");
    } finally {
      setLoading(false);
    }
  }, [filters.category, filters.facilityId, filters.search, filters.status, period]);

  useEffect(() => { void Promise.resolve().then(load); }, [load]);

  const tabs = useMemo(() => Object.entries(statusLabels).map(([status, label]) => ({
    value: status,
    label,
    count: status === "ALL" ? allRows.length : allRows.filter((metric) => metric.status === status).length,
  })), [allRows]);

  const requestBatch = async () => {
    const result = await Swal.fire({
      title: `${period} 승인 일괄 요청`,
      text: filters.category
        ? `${filters.category} 영역의 작성 중·반려 데이터를 승인 요청합니다.`
        : "현재 월의 작성 중·반려 데이터를 승인 요청합니다.",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "승인 요청",
      cancelButtonText: "취소",
    });
    if (!result.isConfirmed) return;

    setProcessing(true);
    try {
      const response = await metricApi.requestApprovalBatch(period, filters.category || undefined);
      await Swal.fire("처리 완료", `${response?.processedCount || 0}건을 승인 요청했습니다.`, "success");
      await load();
    } catch (error) {
      Swal.fire("처리 실패", apiErrorMessage(error), "error");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="page-stack metric-management-page">
      <PageHeader
        breadcrumbs={["데이터 관리", "ESG 데이터 관리"]}
        eyebrow="ESG DATA REGISTRATION"
        title="ESG 데이터 관리"
        description="사업장별 ESG 내역 PDF와 지표값을 등록하고 최종 승인을 요청합니다."
        actions={isManager ? <>
          <Button onClick={() => navigate("/manager/metrics/new")}>신규 데이터 등록</Button>
          <Button variant="outline" disabled={processing} onClick={requestBatch}>승인 일괄 요청</Button>
        </> : null}
      />

      <section className="metric-flow-banner">
        <strong>신규 데이터 등록</strong><i>→</i><span>검토·수정</span><i>→</i><span>승인 요청</span><i>→</i><span>최종 승인</span><i>→</i><span>조회 화면 자동 반영</span>
      </section>

      <Tabs items={tabs} value={filters.status} onChange={(status) => setFilters({ ...filters, status })} />
      <MetricSummaryPanel metrics={allRows} />

      <Card title="검색 및 필터" description="기준월·ESG 영역·사업장·상태·지표명으로 조회합니다.">
        <div className="esg-filter-grid metric-filters">
          <label><span>기준연도</span><select value={filters.year} onChange={(event) => setFilters({ ...filters, year: Number(event.target.value) })}><option value={2026}>2026년</option><option value={2025}>2025년</option></select></label>
          <label><span>기준월</span><select value={filters.month} onChange={(event) => setFilters({ ...filters, month: Number(event.target.value) })}>{Array.from({ length: 12 }, (_, index) => <option key={index + 1} value={index + 1}>{index + 1}월</option>)}</select></label>
          <label><span>ESG 영역</span><select value={filters.category} onChange={(event) => setFilters({ ...filters, category: event.target.value })}><option value="">전체 영역</option><option value="ENVIRONMENT">환경</option><option value="SOCIAL">사회</option><option value="GOVERNANCE">거버넌스</option></select></label>
          <label><span>사업장</span><select value={filters.facilityId} onChange={(event) => setFilters({ ...filters, facilityId: event.target.value })}><option value="">전체 사업장</option>{facilities.map((facility) => <option key={facility.id} value={facility.id}>{facility.facility_name}</option>)}</select></label>
          <label className="filter-search"><span>검색</span><input value={filters.search} onChange={(event) => setFilters({ ...filters, search: event.target.value })} placeholder="지표명·코드·사업장 검색" /></label>
          <div className="filter-actions"><Button variant="outline" onClick={() => setFilters(initialFilters)}>초기화</Button><Button onClick={load}>검색</Button></div>
        </div>
      </Card>

      <Card title={`${period} ESG 데이터`} description={`등록 데이터 ${rows.length}건`}>
        {loading ? <div className="data-loading">ESG 데이터를 불러오는 중입니다.</div> : <MetricDataGrid rows={rows} onRowClick={(row) => navigate(`/manager/metrics/${row.id}`)} />}
      </Card>
    </div>
  );
}
