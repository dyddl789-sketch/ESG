import { useCallback, useEffect, useMemo, useState } from "react";
import { Bar } from "react-chartjs-2";
import Swal from "sweetalert2";
import { useAuth } from "../../../app/providers/AuthProvider";
import { ROLES } from "../../../app/config/roles";
import PageHeader from "../../../shared/components/PageHeader";
import Card from "../../../shared/components/Card";
import Button from "../../../shared/components/Button";
import StatusBadge from "../../../shared/components/StatusBadge";
import { apiErrorMessage, formatDateTime } from "../../../shared/utils/esgFormat";
import { externalBenchmarkApi } from "../api/externalBenchmarkApi";

const YEAR_OPTIONS = [2026, 2025, 2024];

const number = (value, digits = 2) => value == null ? "-" : Number(value).toLocaleString("ko-KR", {
  minimumFractionDigits: digits,
  maximumFractionDigits: digits,
});

const comparisonText = (value) => {
  if (value == null) return "비교 대기";
  return `${Math.abs(Number(value)).toFixed(1)}% ${Number(value) >= 0 ? "낮음" : "높음"}`;
};

export default function ExternalBenchmarkPage() {
  const { user } = useAuth();
  const canSync = [ROLES.SYSTEM_ADMIN, ROLES.COMPANY_MANAGER].includes(user?.role);
  const [selectedYear, setSelectedYear] = useState(2026);
  const [benchmark, setBenchmark] = useState(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setBenchmark(await externalBenchmarkApi.get(selectedYear));
    } catch (error) {
      Swal.fire("조회 실패", apiErrorMessage(error, "외부 비교 데이터를 불러오지 못했습니다."), "error");
    } finally {
      setLoading(false);
    }
  }, [selectedYear]);

  useEffect(() => {
    void Promise.resolve().then(load);
  }, [load]);

  const sync = async () => {
    const result = await Swal.fire({
      title: "2021년 공공데이터 동기화",
      text: "한국에너지공단 전력·온실가스와 KOSIS 출하액을 다시 조회하여 DB를 갱신합니다.",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "동기화",
      cancelButtonText: "취소",
    });
    if (!result.isConfirmed) return;

    setSyncing(true);
    try {
      await externalBenchmarkApi.sync();
      setBenchmark(await externalBenchmarkApi.get(selectedYear));
      await Swal.fire("동기화 완료", "공공데이터 원본과 변환값을 PostgreSQL에 저장했습니다.", "success");
    } catch (error) {
      Swal.fire("동기화 실패", apiErrorMessage(error), "error");
    } finally {
      setSyncing(false);
    }
  };

  const internalChartLabel = benchmark?.internalPeriodLabel || `${selectedYear}년 승인 누적`;

  const electricityChart = useMemo(() => ({
    labels: [internalChartLabel, "2021년 동일 업종"],
    datasets: [{
      label: benchmark?.electricityUnit || "MWh/출하액 1억원",
      data: [benchmark?.internalElectricityIntensity ?? 0, benchmark?.externalElectricityIntensity ?? 0],
      backgroundColor: ["#3a74b7", "#b8cae0"],
      borderRadius: 8,
    }],
  }), [benchmark, internalChartLabel]);

  const carbonChart = useMemo(() => ({
    labels: [internalChartLabel, "2021년 동일 업종"],
    datasets: [{
      label: benchmark?.carbonUnit || "tCO₂eq/출하액 1억원",
      data: [benchmark?.internalCarbonIntensity ?? 0, benchmark?.externalCarbonIntensity ?? 0],
      backgroundColor: ["#1f6b46", "#9eb8aa"],
      borderRadius: 8,
    }],
  }), [benchmark, internalChartLabel]);

  const synced = benchmark?.status === "SYNCED";

  return (
    <div className="page-stack">
      <PageHeader
        breadcrumbs={["데이터 관리", "외부 데이터 비교"]}
        eyebrow="PUBLIC DATA BENCHMARK"
        title="외부 공공데이터 비교"
        description={`${selectedYear}년 승인 완료 내부 실적을 2021년 C303 공공통계 원단위와 비교합니다.`}
        actions={(
          <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
            <label style={{ display: "flex", alignItems: "center", gap: "8px", fontWeight: 600 }}>
              <span>내부 기준연도</span>
              <select
                value={selectedYear}
                onChange={(event) => setSelectedYear(Number(event.target.value))}
                disabled={loading || syncing}
              >
                {YEAR_OPTIONS.map((year) => <option key={year} value={year}>{year}년</option>)}
              </select>
            </label>
            {canSync
              ? <Button disabled={syncing} onClick={sync}>{syncing ? "동기화 중..." : "외부 데이터 동기화"}</Button>
              : <span className="verified-role">조회 전용</span>}
          </div>
        )}
      />

      {loading ? (
        <div className="page-loading">{selectedYear}년 외부 공공데이터 비교값을 불러오는 중입니다.</div>
      ) : (
        <>
          <div className="benchmark-source-strip">
            <div><span>동기화 상태</span><StatusBadge status={synced ? "NORMAL" : benchmark?.status || "NOT_SYNCED"} label={synced ? "동기화 완료" : benchmark?.status === "FAILED" ? "동기화 실패" : "동기화 필요"} /></div>
            <div><span>최근 갱신</span><b>{formatDateTime(benchmark?.lastSyncedAt)}</b></div>
            <div><span>외부 기준</span><b>{benchmark?.externalPeriodLabel || "2021년 연간 공공통계"}</b></div>
            <div><span>내부 기준</span><b>{benchmark?.internalPeriodLabel || `${selectedYear}년 비교 가능한 승인 데이터 없음`}</b></div>
          </div>

          {!synced && (
            <div className="benchmark-warning">
              <b>공공데이터 동기화 필요</b>
              <p>{benchmark?.lastErrorMessage || "관리자가 외부 데이터 동기화를 실행하면 한국에너지공단·KOSIS 값을 저장하고 비교를 시작합니다."}</p>
            </div>
          )}

          <div className="summary-grid four">
            <article className="benchmark-stat"><span>우리 기업 전력 원단위</span><strong>{number(benchmark?.internalElectricityIntensity)}</strong><small>{benchmark?.electricityUnit}</small></article>
            <article className="benchmark-stat"><span>업종 기준 전력 원단위</span><strong>{number(benchmark?.externalElectricityIntensity)}</strong><small>{benchmark?.industryName} ({benchmark?.industryCode})</small></article>
            <article className="benchmark-stat"><span>전력 효율 비교</span><strong className={Number(benchmark?.electricityImprovementPercent || 0) >= 0 ? "positive-text" : "warning-text"}>{comparisonText(benchmark?.electricityImprovementPercent)}</strong><small>2021년 업종 기준 대비</small></article>
            <article className="benchmark-stat"><span>탄소 효율 비교</span><strong className={Number(benchmark?.carbonImprovementPercent || 0) >= 0 ? "positive-text" : "warning-text"}>{comparisonText(benchmark?.carbonImprovementPercent)}</strong><small>2021년 업종 기준 대비</small></article>
          </div>

          <div className="two-cols benchmark-charts">
            <Card title="출하액 기준 전력 원단위 비교" description={`${benchmark?.internalPeriodLabel || `${selectedYear}년 승인 누적`} · ${benchmark?.industryName || "자동차 신품 부품 제조업"}`}>
              <div className="chart-box"><Bar data={electricityChart} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, title: { display: true, text: benchmark?.electricityUnit } } } }} /></div>
              <p className="source-caption">출처: {benchmark?.sourceLabel || "한국에너지공단 · KOSIS"}</p>
            </Card>
            <Card title="출하액 기준 탄소 원단위 비교" description={`${benchmark?.externalPeriodLabel || "2021년 연간 공공통계"} · ${benchmark?.industryName || "자동차 신품 부품 제조업"}`}>
              <div className="chart-box"><Bar data={carbonChart} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, title: { display: true, text: benchmark?.carbonUnit } } } }} /></div>
              <p className="source-caption">출처: {benchmark?.sourceLabel || "한국에너지공단 · KOSIS"} · 원본 최종수정 {benchmark?.sourceUpdatedAt || "-"}</p>
            </Card>
          </div>

          <Card title="비교 데이터 구성" description="공공데이터는 내부 ESG 원본이 아니라 동일 업종 기준선으로 사용합니다.">
            <div className="data-role-grid">
              <article><span className="role-number">01</span><div><b>내부 승인 데이터</b><p>{selectedYear}년 전력·Scope 2·출하액이 모두 승인된 최신 월까지 누적 계산합니다.</p></div></article>
              <article><span className="role-number">02</span><div><b>한국에너지공단</b><p>2021년 C303 업종 전체 전력 사용량과 전력 관련 온실가스 배출량을 사용합니다.</p></div></article>
              <article><span className="role-number">03</span><div><b>KOSIS</b><p>2021년 전국 자동차 신품 부품 제조업의 출하액 계를 사용합니다.</p></div></article>
            </div>
          </Card>

          <div className="benchmark-warning">
            <b>{benchmark?.provisional ? "잠정 비교" : "연간 비교"}</b>
            <p>{benchmark?.methodologyNote || "외부 기준은 연간 통계이며 내부 값은 승인 완료 누적 원단위입니다."}</p>
          </div>
        </>
      )}
    </div>
  );
}
