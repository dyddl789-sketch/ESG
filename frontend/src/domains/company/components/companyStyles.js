/**
 * Company Domain 전용 스타일 상수
 * B2B 관리자 대시보드 스타일 가이드라인 적용
 */

export const COLORS = {
  primary: "#2a7d55",
  primaryLight: "rgba(42, 125, 85, 0.1)",
  primaryHover: "#236a48",
  bgHover: "#f9fbf9",
  border: "#e1e4e8",
  borderFocus: "#2a7d55",
  textPrimary: "#1a1d1f",
  textSecondary: "#6f767e",
  textPlaceholder: "#9a9fa5",
  danger: "#ef4444",
  success: "#10b981",
  warning: "#f59e0b",
  info: "#3b82f6",
  white: "#ffffff",
  shadow: "0 2px 4px rgba(0, 0, 0, 0.05)",
  focusShadow: "0 0 0 3px rgba(42, 125, 85, 0.12)",
};

export const SPACING = {
  xs: "4px",
  sm: "8px",
  md: "16px",
  lg: "24px",
  xl: "32px",
};

export const RADIUS = {
  sm: "4px",
  md: "8px",
  lg: "12px",
  full: "9999px",
};

export const FONT_SIZE = {
  xs: "12px",
  sm: "13px",
  md: "14px",
  lg: "16px",
  xl: "18px",
};

export const COMMON_STYLES = {
  card: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.md,
    border: `1px solid ${COLORS.border}`,
    boxShadow: COLORS.shadow,
    overflow: "hidden",
  },
  tableRow: {
    transition: "background-color 0.2s ease",
    cursor: "pointer",
    "&:hover": {
      backgroundColor: COLORS.bgHover,
    },
  },
  input: {
    width: "100%",
    padding: "10px 14px",
    borderRadius: RADIUS.md,
    border: `1px solid ${COLORS.border}`,
    fontSize: FONT_SIZE.md,
    transition: "all 0.2s ease",
    outline: "none",
  },
};
