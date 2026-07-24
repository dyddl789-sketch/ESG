const valueOf = (object, ...keys) => {
  for (const key of keys) {
    const value = object?.[key];
    if (value !== undefined && value !== null && value !== "") return value;
  }
  return null;
};

export const facilityNameOf = (facility) => (
  valueOf(facility, "facilityName", "facility_name", "name") || "선택한 사업장"
);

const facilityIdOf = (facility) => valueOf(facility, "id", "facilityId", "facility_id");

const normalizeName = (value) => String(value || "")
  .toLowerCase()
  .replace(/주식회사|㈜|\(주\)/g, "")
  .replace(/사업장|공장/g, "facility")
  .replace(/본점/g, "본사")
  .replace(/[^0-9a-z가-힣]/g, "");

export const findFacilityFromAnalysis = (facilities, analysis) => {
  const byId = facilities.find((facility) => (
    String(facilityIdOf(facility)) === String(analysis?.facilityId ?? analysis?.facility_id ?? "")
  ));
  if (byId) return byId;

  const targetName = normalizeName(analysis?.facilityName ?? analysis?.facility_name);
  if (!targetName) return null;

  const matched = facilities.filter((facility) => normalizeName(facilityNameOf(facility)) === targetName);
  return matched.length === 1 ? matched[0] : null;
};

const toMonthIndex = (year, month) => Number(year) * 12 + Number(month) - 1;

const periodRange = (reportingYear, periodType, periodValue) => {
  const year = Number(reportingYear);
  const value = Number(periodValue);
  const type = String(periodType || "MONTHLY").toUpperCase();

  if (!Number.isInteger(year) || year < 1900) return null;

  if (type === "YEARLY") {
    return { start: toMonthIndex(year, 1), end: toMonthIndex(year, 12) };
  }
  if (type === "QUARTERLY") {
    if (!Number.isInteger(value) || value < 1 || value > 4) return null;
    const startMonth = (value - 1) * 3 + 1;
    return { start: toMonthIndex(year, startMonth), end: toMonthIndex(year, startMonth + 2) };
  }
  if (!Number.isInteger(value) || value < 1 || value > 12) return null;
  const month = toMonthIndex(year, value);
  return { start: month, end: month };
};

const parseDateMonth = (value) => {
  const matched = String(value || "").match(/^(\d{4})-(\d{1,2})/);
  if (!matched) return null;
  return {
    year: Number(matched[1]),
    month: Number(matched[2]),
    index: toMonthIndex(Number(matched[1]), Number(matched[2])),
  };
};

const formatMonth = (dateMonth) => `${dateMonth.year}년 ${dateMonth.month}월`;

export const facilityOperationPeriodError = ({ facility, reportingYear, periodType, periodValue }) => {
  if (!facility) return null;

  const range = periodRange(reportingYear, periodType, periodValue);
  if (!range) return "보고 연도와 기간을 확인해 주세요.";

  const startMonth = parseDateMonth(valueOf(facility, "operationStartDate", "operation_start_date"));
  const endMonth = parseDateMonth(valueOf(facility, "operationEndDate", "operation_end_date"));
  const name = facilityNameOf(facility);

  if (startMonth && range.end < startMonth.index) {
    return `${name}의 운영 시작월은 ${formatMonth(startMonth)}입니다. 운영 시작월 이전 ESG 데이터는 등록할 수 없습니다.`;
  }
  if (endMonth && range.start > endMonth.index) {
    return `${name}의 운영 종료월은 ${formatMonth(endMonth)}입니다. 운영 종료월 이후 ESG 데이터는 등록할 수 없습니다.`;
  }
  return null;
};
