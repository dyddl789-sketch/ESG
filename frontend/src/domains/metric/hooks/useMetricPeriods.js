import { useEffect, useMemo, useState } from "react";
import { metricApi } from "../api/metricApi";

const PERIOD_PATTERN = /^(\d{4})-(0[1-9]|1[0-2])$/;

const normalizePeriods = (source) => {
  if (!Array.isArray(source)) return [];
  return [...new Set(source
    .map((value) => String(value || "").trim())
    .filter((value) => PERIOD_PATTERN.test(value)))]
    .sort((left, right) => right.localeCompare(left));
};

export const resolvePeriodSelection = (selection, years, monthsByYear) => {
  const currentYear = Number(selection?.year);
  const currentMonth = Number(selection?.month);
  if (!years.length) {
    return { year: currentYear, month: currentMonth };
  }

  const year = years.includes(currentYear) ? currentYear : years[0];
  const months = monthsByYear[year] || [];
  const month = months.includes(currentMonth)
    ? currentMonth
    : (months.at(-1) || currentMonth || 1);

  return { year, month };
};

export function useMetricPeriods({
  approvedOnly = false,
  category = "",
  status = "",
  facilityId = "",
  benchmarkReady = false,
} = {}) {
  const [periods, setPeriods] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const loadPeriods = async () => {
      setLoading(true);
      try {
        const response = await metricApi.periods({
          approvedOnly,
          benchmarkReady,
          ...(category ? { category } : {}),
          ...(status && status !== "ALL" ? { status } : {}),
          ...(facilityId ? { facilityId } : {}),
        });
        if (active) setPeriods(normalizePeriods(response));
      } catch (error) {
        console.error("ESG 데이터 기간 조회 실패", error);
        if (active) setPeriods([]);
      } finally {
        if (active) setLoading(false);
      }
    };

    void loadPeriods();
    return () => {
      active = false;
    };
  }, [approvedOnly, benchmarkReady, category, facilityId, status]);

  const periodInfo = useMemo(() => {
    const monthsByYear = {};
    periods.forEach((period) => {
      const [yearText, monthText] = period.split("-");
      const year = Number(yearText);
      const month = Number(monthText);
      if (!monthsByYear[year]) monthsByYear[year] = [];
      if (!monthsByYear[year].includes(month)) monthsByYear[year].push(month);
    });

    Object.values(monthsByYear).forEach((months) => months.sort((a, b) => a - b));
    const years = Object.keys(monthsByYear).map(Number).sort((a, b) => b - a);
    const latest = periods[0]?.split("-").map(Number);

    return {
      years,
      monthsByYear,
      latestPeriod: latest ? { year: latest[0], month: latest[1] } : null,
    };
  }, [periods]);

  return {
    periods,
    loading,
    ...periodInfo,
  };
}
