import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../../app/providers/AuthProvider";
import { useDemoData } from "../../../app/providers/DemoDataProvider";
import PageHeader from "../../../shared/components/PageHeader";
import Button from "../../../shared/components/Button";
import StatusBadge from "../../../shared/components/StatusBadge";
import MetricDetailPanel from "../../metric/components/MetricDetailPanel";
export default function ApprovalDetailPage(){ const {metricId}=useParams(); const {user}=useAuth(); const {db,decideApproval}=useDemoData(); const nav=useNavigate(); const metric=db.metrics.find(m=>m.id===Number(metricId)); if(!metric)return <p>데이터를 찾을 수 없습니다.</p>; const decide=async(s)=>{const ok=await decideApproval(metric.id,s,user);if(ok)nav("/admin/approvals");}; return <div className="page-stack"><PageHeader breadcrumbs={["승인 관리",metric.title]} title={`${metric.title} 승인 검토`} description={`${metric.facility} · ${metric.period}`} actions={<><Button variant="outline" onClick={()=>nav(-1)}>목록</Button><StatusBadge status={metric.status}/></>}/><div className="detail-layout"><MetricDetailPanel metric={metric}/><aside><div className="action-card"><h3>최종 검토</h3><p>승인 시 외부 공개 대시보드와 보고서 집계에 즉시 반영됩니다.</p><div className="action-stack"><Button variant="danger" onClick={()=>decide("REJECTED")}>반려</Button><Button onClick={()=>decide("APPROVED")}>최종 승인</Button></div></div></aside></div></div>; }
