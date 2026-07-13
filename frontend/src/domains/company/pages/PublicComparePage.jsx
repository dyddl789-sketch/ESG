import { useEffect, useState } from "react";
import { Line } from "react-chartjs-2";
import Swal from "sweetalert2";
import PageHeader from "../../../shared/components/PageHeader";
import Card from "../../../shared/components/Card";
import dashboardApi from "../../dashboard/api/dashboardApi";
import { apiErrorMessage } from "../../../shared/utils/esgFormat";

export default function PublicComparePage() {
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    dashboardApi.getSummary(2026).then(setSummary).catch((error) => Swal.fire("조회 실패", apiErrorMessage(error), "error"));
  }, []);

  const trend = summary?.scoreTrend || [];
  const data = {
    labels: trend.map((row) => `${Number(row.period.slice(5))}월`),
    datasets: [
      { label: "환경(E)", data: trend.map((row) => row.eScore), borderColor: "#2a7d55", tension: 0.3 },
      { label: "사회(S)", data: trend.map((row) => row.sScore), borderColor: "#d59231", tension: 0.3 },
      { label: "거버넌스(G)", data: trend.map((row) => row.gScore), borderColor: "#3a74b7", tension: 0.3 },
      { label: "통합 내부지수", data: trend.map((row) => row.totalScore), borderColor: "#6957a8", tension: 0.3 },
    ],
  };

  return <div className="page-stack">
    <PageHeader breadcrumbs={["공개 ESG 정보", "기간별 비교"]} title="월별 ESG 확정 실적 비교" description="최종 승인된 KCGS 평가체계 준용 내부 ESG 지수의 월별 추이를 조회합니다." />
    <Card title="2026년 승인 완료 내부 ESG 지수" description={`최근 확정월: ${summary?.latestApprovedPeriod || "-"}`}>
      <div className="chart-box large">{trend.length ? <Line data={data} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: "bottom" } }, scales: { y: { min: 0, max: 100 } } }} /> : <p>승인 완료 데이터가 없습니다.</p>}</div>
    </Card>
    <p className="dashboard-disclaimer">{summary?.disclaimer || "본 지수는 내부 ESG 관리 목적의 자체 산정 결과이며 외부 평가기관의 공식 등급이 아닙니다."}</p>
  </div>;
}
