import { useDemoData } from "../../../app/providers/DemoDataProvider";
import PageHeader from "../../../shared/components/PageHeader";
import Card from "../../../shared/components/Card";
import DataTable from "../../../shared/components/DataTable";
export default function AuditLogPage(){ const {db}=useDemoData(); return <div className="page-stack"><PageHeader breadcrumbs={["운영 관리","감사 로그"]} title="감사 로그" description="데이터 변경·승인·연동 실행 이력을 조회합니다."/><Card><DataTable rows={db.auditLogs} columns={[{key:"at",label:"처리일시"},{key:"user",label:"사용자"},{key:"action",label:"작업"},{key:"target",label:"대상"},{key:"detail",label:"상세 내용"}]} /></Card></div>; }
