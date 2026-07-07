import { useNavigate } from "react-router-dom";
import { useDemoData } from "../../../app/providers/DemoDataProvider";
import { useMetricFilters } from "../hooks/useMetricFilters";
import PageHeader from "../../../shared/components/PageHeader";
import Card from "../../../shared/components/Card";
import Tabs from "../../../shared/components/Tabs";
import Button from "../../../shared/components/Button";
import MetricSummaryPanel from "../components/MetricSummaryPanel";
import MetricFilterBar from "../components/MetricFilterBar";
import MetricDataGrid from "../components/MetricDataGrid";
export default function MetricListPage(){ const {db}=useDemoData(); const navigate=useNavigate(); const {filters,setFilters,rows}=useMetricFilters(db.metrics); const tabs=["ALL","DRAFT","PENDING","REJECTED","APPROVED"].map(v=>({value:v,label:({ALL:"전체",DRAFT:"검토 중",PENDING:"승인 대기",REJECTED:"반려",APPROVED:"승인 완료"})[v],count:v==="ALL"?db.metrics.length:db.metrics.filter(m=>m.status===v).length})); return <div className="page-stack"><PageHeader breadcrumbs={["데이터 관리","ESG 데이터 관리"]} title="ESG 데이터 관리" description="수집된 원천 데이터를 검토하고 증빙을 연결한 뒤 최종 승인을 요청합니다." actions={<><select className="year-select"><option>‹ 2026 ›</option><option>2025</option></select><Button>신규 데이터 등록</Button></>}/><Tabs items={tabs} value={filters.status} onChange={status=>setFilters({...filters,status})}/><MetricSummaryPanel metrics={db.metrics}/><Card><MetricFilterBar filters={filters} onChange={setFilters}/><div className="grid-hint"><span>데이터 {rows.length}건</span><span>행을 클릭하면 상세 검토 화면으로 이동합니다.</span></div><MetricDataGrid rows={rows} onRowClick={row=>navigate(`/manager/metrics/${row.id}`)}/></Card></div>; }
