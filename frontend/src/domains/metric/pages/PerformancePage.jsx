import React from "react";
// [정정] 파일 위치(domains/metric/pages/)에서 providers 폴더로 가기 위한 정확한 상대 경로 적용
import { useEsgData } from "../../../app/providers/EsgDataProvider";
import PageHeader from "../../../shared/components/PageHeader";
import Card from "../../../shared/components/Card";
// [참고] 하위 컴포넌트들이 domains/metric/components에 있다면 아래 경로가 맞습니다.
import PerformanceStats from "../components/PerformanceStats";
import PerformanceCharts from "../components/PerformanceCharts";
import PerformanceTable from "../components/PerformanceTable";

export default function PerformancePage() {
  // 실제 서버 데이터를 관리하는 useEsgData 호출
  const { db, loading } = useEsgData();
  
  // 데이터 로딩 중일 때 처리 (사용자 경험 개선)
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
        <span className="ml-3 text-gray-500">퍼포먼스 데이터를 분석 중입니다...</span>
      </div>
    );
  }

  // db.metrics가 없을 경우를 대비한 방어 코드
  const metrics = db?.metrics || [];

  return (
    <div className="page-stack">
      <PageHeader 
        breadcrumbs={["성과 분석", "ESG 퍼포먼스"]} 
        title="ESG 퍼포먼스 대시보드" 
        description="전사 및 사업장별 ESG 지표 달성 현황과 추이를 분석합니다."
        actions={
          <select className="year-select">
            <option>2026년</option>
            <option>2025년</option>
          </select>
        }
      />

      {/* 실제 DB 데이터를 기반으로 통계 계산 */}
      <PerformanceStats metrics={metrics} />

      <div className="grid-layout col-2">
        <Card title="카테고리별 달성률">
          <PerformanceCharts type="radar" metrics={metrics} />
        </Card>
        <Card title="월별 배출량 추이">
          <PerformanceCharts type="line" metrics={metrics} />
        </Card>
      </div>

      <Card title="지표별 상세 성과">
        <PerformanceTable metrics={metrics} />
      </Card>
    </div>
  );
}
