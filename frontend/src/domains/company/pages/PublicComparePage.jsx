import { useState, useEffect } from "react";
import { Line } from "react-chartjs-2";
import PageHeader from "../../../shared/components/PageHeader";
import Card from "../../../shared/components/Card";
import scoreApi from "../api/scoreApi";

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
        setScores(res.data);
      } catch (err) {
        setError("연도별 ESG 점수를 불러오는데 실패했습니다.");
        console.error("Failed to fetch scores:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchScores();
  }, []);

  if (loading) return <div className="page-stack">로딩 중...</div>;
  if (error) return <div className="page-stack error-message">오류: {error}</div>;

  const sorted = [...scores].sort((a, b) => a.reporting_year - b.reporting_year);

  if (sorted.length === 0) {
    return (
      <div className="page-stack">
        <PageHeader
          breadcrumbs={["공개 ESG 정보", "연도별 비교"]}
          title="연도별 ESG 성과 비교"
          description="공개 승인된 연도별 E·S·G 점수 추이를 비교합니다."
        />
        <Card>
          <div style={{ textAlign: "center", padding: "60px", color: "#8a8f98" }}>
            아직 등록된 ESG 점수 데이터가 없습니다.
          </div>
        </Card>
      </div>
    );
  }

  const data = {
    labels: sorted.map((s) => String(s.reporting_year)),
    datasets: [
      { label: "환경(E)", data: sorted.map((s) => s.e_score), borderColor: "#2a7d55", tension: 0.3 },
      { label: "사회(S)", data: sorted.map((s) => s.s_score), borderColor: "#d59231", tension: 0.3 },
      { label: "거버넌스(G)", data: sorted.map((s) => s.g_score), borderColor: "#3a74b7", tension: 0.3 },
    ],
  };

  return (
    <div className="page-stack">
      <PageHeader
        breadcrumbs={["공개 ESG 정보", "연도별 비교"]}
        title="연도별 ESG 성과 비교"
        description="공개 승인된 연도별 E·S·G 점수 추이를 비교합니다."
      />
      <Card title={`${sorted[0].reporting_year}–${sorted[sorted.length - 1].reporting_year} ESG 점수`}>
        <div className="chart-box large">
          <Line
            data={data}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: { legend: { position: "bottom" } },
              scales: { y: { min: 50, max: 100 } },
            }}
          />
        </div>
      </Card>
    </div>
  );
}