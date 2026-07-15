import React, { useState } from "react"; // 💡 useState 추가
import { useNavigate } from "react-router-dom";
// [핵심 수정] 목데이터(useDemoData) → 실제 서버 데이터(useEsgData)로 전환
// 기존에는 목록은 목데이터, 상세는 실데이터를 사용해 목록에서 클릭하면
// 상세에서 "데이터를 찾을 수 없습니다"가 발생했다.
import { useEsgData } from "../../../app/providers/EsgDataProvider";
import { useMetricFilters } from "../hooks/useMetricFilters";
import PageHeader from "../../../shared/components/PageHeader";
import Card from "../../../shared/components/Card";
import Tabs from "../../../shared/components/Tabs";
import Button from "../../../shared/components/Button";
import MetricSummaryPanel from "../components/MetricSummaryPanel";
import MetricFilterBar from "../components/MetricFilterBar";
import MetricDataGrid from "../components/MetricDataGrid";

export default function MetricListPage() {
  const { metrics, loading } = useEsgData();
  const navigate = useNavigate();
  const { filters, setFilters, rows } = useMetricFilters(metrics);

  // 💡 [방법 A] 현재 시스템 날짜(올해)를 기준으로 과거 2020년 기점까지의 연도 목록을 실시간 배열로 연산
  const currentYear = new Date().getFullYear(); // 2026년 기준
  const startYear = 2020; // 최초 데이터 수집 시작 연도 기점 설정
  const availableYears = Array.from(
    { length: currentYear - startYear + 1 },
    (_, i) => currentYear - i
  );

  // 💡 선택된 보고 연도를 관리할 로컬 상태 생성 (기본값: 올해)
  const [selectedYear, setSelectedYear] = useState(currentYear);

  const tabs = ["ALL", "DRAFT", "PENDING", "REJECTED", "APPROVED"].map((v) => ({
    value: v,
    label: { ALL: "전체", DRAFT: "작성 중", PENDING: "승인 대기", REJECTED: "반려", APPROVED: "승인 완료" }[v],
    count: v === "ALL" ? metrics.length : metrics.filter((m) => m.status === v).length,
  }));

  if (loading) {
    return <div className="page-stack"><p style={{ padding: "40px", textAlign: "center" }}>ESG 데이터를 불러오는 중입니다...</p></div>;
  }

  return (
    <div className="page-stack">
      <PageHeader
        breadcrumbs={["데이터 관리", "ESG 데이터 관리"]}
        title="ESG 데이터 관리"
        description="수집된 원천 데이터를 검토하고 증빙을 연결한 뒤 최종 승인을 요청합니다."
        actions={
          <>
            {/* 💡 하드코딩되어 있던 연도 선택창을 Dynamic Map 루프 구조로 전면 교정 */}
            <select 
              className="year-select"
              value={selectedYear}
              onChange={(e) => {
                const nextYear = Number(e.target.value);
                setSelectedYear(nextYear);
                // 기존의 공통 훅 필터 객체에 동적 연도 연동 처리 결합
                setFilters({ ...filters, year: nextYear }); 
              }}
            >
              {availableYears.map((year) => (
                <option key={year} value={year}>
                  {year}년
                </option>
              ))}
            </select>
            <Button onClick={() => navigate("/manager/metrics/new")}>신규 데이터 등록</Button>
          </>
        }
      />
      <Tabs items={tabs} value={filters.status} onChange={(status) => setFilters({ ...filters, status })} />
      <MetricSummaryPanel metrics={metrics} />
      <Card>
        <MetricFilterBar filters={filters} onChange={setFilters} />
        <div className="grid-hint">
          <span>데이터 {rows.length}건</span>
          <span>행을 클릭하면 알맞은 편집 및 검토 화면으로 이동합니다.</span>
        </div>
        
        {/* 데이터 행 클릭 시 상태(status)를 감지하여 목적지 라우터를 동적으로 리다이렉트 처리 */}
                <MetricDataGrid 
          rows={rows} 
          onRowClick={(row) => {
            navigate(`/manager/metrics/${row.id}`);
          }} 
        />
      </Card>
    </div>
  );
}
