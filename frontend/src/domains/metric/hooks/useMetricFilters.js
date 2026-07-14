import { useMemo, useState } from "react";

/**
 * [핵심 수정]
 * 1. 필터 키 통일: MetricFilterBar는 `search` 키로 입력값을 올려보내는데
 *    기존 훅은 `keyword`만 검사해서 검색이 전혀 동작하지 않았다. → `search`로 통일
 * 2. 배열 방어: metrics가 아직 로드되지 않았거나(undefined) 잘못된 타입일 때
 *    .filter 호출로 화면 전체가 깨지는 것을 방지
 */
export function useMetricFilters(metrics) {
  const [filters, setFilters] = useState({ status: "ALL", category: "ALL", search: "" });

  const rows = useMemo(() => {
    const list = Array.isArray(metrics) ? metrics : [];
    const search = (filters.search || "").trim().toLowerCase();

    return list.filter(
      (m) =>
        (filters.status === "ALL" || m.status === filters.status) &&
        (filters.category === "ALL" || m.category === filters.category) &&
        (!search ||
          [m.title, m.indicatorCode, m.facility]
            .filter(Boolean)
            .join(" ")
            .toLowerCase()
            .includes(search)),
    );
  }, [metrics, filters]);

  return { filters, setFilters, rows };
}
