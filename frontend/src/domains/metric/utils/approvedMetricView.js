export const metricValueMap = (metrics = []) => Object.fromEntries(
  metrics.map((metric) => [metric.indicatorCode, metric]),
);

export const metricNumber = (metric) => {
  const value = metric?.value ?? metric?.numericalValue;
  return value === null || value === undefined || value === "" ? null : Number(value);
};

export const latestApprovalDate = (metrics = []) => metrics
  .map((metric) => metric.updatedAt)
  .filter(Boolean)
  .sort()
  .at(-1) || null;

export const firstEvidence = (metrics = []) => metrics.find((metric) => metric.evidence)?.evidence || null;

export const facilityNameOf = (facility) => facility?.facilityName || facility?.facility_name || facility?.name || "-";
export const facilityTypeOf = (facility) => facility?.facilityType || facility?.facility_type || "FACTORY";
