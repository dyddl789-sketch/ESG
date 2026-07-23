import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import Swal from "sweetalert2";
import PageHeader from "../../../shared/components/PageHeader";
import Card from "../../../shared/components/Card";
import Button from "../../../shared/components/Button";
import StatusBadge from "../../../shared/components/StatusBadge";
import { useAuth } from "../../../app/providers/AuthProvider";
import { ROLES } from "../../../app/config/roles";
import companyApi from "../api/companyApi";
import { metricApi } from "../../metric/api/metricApi";
import CompanyEditModal from "../components/CompanyEditModal";
import FacilityFormModal from "../components/FacilityFormModal";
import FacilityMap from "../components/FacilityMap";
import { normalizeFacility } from "../utils/facilityData";
import { apiErrorMessage, formatDateTime, formatNumber, periodOf } from "../../../shared/utils/esgFormat";
import { fileApi } from "../../../shared/api/fileApi";

const initialFilters = { type: "", search: "" };
const categoryMeta = {
  ENVIRONMENT: { label: "환경", className: "environment" },
  SOCIAL: { label: "사회", className: "social" },
  GOVERNANCE: { label: "거버넌스", className: "governance" },
};
const COMPANY_WIDE_GOVERNANCE_CODES = new Set(["IND_G_ATTENDANCE", "IND_G_OUTSIDE"]);
const metricFacilityId = (metric) => metric?.facilityId ?? metric?.facility_id ?? null;
const companyValue = (company, camelKey, snakeKey, fallback = "-") => company?.[camelKey] ?? company?.[snakeKey] ?? fallback;
const maskBusinessNumber = (value) => {
  if (!value || value === "-") return value;
  const parts = String(value).split("-");
  return parts.length === 3 ? `${parts[0]}-${parts[1]}-*****` : `${String(value).slice(0, 6)}*****`;
};
const formatMetricValue = (metric) => {
  if (metric?.value === null || metric?.value === undefined) return metric?.textValue || "-";
  const digits = metric.unit === "%" || metric.indicatorCode === "IND_E_SCOPE2" || metric.derived ? 2 : 0;
  return `${formatNumber(metric.value, digits)} ${metric.unit || ""}`.trim();
};

export default function CompanyProfilePage() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const isSystemAdmin = user?.role === ROLES.SYSTEM_ADMIN;
  const isExternal = user?.role === ROLES.EXTERNAL_USER;
  const canManage = [ROLES.SYSTEM_ADMIN, ROLES.COMPANY_MANAGER].includes(user?.role);
  const requestedFacilityId = searchParams.get("facilityId");
  const initialYear = Number(searchParams.get("year")) || 2026;
  const initialMonth = Number(searchParams.get("month")) || 5;
  const initialPeriod = periodOf(initialYear, initialMonth);

  const [company, setCompany] = useState(null);
  const [facilities, setFacilities] = useState([]);
  const [filters, setFilters] = useState(initialFilters);
  const [loading, setLoading] = useState(true);
  const [selectedFacility, setSelectedFacility] = useState(null);
  const [selectedMetrics, setSelectedMetrics] = useState([]);
  const [selectedPeriod, setSelectedPeriod] = useState(initialPeriod);
  const [detailLoading, setDetailLoading] = useState(false);
  const [editingFacility, setEditingFacility] = useState(null);
  const [facilityFormOpen, setFacilityFormOpen] = useState(false);
  const [companyFormOpen, setCompanyFormOpen] = useState(false);

  const loadFacilityMetrics = useCallback(async (facility, period) => {
    if (!facility) return;
    setDetailLoading(true);
    try {
      const [facilityMetrics, governanceMetrics] = await Promise.all([
        metricApi.list({ period, facilityId: facility.id, status: "APPROVED" }),
        metricApi.list({ period, category: "GOVERNANCE", status: "APPROVED" }),
      ]);
      const commonGovernance = (governanceMetrics || []).filter((metric) => (
        COMPANY_WIDE_GOVERNANCE_CODES.has(metric.indicatorCode)
        && metricFacilityId(metric) == null
      ));
      const facilityEthics = (governanceMetrics || []).filter((metric) => (
        metric.indicatorCode === "IND_G_ETHICS_EDU"
        && String(metricFacilityId(metric)) === String(facility.id)
      ));
      const merged = [...(facilityMetrics || []), ...commonGovernance, ...facilityEthics];
      const unique = Array.from(new Map(merged.map((metric) => [metric.id, metric])).values());
      setSelectedMetrics(unique);
    } catch (error) {
      setSelectedMetrics([]);
      Swal.fire("상세조회 실패", apiErrorMessage(error, "사업장 ESG 확정 실적을 불러오지 못했습니다."), "error");
    } finally {
      setDetailLoading(false);
    }
  }, []);

  const loadProfile = useCallback(async () => {
    setLoading(true);
    try {
      const [companyResponse, facilityResponse] = await Promise.all([companyApi.getCompany(), companyApi.getFacilities()]);
      const nextCompany = companyResponse?.data || null;
      const nextFacilities = (facilityResponse?.data || []).map((facility, index) => normalizeFacility(facility, index));
      setCompany(nextCompany);
      setFacilities(nextFacilities);
      const requested = nextFacilities.find((facility) => String(facility.id) === String(requestedFacilityId));
      const nextSelected = requested || nextFacilities[0] || null;
      setSelectedFacility(nextSelected);
      if (nextSelected) await loadFacilityMetrics(nextSelected, initialPeriod);
    } catch (error) {
      Swal.fire("조회 실패", apiErrorMessage(error, "기업·사업장 정보를 불러오지 못했습니다."), "error");
    } finally {
      setLoading(false);
    }
  }, [initialPeriod, loadFacilityMetrics, requestedFacilityId]);

  useEffect(() => { void Promise.resolve().then(loadProfile); }, [loadProfile]);

  const filteredFacilities = useMemo(() => facilities.filter((facility) => {
    const keyword = filters.search.trim().toLowerCase();
    return (!filters.type || facility.facilityType === filters.type)
      && (!keyword || `${facility.facilityName} ${facility.address}`.toLowerCase().includes(keyword));
  }), [facilities, filters.search, filters.type]);

  const headquarters = facilities.find((facility) => facility.facilityType === "HQ") || facilities[0];
  const groupedMetrics = useMemo(() => {
    const electricity = selectedMetrics.find((metric) => metric.indicatorCode === "IND_E_ELEC");
    const scope2 = selectedMetrics.find((metric) => metric.indicatorCode === "IND_E_SCOPE2");
    const shipmentMillion = Number(electricity?.shipmentAmountMillionKrw || 0);
    const shipmentEok = shipmentMillion / 100;
    const environmentDerived = shipmentMillion > 0 ? [
      { id: `shipment-${electricity.id}`, category: "ENVIRONMENT", indicatorCode: "SHIPMENT_AMOUNT", title: "출하액", value: shipmentMillion, unit: "백만원", derived: true },
      { id: `electricity-intensity-${electricity.id}`, category: "ENVIRONMENT", indicatorCode: "ELECTRICITY_INTENSITY", title: "전력 원단위", value: shipmentEok > 0 ? (Number(electricity.value || 0) / 1000) / shipmentEok : null, unit: "MWh/억원", derived: true },
      { id: `carbon-intensity-${electricity.id}`, category: "ENVIRONMENT", indicatorCode: "CARBON_INTENSITY", title: "탄소 원단위", value: scope2 && shipmentEok > 0 ? Number(scope2.value || 0) / shipmentEok : null, unit: "tCO₂eq/억원", derived: true },
    ] : [];
    const displayMetrics = [...selectedMetrics, ...environmentDerived];
    return Object.entries(categoryMeta).map(([category, meta]) => ({
      category,
      ...meta,
      metrics: displayMetrics.filter((metric) => metric.category === category),
    }));
  }, [selectedMetrics]);
  const latestApprovedAt = selectedMetrics.map((metric) => metric.updatedAt).filter(Boolean).sort().at(-1);
  const evidence = selectedMetrics.map((metric) => metric.evidence).find(Boolean);
  const selectedFacilityNotOperating = Boolean(
    selectedFacility?.operationStartDate
    && selectedPeriod < String(selectedFacility.operationStartDate).slice(0, 7),
  );

  const selectFacility = useCallback(async (facility) => {
    setSelectedFacility(facility);
    await loadFacilityMetrics(facility, selectedPeriod);
  }, [loadFacilityMetrics, selectedPeriod]);

  const changePeriod = async (year, month) => {
    const nextPeriod = periodOf(year, month);
    setSelectedPeriod(nextPeriod);
    if (selectedFacility) await loadFacilityMetrics(selectedFacility, nextPeriod);
  };

  const saveCompany = async (formData) => {
    try {
      const payload = Object.fromEntries(Object.entries(formData).filter(([, value]) => value !== ""));
      const response = await companyApi.updateCompany(payload);
      setCompany(response?.data || formData);
      setCompanyFormOpen(false);
      Swal.fire("저장 완료", "기업 기본정보가 저장되었습니다.", "success");
    } catch (error) {
      Swal.fire("저장 실패", apiErrorMessage(error), "error");
    }
  };

  const saveFacility = async (formData) => {
    try {
      if (editingFacility) await companyApi.updateFacility(editingFacility.id, formData);
      else await companyApi.createFacility(formData);
      setFacilityFormOpen(false);
      setEditingFacility(null);
      await loadProfile();
      Swal.fire("저장 완료", "사업장 기본정보가 저장되었습니다.", "success");
    } catch (error) {
      Swal.fire("저장 실패", apiErrorMessage(error), "error");
    }
  };

  const deleteFacility = async (facilityId) => {
    const result = await Swal.fire({ title: "사업장을 삭제할까요?", text: "연결된 ESG 데이터가 있으면 삭제할 수 없습니다.", icon: "warning", showCancelButton: true, confirmButtonText: "삭제", cancelButtonText: "취소" });
    if (!result.isConfirmed) return;
    try {
      await companyApi.deleteFacility(facilityId);
      setSelectedFacility(null);
      setSelectedMetrics([]);
      await loadProfile();
      Swal.fire("삭제 완료", "사업장을 삭제했습니다.", "success");
    } catch (error) {
      Swal.fire("삭제 실패", apiErrorMessage(error), "error");
    }
  };

  if (loading) return <div className="page-loading">기업·사업장 정보를 불러오는 중입니다.</div>;

  const title = isSystemAdmin ? "기업 관리" : "기업·사업장 정보";
  const breadcrumbRoot = isSystemAdmin ? "플랫폼 관리" : "기업 설정";
  const businessNumber = companyValue(company, "businessNumber", "business_number");
  const displayBusinessNumber = isExternal ? maskBusinessNumber(businessNumber) : businessNumber;
  const [selectedYear, selectedMonth] = selectedPeriod.split("-").map(Number);

  return (
    <div className="page-stack company-profile-page company-document-page">
      <PageHeader
        breadcrumbs={[breadcrumbRoot, title]}
        eyebrow="COMPANY & FACILITY"
        title={title}
        description={isSystemAdmin
          ? "기업 기본정보와 소속 사업장을 한 화면에서 관리하고 월별 최종 승인 ESG 실적을 확인합니다."
          : "기업 기본정보와 등록된 사업장, 월별 최종 승인 ESG 실적을 한 화면에서 확인합니다."}
        actions={canManage ? <div className="company-page-actions"><Button variant="outline" onClick={() => setCompanyFormOpen(true)}>기업 정보 수정</Button><Button onClick={() => { setEditingFacility(null); setFacilityFormOpen(true); }}>신규 사업장 등록</Button></div> : <span className="verified-role">조회 전용</span>}
      />

      <section className="company-document-card" aria-label="기업 기본정보 확인서">
        <header>
          <div><span>COMPANY MASTER PROFILE</span><h2>기업 기본정보 확인서</h2><p>ESG 보고·평가에 사용하는 기업 기준정보입니다.</p></div>
          <div className="company-document-status"><StatusBadge status={companyValue(company, "operationStatus", "operation_status", "ACTIVE") === "ACTIVE" ? "NORMAL" : "INACTIVE"} label={companyValue(company, "operationStatus", "operation_status", "ACTIVE") === "ACTIVE" ? "정상 운영" : "운영 중지"} /></div>
        </header>
        <div className="company-document-grid">
          <div><span>기업명</span><strong>{companyValue(company, "name", "name")}</strong></div>
          <div><span>사업자등록번호</span><strong>{displayBusinessNumber}</strong></div>
          <div><span>대표자명</span><strong>{companyValue(company, "representative", "representative")}</strong></div>
          <div><span>설립일</span><strong>{companyValue(company, "foundedOn", "founded_on")}</strong></div>
          <div><span>업태</span><strong>{companyValue(company, "businessType", "business_type", companyValue(company, "industry", "industry"))}</strong></div>
          <div><span>종목</span><strong>{companyValue(company, "businessItem", "business_item", companyValue(company, "industry", "industry"))}</strong></div>
          <div className="wide"><span>본점 주소</span><strong>{headquarters?.address || "-"}</strong></div>
          <div><span>기업 규모</span><strong>{companyValue(company, "scale", "scale")}</strong></div>
          <div><span>대표 전화</span><strong>{isExternal ? "비공개" : companyValue(company, "representativePhone", "representative_phone")}</strong></div>
          <div><span>대표 이메일</span><strong>{isExternal ? "비공개" : companyValue(company, "representativeEmail", "representative_email")}</strong></div>
        </div>
        <footer><span>문서 기준일</span><strong>{new Date().toLocaleDateString("ko-KR")}</strong><small>시스템 등록정보 기준</small></footer>
      </section>

      <Card title="사업장 조회" description="사업장명 또는 주소를 검색하고 사업장 유형으로 구분합니다.">
        <div className="facility-search-row">
          <label className="facility-search-input"><span>사업장명 또는 주소 검색</span><input value={filters.search} onChange={(event) => setFilters({ ...filters, search: event.target.value })} placeholder="사업장명 또는 주소" /></label>
          <label><span>사업장 유형</span><select value={filters.type} onChange={(event) => setFilters({ ...filters, type: event.target.value })}><option value="">전체</option><option value="HQ">본사</option><option value="FACTORY">공장</option></select></label>
          <Button variant="outline" onClick={() => setFilters(initialFilters)}>초기화</Button>
        </div>
      </Card>

      <div className="company-facility-workspace">
        <Card className="facility-list-card" title="사업장 목록" description="사업장을 선택하면 오른쪽에서 같은 화면 안에 월별 확정 실적이 표시됩니다.">
          <div className="facility-card-list">
            {filteredFacilities.map((facility) => (
              <article key={facility.id} className={selectedFacility?.id === facility.id ? "selected" : ""} onClick={() => selectFacility(facility)}>
                <div className="facility-card-icon">{facility.facilityType === "HQ" ? "HQ" : "F"}</div>
                <div className="facility-card-content">
                  <div><strong>{facility.facilityName}</strong><span className={`facility-type-chip ${facility.facilityType.toLowerCase()}`}>{facility.facilityType === "HQ" ? "본사" : "공장"}</span></div>
                  <p>{facility.address}</p>
                  <dl>
                    <div><dt>담당자</dt><dd>{isExternal ? "비공개" : facility.managerName}</dd></div>
                    <div><dt>운영 상태</dt><dd><StatusBadge status={facility.active ? "NORMAL" : "INACTIVE"} label={facility.active ? "운영 중" : "운영 중지"} /></dd></div>
                  </dl>
                </div>
                <Button size="sm" variant={selectedFacility?.id === facility.id ? "primary" : "outline"} onClick={(event) => { event.stopPropagation(); selectFacility(facility); }}>상세보기</Button>
              </article>
            ))}
            {filteredFacilities.length === 0 && <div className="empty-state"><strong>조건에 맞는 사업장이 없습니다.</strong></div>}
          </div>
        </Card>

        <Card className="facility-inline-detail-card" title="사업장 상세 미리보기" description="선택한 사업장의 최종 승인 ESG 실적입니다.">
          {selectedFacility ? (
            <div className="facility-inline-detail">
              <header>
                <div><span className="section-kicker">FACILITY DETAIL</span><h3>{selectedFacility.facilityName}</h3><p>{selectedFacility.address}</p></div>
                <div className="facility-period-selectors">
                  <label><span>기준연도</span><select value={selectedYear} onChange={(event) => changePeriod(Number(event.target.value), selectedMonth)}><option value={2026}>2026년</option><option value={2025}>2025년</option></select></label>
                  <label><span>기준월</span><select value={selectedMonth} onChange={(event) => changePeriod(selectedYear, Number(event.target.value))}>{Array.from({ length: 12 }, (_, index) => <option key={index + 1} value={index + 1}>{index + 1}월</option>)}</select></label>
                </div>
              </header>

              <div className="facility-inline-meta">
                <div><span>유형</span><strong>{selectedFacility.facilityType === "HQ" ? "본사" : "공장"}</strong></div>
                <div><span>계약전력</span><strong>{formatNumber(selectedFacility.contractPowerKw)} kW</strong></div>
                <div><span>운영 기간</span><strong>{selectedFacility.operationStartDate || "-"} ~ {selectedFacility.operationEndDate || "운영 중"}</strong></div>
                <div><span>최종 승인일</span><strong>{formatDateTime(latestApprovedAt)}</strong></div>
              </div>

              {detailLoading ? <div className="data-loading">확정 실적을 불러오는 중입니다.</div> : (
                <div className="facility-esg-groups">
                  {groupedMetrics.map((group) => (
                    <section key={group.category} className={`facility-esg-group ${group.className}`}>
                      <header><strong>{group.label}</strong>{group.category === "GOVERNANCE" && <small>이사회·사외이사 기업 공통 / 윤리교육 사업장 기준</small>}</header>
                      {group.metrics.length
                        ? group.metrics.map((metric) => <div key={metric.id}><span>{metric.title}</span><strong>{formatMetricValue(metric)}</strong></div>)
                        : <p>{selectedFacilityNotOperating ? "해당 기간은 사업장 운영 시작 이전입니다." : `선택한 기준월에 승인된 ${group.label} 실적이 없습니다.`}</p>}
                    </section>
                  ))}
                </div>
              )}

              <div className="facility-inline-map"><FacilityMap facilities={[selectedFacility]} selectedId={selectedFacility.id} /></div>
              <footer>
                {!isExternal && evidence && <Button variant="outline" onClick={() => fileApi.open(evidence)}>증빙 PDF 보기</Button>}
                {canManage && <><Button variant="outline" onClick={() => { setEditingFacility(selectedFacility); setFacilityFormOpen(true); }}>기본정보 수정</Button><Button variant="danger" onClick={() => deleteFacility(selectedFacility.id)}>사업장 삭제</Button></>}
              </footer>
            </div>
          ) : <div className="empty-state"><strong>사업장을 선택해 주세요.</strong></div>}
        </Card>
      </div>

      {companyFormOpen && <CompanyEditModal company={company} onClose={() => setCompanyFormOpen(false)} onSave={saveCompany} />}
      {facilityFormOpen && <FacilityFormModal facility={editingFacility} onClose={() => { setFacilityFormOpen(false); setEditingFacility(null); }} onSave={saveFacility} />}
    </div>
  );
}
