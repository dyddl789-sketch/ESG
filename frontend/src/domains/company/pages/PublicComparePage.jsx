import { useState, useEffect, useMemo } from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import PageHeader from "../../../shared/components/PageHeader";
import Card from "../../../shared/components/Card";
import scoreApi from "../api/scoreApi";

// Chart.js 모듈 등록
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function PublicComparePage() {
  const [scores, setScores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchScores = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await scoreApi.getYearlyScores();
        setScores(res.data || []);
      } catch (err) {
        setError("연도별 ESG 점수를 불러오는데 실패했습니다.");
        console.error("Failed to fetch scores:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchScores();
  }, []);

  // 데이터 정렬 및 가공
  const sorted = useMemo(() => {
    return [...scores].sort((a, b) => a.reporting_year - b.reporting_year);
  }, [scores]);

  // 최신 연도와 전년도 비교 데이터 계산
  const summaryData = useMemo(() => {
    if (sorted.length === 0) return null;
    const latest = sorted[sorted.length - 1];
    const prev = sorted.length > 1 ? sorted[sorted.length - 2] : null;

    const calculateDiff = (curr, prev) => {
      if (!prev) return null;
      const diff = curr - prev;
      return {
        value: Math.abs(diff).toFixed(1),
        isUp: diff >= 0
      };
    };

    return {
      year: latest.reporting_year,
      e: { score: latest.e_score, diff: calculateDiff(latest.e_score, prev?.e_score) },
      s: { score: latest.s_score, diff: calculateDiff(latest.s_score, prev?.s_score) },
      g: { score: latest.g_score, diff: calculateDiff(latest.g_score, prev?.g_score) },
      total: { 
        score: ((latest.e_score + latest.s_score + latest.g_score) / 3).toFixed(1),
        diff: prev ? calculateDiff((latest.e_score + latest.s_score + latest.g_score) / 3, (prev.e_score + prev.s_score + prev.g_score) / 3) : null
      }
    };
  }, [sorted]);

  if (loading) {
    return (
      <div className="page-stack">
        <PageHeader breadcrumbs={["공개 ESG 정보", "연도별 비교"]} title="연도별 ESG 성과 비교" />
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "400px" }}>
          <div className="loading-spinner">데이터 분석 중...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-stack">
        <PageHeader breadcrumbs={["공개 ESG 정보", "연도별 비교"]} title="연도별 ESG 성과 비교" />
        <Card>
          <div style={{ textAlign: "center", padding: "60px", color: "#e53e3e" }}>
            <p style={{ fontWeight: "600" }}>{error}</p>
            <button onClick={() => window.location.reload()} style={{ marginTop: "1rem", padding: "8px 16px", cursor: "pointer" }}>재시도</button>
          </div>
        </Card>
      </div>
    );
  }

  if (sorted.length === 0) {
    return (
      <div className="page-stack">
        <PageHeader breadcrumbs={["공개 ESG 정보", "연도별 비교"]} title="연도별 ESG 성과 비교" description="공개 승인된 연도별 E·S·G 점수 추이를 비교합니다." />
        <Card>
          <div style={{ textAlign: "center", padding: "80px 20px", color: "#8a8f98" }}>
            아직 등록된 ESG 점수 데이터가 없습니다.
          </div>
        </Card>
      </div>
    );
  }

  const chartData = {
    labels: sorted.map((s) => `${s.reporting_year}`),
    datasets: [
      {
        label: "환경(E)",
        data: sorted.map((s) => s.e_score),
        borderColor: "#2a7d55",
        backgroundColor: "rgba(42, 125, 85, 0.05)",
        borderWidth: 2.5,
        pointRadius: 4,
        pointHoverRadius: 6,
        pointBackgroundColor: "#fff",
        tension: 0.35,
      },
      {
        label: "사회(S)",
        data: sorted.map((s) => s.s_score),
        borderColor: "#d59231",
        backgroundColor: "rgba(213, 146, 49, 0.05)",
        borderWidth: 2.5,
        pointRadius: 4,
        pointHoverRadius: 6,
        pointBackgroundColor: "#fff",
        tension: 0.35,
      },
      {
        label: "거버넌스(G)",
        data: sorted.map((s) => s.g_score),
        borderColor: "#3a74b7",
        backgroundColor: "rgba(58, 116, 183, 0.05)",
        borderWidth: 2.5,
        pointRadius: 4,
        pointHoverRadius: 6,
        pointBackgroundColor: "#fff",
        tension: 0.35,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: "top", align: "end", labels: { boxWidth: 12, usePointStyle: true, font: { size: 11 } } },
      tooltip: { padding: 10, cornerRadius: 4, usePointStyle: true },
    },
    scales: {
      y: { min: 0, max: 100, grid: { color: "#f0f0f0" }, ticks: { stepSize: 20, font: { size: 11 } } },
      x: { grid: { display: false }, ticks: { font: { size: 11 } } }
    }
  };

  return (
    <div className="page-stack" style={{ gap: "20px" }}>
      <PageHeader
        breadcrumbs={["공개 ESG 정보", "연도별 비교"]}
        title="연도별 ESG 성과 비교"
        description={`${summaryData.year}년 기준 ESG 경영 성과 및 연도별 추이 분석 보고서입니다.`}
      />

      {/* 정보 밀도가 높은 요약 섹션 */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px" }}>
        <CompactSummaryCard 
          label="종합 ESG 점수" 
          value={summaryData.total.score} 
          diff={summaryData.total.diff}
          color="#1a202c"
          isMain
        />
        <CompactSummaryCard 
          label="환경 (Environment)" 
          value={summaryData.e.score} 
          diff={summaryData.e.diff}
          color="#2a7d55"
        />
        <CompactSummaryCard 
          label="사회 (Social)" 
          value={summaryData.s.score} 
          diff={summaryData.s.diff}
          color="#d59231"
        />
        <CompactSummaryCard 
          label="거버넌스 (Governance)" 
          value={summaryData.g.score} 
          diff={summaryData.g.diff}
          color="#3a74b7"
        />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "20px" }}>
        {/* 메인 차트 영역 */}
        <Card title="연도별 성과 추이">
          <div style={{ height: "320px", marginTop: "10px" }}>
            <Line data={chartData} options={chartOptions} />
          </div>
        </Card>

        {/* 상세 데이터 테이블 (상세한 느낌 강화) */}
        <Card title="연도별 상세 데이터">
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #edf2f7", textAlign: "left" }}>
                  <th style={{ padding: "12px 8px", color: "#718096", fontWeight: "600" }}>연도</th>
                  <th style={{ padding: "12px 8px", color: "#2a7d55", fontWeight: "600" }}>E</th>
                  <th style={{ padding: "12px 8px", color: "#d59231", fontWeight: "600" }}>S</th>
                  <th style={{ padding: "12px 8px", color: "#3a74b7", fontWeight: "600" }}>G</th>
                </tr>
              </thead>
              <tbody>
                {[...sorted].reverse().map((s) => (
                  <tr key={s.reporting_year} style={{ borderBottom: "1px solid #f7fafc" }}>
                    <td style={{ padding: "10px 8px", fontWeight: "600" }}>{s.reporting_year}</td>
                    <td style={{ padding: "10px 8px" }}>{s.e_score}</td>
                    <td style={{ padding: "10px 8px" }}>{s.s_score}</td>
                    <td style={{ padding: "10px 8px" }}>{s.g_score}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* 분석 코멘트 영역 (전문성 강화) */}
      <Card>
        <div style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
          <div style={{ backgroundColor: "#f0fff4", padding: "8px", borderRadius: "8px", color: "#2a7d55" }}>💡</div>
          <div>
            <h4 style={{ margin: "0 0 4px 0", fontSize: "0.95rem", color: "#2d3748" }}>성과 분석 요약</h4>
            <p style={{ margin: 0, fontSize: "0.85rem", color: "#4a5568", lineHeight: "1.6" }}>
              {summaryData.year}년 종합 점수는 {summaryData.total.score}점으로 측정되었습니다. 
              {summaryData.total.diff ? (
                `전년 대비 ${summaryData.total.diff.isUp ? '약 ' + summaryData.total.diff.value + '점 상승' : '약 ' + summaryData.total.diff.value + '점 하락'} 하였으며, 
                특히 ${[
                  {l:'환경', v:summaryData.e.score}, 
                  {l:'사회', v:summaryData.s.score}, 
                  {l:'거버넌스', v:summaryData.g.score}
                ].sort((a,b)=>b.v-a.v)[0].l} 부문에서 가장 높은 성과를 보이고 있습니다.`
              ) : "지속적인 ESG 경영을 통해 데이터가 축적되면 연도별 성장 추이를 더욱 정교하게 분석할 수 있습니다."}
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}

// 정보 밀도를 높인 소형 요약 카드
function CompactSummaryCard({ label, value, diff, color, isMain = false }) {
  return (
    <div style={{
      backgroundColor: isMain ? "#f8fafc" : "#ffffff",
      padding: "16px",
      borderRadius: "10px",
      border: isMain ? "1px solid #cbd5e0" : "1px solid #edf2f7",
      boxShadow: "0 1px 2px rgba(0,0,0,0.03)",
    }}>
      <div style={{ fontSize: "0.75rem", fontWeight: "600", color: "#718096", marginBottom: "8px", whiteSpace: "nowrap" }}>{label}</div>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
        <span style={{ fontSize: "1.4rem", fontWeight: "800", color: color }}>{value}</span>
        {diff && (
          <div style={{ 
            fontSize: "0.75rem", 
            fontWeight: "600", 
            color: diff.isUp ? "#38a169" : "#e53e3e",
            display: "flex",
            alignItems: "center",
            gap: "2px",
            backgroundColor: diff.isUp ? "#f0fff4" : "#fff5f5",
            padding: "2px 6px",
            borderRadius: "4px"
          }}>
            {diff.isUp ? "▲" : "▼"} {diff.value}
          </div>
        )}
      </div>
    </div>
  );
}
