import React from "react";
import { COLORS, RADIUS, FONT_SIZE } from "../../company/components/companyStyles";

/**
 * AdminBadge: 더 작고 세련된 플랫 배지
 */
export const AdminBadge = ({ children, type = "default", style = {} }) => {
  const getColors = () => {
    switch (type) {
      case "success":
        return { bg: "#f0fdf4", text: "#166534", border: "#dcfce7" };
      case "danger":
        return { bg: "#fef2f2", text: "#991b1b", border: "#fee2e2" };
      case "warning":
        return { bg: "#fffbeb", text: "#92400e", border: "#fef3c7" };
      case "info":
        return { bg: "#eff6ff", text: "#1e40af", border: "#dbeafe" };
      default:
        return { bg: "#f8fafc", text: "#475569", border: "#f1f5f9" };
    }
  };

  const colors = getColors();

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "2px 8px",
        borderRadius: "4px",
        backgroundColor: colors.bg,
        color: colors.text,
        border: `1px solid ${colors.border}`,
        fontSize: "11px",
        fontWeight: "600",
        whiteSpace: "nowrap",
        ...style,
      }}
    >
      {children}
    </span>
  );
};

/**
 * MinimalSelect: 테두리를 최소화하고 세련된 스타일의 필터 셀렉트
 */
export const MinimalSelect = ({ label, options = [], style = {}, ...props }) => {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
      {label && (
        <label style={{ fontSize: "13px", fontWeight: "600", color: "#64748b", whiteSpace: "nowrap" }}>
          {label}
        </label>
      )}
      <select
        style={{
          padding: "6px 32px 6px 12px",
          borderRadius: "6px",
          border: "1px solid #e2e8f0",
          backgroundColor: "#ffffff",
          fontSize: "13px",
          color: "#1e293b",
          outline: "none",
          cursor: "pointer",
          appearance: "none",
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2394a3b8'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
          backgroundRepeat: "no-repeat",
          backgroundPosition: "right 8px center",
          backgroundSize: "14px",
          transition: "all 0.2s",
          ...style,
        }}
        {...props}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
};

/**
 * MiniStat: 박스 스타일이 적용된 세련된 요약 수치
 */
export const MiniStat = ({ label, value, color = "#1e293b", style = {} }) => {
  return (
    <div style={{ 
      display: "flex", 
      flexDirection: "column",
      gap: "4px",
      padding: "12px 20px",
      backgroundColor: "#ffffff",
      borderRadius: "8px",
      border: "1px solid #f1f5f9",
      boxShadow: "0 1px 2px rgba(0,0,0,0.03)",
      minWidth: "120px",
      ...style
    }}>
      <span style={{ fontSize: "12px", color: "#64748b", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.025em" }}>
        {label}
      </span>
      <span style={{ fontSize: "20px", fontWeight: "800", color: color }}>
        {value}
      </span>
    </div>
  );
};
