import { useDemoData } from "../../../app/providers/DemoDataProvider";
import { useAuth } from "../../../app/providers/AuthProvider";
import { ROLES } from "../../../app/config/roles";
import PageHeader from "../../../shared/components/PageHeader";
import Card from "../../../shared/components/Card";
import Button from "../../../shared/components/Button";

export default function CompanyProfilePage() {
  const { user } = useAuth();
  const { db } = useDemoData();
  const company = db.company;
  const canManage = [ROLES.SYSTEM_ADMIN, ROLES.COMPANY_MANAGER].includes(user.role);
  const actionLabel = user.role === ROLES.SYSTEM_ADMIN ? "기업 관리" : "정보 수정";

  return (
    <div className="page-stack">
      <PageHeader
        breadcrumbs={[user.role === ROLES.SYSTEM_ADMIN ? "플랫폼 관리" : "기업 설정", "기업·사업장 정보"]}
        title="기업·사업장 정보"
        description="ESG 데이터의 조직·사업장 기준정보를 관리합니다."
        actions={canManage ? <Button>{actionLabel}</Button> : <span className="verified-role">조회 전용</span>}
      />

      <div className="two-cols">
        <Card title="기업 기본정보">
          <div className="detail-grid">
            {[
              ["기업명", company.name],
              ["업종", company.industry],
              ["기업규모", company.scale],
              ["사업자번호", company.businessNumber],
              ["대표자", company.representative],
              ["운영 상태", "사용 중"],
            ].map(([label, value]) => (
              <div key={label}>
                <span>{label}</span>
                <strong>{value}</strong>
              </div>
            ))}
          </div>
        </Card>

        <Card title="사업장">
          <div className="facility-list">
            {db.facilities.map((facility) => (
              <article key={facility.id}>
                <span>{facility.id}</span>
                <div>
                  <strong>{facility.name}</strong>
                  <small>{facility.address}</small>
                </div>
                <button type="button">상세</button>
              </article>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
