import { useDemoData } from "../../../app/providers/DemoDataProvider";
import PageHeader from "../../../shared/components/PageHeader";
import Card from "../../../shared/components/Card";
import DataTable from "../../../shared/components/DataTable";
import Button from "../../../shared/components/Button";
export default function IndicatorAdminPage(){ const {db}=useDemoData(); return <div className="page-stack"><PageHeader breadcrumbs={["플랫폼 관리","ESG 지표 관리"]} title="ESG 지표 관리" description="업종별 필수 지표, 단위, 정량·정성 구분을 관리합니다." actions={<Button>지표 등록</Button>}/><Card><DataTable rows={db.indicators} rowKey="code" columns={[{key:"code",label:"지표코드"},{key:"category",label:"영역"},{key:"title",label:"지표명"},{key:"type",label:"유형"},{key:"unit",label:"단위"},{key:"active",label:"상태",render:v=><span className="success-text">{v?"사용":"중지"}</span>}]} /></Card></div>; }
