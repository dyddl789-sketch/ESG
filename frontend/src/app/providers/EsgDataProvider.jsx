/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { metricApi } from "../../domains/metric/api/metricApi";

const EsgDataContext = createContext(null);

export function EsgDataProvider({ children }) {
  const [metrics, setMetrics] = useState([]);
  const [loading, setLoading] = useState(false);

  const refreshMetrics = useCallback(async (filters = {}) => {
    setLoading(true);
    try {
      const data = await metricApi.list(filters);
      setMetrics(Array.isArray(data) ? data : []);
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error("ESG 지표 조회 실패:", error);
      setMetrics([]);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    Promise.resolve().then(() => active && refreshMetrics().catch(() => undefined));
    return () => { active = false; };
  }, [refreshMetrics]);

  const value = useMemo(() => ({
    db: { metrics },
    metrics,
    loading,
    refreshMetrics,
  }), [loading, metrics, refreshMetrics]);

  return <EsgDataContext.Provider value={value}>{children}</EsgDataContext.Provider>;
}

export function useEsgData() {
  const value = useContext(EsgDataContext);
  if (!value) throw new Error("useEsgData must be used inside EsgDataProvider");
  return value;
}
