export function formatNumber(value, maximumFractionDigits = 1) {
  return Number(value ?? 0).toLocaleString("ko-KR", { maximumFractionDigits });
}

export function formatDateTime(value) {
  return value || "-";
}

export function categoryLabel(category) {
  return ({ ENVIRONMENT: "환경", SOCIAL: "사회", GOVERNANCE: "거버넌스" })[category] ?? category;
}
