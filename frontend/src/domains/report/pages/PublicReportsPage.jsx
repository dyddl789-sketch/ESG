import { useDemoData } from "../../../app/providers/DemoDataProvider";
import PageHeader from "../../../shared/components/PageHeader";
import Card from "../../../shared/components/Card";
import DataTable from "../../../shared/components/DataTable";
import Button from "../../../shared/components/Button";
import Icon from "../../../shared/components/Icon";
export default function PublicReportsPage(){ const {db}=useDemoData(); const rows=db.reports.filter(r=>r.status==="공개"); return <div className="page-stack"><PageHeader breadcrumbs={["공개 ESG 정보","공개 보고서"]} title="ESG 공개 보고서" description="승인 및 공개가 완료된 지속가능경영 보고서를 제공합니다."/><Card><DataTable rows={rows} columns={[{key:"year",label:"보고연도"},{key:"title",label:"보고서명"},{key:"version",label:"버전"},{key:"publishedAt",label:"공개일"},{key:"status",label:"상태"},{key:"id",label:"다운로드",render:()=> <Button variant="outline" size="sm"><Icon name="download" size={15}/> PDF</Button>}]} /></Card></div>; }
