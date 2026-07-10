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

const latestByCode = (metrics, codes) => 
  codes.map((code) => metrics.find((item) => item.indicatorCode === code)).filter(Boolean);

const formatValue = (metric) => 
  `${Number(metric.value || 0).toLocaleString("ko-KR", { maximumFractionDigits: 2 })} ${metric.unit || ''}`;

// 💡 1. 복사 전용 SVG 아이콘 컴포넌트
const CopyIcon = ({ onClick }) => (
  <svg 
    onClick={onClick}
    xmlns="http://www.w3.org/2000/svg" 
    width="16" height="16" viewBox="0 0 24 24" 
    fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" 
    style={{ cursor: 'pointer', marginLeft: '6px', color: '#94a3b8', transition: 'color 0.2s' }}
    onMouseOver={(e) => e.currentTarget.style.color = '#166534'}
    onMouseOut={(e) => e.currentTarget.style.color = '#94a3b8'}
    title="실적 텍스트 복사"
  >
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
  </svg>
);

export default function PerformancePage() {
  const [tab, setTab] = useState("ENVIRONMENT");
  const [year, setYear] = useState(2026); // 기능 2: 연도 동적 선택기
  const [statusFilter, setStatusFilter] = useState("ALL"); // 기능 3: 결재 상태 필터링
  
  const [metrics, setMetrics] = useState([]);
  const [prevYearMetrics, setPrevYearMetrics] = useState([]); 
  const [isLoading, setIsLoading] = useState(true);

  // 연도가 변경될 때마다 당해 연도와 전년도 데이터를 병렬로 동시에 호출합니다.
  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        setIsLoading(true);
        const [currRes, prevRes] = await Promise.all([
          performanceApi.getPerformanceMetrics(year),
          performanceApi.getPerformanceMetrics(year - 1) // YoY 비교를 위해 전년도 함께 호출
        ]);
        
        setMetrics(currRes.data?.data || currRes.data || []);
        setPrevYearMetrics(prevRes.data?.data || prevRes.data || []);
      } catch (error) {
        console.error("ESG 실적 데이터를 불러오는 데 실패했습니다:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchMetrics();
  }, [year]);

  const latest = useMemo(() => latestByCode(metrics, configs[tab].codes), [metrics, tab]);
  const selected = latest[0];
  
  // 탭 분류 + 상태 필터링이 모두 적용된 최종 테이블 데이터(rows)
  const filteredRows = useMemo(() => {
    return metrics.filter((item) => {
      const isTabMatch = item.category === tab;
      const isStatusMatch = statusFilter === "ALL" 
        ? true 
        : (statusFilter === "REVIEW" ? (item.status === "PENDING" || item.status === "DRAFT") : item.status === "APPROVED");
      return isTabMatch && isStatusMatch;
    });
  }, [metrics, tab, statusFilter]);

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

  // 엑셀 다운로드 (탭 라인으로 위치 이동 완료)
  const handleExportExcel = () => {
    const headers = ["지표코드", "지표명", "기준기간", "원천 시스템", "실적", "상태"];
    const csvRows = [headers.join(",")];
    
    filteredRows.forEach(row => {
      const rowData = [row.indicatorCode, row.title, row.period, row.source, `${row.value} ${row.unit}`, row.status];
      csvRows.push(rowData.join(","));
    });
    
    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + csvRows.join("\n");
    const link = document.createElement("a");
    link.href = encodeURI(csvContent);
    link.download = `ESG_실적조회_${year}_${tab}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 클립보드 복사 로직
  const handleCopy = (title, period, value, unit) => {
    const textToCopy = `[${period}] ${title}: ${Number(value).toLocaleString("ko-KR", { maximumFractionDigits: 2 })} ${unit}`;
    navigator.clipboard.writeText(textToCopy).then(() => {
      alert(`클립보드에 복사되었습니다.\n\n${textToCopy}`);
    });
  };

  // 💡 4. YoY (전년 동월 대비) 증감률 시각화 계산 로직
  const getYoY = (indicatorCode, currentMonths) => {
    if (!currentMonths) return null;
    
    // 현재 연도에서 가장 최신 데이터가 있는 월(Index) 찾기
    let latestMonthIdx = -1;
    for (let i = 11; i >= 0; i--) {
      if (currentMonths[i] !== null && currentMonths[i] !== undefined) {
        latestMonthIdx = i;
        break;
      }
    }
    
    if (latestMonthIdx === -1) return null;
    const currentValue = currentMonths[latestMonthIdx];
    
    // 전년도 데이터에서 동일한 월의 데이터 찾기
    const prevMetric = prevYearMetrics.find(p => p.indicatorCode === indicatorCode);
    if (!prevMetric || !prevMetric.months || prevMetric.months[latestMonthIdx] == null) return null;

    const prevValue = prevMetric.months[latestMonthIdx];
    if (prevValue === 0) return null;

    const diff = currentValue - prevValue;
    const rate = (diff / prevValue) * 100;
    const isIncrease = diff > 0;
    
    // 지표 성격에 따라 긍정/부정 색상 스마트 분기 (부정적 지표는 낮을수록 좋음)
    const isNegativeIndicator = ["IND_E_ELEC", "IND_E_SCOPE2", "IND_S_INJURY_RATE", "IND_S_TURNOVER"].includes(indicatorCode);
    
    let color = "#64748b";
    if (rate !== 0) {
      if (isIncrease) {
        color = isNegativeIndicator ? "#dc2626" : "#2563eb"; // 상승: 부정 지표(빨강), 긍정 지표(파랑)
      } else {
        color = isNegativeIndicator ? "#2563eb" : "#dc2626"; // 하락: 부정 지표(파랑), 긍정 지표(빨강)
      }
    }

    const symbol = rate > 0 ? "▲" : (rate < 0 ? "▼" : "-");

    return (
      <span style={{ fontSize: "13px", fontWeight: "600", color, marginLeft: "12px", display: "inline-flex", alignItems: "center" }}>
        {symbol} {Math.abs(rate).toFixed(1)}% <span style={{ color: "#94a3b8", fontSize: "11px", fontWeight: "normal", marginLeft: "4px" }}>전년 동월 대비</span>
      </span>
    );
  };

  return (
    <div className="page-stack">
      {/* 엑셀 액션 버튼이 제거된 깔끔한 헤더 */}
      <PageHeader
        breadcrumbs={["성과·보고", "ESG 실적 조회"]}
        title="ESG 실적 조회"
        description="내부 화면에는 최신 잠정값까지 즉시 반영하고, 상태를 구분해 승인 여부를 확인합니다."
      />
      
      {/* 🌟 탭 & 엑셀 버튼 & 연도 선택기: 동일한 라인에 수평 배치 (Flexbox) */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
        <Tabs value={tab} onChange={setTab} items={Object.entries(configs).map(([value, config]) => ({ value, label: config.label }))} />
        
        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          {/* 조회 연도 동적 선택기 */}
          <select 
            value={year} 
            onChange={(e) => setYear(Number(e.target.value))}
            style={{ padding: "8px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", outline: "none", cursor: "pointer", fontWeight: "600", color: "#334155" }}
          >
            <option value={2026}>2026년 실적</option>
            <option value={2025}>2025년 실적</option>
            <option value={2024}>2024년 실적</option>
          </select>

          {/* 엑셀 다운로드 */}
          <button 
            onClick={handleExportExcel} 
            style={{ display: "flex", alignItems: "center", gap: "6px", padding: "8px 16px", backgroundColor: "#166534", color: "white", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "bold" }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="7 10 12 15 17 10"></polyline>
              <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
            엑셀 다운로드
          </button>
        </div>
      </div>

      {isLoading ? (
        <div style={{ padding: "80px", textAlign: "center", color: "#64748b" }}>데이터를 집계 중입니다...</div>
      ) : (
        <>
          <div className={`performance-cards performance-${tab.toLowerCase()}`}>
            {latest.map((metric) => (
              <article key={metric.indicatorCode}>
                <div className="performance-card-head">
                  <span style={{ display: "flex", alignItems: "center" }}>
                    {metric.title}
                    <CopyIcon onClick={() => handleCopy(metric.title, metric.period, metric.value, metric.unit)} />
                  </span>
                  <StatusBadge status={metric.status} />
                </div>
                
                <div style={{ display: "flex", alignItems: "baseline", marginTop: "6px" }}>
                  <strong>{formatValue(metric)}</strong>
                  {getYoY(metric.indicatorCode, metric.months)}
                </div>
                
                <div style={{ marginTop: "6px" }}>
                  <small>{metric.period} · {metric.status === "APPROVED" ? "공식 확정값" : "내부 잠정값"}</small>
                </div>
              </article>
            ))}
          </div>

          <Card title={selected ? `${year}년 ${selected.title} 추이` : "핵심 지표 추이"} description="수집 완료 시 해당 기간의 최신 값이 차트 마지막 구간에 추가됩니다.">
            <div className="chart-box">
              {chart ? (
                <Line data={chart} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: "bottom" } } }} />
              ) : (
                <p style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%", color: "#94a3b8" }}>차트를 그릴 월별 데이터가 없습니다.</p>
              )}
            </div>
          </Card>

          <Card title="지표별 잠정·승인 데이터" description="승인 완료 데이터만 외부 사용자 대시보드와 공식 보고서에 반영됩니다.">
            {/* 결재 상태 필터링 칩 영역 */}
            <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "16px" }}>
              <div style={{ display: "flex", gap: "8px" }}>
                <button 
                  onClick={() => setStatusFilter("ALL")} 
                  style={{ padding: "6px 14px", borderRadius: "20px", border: "1px solid #cbd5e1", background: statusFilter === "ALL" ? "#f1f5f9" : "white", fontWeight: statusFilter === "ALL" ? "bold" : "normal", cursor: "pointer", fontSize: "13px", color: "#334155", transition: "all 0.2s" }}
                >
                  전체 보기
                </button>
                <button 
                  onClick={() => setStatusFilter("APPROVED")} 
                  style={{ padding: "6px 14px", borderRadius: "20px", border: "1px solid #cbd5e1", background: statusFilter === "APPROVED" ? "#dcfce3" : "white", color: statusFilter === "APPROVED" ? "#166534" : "#334155", fontWeight: statusFilter === "APPROVED" ? "bold" : "normal", cursor: "pointer", fontSize: "13px", transition: "all 0.2s" }}
                >
                  승인 완료
                </button>
                <button 
                  onClick={() => setStatusFilter("REVIEW")} 
                  style={{ padding: "6px 14px", borderRadius: "20px", border: "1px solid #cbd5e1", background: statusFilter === "REVIEW" ? "#fef3c7" : "white", color: statusFilter === "REVIEW" ? "#b45309" : "#334155", fontWeight: statusFilter === "REVIEW" ? "bold" : "normal", cursor: "pointer", fontSize: "13px", transition: "all 0.2s" }}
                >
                  검토 중
                </button>
              </div>
            </div>

            <DataTable rows={filteredRows} columns={[
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