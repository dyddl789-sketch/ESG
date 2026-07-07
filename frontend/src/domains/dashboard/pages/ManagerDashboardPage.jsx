import { Line } from "react-chartjs-2";
import { useDemoData } from "../../../app/providers/DemoDataProvider";
import { getDashboardSummary } from "../api/dashboardApi";
import PageHeader from "../../../shared/components/PageHeader";
import Card from "../../../shared/components/Card";
import StatCard from "../../../shared/components/StatCard";
import ScoreRing from "../components/ScoreRing";
import CollectionCards from "../components/CollectionCards";

export default function ManagerDashboardPage() {
  const { db } = useDemoData(); const summary = getDashboardSummary(db);
  const chart = { labels:["1월","2월","3월","4월","5월","6월"], datasets:[{ label:"Scope 1·2 배출량", data:[156.2,149.4,145.8,141.2,136.9,128.4], borderColor:"#1f6b46", backgroundColor:"rgba(31,107,70,.12)", fill:true, tension:.35 },{ label:"목표", data:[150,145,140,135,132,130], borderColor:"#d59231", borderDash:[6,6], tension:.2 }] };
  return <div className="page-stack"><PageHeader breadcrumbs={["홈","ESG 대시보드"]} title="ESG 종합 대시보드" description="수집·검토·승인 현황과 승인된 ESG 성과를 한눈에 확인합니다." actions={<select className="select"><option>2026년</option><option>2025년</option></select>} /><div className="summary-grid"><StatCard label="종합 ESG 점수" value={summary.overallScore} helper="전년 대비 +3.2" icon="ESG"/><StatCard label="환경(E)" value={summary.eScore} helper="에너지·탄소·폐기물" icon="E"/><StatCard label="사회(S)" value={summary.sScore} helper="인사·안전" tone="orange" icon="S"/><StatCard label="거버넌스(G)" value={summary.gScore} helper="이사회·윤리" tone="blue" icon="G"/><StatCard label="수집률" value={`${summary.collectionRate}%`} helper="정상 연동 기준" tone="purple" icon="↻"/><StatCard label="승인 대기" value={`${summary.pending}건`} helper={`반려 ${summary.rejected}건`} tone="red" icon="!"/></div><div className="dashboard-cols"><Card title="ESG 종합 현황" className="score-card"><div className="score-row"><ScoreRing score={summary.overallScore}/><div className="score-bars">{[["환경",85],["사회",78],["거버넌스",83]].map(([label,value]) => <div key={label}><span>{label}<b>{value}</b></span><i><em style={{width:`${value}%`}}/></i></div>)}</div></div></Card><Card title="월별 온실가스 배출 추이" description="승인 완료 데이터를 기준으로 집계"><div className="chart-box"><Line data={chart} options={{ responsive:true, maintainAspectRatio:false, plugins:{legend:{position:"bottom"}}, scales:{y:{grid:{color:"#edf1ef"}}} }} /></div></Card></div><Card title="외부 시스템 수집 상태" action={<a className="text-link" href="/manager/integrations">연동 관리 →</a>}><CollectionCards sources={db.integrations}/></Card></div>;
}
