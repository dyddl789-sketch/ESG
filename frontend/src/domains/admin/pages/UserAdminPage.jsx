import { useDemoData } from "../../../app/providers/DemoDataProvider";
import PageHeader from "../../../shared/components/PageHeader";
import Card from "../../../shared/components/Card";
import DataTable from "../../../shared/components/DataTable";
import Button from "../../../shared/components/Button";
import { ROLE_LABELS } from "../../../app/config/roles";
export default function UserAdminPage(){ const {db}=useDemoData(); return <div className="page-stack"><PageHeader breadcrumbs={["플랫폼 관리","사용자·권한 관리"]} title="사용자·권한 관리" description="3개 역할과 계정 활성 상태를 관리합니다." actions={<Button>사용자 등록</Button>}/><Card><DataTable rows={db.users} columns={[{key:"name",label:"이름"},{key:"email",label:"이메일"},{key:"department",label:"소속"},{key:"role",label:"권한",render:v=>ROLE_LABELS[v]},{key:"active",label:"상태",render:v=><span className={v?"success-text":"danger-text"}>{v?"사용 중":"비활성"}</span>}]} /></Card></div>; }
