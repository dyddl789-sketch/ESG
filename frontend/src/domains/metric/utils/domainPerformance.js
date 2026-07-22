export const valueOf = (metric) => {
  const raw = metric?.value ?? metric?.numericalValue;
  return raw === null || raw === undefined || raw === "" ? null : Number(raw);
};

export const periodKey = (period) => Number(String(period || "").replace("-", "")) || 0;

export const previousPeriod = (metrics, currentPeriod) => [...new Set(metrics.map((metric) => metric.period))]
  .filter((period) => periodKey(period) < periodKey(currentPeriod))
  .sort((left, right) => periodKey(right) - periodKey(left))[0] || null;

export const metricsAt = (metrics, period) => metrics.filter((metric) => metric.period === period);

export const metricMap = (metrics) => Object.fromEntries(metrics.map((metric) => [metric.indicatorCode, metric]));

export const average = (values) => {
  const valid = values.filter((value) => value !== null && Number.isFinite(Number(value))).map(Number);
  return valid.length ? valid.reduce((sum, value) => sum + value, 0) / valid.length : null;
};

export const sum = (values) => {
  const valid = values.filter((value) => value !== null && Number.isFinite(Number(value))).map(Number);
  return valid.length ? valid.reduce((total, value) => total + value, 0) : null;
};

export const comparison = (current, previous, lowerIsBetter = false) => {
  if (current === null || previous === null || current === undefined || previous === undefined) return { label: "직전 승인월 비교 없음", tone: "neutral", delta: null };
  const delta = Number(current) - Number(previous);
  if (Math.abs(delta) < 0.000001) return { label: "변동 없음", tone: "neutral", delta: 0 };
  const improved = lowerIsBetter ? delta < 0 : delta > 0;
  return { label: `${improved ? "개선" : "악화"} ${Math.abs(delta).toLocaleString("ko-KR", { maximumFractionDigits: 2 })}`, tone: improved ? "improved" : "worsened", delta };
};

export const evidenceCount = (metrics) => new Set(
  metrics
    .filter((metric) => Boolean(metric?.evidence) && Number(metric?.evidenceFileSize) > 0)
    .map((metric) => metric.evidence),
).size;
