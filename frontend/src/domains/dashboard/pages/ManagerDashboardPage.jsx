import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Line } from "react-chartjs-2";
import Swal from "sweetalert2";
import PageHeader from "../../../shared/components/PageHeader";
import Card from "../../../shared/components/Card";
import StatusBadge from "../../../shared/components/StatusBadge";
import ScoreRing from "../components/ScoreRing";
import FacilityMap from "../../company/components/FacilityMap";
import dashboardApi from "../api/dashboardApi";
import companyApi from "../../company/api/companyApi";
import { useAuth } from "../../../app/providers/AuthProvider";
import { ROLES } from "../../../app/config/roles";
import { facilityNameOf } from "../../metric/utils/approvedMetricView";
import { resolvePeriodSelection, useMetricPeriods } from "../../metric/hooks/useMetricPeriods";
import { apiErrorMessage, categoryLabel, formatNumber } from "../../../shared/utils/esgFormat";

const scoreValue = (value) => Number(value || 0);
const domainOrder = ["ENVIRONMENT", "SOCIAL", "GOVERNANCE"];
const domainMeta = {
  ENVIRONMENT: { key: "E", label: "환경", english: "Environment", weight: "40%", description: "에너지·온실가스 관리", path: "/manager/integrations" },
  SOCIAL: { key: "S", label: "사회", english: "Social", weight: "35%", description: "안전·교육·인적자원 관리", path: "/manager/social" },
  GOVERNANCE: { key: "G", label: "거버넌스", english: "Governance", weight: "25%", description: "이사회·윤리경영 관리", path: "/manager/governance" },
};
const lowerIsBetter = new Set(["IND_E_ELEC", "IND_E_SCOPE2", "IND_S_INJURY_RATE", "IND_S_TURNOVER"]);

const normalizedScore = (source) => source ? {
  ...source,
  environmentScore: source.environmentScore ?? source.eScore ?? source.e_score ?? source.escore,
  socialScore: source.socialScore ?? source.sScore ?? source.s_score ?? source.sscore,
  governanceScore: source.governanceScore ?? source.gScore ?? source.g_score ?? source.gscore,
} : null;

const queryString = ({ year, month, facilityId, indicator }) => {
  const params = new URLSearchParams();
  params.set("year", String(year));
  params.set("month", String(month));
  if (facilityId) params.set("facilityId", String(facilityId));
  if (indicator) params.set("indicator", indicator);
  return params.toString();
};

const changePresentation = (kpi) => {
  if (kpi.changeRate === null || kpi.changeRate === undefined) {
    return { label: "비교 가능한 직전 승인 데이터 없음", tone: "neutral" };
  }

  const change = Number(kpi.changeRate);
  if (Math.abs(change) < 0.005) return { label: "변동 없음", tone: "neutral" };

  const improved = lowerIsBetter.has(kpi.indicatorCode) ? change < 0 : change > 0;
  return {
    label: `${improved ? "개선" : "악화"} ${formatNumber(Math.abs(change), 2)}%`,
    tone: improved ? "improved" : "worsened",
  };
};

export default function ManagerDashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [facilityId, setFacilityId] = useState("");
  const [facilityOptions, setFacilityOptions] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const {
    years,
    monthsByYear,
    loading: periodLoading,
  } = useMetricPeriods({
    approvedOnly: true,
    facilityId,
  });

  const resolvedPeriod = resolvePeriodSelection({ year, month }, years, monthsByYear);
  const selectedYear = periodLoading ? year : resolvedPeriod.year;
  const selectedMonth = periodLoading ? month : resolvedPeriod.month;


  const load = useCallback(async () => {
    if (periodLoading) return;
    setLoading(true);
    try {
      const [dashboard, facilityResponse] = await Promise.all([
        dashboardApi.getSummary(selectedYear, selectedMonth, facilityId || undefined),
        companyApi.getFacilities(),
      ]);
      setSummary(dashboard);
      setFacilityOptions(facilityResponse?.data || []);
    } catch (error) {
      Swal.fire("대시보드 조회 실패", apiErrorMessage(error), "error");
    } finally {
      setLoading(false);
    }
  }, [facilityId, periodLoading, selectedMonth, selectedYear]);

  useEffect(() => { void Promise.resolve().then(load); }, [load]);

  const score = normalizedScore(summary?.score);
  const trend = (summary?.scoreTrend || []).map(normalizedScore);
  const kpis = useMemo(() => summary?.kpis || [], [summary]);
  const groupedKpis = useMemo(() => domainOrder.map((category) => ({
    category,
    items: kpis.filter((kpi) => kpi.category === category),
  })).filter((group) => group.items.length), [kpis]);
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
      { label: "환경", data: trend.map((item) => scoreValue(item.environmentScore)), borderColor: "#2f88c6", tension: 0.3 },
      { label: "사회", data: trend.map((item) => scoreValue(item.socialScore)), borderColor: "#d58a1f", tension: 0.3 },
      { label: "거버넌스", data: trend.map((item) => scoreValue(item.governanceScore)), borderColor: "#7c62b6", tension: 0.3 },
    ],
  };

  const goDomain = (category, indicator) => {
    const meta = domainMeta[category];
    if (!meta) return;
    navigate(`${meta.path}?${queryString({ year: selectedYear, month: selectedMonth, facilityId, indicator })}`);
  };

  const goFacility = (facility) => {
    const base = user?.role === ROLES.SYSTEM_ADMIN ? "/admin/companies" : "/manager/company";
    navigate(`${base}?${queryString({ year: selectedYear, month: selectedMonth, facilityId: facility.facilityId || facility.id })}`);
  };

  const handleYearChange = (event) => {
    const nextYear = Number(event.target.value);
    const months = monthsByYear[nextYear] || [];
    setYear(nextYear);
    setMonth(months.at(-1) || selectedMonth);
  };

  if (loading) return <div className="data-loading page-loading">최종 승인 데이터를 기준으로 대시보드를 구성하는 중입니다.</div>;

  const scoreCards = [
    { category: "ENVIRONMENT", value: score?.environmentScore },
    { category: "SOCIAL", value: score?.socialScore },
    { category: "GOVERNANCE", value: score?.governanceScore },
  ];

  return (
    <div className="page-stack dashboard-page official-dashboard">
      <PageHeader
        breadcrumbs={["홈", "ESG 대시보드"]}
        eyebrow="APPROVED ESG PERFORMANCE"
        title="ESG 종합 대시보드"
        description="최종 승인된 실제값과 KCGS 평가체계 준용 내부 ESG 지수를 제공합니다."
        actions={<div className="dashboard-filter-actions">
          <select className="select" value={selectedYear} onChange={handleYearChange} disabled={periodLoading || !years.length}>{years.map((optionYear) => <option key={optionYear} value={optionYear}>{optionYear}년</option>)}</select>
          <select className="select" value={selectedMonth} onChange={(event) => setMonth(Number(event.target.value))} disabled={periodLoading || !(monthsByYear[selectedYear] || []).length}>{(monthsByYear[selectedYear] || []).map((optionMonth) => <option key={optionMonth} value={optionMonth}>{optionMonth}월</option>)}</select>
          <select className="select" value={facilityId} onChange={(event) => setFacilityId(event.target.value)}><option value="">전체 사업장</option>{facilityOptions.map((facility) => <option key={facility.id} value={facility.id}>{facilityNameOf(facility)}</option>)}</select>
        </div>}
      />

      <section className="official-data-banner">
        <div>
          <span className="section-kicker">APPROVED DATA ONLY</span>
          <h2>{summary?.latestApprovedPeriod ? `${summary.latestApprovedPeriod}까지 최종 승인 완료` : "승인 완료 데이터 없음"}</h2>
          <p>대시보드의 수치와 점수는 최종 승인된 데이터만 사용합니다.</p>
        </div>
        <div className="official-data-meta">
          <div><span>최근 등록월</span><strong>{summary?.latestCollectedPeriod || "-"}</strong></div>
          <div><span>최근 확정월</span><strong>{summary?.latestApprovedPeriod || "-"}</strong></div>
          <div><span>승인 대기</span><strong>{summary?.pendingApprovalCount || 0}건</strong></div>
        </div>
      </section>

      {summary?.pendingPeriod && summary.pendingPeriod !== summary.latestApprovedPeriod && (
        <div className="pending-dashboard-notice">
          <StatusBadge status="PENDING" />
          <div><strong>{summary.pendingPeriod} 데이터는 처리 중입니다.</strong><p>최종 승인이 완료되면 이 대시보드와 영역별 실적 화면에 자동 반영됩니다.</p></div>
          <Link to="/manager/metrics">처리 현황 보기 →</Link>
        </div>
      )}

      <section className="domain-score-grid" aria-label="환경 사회 거버넌스 영역별 점수">
        {scoreCards.map((item) => {
          const meta = domainMeta[item.category];
          const value = scoreValue(item.value);
          return (
            <article
              key={meta.key}
              className={`domain-score-card domain-score-${meta.key.toLowerCase()} is-navigable`}
              role="button"
              tabIndex={0}
              onClick={() => goDomain(item.category)}
              onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") goDomain(item.category); }}
            >
              <div className="domain-score-head">
                <span className="domain-score-letter">{meta.key}</span>
                <div><strong>{meta.label}</strong><small>{meta.english}</small></div>
                <em>가중치 {meta.weight}</em>
              </div>
              <div className="domain-score-value"><strong>{score ? formatNumber(value, 1) : "-"}</strong><span>/ 100점</span></div>
              <div className="domain-score-progress"><i style={{ width: `${score ? Math.min(100, value) : 0}%` }} /></div>
              <p>{score ? `${score.period} 최종 승인 기준` : "승인 완료 데이터 집계 전"} · {meta.description}</p>
              <span className="card-navigation-hint">상세 실적 보기 →</span>
            </article>
          );
        })}
      </section>

      <div className="dashboard-score-layout">
        <Card className="internal-score-card" title={summary?.evaluationName || "KCGS 평가체계 준용 내부 ESG 지수"} description={`${summary?.evaluationVersion || "내부 기준"} · 외부 평가기관의 공식등급이 아닙니다.`}>
          {score ? (
            <div className="internal-score-content">
              <ScoreRing score={scoreValue(score.totalScore).toFixed(1)} />
              <div className="score-grade-block"><span>내부 추정등급</span><strong>{score.grade}</strong><small>{score.period} 확정</small></div>
              <div className="score-bars">
                {[["환경(E)", score.environmentScore], ["사회(S)", score.socialScore], ["거버넌스(G)", score.governanceScore]].map(([label, value]) => (
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

      <Card title={`${summary?.latestApprovedPeriod || "-"} 핵심 ESG 실제값`} description="영역별 최종 승인 실제값과 직전 승인월 대비 개선·악화를 함께 제공합니다.">
        <div className="approved-kpi-sections">
          {groupedKpis.map((group) => {
            const meta = domainMeta[group.category];
            return (
              <section key={group.category} className={`approved-kpi-section kpi-section-${group.category.toLowerCase()}`}>
                <header><div><span>{meta.key}</span><strong>{meta.label}</strong><small>{meta.english}</small></div><button type="button" onClick={() => goDomain(group.category)}>전체 보기 →</button></header>
                <div className="approved-kpi-grid">
                  {group.items.map((kpi) => {
                    const change = changePresentation(kpi);
                    return (
                      <article
                        key={kpi.indicatorCode}
                        className={`kpi-domain-${String(kpi.category).toLowerCase()} is-navigable`}
                        role="button"
                        tabIndex={0}
                        onClick={() => goDomain(kpi.category, kpi.indicatorCode)}
                        onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") goDomain(kpi.category, kpi.indicatorCode); }}
                      >
                        <div><span>{categoryLabel(kpi.category)}</span><small>{summary?.latestApprovedPeriod || `${selectedYear}-${String(selectedMonth).padStart(2, "0")}`}</small></div>
                        <h3>{kpi.title}</h3>
                        <strong>{formatNumber(kpi.value, kpi.unit === "%" ? 2 : 1)} <small>{kpi.unit}</small></strong>
                        <p className={change.tone}>{change.label}</p>
                        <span className="card-navigation-hint">해당 지표 보기 →</span>
                      </article>
                    );
                  })}
                </div>
              </section>
            );
          })}
          {kpis.length === 0 && <div className="empty-state"><strong>승인된 실제값이 없습니다.</strong></div>}
        </div>
      </Card>

      <div className="facility-map-grid">
        <Card title="사업장 위치와 확정 실적" description="지도 마커를 선택하면 해당 사업장의 같은 기준월 상세정보로 이동합니다.">
          <FacilityMap facilities={facilities} onSelect={goFacility} />
        </Card>
        <Card title="사업장별 비교" description={`${summary?.latestApprovedPeriod || "-"} 최종 승인 데이터`}>
          <div className="dashboard-facility-list">
            {facilities.map((facility) => (
              <article
                key={facility.facilityId}
                className="is-navigable"
                role="button"
                tabIndex={0}
                onClick={() => goFacility(facility)}
                onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") goFacility(facility); }}
              >
                <div><strong>{facility.facilityName}</strong><small>{facility.facilityType === "HQ" ? "본사" : "공장"} · {facility.address}</small></div>
                <dl><div><dt>Scope 2</dt><dd>{formatNumber(facility.scope2Tco2eq, 2)} tCO₂eq</dd></div><div><dt>교육 이수율</dt><dd>{formatNumber(facility.trainingCompletionRate, 1)}%</dd></div><div><dt>산업재해율</dt><dd>{formatNumber(facility.injuryRate, 2)}%</dd></div></dl>
                <span className="card-navigation-hint">사업장 상세 보기 →</span>
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
