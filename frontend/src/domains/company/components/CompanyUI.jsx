import React from "react";
import { COLORS, RADIUS, FONT_SIZE } from "./companyStyles";

/**
 * AdminBadge: 상태 표시를 위한 둥근 배경색 배지
 */
export const AdminBadge = ({ children, type = "default", style = {} }) => {
  const getColors = () => {
    switch (type) {
      case "success":
        return { bg: "#ecfdf5", text: "#065f46" };
      case "danger":
        return { bg: "#fef2f2", text: "#991b1b" };
      case "warning":
        return { bg: "#fffbeb", text: "#92400e" };
      case "info":
        return { bg: "#eff6ff", text: "#1e40af" };
      default:
        return { bg: "#f3f4f6", text: "#374151" };
    }
  };

  const colors = getColors();

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "2px 10px",
        borderRadius: RADIUS.full,
        backgroundColor: colors.bg,
        color: colors.text,
        fontSize: FONT_SIZE.xs,
        fontWeight: "600",
        lineHeight: "1.5",
        ...style,
      }}
    >
      {children}
    </span>
  );
};

export const CustomInput = ({ label, required, error, style = {}, ...props }) => {
  const [isFocused, setIsFocused] = React.useState(false);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "6px", width: "100%" }}>
      {label && (
        <label style={{ fontSize: FONT_SIZE.sm, fontWeight: "600", color: COLORS.textPrimary }}>
          {label} {required && <span style={{ color: COLORS.danger }}>*</span>}
        </label>
      )}
      <input
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        style={{
          padding: "10px 14px",
          borderRadius: RADIUS.md,
          border: `1px solid ${isFocused ? COLORS.borderFocus : COLORS.border}`,
          boxShadow: isFocused ? COLORS.focusShadow : "none",
          fontSize: FONT_SIZE.md,
          color: COLORS.textPrimary,
          outline: "none",
          transition: "all 0.2s ease",
          backgroundColor: COLORS.white,
          ...style,
        }}
        {...props}
      />
      {error && <span style={{ fontSize: FONT_SIZE.xs, color: COLORS.danger }}>{error}</span>}
    </div>
  );
};

export const CustomSelect = ({ label, required, options = [], style = {}, ...props }) => {
  const [isFocused, setIsFocused] = React.useState(false);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "6px", width: "100%" }}>
      {label && (
        <label style={{ fontSize: FONT_SIZE.sm, fontWeight: "600", color: COLORS.textPrimary }}>
          {label} {required && <span style={{ color: COLORS.danger }}>*</span>}
        </label>
      )}
      <select
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        style={{
          padding: "10px 14px",
          borderRadius: RADIUS.md,
          border: `1px solid ${isFocused ? COLORS.borderFocus : COLORS.border}`,
          boxShadow: isFocused ? COLORS.focusShadow : "none",
          fontSize: FONT_SIZE.md,
          color: COLORS.textPrimary,
          outline: "none",
          transition: "all 0.2s ease",
          backgroundColor: COLORS.white,
          appearance: "none",
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236f767e'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
          backgroundRepeat: "no-repeat",
          backgroundPosition: "right 12px center",
          backgroundSize: "16px",
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

export const InfoBox = ({ title, children, style = {} }) => {
  return (
    <div
      style={{
        padding: "24px 32px",
        paddingTop: "8px",
        borderRadius: RADIUS.lg,
        backgroundColor: COLORS.bgHover,
        borderLeft: `6px solid ${COLORS.primary}`,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        ...style,
      }}
    >
      {title && (
        <h4 style={{ 
          fontSize: "20px", 
          fontWeight: "800", 
          color: COLORS.primary, 
          marginBottom: "12px",
          lineHeight: "1.2"
        }}>
          {title}
        </h4>
      )}
      <div style={{ 
        fontSize: FONT_SIZE.lg, 
        color: COLORS.textSecondary, 
        lineHeight: "1.6",
        fontWeight: "500"
      }}>
        {children}
      </div>
    </div>
  );
};
