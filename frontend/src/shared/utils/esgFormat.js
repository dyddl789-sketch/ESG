export const formatNumber = (value, digits = 0) => {
  if (value === null || value === undefined || value === "") return "-";
  return Number(value).toLocaleString("ko-KR", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
};

export const formatDateTime = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString("ko-KR", { hour12: false });
};

export const periodOf = (year, month) => `${year}-${String(month).padStart(2, "0")}`;

export const categoryLabel = (category) => ({
  ENVIRONMENT: "환경",
  SOCIAL: "사회",
  GOVERNANCE: "거버넌스",
}[category] || category || "-");

export const apiErrorMessage = (error, fallback = "처리 중 오류가 발생했습니다.") =>
  error?.response?.data?.message || error?.response?.data?.error?.message || error?.message || fallback;
