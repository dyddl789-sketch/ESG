import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import PageHeader from "../../../shared/components/PageHeader";
import Card from "../../../shared/components/Card";
import Button from "../../../shared/components/Button";
import DataTable from "../../../shared/components/DataTable";
import StatusBadge from "../../../shared/components/StatusBadge";
import companyApi from "../../company/api/companyApi";
import approvalApi from "../api/approvalApi";
import { apiErrorMessage, categoryLabel, formatNumber, periodOf } from "../../../shared/utils/esgFormat";

const initialFilters = { year: 2026, month: 6, category: "", facilityId: "", search: "" };

export default function ApprovalListPage() {
  const navigate = useNavigate();
  const [filters, setFilters] = useState(initialFilters);
  const [rows, setRows] = useState([]);
  const [facilities, setFacilities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const period = periodOf(filters.year, filters.month);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [data, facilityResponse] = await Promise.all([
        approvalApi.list({
          period,
          ...(filters.category ? { category: filters.category } : {}),
          ...(filters.facilityId ? { facilityId: filters.facilityId } : {}),
          ...(filters.search.trim() ? { search: filters.search.trim() } : {}),
        }),
        companyApi.getFacilities(),
      ]);
      setRows(data || []);
      setFacilities(facilityResponse?.data || []);
    } catch (error) {
      Swal.fire("조회 실패", apiErrorMessage(error), "error");
    } finally {
      setLoading(false);
    }
  }, [filters.category, filters.facilityId, filters.search, period]);

  useEffect(() => { void Promise.resolve().then(load); }, [load]);

  const summary = useMemo(() => ({
    total: rows.length,
    environment: rows.filter((row) => row.category === "ENVIRONMENT").length,
    social: rows.filter((row) => row.category === "SOCIAL").length,
    governance: rows.filter((row) => row.category === "GOVERNANCE").length,
    highRisk: rows.filter((row) => row.risk === "HIGH").length,
  }), [rows]);

  const approveBatch = async () => {
    const result = await Swal.fire({
      title: `${period} 최종 일괄 승인`,
      text: filters.category ? "선택 영역의 승인 대기 데이터를 최종 승인합니다." : "조회 월의 승인 대기 데이터를 최종 승인합니다.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "최종 승인",
      cancelButtonText: "취소",
    });
    if (!result.isConfirmed) return;
    setProcessing(true);
    try {
      const response = await approvalApi.approveBatch(period, filters.category || undefined);
      await Swal.fire("승인 완료", `${response?.processedCount || 0}건을 최종 승인했습니다. 승인된 월은 대시보드에 확정 반영됩니다.`, "success");
      await load();
    } catch (error) {
      Swal.fire("승인 실패", apiErrorMessage(error), "error");
    } finally {
      setProcessing(false);
    }
  };

  const columns = [
    { key: "period", label: "기준월" },
    { key: "category", label: "영역", render: (value) => <span className={`category category-${String(value).toLowerCase()}`}>{categoryLabel(value)}</span> },
    { key: "title", label: "지표명", render: (value, row) => <><strong>{value}</strong><small className="cell-sub">{row.indicatorCode}</small></> },
    { key: "facility", label: "사업장" },
    { key: "value", label: "제출 실제값", render: (value, row) => value === null || value === undefined ? row.textValue || "-" : `${formatNumber(value, 2)} ${row.unit || ""}` },
    { key: "assignee", label: "요청자", render: (value) => value || "기업 ESG 관리자" },
    { key: "aiStatus", label: "AI 분석", render: (value) => <StatusBadge status={value} label={value === "COMPLETED" ? "분석 완료" : "미분석"} /> },
    { key: "risk", label: "AI 위험", render: (value) => <StatusBadge status={value} label={value === "HIGH" ? "높음" : value === "MEDIUM" ? "보통" : "낮음"} /> },
    { key: "status", label: "상태", render: (value) => <StatusBadge status={value} /> },
  ];

  return (
    <div className="page-stack approval-page">
      <PageHeader breadcrumbs={["시스템 개요", "승인 관리"]} eyebrow="FINAL APPROVAL" title="ESG 데이터 승인 관리" description="기업 ESG 관리자가 요청한 지표·AI 분석·증빙을 최종 검토합니다." actions={<Button disabled={processing || rows.length === 0} onClick={approveBatch}>{processing ? "승인 중..." : "조회 결과 일괄 승인"}</Button>} />

      <section className="workflow-strip"><span>ESG 반영</span><i>→</i><span>AI 사전 분석</span><i>→</i><strong>최종 승인·반려</strong><i>→</i><span>내부 ESG 지수 확정</span><i>→</i><span>대시보드 반영</span></section>

      <div className="summary-card-grid five">
        <article><span>승인 대기</span><strong>{summary.total}</strong><small>{period} 조회 기준</small></article>
        <article><span>환경</span><strong>{summary.environment}</strong><small>대기 지표</small></article>
        <article><span>사회</span><strong>{summary.social}</strong><small>대기 지표</small></article>
        <article><span>거버넌스</span><strong>{summary.governance}</strong><small>대기 지표</small></article>
        <article><span>고위험 검토</span><strong>{summary.highRisk}</strong><small>AI 제안 기준</small></article>
      </div>

      <Card title="승인 검색 조건" description="기간·영역·사업장·지표명으로 승인 대기 데이터를 검색합니다.">
        <div className="esg-filter-grid metric-filters">
          <label><span>기준연도</span><select value={filters.year} onChange={(e) => setFilters({ ...filters, year: Number(e.target.value) })}><option value={2026}>2026년</option><option value={2025}>2025년</option></select></label>
          <label><span>기준월</span><select value={filters.month} onChange={(e) => setFilters({ ...filters, month: Number(e.target.value) })}>{Array.from({ length: 12 }, (_, index) => <option key={index + 1} value={index + 1}>{index + 1}월</option>)}</select></label>
          <label><span>ESG 영역</span><select value={filters.category} onChange={(e) => setFilters({ ...filters, category: e.target.value })}><option value="">전체 영역</option><option value="ENVIRONMENT">환경</option><option value="SOCIAL">사회</option><option value="GOVERNANCE">거버넌스</option></select></label>
          <label><span>사업장</span><select value={filters.facilityId} onChange={(e) => setFilters({ ...filters, facilityId: e.target.value })}><option value="">전체 사업장</option>{facilities.map((facility) => <option key={facility.id} value={facility.id}>{facility.facility_name}</option>)}</select></label>
          <label className="filter-search"><span>검색</span><input value={filters.search} onChange={(e) => setFilters({ ...filters, search: e.target.value })} placeholder="지표명·코드·사업장 검색" /></label>
          <div className="filter-actions"><Button variant="outline" onClick={() => setFilters(initialFilters)}>초기화</Button><Button onClick={load}>검색</Button></div>
        </div>
      </Card>

      <Card title="승인 요청 목록" description="행을 선택하면 실제값, AI 분석결과, 증빙 및 처리이력을 확인할 수 있습니다.">
        {loading ? <div className="data-loading">승인 요청을 불러오는 중입니다.</div> : <DataTable rows={rows} columns={columns} onRowClick={(row) => navigate(`/admin/approvals/${row.id}`)} emptyText="현재 조건의 승인 대기 데이터가 없습니다." />}
      </Card>
    </div>
  );
}
