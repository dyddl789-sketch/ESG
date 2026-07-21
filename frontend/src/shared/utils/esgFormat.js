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

export const formatFileSize = (value) => {
  const size = Number(value);
  if (!Number.isFinite(size) || size < 0) return "-";
  if (size < 1024) return `${size.toLocaleString("ko-KR")} B`;
  const units = ["KB", "MB", "GB"];
  let resolved = size / 1024;
  let unitIndex = 0;
  while (resolved >= 1024 && unitIndex < units.length - 1) {
    resolved /= 1024;
    unitIndex += 1;
  }
  return `${resolved.toLocaleString("ko-KR", {
    minimumFractionDigits: resolved < 10 ? 1 : 0,
    maximumFractionDigits: resolved < 10 ? 1 : 0,
  })} ${units[unitIndex]}`;
};
