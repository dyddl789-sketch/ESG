import { Bar } from "react-chartjs-2";
import { useDemoData } from "../../../app/providers/DemoDataProvider";
import PageHeader from "../../../shared/components/PageHeader";
import Card from "../../../shared/components/Card";
import Button from "../../../shared/components/Button";
import StatusBadge from "../../../shared/components/StatusBadge";

const number = (value, digits = 0) => Number(value).toLocaleString("ko-KR", {
  minimumFractionDigits: digits,
  maximumFractionDigits: digits,
});

export default function ExternalBenchmarkPage() {
  const { db, syncExternalBenchmark } = useDemoData();
  const { electricity, greenhouseGas, lastSyncedAt, status } = db.externalBenchmarks;
  const electricityGap = ((electricity.ourIntensity - electricity.industryIntensity) / electricity.industryIntensity) * 100;
  const gasGap = ((greenhouseGas.ourEmission - greenhouseGas.averageEmission) / greenhouseGas.averageEmission) * 100;

  const gasChart = {
    labels: ["우리 기업", "동일 업종 평균", "동일 업종 중앙값"],
    datasets: [{
      label: "Scope 1·2 배출량",
      data: [greenhouseGas.ourEmission, greenhouseGas.averageEmission, greenhouseGas.medianEmission],
      backgroundColor: ["#1f6b46", "#8da99a", "#c3d2ca"],
      borderRadius: 8,
    }],
  };

  const intensityChart = {
    labels: ["우리 기업", "동일 업종 기준"],
    datasets: [{
      label: "생산량당 전력 사용량",
      data: [electricity.ourIntensity, electricity.industryIntensity],
      backgroundColor: ["#3a74b7", "#b8cae0"],
      borderRadius: 8,
    }],
  };

  return (
    <div className="page-stack">
      <PageHeader
        breadcrumbs={["데이터 관리", "외부 데이터 비교"]}
        eyebrow="PUBLIC DATA BENCHMARK"
        title="외부 공공데이터 비교"
        description="가상 EMS 실적을 공공데이터의 동일 업종 기준과 비교해 수치의 의미를 해석합니다."
        actions={<Button onClick={syncExternalBenchmark}>외부 데이터 동기화</Button>}
      />

      <div className="benchmark-source-strip">
        <div><span>동기화 상태</span><StatusBadge status={status} /></div>
        <div><span>최근 갱신</span><b>{lastSyncedAt}</b></div>
        <div><span>비교 원칙</span><b>승인된 내부 데이터만 사용</b></div>
        <div><span>저장 방식</span><b>PostgreSQL 기준정보 적재</b></div>
      </div>

      <div className="summary-grid four">
        <article className="benchmark-stat"><span>우리 기업 전력 원단위</span><strong>{number(electricity.ourIntensity, 1)}</strong><small>{electricity.unit}</small></article>
        <article className="benchmark-stat"><span>업종 기준 전력 원단위</span><strong>{number(electricity.industryIntensity, 1)}</strong><small>{electricity.companyCount}개 비교 표본</small></article>
        <article className="benchmark-stat"><span>전력 효율 비교</span><strong className="positive-text">{Math.abs(electricityGap).toFixed(1)}% 우수</strong><small>업종 기준보다 낮은 사용량</small></article>
        <article className="benchmark-stat"><span>연간 배출량 비교</span><strong className={gasGap <= 0 ? "positive-text" : "warning-text"}>{Math.abs(gasGap).toFixed(1)}% {gasGap <= 0 ? "낮음" : "높음"}</strong><small>동일 업종 평균 대비</small></article>
      </div>

      <div className="two-cols benchmark-charts">
        <Card title="생산량당 전력 사용량 비교" description={`${electricity.basePeriod} · ${electricity.industry}`}>
          <div className="chart-box"><Bar data={intensityChart} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, title: { display: true, text: electricity.unit } } } }} /></div>
          <p className="source-caption">출처: {electricity.source}</p>
        </Card>
        <Card title="연간 온실가스 배출량 비교" description={`${greenhouseGas.baseYear}년 공개자료 · ${greenhouseGas.industry}`}>
          <div className="chart-box"><Bar data={gasChart} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, title: { display: true, text: greenhouseGas.unit } } } }} /></div>
          <p className="source-caption">출처: {greenhouseGas.source} · 공개업체 {greenhouseGas.companyCount}개 기준</p>
        </Card>
      </div>

      <Card title="내부 데이터와 외부 데이터의 역할" description="공공데이터는 우리 기업의 ESG 원본이 아니라 비교와 해석을 위한 기준으로 사용합니다.">
        <div className="data-role-grid">
          <article>
            <span className="role-number">01</span>
            <div><b>가상 EMS</b><p>본사와 각 공장의 전력·가스 사용량을 생성하고 월별 ESG 원본으로 사용합니다.</p></div>
          </article>
          <article>
            <span className="role-number">02</span>
            <div><b>공식 계산 기준</b><p>연도별 배출계수를 적용해 Scope 2 배출량을 계산하고 계산 버전을 보관합니다.</p></div>
          </article>
          <article>
            <span className="role-number">03</span>
            <div><b>외부 공공데이터</b><p>동일 업종 평균·중앙값·원단위를 정기 수집해 우리 기업의 상대적 수준을 분석합니다.</p></div>
          </article>
        </div>
      </Card>

      <div className="benchmark-warning">
        <b>비교 해석 주의</b>
        <p>기업 규모에 따라 절대 사용량이 달라질 수 있으므로, 전체 사용량과 함께 생산량 1톤당 전력 사용량 같은 원단위를 우선 비교합니다.</p>
      </div>
    </div>
  );
}
