import { useDemoData } from "../../../app/providers/DemoDataProvider";
import PageHeader from "../../../shared/components/PageHeader";
import Card from "../../../shared/components/Card";
export default function PublicCompanyPage(){ const {db}=useDemoData(); return <div className="page-stack"><PageHeader breadcrumbs={["공개 ESG 정보","기업 ESG 정보"]} title={db.company.name} description={`${db.company.industry} · ${db.company.scale}`}/><Card title="기업 ESG 정책"><div className="public-copy"><h2>지속가능한 모빌리티 공급망 구축</h2><p>에너지 효율 개선, 안전한 근로환경, 투명한 의사결정을 핵심 가치로 ESG 경영을 추진합니다.</p></div></Card><Card title="사업장 현황"><div className="facility-grid">{db.facilities.map(f=><article key={f.id}><strong>{f.name}</strong><span>{f.address}</span></article>)}</div></Card></div>; }
