import React from "react";
import Button from "../../../shared/components/Button";
import { COLORS, FONT_SIZE, RADIUS } from "./companyStyles";
import { AdminBadge } from "./CompanyUI";

const overlayStyle = {
  position: "fixed",
  top: 0,
  left: 0,
  width: "100%",
  height: "100%",
  backgroundColor: "rgba(0, 0, 0, 0.4)",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  zIndex: 1000,
  backdropFilter: "blur(2px)",
};

const contentStyle = {
  backgroundColor: COLORS.white,
  width: "600px",
  borderRadius: RADIUS.lg,
  boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
  overflow: "hidden",
  display: "flex",
  flexDirection: "column",
};

const headerStyle = {
  padding: "20px 24px",
  borderBottom: `1px solid ${COLORS.border}`,
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  backgroundColor: COLORS.white,
};

const titleStyle = {
  margin: 0,
  fontSize: FONT_SIZE.xl,
  fontWeight: "700",
  color: COLORS.textPrimary,
};

const closeBtnStyle = {
  background: "none",
  border: "none",
  fontSize: "24px",
  cursor: "pointer",
  color: COLORS.textSecondary,
  lineHeight: 1,
  padding: "4px",
  borderRadius: RADIUS.sm,
  transition: "background-color 0.2s",
};

const footerStyle = {
  padding: "16px 24px",
  borderTop: `1px solid ${COLORS.border}`,
  display: "flex",
  justifyContent: "flex-end",
  gap: "12px",
  backgroundColor: COLORS.bgHover,
};

const detailGridStyle = {
  padding: "24px",
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: "24px 32px",
};

const detailItemStyle = {
  display: "flex",
  flexDirection: "column",
  gap: "6px",
};

const labelStyle = {
  fontSize: FONT_SIZE.xs,
  fontWeight: "600",
  color: COLORS.textSecondary,
  textTransform: "uppercase",
  letterSpacing: "0.025em",
};

const valueStyle = {
  fontSize: FONT_SIZE.md,
  fontWeight: "500",
  color: COLORS.textPrimary,
};

export default function FacilityDetailModal({ facility, onClose, onEdit, onDelete, canEdit }) {
  if (!facility) return null;

  const details = [
    { label: "사업장명", value: facility.facility_name, fullWidth: true },
    { label: "사업장 코드/ID", value: facility.id },
    { label: "사업장 유형", value: <AdminBadge type="info">{facility.facility_type}</AdminBadge> },
    { label: "주소", value: facility.address, fullWidth: true },
    { label: "한전 계약전력", value: `${facility.contract_power_kw} kW` },
    { label: "등록일", value: new Date(facility.created_at).toLocaleDateString() },
  ];

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div style={contentStyle} onClick={(e) => e.stopPropagation()}>
        <div style={headerStyle}>
          <h2 style={titleStyle}>사업장 상세 정보</h2>
          <button 
            style={closeBtnStyle} 
            onClick={onClose}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = COLORS.bgHover}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
          >
            &times;
          </button>
        </div>

        <div style={detailGridStyle}>
          {details.map((item, index) => (
            <div 
              key={index} 
              style={{ 
                ...detailItemStyle, 
                gridColumn: item.fullWidth ? "span 2" : "auto" 
              }}
            >
              <span style={labelStyle}>{item.label}</span>
              <div style={valueStyle}>{item.value}</div>
            </div>
          ))}
        </div>

        <div style={footerStyle}>
          {canEdit && (
            <>
              <Button variant="danger" onClick={() => onDelete(facility.id)} style={{ marginRight: "auto" }}>
                삭제
              </Button>
              <Button variant="secondary" onClick={() => onEdit(facility)}>
                정보 수정
              </Button>
            </>
          )}
          <Button onClick={onClose} style={{ backgroundColor: COLORS.primary }}>
            닫기
          </Button>
        </div>
      </div>
    </div>
  );
}
