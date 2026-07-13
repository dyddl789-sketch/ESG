import { useCallback, useEffect, useMemo, useState } from "react";
import Swal from "sweetalert2";
import PageHeader from "../../../shared/components/PageHeader";
import Card from "../../../shared/components/Card";
import Button from "../../../shared/components/Button";
import StatusBadge from "../../../shared/components/StatusBadge";
import { useAuth } from "../../../app/providers/AuthProvider";
import { ROLES } from "../../../app/config/roles";
import companyApi from "../api/companyApi";
import FacilityDetailModal from "../components/FacilityDetailModal";
import FacilityFormModal from "../components/FacilityFormModal";
import { normalizeFacility } from "../utils/facilityData";
import { apiErrorMessage, formatNumber, periodOf } from "../../../shared/utils/esgFormat";

const companyValue = (company, camelKey, snakeKey) => company?.[camelKey] ?? company?.[snakeKey] ?? "-";
const initialFilters = { year: 2026, month: 6, type: "", status: "", search: "" };

export default function CompanyProfilePage() {
  const { user } = useAuth();
  const canManage = [ROLES.SYSTEM_ADMIN, ROLES.COMPANY_MANAGER].includes(user?.role);
  const [company, setCompany] = useState(null);
  const [facilities, setFacilities] = useState([]);
  const [facilityDetails, setFacilityDetails] = useState({});
  const [filters, setFilters] = useState(initialFilters);
  const [loading, setLoading] = useState(true);
  const [selectedFacility, setSelectedFacility] = useState(null);
  const [selectedDetail, setSelectedDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [editingFacility, setEditingFacility] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const period = periodOf(filters.year, filters.month);

  const loadProfile = useCallback(async () => {
    setLoading(true);
    try {
      const [companyResponse, facilityResponse] = await Promise.all([companyApi.getCompany(), companyApi.getFacilities()]);
      const normalized = (facilityResponse?.data || []).map((facility, index) => normalizeFacility(facility, index));
      setCompany(companyResponse?.data || null);
      setFacilities(normalized);
      const details = await Promise.all(normalized.map(async (facility) => {
        try { return [facility.id, (await companyApi.getFacilityEsgDetail(facility.id, period))?.data]; }
        catch { return [facility.id, null]; }
      }));
      setFacilityDetails(Object.fromEntries(details));
    } catch (error) {
      Swal.fire("조회 실패", apiErrorMessage(error, "기업·사업장 정보를 불러오지 못했습니다."), "error");
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => { loadProfile(); }, [loadProfile]);

  const filteredFacilities = useMemo(() => facilities.filter((facility) => {
    const detail = facilityDetails[facility.id];
    const status = detail?.environment?.approvalStatus || detail?.social?.approvalStatus || "DRAFT";
    const keyword = filters.search.trim().toLowerCase();
    return (!filters.type || facility.facilityType === filters.type)
      && (!filters.status || status === filters.status)
      && (!keyword || `${facility.facilityName} ${facility.address}`.toLowerCase().includes(keyword));
  }), [facilities, facilityDetails, filters.search, filters.status, filters.type]);

  const summary = useMemo(() => ({
    total: facilities.length,
    collected: facilities.filter((facility) => facilityDetails[facility.id]?.environment?.collectionStatus === "COLLECTED" && facilityDetails[facility.id]?.social?.collectionStatus === "COLLECTED").length,
    reflected: facilities.filter((facility) => facilityDetails[facility.id]?.environment?.reflectionStatus === "REFLECTED" && facilityDetails[facility.id]?.social?.reflectionStatus === "REFLECTED").length,
    approved: facilities.filter((facility) => facilityDetails[facility.id]?.environment?.approvalStatus === "APPROVED" && facilityDetails[facility.id]?.social?.approvalStatus === "APPROVED").length,
  }), [facilities, facilityDetails]);

  const openFacility = async (facility, nextPeriod = period) => {
    setSelectedFacility(facility);
    setSelectedDetail(facilityDetails[facility.id] || null);
    setDetailLoading(true);
    try {
      const response = await companyApi.getFacilityEsgDetail(facility.id, nextPeriod);
      setSelectedDetail(response?.data || null);
      setFacilityDetails((current) => ({ ...current, [facility.id]: response?.data || null }));
    } catch (error) {
      Swal.fire("상세조회 실패", apiErrorMessage(error), "error");
    } finally {
      setDetailLoading(false);
    }
  };

  const saveFacility = async (formData) => {
    try {
      if (editingFacility) await companyApi.updateFacility(editingFacility.id, formData);
      else await companyApi.createFacility(formData);
      setFormOpen(false);
      setEditingFacility(null);
      await loadProfile();
      Swal.fire("저장 완료", "사업장 기본정보가 저장되었습니다.", "success");
    } catch (error) { Swal.fire("저장 실패", apiErrorMessage(error), "error"); }
  };

  const deleteFacility = async (facilityId) => {
    const result = await Swal.fire({ title: "사업장을 삭제할까요?", text: "연결된 월별 데이터도 함께 삭제될 수 있습니다.", icon: "warning", showCancelButton: true, confirmButtonText: "삭제", cancelButtonText: "취소" });
    if (!result.isConfirmed) return;
    try {
      await companyApi.deleteFacility(facilityId);
      setSelectedFacility(null);
      setSelectedDetail(null);
      await loadProfile();
      Swal.fire("삭제 완료", "사업장을 삭제했습니다.", "success");
    } catch (error) { Swal.fire("삭제 실패", apiErrorMessage(error), "error"); }
  };

  if (loading) return <div className="page-loading">기업·사업장 실제 데이터를 불러오는 중입니다.</div>;

  return (
    <div className="page-stack company-profile-page">
      <PageHeader breadcrumbs={["기업 설정", "기업·사업장 정보"]} eyebrow="COMPANY & FACILITY" title="기업·사업장 정보" description="기업 기준정보와 사업장별 월간 수집·ESG 반영·승인 상태를 확인합니다." actions={canManage ? <Button onClick={() => { setEditingFacility(null); setFormOpen(true); }}>신규 사업장 등록</Button> : <span className="verified-role">조회 전용</span>} />

      <Card title="기업 기본정보" description="ESG 보고와 평가의 소속 기준입니다.">
        <div className="company-master-grid">
          <div><span>기업명</span><strong>{companyValue(company, "name", "name")}</strong></div>
          <div><span>업종</span><strong>{companyValue(company, "industry", "industry")}</strong></div>
          <div><span>기업 규모</span><strong>{companyValue(company, "scale", "company_scale")}</strong></div>
          <div><span>사업자등록번호</span><strong>{companyValue(company, "businessNumber", "business_number")}</strong></div>
          <div><span>대표자</span><strong>{companyValue(company, "representative", "representative_name")}</strong></div>
          <div><span>운영 상태</span><StatusBadge status="NORMAL" label="사용 중" /></div>
        </div>
      </Card>

      <Card title="사업장 조회 조건" description="기간·유형·승인 상태·사업장명으로 검색할 수 있습니다.">
        <div className="esg-filter-grid">
          <label><span>기준연도</span><select value={filters.year} onChange={(event) => setFilters({ ...filters, year: Number(event.target.value) })}><option value={2026}>2026년</option><option value={2025}>2025년</option></select></label>
          <label><span>기준월</span><select value={filters.month} onChange={(event) => setFilters({ ...filters, month: Number(event.target.value) })}>{Array.from({ length: 12 }, (_, index) => <option key={index + 1} value={index + 1}>{index + 1}월</option>)}</select></label>
          <label><span>사업장 유형</span><select value={filters.type} onChange={(event) => setFilters({ ...filters, type: event.target.value })}><option value="">전체</option><option value="HQ">본사</option><option value="FACTORY">공장</option></select></label>
          <label><span>승인 상태</span><select value={filters.status} onChange={(event) => setFilters({ ...filters, status: event.target.value })}><option value="">전체</option><option value="DRAFT">검토 중</option><option value="PENDING">승인 대기</option><option value="APPROVED">승인 완료</option><option value="REJECTED">반려</option></select></label>
          <label className="filter-search"><span>검색</span><input value={filters.search} onChange={(event) => setFilters({ ...filters, search: event.target.value })} placeholder="사업장명 또는 주소" /></label>
          <div className="filter-actions"><Button variant="outline" onClick={() => setFilters(initialFilters)}>초기화</Button><Button onClick={loadProfile}>검색</Button></div>
        </div>
      </Card>

      <div className="facility-summary-grid">
        <article><span>등록 사업장</span><strong>{summary.total}</strong><small>본사·공장 포함</small></article>
        <article><span>월 마감·수집 완료</span><strong>{summary.collected}</strong><small>{period} 기준</small></article>
        <article><span>ESG 반영 완료</span><strong>{summary.reflected}</strong><small>환경·사회 모두</small></article>
        <article><span>최종 승인 완료</span><strong>{summary.approved}</strong><small>대시보드 확정 가능</small></article>
      </div>

      <Card title="사업장 목록" description="상세정보에서 지도, 환경·사회 실제값, 1~6월 수집현황을 확인합니다.">
        <div className="facility-management-table-wrap">
          <table className="data-table facility-management-table is-clickable">
            <thead><tr><th>사업장</th><th>유형</th><th>주소</th><th>계약전력</th><th>월 마감</th><th>ESG 반영</th><th>승인</th><th>관리</th></tr></thead>
            <tbody>
              {filteredFacilities.map((facility) => {
                const detail = facilityDetails[facility.id];
                const environment = detail?.environment;
                const social = detail?.social;
                const collection = environment?.collectionStatus === "COLLECTED" && social?.collectionStatus === "COLLECTED" ? "COLLECTED" : environment?.collectionStatus || social?.collectionStatus || "NOT_COLLECTED";
                const reflection = environment?.reflectionStatus === "REFLECTED" && social?.reflectionStatus === "REFLECTED" ? "REFLECTED" : "NOT_REFLECTED";
                const approval = environment?.approvalStatus === "APPROVED" && social?.approvalStatus === "APPROVED" ? "APPROVED" : environment?.approvalStatus || social?.approvalStatus || "DRAFT";
                return <tr key={facility.id} onClick={() => openFacility(facility)}><td><strong>{facility.facilityName}</strong><small className="cell-sub">ID {facility.id}</small></td><td>{facility.facilityType === "HQ" ? "본사" : "공장"}</td><td>{facility.address}</td><td>{formatNumber(facility.contractPowerKw)} kW</td><td><StatusBadge status={collection} /></td><td><StatusBadge status={reflection} /></td><td><StatusBadge status={approval} /></td><td><Button size="sm" variant="outline" onClick={(event) => { event.stopPropagation(); openFacility(facility); }}>상세보기</Button></td></tr>;
              })}
              {filteredFacilities.length === 0 && <tr><td colSpan={8} className="empty-cell">조건에 맞는 사업장이 없습니다.</td></tr>}
            </tbody>
          </table>
        </div>
      </Card>

      {selectedFacility && selectedDetail && (
        <FacilityDetailModal
          snapshot={selectedDetail}
          period={selectedDetail.selectedPeriod || period}
          loading={detailLoading}
          canEdit={canManage}
          onPeriodChange={(nextPeriod) => openFacility(selectedFacility, nextPeriod)}
          onClose={() => { setSelectedFacility(null); setSelectedDetail(null); }}
          onEdit={(facility) => { setSelectedFacility(null); setSelectedDetail(null); setEditingFacility(facility); setFormOpen(true); }}
          onDelete={deleteFacility}
        />
      )}

      {formOpen && <FacilityFormModal facility={editingFacility} onClose={() => { setFormOpen(false); setEditingFacility(null); }} onSave={saveFacility} />}
    </div>
  );
}
