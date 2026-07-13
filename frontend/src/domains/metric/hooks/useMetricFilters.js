import { useMemo, useState } from "react";

const initialFilters = {
  status: "ALL",
  category: "ALL",
  facility: "ALL",
  keyword: "",
};

export function useMetricFilters(metrics) {
  const [filters, setFilters] = useState(initialFilters);

  const facilities = useMemo(() => Array.from(new Set(
    metrics.map((metric) => metric.facility).filter(Boolean),
  )), [metrics]);

  const rows = useMemo(() => metrics.filter((metric) => {
    const matchesStatus = filters.status === "ALL" || metric.status === filters.status;
    const matchesCategory = filters.category === "ALL" || metric.category === filters.category;
    const matchesFacility = filters.facility === "ALL" || metric.facility === filters.facility;
    const keywordTarget = [
      metric.title,
      metric.indicatorCode,
      metric.facility,
      metric.source,
    ].join(" ").toLowerCase();
    const matchesKeyword = !filters.keyword || keywordTarget.includes(filters.keyword.toLowerCase());

    return matchesStatus && matchesCategory && matchesFacility && matchesKeyword;
  }), [filters, metrics]);

  return {
    filters,
    facilities,
    rows,
    setFilters,
    resetFilters: () => setFilters(initialFilters),
  };
}
