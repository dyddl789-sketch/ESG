import { useCallback, useEffect, useMemo, useState } from "react";
import Swal from "sweetalert2";
import { useAuth } from "../../../app/providers/AuthProvider";
import { ROLES } from "../../../app/config/roles";
import PageHeader from "../../../shared/components/PageHeader";
import Card from "../../../shared/components/Card";
import Button from "../../../shared/components/Button";
import DataTable from "../../../shared/components/DataTable";
import StatusBadge from "../../../shared/components/StatusBadge";
import companyApi from "../../company/api/companyApi";
import esgDataApi from "../api/esgDataApi";
import { apiErrorMessage, formatDateTime, formatNumber, periodOf } from "../../../shared/utils/esgFormat";

const initialFilters = { year: 2026, month: 6, facilityId: "", reflectionStatus: "", approvalStatus: "", search: "" };

export default function IntegrationPage() {
  const { user } = useAuth();
  const canManage = [ROLES.COMPANY_MANAGER, ROLES.SYSTEM_ADMIN].includes(user?.role);
  const [filters, setFilters] = useState(initialFilters);
  const [facilities, setFacilities] = useState([]);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reflecting, setReflecting] = useState(false);
  const period = periodOf(filters.year, filters.month);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [facilityResponse, data] = await Promise.all([
        companyApi.getFacilities(),
        esgDataApi.getEnvironment({
          period,
          ...(filters.facilityId ? { facilityId: filters.facilityId } : {}),
          ...(filters.search ? { search: filters.search.trim() } : {}),
          ...(filters.reflectionStatus ? { reflectionStatus: filters.reflectionStatus } : {}),
          ...(filters.approvalStatus ? { approvalStatus: filters.approvalStatus } : {}),
        }),
      ]);
      setFacilities(facilityResponse?.data || []);
      setRows(data || []);
    } catch (error) {
      Swal.fire("조회 실패", apiErrorMessage(error), "error");
    } finally {
      setLoading(false);
    }
  }, [filters.approvalStatus, filters.facilityId, filters.reflectionStatus, filters.search, period]);

  useEffect(() => { load(); }, [load]);

  const summary = useMemo(() => ({
    total: rows.length,
    collected: rows.filter((row) => row.collectionStatus === "COLLECTED").length,
    reflected: rows.filter((row) => row.reflectionStatus === "REFLECTED").length,
    scope2: rows.reduce((sum, row) => sum + Number(row.scope2Tco2eq || 0), 0),
  }), [rows]);

  const reflect = async (facilityId = filters.facilityId || null) => {
    const targetName = facilityId
      ? facilities.find((facility) => String(facility.id) === String(facilityId))?.facility_name || "선택 사업장"
      : "조회된 전체 사업장";
    const confirmation = await Swal.fire({
      title: `${period} 환경 데이터 ESG 반영`,
      text: `${targetName}의 수집 완료 데이터를 ESG 지표로 계산·저장합니다.`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "ESG 반영",
      cancelButtonText: "취소",
    });
    if (!confirmation.isConfirmed) return;

    setReflecting(true);
    try {
      const result = await esgDataApi.reflect("ENVIRONMENT", period, facilityId || undefined);
      await Swal.fire("반영 완료", `${result?.reflectedMetricCount || 0}개 환경 지표가 검토 대상으로 생성되었습니다.`, "success");
      await load();
    } catch (error) {
      Swal.fire("반영 실패", apiErrorMessage(error), "error");
    } finally {
      setReflecting(false);
    }
  };

  const columns = [
    { key: "facilityName", label: "사업장", render: (value, row) => <div><strong>{value}</strong><small className="cell-sub">{row.facilityType === "HQ" ? "본사" : "공장"}</small></div> },
    { key: "electricityUsageKwh", label: "전력 사용량", render: (value) => `${formatNumber(value)} kWh` },
    { key: "productionTon", label: "생산량", render: (value) => `${formatNumber(value)} ton` },
    { key: "intensityKwhPerTon", label: "전력 원단위", render: (value) => `${formatNumber(value, 1)} kWh/ton` },
    { key: "scope2Tco2eq", label: "Scope 2", render: (value) => `${formatNumber(value, 2)} tCO₂eq` },
    { key: "validationStatus", label: "검증", render: (value) => <StatusBadge status={value} /> },
    { key: "collectionStatus", label: "수집", render: (value) => <StatusBadge status={value} /> },
    { key: "reflectionStatus", label: "ESG 반영", render: (value) => <StatusBadge status={value} /> },
    { key: "approvalStatus", label: "승인", render: (value) => <StatusBadge status={value} /> },
    { key: "collectedAt", label: "최근 수집", render: (value) => formatDateTime(value) },
    ...(canManage ? [{ key: "action", label: "처리", render: (_, row) => (
      <Button size="sm" variant="outline" disabled={row.reflectionStatus === "REFLECTED" || reflecting} onClick={(event) => { event.stopPropagation(); reflect(row.facilityId); }}>
        {row.reflectionStatus === "REFLECTED" ? "반영 완료" : "ESG 반영"}
      </Button>
    ) }] : []),
  ];

  return (
    <div className="page-stack esg-domain-page">
      <PageHeader
        breadcrumbs={["데이터 관리", "환경"]}
        eyebrow="ENVIRONMENT DATA"
        title="환경 데이터"
        description="EMS에서 자동 수집된 월별 실제값을 확인하고 ESG 지표로 반영합니다."
        actions={canManage ? <Button disabled={reflecting || rows.every((row) => row.reflectionStatus === "REFLECTED")} onClick={() => reflect()}>{reflecting ? "반영 중..." : "조회 결과 ESG 반영"}</Button> : null}
      />

      <section className="workflow-strip"><span>외부 EMS 수집</span><i>→</i><strong>월별 실제값 확인</strong><i>→</i><span>ESG 반영</span><i>→</i><span>AI 분석·승인</span><i>→</i><span>대시보드 확정</span></section>

      <Card className="filter-card" title="조회 조건" description="필요한 기간과 사업장을 선택하거나 사업장명으로 검색할 수 있습니다.">
        <div className="esg-filter-grid">
          <label><span>기준연도</span><select value={filters.year} onChange={(e) => setFilters({ ...filters, year: Number(e.target.value) })}><option value={2026}>2026년</option><option value={2025}>2025년</option></select></label>
          <label><span>기준월</span><select value={filters.month} onChange={(e) => setFilters({ ...filters, month: Number(e.target.value) })}>{Array.from({ length: 12 }, (_, index) => <option key={index + 1} value={index + 1}>{index + 1}월</option>)}</select></label>
          <label><span>사업장</span><select value={filters.facilityId} onChange={(e) => setFilters({ ...filters, facilityId: e.target.value })}><option value="">전체 사업장</option>{facilities.map((facility) => <option key={facility.id} value={facility.id}>{facility.facility_name}</option>)}</select></label>
          <label><span>반영 상태</span><select value={filters.reflectionStatus} onChange={(e) => setFilters({ ...filters, reflectionStatus: e.target.value })}><option value="">전체</option><option value="NOT_REFLECTED">미반영</option><option value="REFLECTED">반영 완료</option></select></label>
          <label><span>승인 상태</span><select value={filters.approvalStatus} onChange={(e) => setFilters({ ...filters, approvalStatus: e.target.value })}><option value="">전체</option><option value="DRAFT">검토 중</option><option value="PENDING">승인 대기</option><option value="APPROVED">승인 완료</option><option value="REJECTED">반려</option></select></label>
          <label className="filter-search"><span>검색</span><input value={filters.search} onChange={(e) => setFilters({ ...filters, search: e.target.value })} placeholder="사업장명 검색" /></label>
          <div className="filter-actions"><Button variant="outline" onClick={() => setFilters(initialFilters)}>초기화</Button><Button onClick={load}>검색</Button></div>
        </div>
      </Card>

      <div className="summary-card-grid four">
        <article><span>조회 사업장</span><strong>{summary.total}</strong><small>{period} 기준</small></article>
        <article><span>수집 완료</span><strong>{summary.collected}</strong><small>외부 EMS 수집</small></article>
        <article><span>ESG 반영 완료</span><strong>{summary.reflected}</strong><small>검토 지표 생성</small></article>
        <article><span>월간 Scope 2</span><strong>{formatNumber(summary.scope2, 2)}</strong><small>tCO₂eq</small></article>
      </div>

      <Card title={`${period} 환경 실제값`} description="표시되는 수치는 DB에 저장된 월별 실제 수집 데이터입니다.">
        {loading ? <div className="data-loading">환경 데이터를 불러오는 중입니다.</div> : <DataTable rows={rows} columns={columns} emptyText="조건에 맞는 환경 데이터가 없습니다." />}
      </Card>
    </div>
  );
}
