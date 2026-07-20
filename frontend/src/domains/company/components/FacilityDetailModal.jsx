import { useMemo, useState } from "react";
import Button from "../../../shared/components/Button";
import DataTable from "../../../shared/components/DataTable";
import StatusBadge from "../../../shared/components/StatusBadge";
import Tabs from "../../../shared/components/Tabs";
import FacilityMap from "./FacilityMap";
import { normalizeFacility } from "../utils/facilityData";
import { formatDateTime, formatNumber } from "../../../shared/utils/esgFormat";
import { fileApi } from "../../../shared/api/fileApi";

const categoryName = { ENVIRONMENT: "환경", SOCIAL: "사회", GOVERNANCE: "거버넌스" };

export default function FacilityDetailModal({ facility: facilitySource, metrics = [], period, onPeriodChange, onClose, onEdit, onDelete, canEdit, loading = false }) {
  const [activeTab, setActiveTab] = useState("overview");
  const facility = normalizeFacility(facilitySource || {});
  const [year, month] = String(period || "2026-05").split("-").map(Number);
  const approvedRows = useMemo(() => {
    const rows = metrics.map((metric) => ({
      ...metric,
      id: metric.id,
      categoryName: categoryName[metric.category] || metric.category,
      displayValue: metric.value === null || metric.value === undefined ? metric.textValue || "-" : `${formatNumber(metric.value, metric.unit === "%" ? 2 : metric.indicatorCode === "IND_E_SCOPE2" ? 2 : 0)} ${metric.unit || ""}`.trim(),
    }));
    const electricity = metrics.find((metric) => metric.indicatorCode === "IND_E_ELEC");
    const scope2 = metrics.find((metric) => metric.indicatorCode === "IND_E_SCOPE2");
    const shipmentMillion = Number(electricity?.shipmentAmountMillionKrw || 0);
    const shipmentEok = shipmentMillion / 100;
    if (shipmentMillion > 0) {
      rows.push({ id: `shipment-${electricity.id}`, category: "ENVIRONMENT", categoryName: "환경", title: "출하액", displayValue: `${formatNumber(shipmentMillion, 2)} 백만원`, updatedAt: electricity.updatedAt, evidence: electricity.evidence });
      rows.push({ id: `electricity-intensity-${electricity.id}`, category: "ENVIRONMENT", categoryName: "환경", title: "전력 원단위", displayValue: `${formatNumber((Number(electricity.value || 0) / 1000) / shipmentEok, 2)} MWh/억원`, updatedAt: electricity.updatedAt, evidence: electricity.evidence });
      if (scope2) rows.push({ id: `carbon-intensity-${electricity.id}`, category: "ENVIRONMENT", categoryName: "환경", title: "탄소 원단위", displayValue: `${formatNumber(Number(scope2.value || 0) / shipmentEok, 2)} tCO₂eq/억원`, updatedAt: scope2.updatedAt, evidence: scope2.evidence });
    }
    return rows;
  }, [metrics]);
  const environmentCount = approvedRows.filter((row) => row.category === "ENVIRONMENT").length;
  const socialCount = approvedRows.filter((row) => row.category === "SOCIAL").length;
  const governanceCount = approvedRows.filter((row) => row.category === "GOVERNANCE").length;
  const latestApprovedAt = approvedRows.map((row) => row.updatedAt).filter(Boolean).sort().at(-1);

  const tabs = [
    { value: "overview", label: "기본정보" },
    { value: "esg", label: "월별 ESG 확정 실적", count: approvedRows.length },
  ];
  const columns = [
    { key: "categoryName", label: "영역", render: (value, row) => <span className={`category category-${row.category?.toLowerCase()}`}>{value}</span> },
    { key: "title", label: "지표" },
    { key: "displayValue", label: "확정값", render: (value) => <strong>{value}</strong> },
    { key: "updatedAt", label: "최종 승인일", render: (value) => formatDateTime(value) },
    { key: "evidence", label: "증빙 PDF", render: (value) => value ? <button type="button" className="text-link" onClick={() => fileApi.open(value)}>보기</button> : "-" },
  ];

  return (
    <div className="facility-detail-overlay" onClick={onClose}>
      <section className="facility-detail-modal simplified" onClick={(event) => event.stopPropagation()}>
        <header className="facility-detail-header">
          <div><span className="section-kicker">FACILITY DETAIL</span><h2>{facility.facilityName} 상세보기</h2><p>{facility.address}</p></div>
          <div className="facility-detail-head-actions"><StatusBadge status="APPROVED" label="확정 실적 조회" /><button type="button" className="modal-close-button" onClick={onClose}>×</button></div>
        </header>

        <div className="facility-detail-tabs"><Tabs items={tabs} value={activeTab} onChange={setActiveTab} /></div>
        <div className="facility-detail-body">
          <div className="facility-period-toolbar">
            <div><span>ESG 확정 실적 기준월</span><strong>{period}</strong></div>
            <select value={year} onChange={(event) => onPeriodChange(`${event.target.value}-${String(month).padStart(2, "0")}`)}><option value={2026}>2026년</option><option value={2025}>2025년</option></select>
            <select value={month} onChange={(event) => onPeriodChange(`${year}-${String(event.target.value).padStart(2, "0")}`)}>{Array.from({ length: 12 }, (_, index) => <option key={index + 1} value={index + 1}>{index + 1}월</option>)}</select>
          </div>
          {loading && <div className="facility-detail-loading">선택한 기준월의 최종 승인 ESG 실적을 불러오는 중입니다.</div>}

          {activeTab === "overview" && (
            <div className="facility-overview-grid compact-map-grid">
              <div className="facility-overview-info">
                <div className="detail-grid three">
                  <div><span>사업장 유형</span><strong>{facility.facilityType === "HQ" ? "본사" : "공장"}</strong></div>
                  <div><span>계약전력</span><strong>{formatNumber(facility.contractPowerKw)} kW</strong></div>
                  <div><span>등록일</span><strong>{formatDateTime(facility.createdAt)}</strong></div>
                  <div><span>환경 확정 지표</span><strong>{environmentCount}개</strong></div>
                  <div><span>사회 확정 지표</span><strong>{socialCount}개</strong></div>
                  <div><span>거버넌스 확정 지표</span><strong>{governanceCount}개</strong></div>
                </div>
                <div className="facility-address-box"><span>사업장 주소</span><strong>{facility.address}</strong><small>최근 최종 승인일 {formatDateTime(latestApprovedAt)}</small></div>
              </div>
              <FacilityMap facilities={[facility]} selectedId={facility.id} />
            </div>
          )}

          {activeTab === "esg" && (
            <div className="facility-tab-stack">
              <div className="facility-tab-summary">
                <div><span>기준월</span><strong>{period}</strong></div>
                <div><span>환경</span><strong>{environmentCount}개</strong></div>
                <div><span>사회</span><strong>{socialCount}개</strong></div>
                <div><span>거버넌스</span><strong>{governanceCount}개</strong></div>
              </div>
              <DataTable rows={approvedRows} columns={columns} emptyText="선택한 월에 최종 승인된 ESG 실적이 없습니다." />
            </div>
          )}
        </div>

        <footer className="facility-detail-footer">
          {canEdit && <><Button variant="danger" onClick={() => onDelete(facility.id)}>사업장 삭제</Button><Button variant="outline" onClick={() => onEdit(facility)}>기본정보 수정</Button></>}
          <Button onClick={onClose}>닫기</Button>
        </footer>
      </section>
    </div>
  );
}
