import { useEffect, useMemo, useState } from "react";
import Swal from "sweetalert2";

import PageHeader from "../../../shared/components/PageHeader";
import Card from "../../../shared/components/Card";
import DataTable from "../../../shared/components/DataTable";
import Button from "../../../shared/components/Button";
import apiClient from "../../../shared/api/apiClient";
import companyApi from "../../company/api/companyApi";
import indicatorApi from "../api/indicatorApi";

const INITIAL_FILTERS = {
  facilityId: "",
  indicatorId: "",
  action: "",
  fromDate: "",
  toDate: "",
};

const ACTION_OPTIONS = [
  { value: "DATA_CREATED", label: "데이터 등록" },
  { value: "DATA_UPDATED", label: "데이터 수정" },
  { value: "APPROVAL_REQUESTED", label: "승인 요청" },
  { value: "APPROVAL_CANCELED", label: "승인 요청 취소" },
  { value: "FINAL_APPROVED", label: "최종 승인" },
  { value: "REJECTED", label: "반려" },
  { value: "DELETED", label: "삭제" },
];

const PAGE_SIZES = [20, 50, 100];

function unwrapApiData(payload) {
  return payload?.data ?? payload;
}

function createPageNumbers(currentPage, totalPages) {
  if (totalPages <= 0) return [];

  const windowSize = 5;
  let start = Math.max(0, currentPage - Math.floor(windowSize / 2));
  const end = Math.min(totalPages, start + windowSize);
  start = Math.max(0, end - windowSize);

  return Array.from({ length: end - start }, (_, index) => start + index);
}

export default function AuditLogPage() {
  const [auditRows, setAuditRows] = useState([]);
  const [facilities, setFacilities] = useState([]);
  const [indicators, setIndicators] = useState([]);
  const [draftFilters, setDraftFilters] = useState(INITIAL_FILTERS);
  const [appliedFilters, setAppliedFilters] = useState(INITIAL_FILTERS);
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(50);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFilterOptions = async () => {
      try {
        const [facilityPayload, indicatorPayload] = await Promise.all([
          companyApi.getFacilities(),
          indicatorApi.getIndicators(),
        ]);
        setFacilities(unwrapApiData(facilityPayload) || []);
        setIndicators(unwrapApiData(indicatorPayload) || []);
      } catch (error) {
        console.error("감사 로그 필터 기준정보 로드 실패:", error);
      }
    };

    fetchFilterOptions();
  }, []);

  useEffect(() => {
    const fetchAuditLogs = async () => {
      setLoading(true);
      try {
        const params = {
          page,
          size,
          ...(appliedFilters.facilityId && { facilityId: appliedFilters.facilityId }),
          ...(appliedFilters.indicatorId && { indicatorId: appliedFilters.indicatorId }),
          ...(appliedFilters.action && { action: appliedFilters.action }),
          ...(appliedFilters.fromDate && { fromDate: appliedFilters.fromDate }),
          ...(appliedFilters.toDate && { toDate: appliedFilters.toDate }),
        };

        const response = await apiClient.get("/audit-logs", { params });
        const result = unwrapApiData(response.data) || {};

        setAuditRows(result.content || []);
        setTotalElements(Number(result.totalElements || 0));
        setTotalPages(Number(result.totalPages || 0));
      } catch (error) {
        console.error("데이터베이스 감사 로그 로드 실패:", error);
        setAuditRows([]);
        setTotalElements(0);
        setTotalPages(0);
        Swal.fire("오류", "감사 로그를 불러오지 못했습니다.", "error");
      } finally {
        setLoading(false);
      }
    };

    fetchAuditLogs();
  }, [appliedFilters, page, size]);

  const pageNumbers = useMemo(
    () => createPageNumbers(page, totalPages),
    [page, totalPages],
  );

  const updateFilter = (key, value) => {
    setDraftFilters((previous) => ({ ...previous, [key]: value }));
  };

  const applyFilters = () => {
    if (
      draftFilters.fromDate &&
      draftFilters.toDate &&
      draftFilters.fromDate > draftFilters.toDate
    ) {
      Swal.fire("조회 기간 확인", "시작일은 종료일보다 늦을 수 없습니다.", "warning");
      return;
    }

    setPage(0);
    setAppliedFilters({ ...draftFilters });
  };

  const resetFilters = () => {
    setDraftFilters(INITIAL_FILTERS);
    setAppliedFilters(INITIAL_FILTERS);
    setPage(0);
  };

  return (
    <div className="page-stack">
      <PageHeader
        breadcrumbs={["운영 관리", "감사 로그"]}
        title="감사 로그"
        description="ESG 실적의 등록·수정·승인 요청·최종 승인·반려 이력을 조건별로 조회합니다."
      />

      <Card
        title="조회 조건"
        description="사업장, 대상 지표, 작업 진행 상태와 처리 기간을 조합해 조회할 수 있습니다."
      >
        <div className="esg-filter-grid metric-filters">
          <label>
            <span>사업장</span>
            <select
              value={draftFilters.facilityId}
              onChange={(event) => updateFilter("facilityId", event.target.value)}
            >
              <option value="">전체 사업장</option>
              {facilities.map((facility) => (
                <option key={facility.id} value={facility.id}>
                  {facility.facility_name || facility.facilityName}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span>대상 지표</span>
            <select
              value={draftFilters.indicatorId}
              onChange={(event) => updateFilter("indicatorId", event.target.value)}
            >
              <option value="">전체 지표</option>
              {indicators.map((indicator) => (
                <option key={indicator.id} value={indicator.id}>
                  {indicator.title}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span>작업 진행</span>
            <select
              value={draftFilters.action}
              onChange={(event) => updateFilter("action", event.target.value)}
            >
              <option value="">전체 작업</option>
              {ACTION_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span>처리 시작일</span>
            <input
              type="date"
              value={draftFilters.fromDate}
              onChange={(event) => updateFilter("fromDate", event.target.value)}
            />
          </label>

          <label>
            <span>처리 종료일</span>
            <input
              type="date"
              value={draftFilters.toDate}
              onChange={(event) => updateFilter("toDate", event.target.value)}
            />
          </label>

          <div className="filter-actions">
            <Button type="button" onClick={applyFilters} disabled={loading}>
              조회
            </Button>
            <Button type="button" variant="ghost" onClick={resetFilters} disabled={loading}>
              초기화
            </Button>
          </div>
        </div>
      </Card>

      <Card
        title="감사 이력"
        description={`조회 결과 총 ${totalElements.toLocaleString()}건 · 최신 처리일시순`}
      >
        {loading ? (
          <div className="data-loading">감사 로그를 조회하고 있습니다...</div>
        ) : (
          <>
            <DataTable
              rows={auditRows}
              emptyText="조건에 해당하는 감사 로그가 없습니다."
              columns={[
                { key: "at", label: "처리일시" },
                { key: "facility", label: "사업장" },
                { key: "reporter", label: "보고자" },
                { key: "approver", label: "승인자" },
                { key: "action", label: "작업" },
                { key: "target", label: "대상 지표" },
                { key: "detail", label: "상세 내용" },
              ]}
            />

            <div className="table-pagination">
              <label>
                페이지당
                <select
                  value={size}
                  onChange={(event) => {
                    setSize(Number(event.target.value));
                    setPage(0);
                  }}
                >
                  {PAGE_SIZES.map((pageSize) => (
                    <option key={pageSize} value={pageSize}>
                      {pageSize}건
                    </option>
                  ))}
                </select>
              </label>

              <div>
                <button
                  type="button"
                  onClick={() => setPage((current) => Math.max(0, current - 1))}
                  disabled={page <= 0}
                  aria-label="이전 페이지"
                >
                  이전
                </button>

                {pageNumbers.map((pageNumber) => (
                  <button
                    type="button"
                    key={pageNumber}
                    className={pageNumber === page ? "active" : ""}
                    onClick={() => setPage(pageNumber)}
                  >
                    {pageNumber + 1}
                  </button>
                ))}

                <button
                  type="button"
                  onClick={() => setPage((current) => current + 1)}
                  disabled={totalPages === 0 || page >= totalPages - 1}
                  aria-label="다음 페이지"
                >
                  다음
                </button>
              </div>
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
