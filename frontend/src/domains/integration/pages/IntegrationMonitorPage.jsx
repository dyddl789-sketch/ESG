import { useCallback, useEffect, useMemo, useState } from "react";
import Swal from "sweetalert2";
import PageHeader from "../../../shared/components/PageHeader";
import Card from "../../../shared/components/Card";
import Button from "../../../shared/components/Button";
import DataTable from "../../../shared/components/DataTable";
import StatusBadge from "../../../shared/components/StatusBadge";
import esgDataApi from "../api/esgDataApi";
import { apiErrorMessage, formatDateTime, periodOf } from "../../../shared/utils/esgFormat";

const initialFilters = { year: 2026, month: 6, domain: "", search: "" };
const domainLabel = { ENVIRONMENT: "환경", SOCIAL: "사회", GOVERNANCE: "거버넌스" };

export default function IntegrationMonitorPage() {
  const [filters, setFilters] = useState(initialFilters);
  const [runs, setRuns] = useState([]);
  const [rawData, setRawData] = useState([]);
  const [loading, setLoading] = useState(true);
  const period = periodOf(filters.year, filters.month);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = { period, limit: 200, ...(filters.domain ? { domain: filters.domain } : {}) };
      const [runRows, rawRows] = await Promise.all([esgDataApi.getRuns(params), esgDataApi.getRawData(params)]);
      setRuns(runRows || []);
      setRawData(rawRows || []);
    } catch (error) {
      Swal.fire("조회 실패", apiErrorMessage(error), "error");
    } finally {
      setLoading(false);
    }
  }, [filters.domain, period]);

  useEffect(() => { load(); }, [load]);

  const searchedRaw = useMemo(() => {
    const keyword = filters.search.trim().toLowerCase();
    if (!keyword) return rawData;
    return rawData.filter((row) => `${row.facilityName || ""} ${row.sourceSystem || ""} ${row.sourceRecordId || ""}`.toLowerCase().includes(keyword));
  }, [filters.search, rawData]);

  const summary = useMemo(() => ({
    runCount: runs.length,
    success: runs.filter((run) => run.status === "SUCCESS").length,
    error: runs.reduce((sum, run) => sum + Number(run.errorCount || 0), 0),
    rawCount: searchedRaw.length,
  }), [runs, searchedRaw.length]);

  const runColumns = [
    { key: "id", label: "실행 번호" },
    { key: "domain", label: "영역", render: (value) => domainLabel[value] || value },
    { key: "sourceSystem", label: "원천 시스템" },
    { key: "basePeriod", label: "기준월" },
    { key: "triggerType", label: "실행 유형", render: (value) => value === "SCHEDULED" ? "자동 스케줄" : value === "RETRY" ? "재시도" : "시연" },
    { key: "totalCount", label: "전체" },
    { key: "successCount", label: "성공" },
    { key: "errorCount", label: "오류" },
    { key: "startedAt", label: "시작 시각", render: (value) => formatDateTime(value) },
    { key: "completedAt", label: "완료 시각", render: (value) => formatDateTime(value) },
    { key: "status", label: "결과", render: (value) => <StatusBadge status={value} /> },
  ];

  const rawColumns = [
    { key: "domain", label: "영역", render: (value) => domainLabel[value] || value },
    { key: "facilityName", label: "사업장", render: (value) => value || "기업 전체" },
    { key: "sourceSystem", label: "원천 시스템" },
    { key: "sourceRecordId", label: "원천 레코드 ID" },
    { key: "basePeriod", label: "기준월" },
    { key: "validationStatus", label: "검증", render: (value) => <StatusBadge status={value} /> },
    { key: "collectedAt", label: "수집 시각", render: (value) => formatDateTime(value) },
  ];

  return (
    <div className="page-stack">
      <PageHeader breadcrumbs={["운영 관리", "연동 모니터링"]} eyebrow="INTEGRATION OPERATIONS" title="외부 시스템 연동 모니터링" description="DB에 저장된 자동 수집 실행 이력과 원천 레코드를 조회합니다." />

      <Card className="filter-card" title="조회 조건" description="기준월·ESG 영역·원천 레코드 검색으로 실행 결과를 확인합니다.">
        <div className="esg-filter-grid">
          <label><span>기준연도</span><select value={filters.year} onChange={(event) => setFilters({ ...filters, year: Number(event.target.value) })}><option value={2026}>2026년</option><option value={2025}>2025년</option></select></label>
          <label><span>기준월</span><select value={filters.month} onChange={(event) => setFilters({ ...filters, month: Number(event.target.value) })}>{Array.from({ length: 12 }, (_, index) => <option key={index + 1} value={index + 1}>{index + 1}월</option>)}</select></label>
          <label><span>ESG 영역</span><select value={filters.domain} onChange={(event) => setFilters({ ...filters, domain: event.target.value })}><option value="">전체</option><option value="ENVIRONMENT">환경</option><option value="SOCIAL">사회</option><option value="GOVERNANCE">거버넌스</option></select></label>
          <label className="filter-search"><span>검색</span><input value={filters.search} onChange={(event) => setFilters({ ...filters, search: event.target.value })} placeholder="사업장·시스템·레코드 ID" /></label>
          <div className="filter-actions"><Button variant="outline" onClick={() => setFilters(initialFilters)}>초기화</Button><Button onClick={load}>검색</Button></div>
        </div>
      </Card>

      <div className="summary-card-grid four">
        <article><span>수집 실행</span><strong>{summary.runCount}</strong><small>{period} 기준</small></article>
        <article><span>정상 완료</span><strong>{summary.success}</strong><small>SUCCESS 실행</small></article>
        <article><span>오류 레코드</span><strong>{summary.error}</strong><small>실행 이력 합계</small></article>
        <article><span>원천 레코드</span><strong>{summary.rawCount}</strong><small>검색 결과</small></article>
      </div>

      <Card title="연동 실행 이력" description="자동 스케줄러가 영역별로 수행한 DB 실행 기록입니다.">{loading ? <div className="data-loading">실행 이력을 불러오는 중입니다.</div> : <DataTable rows={runs} columns={runColumns} emptyText="수집 실행 이력이 없습니다." />}</Card>
      <Card title="원천 데이터 수집 내역" description="실제 월별 집계의 근거가 되는 원천 레코드 목록입니다."><DataTable rows={searchedRaw} columns={rawColumns} emptyText="조건에 맞는 원천 데이터가 없습니다." /></Card>
    </div>
  );
}
