import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Line } from "react-chartjs-2";
import Swal from "sweetalert2";
import PageHeader from "../../../shared/components/PageHeader";
import Card from "../../../shared/components/Card";
import StatusBadge from "../../../shared/components/StatusBadge";
import ScoreRing from "../components/ScoreRing";
import FacilityMap from "../../company/components/FacilityMap";
import dashboardApi from "../api/dashboardApi";
import { apiErrorMessage, categoryLabel, formatNumber } from "../../../shared/utils/esgFormat";

const scoreValue = (value) => Number(value || 0);

export default function ManagerDashboardPage() {
  const [year, setYear] = useState(2026);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try { setSummary(await dashboardApi.getSummary(year)); }
    catch (error) { Swal.fire("대시보드 조회 실패", apiErrorMessage(error), "error"); }
    finally { setLoading(false); }
  }, [year]);

  useEffect(() => { load(); }, [load]);

  const score = summary?.score;
  const trend = summary?.scoreTrend || [];
  const kpis = summary?.kpis || [];
  const facilities = useMemo(() => (summary?.facilities || []).map((facility) => ({
    ...facility,
    id: facility.facilityId,
    name: facility.facilityName,
    mapStatus: "NORMAL",
  })), [summary]);

  const chart = {
    labels: trend.map((item) => `${Number(item.period?.slice(5))}월`),
    datasets: [
      { label: "종합 내부 ESG 지수", data: trend.map((item) => scoreValue(item.totalScore)), borderColor: "#1f6b46", backgroundColor: "rgba(31,107,70,.12)", tension: 0.35, fill: true },
      { label: "환경", data: trend.map((item) => scoreValue(item.eScore)), borderColor: "#2f88c6", tension: 0.3 },
      { label: "사회", data: trend.map((item) => scoreValue(item.sScore)), borderColor: "#d58a1f", tension: 0.3 },
      { label: "거버넌스", data: trend.map((item) => scoreValue(item.gScore)), borderColor: "#7c62b6", tension: 0.3 },
    ],
  };

  if (loading) return <div className="data-loading page-loading">최종 승인 데이터를 기준으로 대시보드를 구성하는 중입니다.</div>;

  return (
    <div className="page-stack dashboard-page official-dashboard">
      <PageHeader
        breadcrumbs={["홈", "ESG 대시보드"]}
        eyebrow="APPROVED ESG PERFORMANCE"
        title="ESG 종합 대시보드"
        description="최종 승인된 실제값과 KCGS 평가체계 준용 내부 ESG 지수를 제공합니다."
        actions={<select className="select" value={year} onChange={(event) => setYear(Number(event.target.value))}><option value={2026}>2026년</option><option value={2025}>2025년</option></select>}
      />

      <section className="official-data-banner">
        <div>
          <span className="section-kicker">APPROVED DATA ONLY</span>
          <h2>{summary?.latestApprovedPeriod ? `${summary.latestApprovedPeriod}까지 최종 승인 완료` : "승인 완료 데이터 없음"}</h2>
          <p>대시보드의 수치와 점수는 최종 승인된 데이터만 사용합니다.</p>
        </div>
        <div className="official-data-meta">
          <div><span>최근 수집월</span><strong>{summary?.latestCollectedPeriod || "-"}</strong></div>
          <div><span>최근 확정월</span><strong>{summary?.latestApprovedPeriod || "-"}</strong></div>
          <div><span>승인 대기</span><strong>{summary?.pendingApprovalCount || 0}건</strong></div>
        </div>
      </section>

      {summary?.pendingPeriod && summary.pendingPeriod !== summary.latestApprovedPeriod && (
        <div className="pending-dashboard-notice">
          <StatusBadge status="PENDING" />
          <div><strong>{summary.pendingPeriod} 데이터는 처리 중입니다.</strong><p>ESG 반영·AI 분석·최종 승인이 완료되면 이 대시보드에 확정값으로 추가됩니다.</p></div>
          <Link to="/manager/metrics">처리 현황 보기 →</Link>
        </div>
      )}

      <div className="dashboard-score-layout">
        <Card className="internal-score-card" title={summary?.evaluationName || "KCGS 평가체계 준용 내부 ESG 지수"} description={`${summary?.evaluationVersion || "내부 기준"} · 외부 평가기관의 공식등급이 아닙니다.`}>
          {score ? (
            <div className="internal-score-content">
              <ScoreRing score={scoreValue(score.totalScore).toFixed(1)} />
              <div className="score-grade-block"><span>내부 추정등급</span><strong>{score.grade}</strong><small>{score.period} 확정</small></div>
              <div className="score-bars">
                {[["환경(E)", score.eScore], ["사회(S)", score.sScore], ["거버넌스(G)", score.gScore]].map(([label, value]) => (
                  <div key={label}><span>{label}<b>{formatNumber(value, 1)}</b></span><i><em style={{ width: `${Math.min(100, scoreValue(value))}%` }} /></i></div>
                ))}
              </div>
            </div>
          ) : <div className="empty-state"><strong>확정 점수 없음</strong><p>월별 E·S·G 지표 전체가 최종 승인되면 내부 ESG 지수가 생성됩니다.</p></div>}
        </Card>

        <Card title="월별 내부 ESG 지수 추이" description="최종 승인된 월만 선으로 연결합니다.">
          <div className="chart-box">
            {trend.length ? <Line data={chart} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: "bottom" } }, scales: { y: { min: 0, max: 100, grid: { color: "#edf1ef" } } } }} /> : <div className="empty-state"><strong>추이 데이터 없음</strong></div>}
          </div>
        </Card>
      </div>

      <Card title={`${summary?.latestApprovedPeriod || "-"} 핵심 ESG 실제값`} description="점수와 별도로 최종 승인된 원본 실제값을 함께 제공합니다.">
        <div className="approved-kpi-grid">
          {kpis.map((kpi) => (
            <article key={kpi.indicatorCode} className={`kpi-domain-${String(kpi.category).toLowerCase()}`}>
              <div><span>{categoryLabel(kpi.category)}</span><small>{kpi.indicatorCode}</small></div>
              <h3>{kpi.title}</h3>
              <strong>{formatNumber(kpi.value, kpi.unit === "%" ? 2 : 1)} <small>{kpi.unit}</small></strong>
              <p className={Number(kpi.changeRate) > 0 ? "increase" : "decrease"}>
                {kpi.changeRate === null || kpi.changeRate === undefined ? "이전 확정월 비교 없음" : `이전 확정월 대비 ${Number(kpi.changeRate) > 0 ? "+" : ""}${formatNumber(kpi.changeRate, 2)}%`}
              </p>
            </article>
          ))}
          {kpis.length === 0 && <div className="empty-state"><strong>승인된 실제값이 없습니다.</strong></div>}
        </div>
      </Card>

      <div className="facility-map-grid">
        <Card title="사업장 위치와 확정 실적" description="본사·부산공장·울산공장의 최근 승인 실적입니다.">
          <FacilityMap facilities={facilities} />
        </Card>
        <Card title="사업장별 비교" description={`${summary?.latestApprovedPeriod || "-"} 최종 승인 데이터`}>
          <div className="dashboard-facility-list">
            {facilities.map((facility) => (
              <article key={facility.facilityId}>
                <div><strong>{facility.facilityName}</strong><small>{facility.facilityType === "HQ" ? "본사" : "공장"} · {facility.address}</small></div>
                <dl><div><dt>Scope 2</dt><dd>{formatNumber(facility.scope2Tco2eq, 2)} tCO₂eq</dd></div><div><dt>교육 이수율</dt><dd>{formatNumber(facility.trainingCompletionRate, 1)}%</dd></div><div><dt>산업재해율</dt><dd>{formatNumber(facility.injuryRate, 2)}%</dd></div></dl>
              </article>
            ))}
          </div>
        </Card>
      </div>

      <Card title="내부 지수 산정 안내">
        <div className="evaluation-disclaimer">
          <strong>{summary?.evaluationName || "KCGS 평가체계 준용 내부 ESG 지수"}</strong>
          <p>{summary?.disclaimer || "본 지수는 당사의 개선활동 관리를 위한 자체 산정 결과이며 외부 ESG 평가기관의 공식 등급이 아닙니다."}</p>
          <div><span>영역 가중치</span><b>환경 40% · 사회 35% · 거버넌스 25%</b></div>
        </div>
      </Card>
    </div>
  );
}
