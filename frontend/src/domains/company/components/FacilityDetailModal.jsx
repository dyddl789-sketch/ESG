import { useMemo, useState } from "react";
import Button from "../../../shared/components/Button";
import DataTable from "../../../shared/components/DataTable";
import StatusBadge from "../../../shared/components/StatusBadge";
import Tabs from "../../../shared/components/Tabs";
import FacilityMap from "./FacilityMap";
import { normalizeFacility } from "../utils/facilityData";
import { formatDateTime, formatNumber } from "../../../shared/utils/esgFormat";

export default function FacilityDetailModal({ snapshot, period, onPeriodChange, onClose, onEdit, onDelete, canEdit, loading = false }) {
  const [activeTab, setActiveTab] = useState("overview");
  const facility = normalizeFacility(snapshot?.facility || {});
  const environment = snapshot?.environment;
  const social = snapshot?.social;
  const months = useMemo(() => {
    const records = new Map();
    (snapshot?.environmentHistory || []).forEach((row) => records.set(row.basePeriod, { ...(records.get(row.basePeriod) || {}), period: row.basePeriod, environment: row }));
    (snapshot?.socialHistory || []).forEach((row) => records.set(row.basePeriod, { ...(records.get(row.basePeriod) || {}), period: row.basePeriod, social: row }));
    return [...records.values()].sort((a, b) => a.period.localeCompare(b.period));
  }, [snapshot]);

  const [year, month] = String(period || "2026-06").split("-").map(Number);
  const tabs = [
    { value: "overview", label: "기본정보" },
    { value: "detail", label: "상세정보" },
    { value: "collection", label: "수집현황", count: months.length },
  ];

  const actualRows = [
    { id: "e1", domain: "환경", label: "전력 사용량", value: `${formatNumber(environment?.electricityUsageKwh)} kWh`, basis: "EMS 월간 실제값" },
    { id: "e2", domain: "환경", label: "생산량", value: `${formatNumber(environment?.productionTon)} ton`, basis: "생산 시스템" },
    { id: "e3", domain: "환경", label: "전력 원단위", value: `${formatNumber(environment?.intensityKwhPerTon, 2)} kWh/ton`, basis: "전력 사용량 ÷ 생산량" },
    { id: "e4", domain: "환경", label: "Scope 2", value: `${formatNumber(environment?.scope2Tco2eq, 2)} tCO₂eq`, basis: "전력 사용량 × 배출계수" },
    { id: "s1", domain: "사회", label: "산업재해율", value: `${formatNumber(social?.injuryRate, 2)}%`, basis: `재해자 ${social?.injuredEmployeeCount ?? 0}명 / 평균 ${social?.averageEmployees ?? 0}명` },
    { id: "s2", domain: "사회", label: "안전교육 이수율", value: `${formatNumber(social?.trainingCompletionRate, 1)}%`, basis: `${social?.trainingCompletedCount ?? 0}/${social?.trainingTargetCount ?? 0}명` },
    { id: "s3", domain: "사회", label: "위험요인 개선 조치율", value: `${formatNumber(social?.hazardActionRate, 1)}%`, basis: `${social?.hazardCompletedCount ?? 0}/${social?.hazardTotalCount ?? 0}건` },
    { id: "s4", domain: "사회", label: "퇴사율", value: `${formatNumber(social?.turnoverRate, 1)}%`, basis: `퇴사 ${social?.exitCount ?? 0}명 / 평균 ${social?.averageEmployees ?? 0}명` },
  ];

  const actualColumns = [
    { key: "domain", label: "영역", render: (value) => <span className={`category category-${value === "환경" ? "environment" : "social"}`}>{value}</span> },
    { key: "label", label: "지표" },
    { key: "value", label: "실제값", render: (value) => <strong>{value}</strong> },
    { key: "basis", label: "산정 근거" },
  ];

  const collectionRows = months.map((row) => ({
    id: row.period,
    period: row.period,
    environmentCollection: row.environment?.collectionStatus || "NOT_COLLECTED",
    socialCollection: row.social?.collectionStatus || "NOT_COLLECTED",
    reflection: row.environment?.reflectionStatus === "REFLECTED" && row.social?.reflectionStatus === "REFLECTED" ? "REFLECTED" : "NOT_REFLECTED",
    approval: row.environment?.approvalStatus === "APPROVED" && row.social?.approvalStatus === "APPROVED" ? "APPROVED" : row.environment?.approvalStatus || row.social?.approvalStatus || "DRAFT",
    collectedAt: row.environment?.collectedAt || row.social?.collectedAt,
  }));

  const collectionColumns = [
    { key: "period", label: "기준월" },
    { key: "environmentCollection", label: "환경 수집", render: (value) => <StatusBadge status={value} /> },
    { key: "socialCollection", label: "사회 수집", render: (value) => <StatusBadge status={value} /> },
    { key: "reflection", label: "ESG 반영", render: (value) => <StatusBadge status={value} /> },
    { key: "approval", label: "승인", render: (value) => <StatusBadge status={value} /> },
    { key: "collectedAt", label: "최근 수집일", render: (value) => formatDateTime(value) },
  ];

  return (
    <div className="facility-detail-overlay" onClick={onClose}>
      <section className="facility-detail-modal simplified" onClick={(event) => event.stopPropagation()}>
        <header className="facility-detail-header">
          <div><span className="section-kicker">FACILITY DETAIL</span><h2>{facility.facilityName} 상세보기</h2><p>{facility.address}</p></div>
          <div className="facility-detail-head-actions"><StatusBadge status={environment?.approvalStatus || social?.approvalStatus || "DRAFT"} /><button type="button" className="modal-close-button" onClick={onClose}>×</button></div>
        </header>

        <div className="facility-detail-tabs"><Tabs items={tabs} value={activeTab} onChange={setActiveTab} /></div>
        <div className="facility-detail-body">
          <div className="facility-period-toolbar">
            <div><span>상세 데이터 기준월</span><strong>{period}</strong></div>
            <select value={year} onChange={(event) => onPeriodChange(`${event.target.value}-${String(month).padStart(2, "0")}`)}><option value={2026}>2026년</option><option value={2025}>2025년</option></select>
            <select value={month} onChange={(event) => onPeriodChange(`${year}-${String(event.target.value).padStart(2, "0")}`)}>{Array.from({ length: 12 }, (_, index) => <option key={index + 1} value={index + 1}>{index + 1}월</option>)}</select>
          </div>
          {loading && <div className="facility-detail-loading">선택한 기준월의 실제 데이터를 불러오는 중입니다.</div>}

          {activeTab === "overview" && (
            <div className="facility-overview-grid compact-map-grid">
              <div className="facility-overview-info">
                <div className="detail-grid three">
                  <div><span>사업장 유형</span><strong>{facility.facilityType === "HQ" ? "본사" : "공장"}</strong></div>
                  <div><span>계약전력</span><strong>{formatNumber(facility.contractPowerKw)} kW</strong></div>
                  <div><span>등록일</span><strong>{formatDateTime(facility.createdAt)}</strong></div>
                  <div><span>월 마감 상태</span><StatusBadge status={environment?.collectionStatus || social?.collectionStatus || "NOT_COLLECTED"} /></div>
                  <div><span>ESG 반영 상태</span><StatusBadge status={environment?.reflectionStatus === "REFLECTED" && social?.reflectionStatus === "REFLECTED" ? "REFLECTED" : "NOT_REFLECTED"} /></div>
                  <div><span>승인 상태</span><StatusBadge status={environment?.approvalStatus || social?.approvalStatus || "DRAFT"} /></div>
                </div>
                <div className="facility-address-box"><span>사업장 주소</span><strong>{facility.address}</strong><small>위도 {facility.latitude} · 경도 {facility.longitude}</small></div>
              </div>
              <FacilityMap facilities={[facility]} selectedId={facility.id} />
            </div>
          )}

          {activeTab === "detail" && (
            <div className="facility-tab-stack">
              <div className="facility-tab-summary">
                <div><span>기준월</span><strong>{period}</strong></div>
                <div><span>환경 실제값</span><strong>4개</strong></div>
                <div><span>사회 실제값</span><strong>4개</strong></div>
                <div><span>표시 기준</span><strong>성과 판정 없이 실제값</strong></div>
              </div>
              <DataTable rows={actualRows} columns={actualColumns} emptyText="선택한 월의 실제 데이터가 없습니다." />
            </div>
          )}

          {activeTab === "collection" && <DataTable rows={collectionRows} columns={collectionColumns} emptyText="월별 수집현황이 없습니다." />}
        </div>

        <footer className="facility-detail-footer">
          {canEdit && <><Button variant="danger" onClick={() => onDelete(facility.id)}>사업장 삭제</Button><Button variant="outline" onClick={() => onEdit(facility)}>기본정보 수정</Button></>}
          <Button onClick={onClose}>닫기</Button>
        </footer>
      </section>
    </div>
  );
}
