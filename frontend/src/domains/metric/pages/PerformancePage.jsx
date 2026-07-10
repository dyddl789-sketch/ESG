import React, { useMemo, useState, useEffect } from "react";
import { Line } from "react-chartjs-2";
import PageHeader from "../../../shared/components/PageHeader";
import Card from "../../../shared/components/Card";
import Tabs from "../../../shared/components/Tabs";
import DataTable from "../../../shared/components/DataTable";
import StatusBadge from "../../../shared/components/StatusBadge";
import { performanceApi } from "../api/performanceApi";

const configs = {
  ENVIRONMENT: { label: "환경(E)", codes: ["IND_E_ELEC", "IND_E_SCOPE2"] },
  SOCIAL: { label: "사회(S)", codes: ["IND_S_INJURY_RATE", "IND_S_SAFETY_EDU", "IND_S_RISK_ACTION", "IND_S_TURNOVER"] },
  GOVERNANCE: { label: "거버넌스(G)", codes: ["IND_G_ATTENDANCE", "IND_G_OUTSIDE", "IND_G_ETHICS_EDU"] },
};

// 백엔드에서 이미 지표별로 정리된 단일 객체를 주므로 reverse()가 필요 없습니다.
const latestByCode = (metrics, codes) => 
  codes.map((code) => metrics.find((item) => item.indicatorCode === code)).filter(Boolean);

const formatValue = (metric) => 
  `${Number(metric.value || 0).toLocaleString("ko-KR", { maximumFractionDigits: 2 })} ${metric.unit || ''}`;

export default function PerformancePage() {
  const [tab, setTab] = useState("ENVIRONMENT");
  
  // 1. 상태 관리 추가 (ReportBuilderPage 패턴 차용)
  const [metrics, setMetrics] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // 2. 마운트 시 DB 연동 데이터 패칭
  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        setIsLoading(true);
        const response = await performanceApi.getPerformanceMetrics();
        // 백엔드 공통 응답 구조 대응
        const data = response.data?.data || response.data || [];
        setMetrics(data);
      } catch (error) {
        console.error("ESG 실적 데이터를 불러오는 데 실패했습니다:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchMetrics();
  }, []);

  const latest = useMemo(() => latestByCode(metrics, configs[tab].codes), [metrics, tab]);
  const selected = latest[0];
  const rows = metrics.filter((item) => item.category === tab);
  
  // 3. 차트 렌더링 방어 코드 (데이터가 도착하기 전 에러 방지)
  const chart = (selected && selected.months) ? {
    labels: selected.months.map((_, index) => `${index + 1}월`),
    datasets: [{ 
      label: `${selected.title} (${selected.unit})`, 
      data: selected.months, 
      borderColor: "#2a7d55", 
      backgroundColor: "rgba(42,125,85,.12)", 
      fill: true, 
      tension: .3 
    }],
  } : null;

  return (
    <div className="page-stack">
      <PageHeader
        breadcrumbs={["성과·보고", "ESG 실적 조회"]}
        title="ESG 실적 조회"
        description="내부 화면에는 최신 잠정값까지 즉시 반영하고, 상태를 구분해 승인 여부를 확인합니다."
      />
      <Tabs value={tab} onChange={setTab} items={Object.entries(configs).map(([value, config]) => ({ value, label: config.label }))} />

      {/* 로딩 상태 뷰 처리 */}
      {isLoading ? (
        <div style={{ padding: "80px", textAlign: "center", color: "#64748b" }}>
          데이터를 집계 중입니다...
        </div>
      ) : (
        <>
          <div className={`performance-cards performance-${tab.toLowerCase()}`}>
            {latest.map((metric) => (
              <article key={metric.indicatorCode}>
                <div className="performance-card-head">
                  <span>{metric.title}</span><StatusBadge status={metric.status} />
                </div>
                <strong>{formatValue(metric)}</strong>
                <small>{metric.period} · {metric.status === "APPROVED" ? "공식 확정값" : "내부 잠정값"}</small>
              </article>
            ))}
          </div>

          <Card title={selected ? `${selected.title} 추이` : "핵심 지표 추이"} description="수집 완료 시 해당 기간의 최신 값이 차트 마지막 구간에 추가됩니다.">
            <div className="chart-box">
              {chart ? (
                <Line data={chart} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: "bottom" } } }} />
              ) : (
                <p style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%", color: "#94a3b8" }}>
                  차트를 그릴 월별 데이터가 없습니다.
                </p>
              )}
            </div>
          </Card>

          <Card title="지표별 잠정·승인 데이터" description="승인 완료 데이터만 외부 사용자 대시보드와 공식 보고서에 반영됩니다.">
            <DataTable rows={rows} columns={[
              { key: "indicatorCode", label: "지표코드" },
              { key: "title", label: "지표명" },
              { key: "period", label: "기준기간" },
              { key: "source", label: "원천 시스템" },
              { key: "value", label: "실적", render: (_, row) => formatValue(row) },
              { key: "status", label: "상태", render: (value) => <StatusBadge status={value} /> },
            ]} />
          </Card>
        </>
      )}
    </div>
  );
}