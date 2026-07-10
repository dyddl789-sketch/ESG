import React, { useState, useEffect } from "react";
import PageHeader from "../../../shared/components/PageHeader";
import Card from "../../../shared/components/Card";
import Button from "../../../shared/components/Button";
import { useAuth } from "../../../app/providers/AuthProvider";
import { ROLES } from "../../../app/config/roles";
import companyApi from "../api/companyApi";
import FacilityDetailModal from "../components/FacilityDetailModal";
import FacilityFormModal from "../components/FacilityFormModal";
import { COLORS, FONT_SIZE, RADIUS } from "../components/companyStyles";
import { AdminBadge, InfoBox } from "../components/CompanyUI";

// TODO: Toast/Alert 컴포넌트 추가 필요
const showToast = (message, type) => {
  console.log(`Toast: ${type} - ${message}`);
};

export default function CompanyProfilePage() {
  const { user } = useAuth();
  const currentUserRole = user?.role;

  const [company, setCompany] = useState(null);
  const [facilities, setFacilities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [showFacilityDetailModal, setShowFacilityDetailModal] = useState(false);
  const [selectedFacility, setSelectedFacility] = useState(null);

  const [showFacilityFormModal, setShowFacilityFormModal] = useState(false);
  const [editingFacility, setEditingFacility] = useState(null);

  const canManage = [ROLES.SYSTEM_ADMIN, ROLES.COMPANY_MANAGER].includes(currentUserRole);

  const fetchCompanyData = async () => {
    setLoading(true);
    setError(null);
    try {
      const companyData = await companyApi.getCompany();
      setCompany(companyData.data);
    } catch (err) {
      setError("기업 정보를 불러오는데 실패했습니다.");
      showToast("기업 정보를 불러오는데 실패했습니다.", "error");
      console.error("Failed to fetch company data:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchFacilitiesData = async () => {
    setLoading(true);
    setError(null);
    try {
      const facilitiesData = await companyApi.getFacilities();
      setFacilities(facilitiesData.data);
    } catch (err) {
      setError("사업장 목록을 불러오는데 실패했습니다.");
      showToast("사업장 목록을 불러오는데 실패했습니다.", "error");
      console.error("Failed to fetch facilities data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanyData();
    fetchFacilitiesData();
  }, []);

  const handleFacilityClick = (facility) => {
    setSelectedFacility(facility);
    setShowFacilityDetailModal(true);
  };

  const handleCloseFacilityDetailModal = () => {
    setShowFacilityDetailModal(false);
    setSelectedFacility(null);
  };

  const handleAddFacility = () => {
    setEditingFacility(null);
    setShowFacilityFormModal(true);
  };

  const handleEditFacility = (facility) => {
    setSelectedFacility(null);
    setShowFacilityDetailModal(false);
    setEditingFacility(facility);
    setShowFacilityFormModal(true);
  };

  const handleSaveFacility = async (newFacilityData) => {
    try {
      if (editingFacility) {
        await companyApi.updateFacility(editingFacility.id, newFacilityData);
        showToast("사업장 정보가 성공적으로 수정되었습니다.", "success");
      } else {
        await companyApi.createFacility(newFacilityData);
        showToast("사업장이 성공적으로 등록되었습니다.", "success");
      }
      setShowFacilityFormModal(false);
      setEditingFacility(null);
      fetchFacilitiesData();
    } catch (err) {
      showToast("사업장 정보 저장에 실패했습니다.", "error");
      console.error("Failed to save facility:", err);
    }
  };

  const handleDeleteFacility = async (facilityId) => {
    if (window.confirm("정말로 이 사업장을 삭제하시겠습니까?")) {
      try {
        await companyApi.deleteFacility(facilityId);
        showToast("사업장이 성공적으로 삭제되었습니다.", "success");
        setShowFacilityDetailModal(false);
        setSelectedFacility(null);
        fetchFacilitiesData();
      } catch (err) {
        showToast("사업장 삭제에 실패했습니다.", "error");
        console.error("Failed to delete facility:", err);
      }
    }
  };

  if (loading) {
    return (
      <div className="page-stack" style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "200px", color: COLORS.textSecondary }}>
        로딩 중...
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-stack" style={{ padding: "40px", textAlign: "center", color: COLORS.danger }}>
        오류: {error}
      </div>
    );
  }

  return (
    <div className="page-stack" style={{ gap: "32px", maxWidth: "1400px", margin: "0 auto" }}>
      <PageHeader
        breadcrumbs={["기업 설정", "기업·사업장 정보"]}
        title="기업·사업장 정보"
        description="ESG 데이터의 조직·사업장 기준정보를 관리합니다."
      />

      <Card>
        <div style={{ margin: "-20px" }}>
          <InfoBox title="지속 가능한 모빌리티 공급망 구축">
            에너지 효율 개선, 안전한 근로환경, 투명한 의사결정을 핵심 가치로 ESG 경영을 추진합니다.
          </InfoBox>
        </div>
      </Card>

      {/* 기업 기본정보 섹션 - 전체 화면 대응을 위해 2열 그리드 및 스타일 개선 */}
      <Card title="기업 기본정보">
        <div style={{ 
          display: "grid", 
          gridTemplateColumns: "repeat(2, 1fr)", 
          gap: "24px 48px",
          padding: "8px 0"
        }}>
          {company ? (
            <>
              {[
                { label: "기업명", value: company.name },
                { label: "업종", value: company.industry },
                { label: "기업규모", value: company.scale },
                { label: "사업자번호", value: company.business_number },
                { label: "대표자", value: company.representative },
              ].map((item) => (
                <div key={item.label} style={{ 
                  display: "flex", 
                  flexDirection: "column", 
                  gap: "8px",
                  borderBottom: `1px solid ${COLORS.bgHover}`,
                  paddingBottom: "12px"
                }}>
                  <span style={{ fontSize: FONT_SIZE.xs, color: COLORS.textSecondary, fontWeight: "600", textTransform: "uppercase" }}>{item.label}</span>
                  <strong style={{ fontSize: "16px", color: COLORS.textPrimary }}>{item.value}</strong>
                </div>
              ))}
              <div style={{ display: "flex", flexDirection: "column", gap: "8px", paddingBottom: "12px" }}>
                <span style={{ fontSize: FONT_SIZE.xs, color: COLORS.textSecondary, fontWeight: "600", textTransform: "uppercase" }}>운영 상태</span>
                <div>
                  <AdminBadge type="success" style={{ fontSize: FONT_SIZE.sm, padding: "4px 12px" }}>사용 중</AdminBadge>
                </div>
              </div>
            </>
          ) : (
            <div style={{ gridColumn: "span 2", textAlign: "center", padding: "20px", color: COLORS.textSecondary }}>기업 정보가 없습니다.</div>
          )}
        </div>
      </Card>

      {/* 사업장 목록 섹션 - 등록 버튼 복구 및 상세 버튼 추가 */}
<Card title="사업장 관리">
  <div style={{ 
    display: "flex", 
    justifyContent: "flex-end", 
    marginBottom: "1px" 
  }}>
    {canManage && (
      <Button onClick={handleAddFacility} style={{ backgroundColor: COLORS.primary, fontWeight: "600" }}>
        + 신규 사업장 등록
      </Button>
    )}
  </div>
  <div className="facility-list" style={{ marginTop: "8px" }}>
          {facilities.length > 0 ? (
            <div style={{ border: `1px solid ${COLORS.border}`, borderRadius: RADIUS.md, overflow: "hidden" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                <thead>
                  <tr style={{ backgroundColor: COLORS.bgHover, borderBottom: `1px solid ${COLORS.border}` }}>
                    <th style={{ padding: "16px", fontSize: FONT_SIZE.xs, color: COLORS.textSecondary, fontWeight: "700", width: "80px" }}>ID</th>
                    <th style={{ padding: "16px", fontSize: FONT_SIZE.xs, color: COLORS.textSecondary, fontWeight: "700" }}>사업장명</th>
                    <th style={{ padding: "16px", fontSize: FONT_SIZE.xs, color: COLORS.textSecondary, fontWeight: "700" }}>주소</th>
                    <th style={{ padding: "16px", fontSize: FONT_SIZE.xs, color: COLORS.textSecondary, fontWeight: "700", width: "120px", textAlign: "center" }}>액션</th>
                  </tr>
                </thead>
                <tbody>
                  {facilities.map((f) => (
                    <tr 
                      key={f.id} 
                      onClick={() => handleFacilityClick(f)} 
                      style={{ 
                        cursor: "pointer", 
                        borderBottom: `1px solid ${COLORS.border}`,
                        transition: "background-color 0.2s"
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = COLORS.bgHover}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                    >
                      <td style={{ padding: "16px", fontSize: FONT_SIZE.sm, color: COLORS.textSecondary }}>#{f.id}</td>
                      <td style={{ padding: "16px" }}>
                        <div style={{ fontWeight: "700", color: COLORS.textPrimary, fontSize: FONT_SIZE.md }}>{f.facility_name}</div>
                      </td>
                      <td style={{ padding: "16px", fontSize: FONT_SIZE.sm, color: COLORS.textSecondary }}>{f.address}</td>
                      <td style={{ padding: "16px", textAlign: "center" }}>
                        <button 
                          style={{ 
                            padding: "6px 12px", 
                            borderRadius: RADIUS.sm, 
                            border: `1px solid ${COLORS.primary}`, 
                            backgroundColor: "transparent", 
                            color: COLORS.primary,
                            fontSize: FONT_SIZE.xs,
                            fontWeight: "600",
                            cursor: "pointer",
                            transition: "all 0.2s"
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = COLORS.primary;
                            e.currentTarget.style.color = COLORS.white;
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = "transparent";
                            e.currentTarget.style.color = COLORS.primary;
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleFacilityClick(f);
                          }}
                        >
                          상세보기
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{ textAlign: "center", padding: "60px", color: COLORS.textSecondary, border: `1px dashed ${COLORS.border}`, borderRadius: RADIUS.md, backgroundColor: COLORS.bgHover }}>
              등록된 사업장이 없습니다. 상단의 버튼을 통해 새로운 사업장을 등록해 주세요.
            </div>
          )}
        </div>
      </Card>

      {showFacilityDetailModal && selectedFacility && (
        <FacilityDetailModal
          facility={selectedFacility}
          onClose={handleCloseFacilityDetailModal}
          onEdit={handleEditFacility}
          onDelete={handleDeleteFacility}
          canEdit={canManage}
        />
      )}

      {showFacilityFormModal && (
        <FacilityFormModal
          facility={editingFacility}
          onClose={() => setShowFacilityFormModal(false)}
          onSave={handleSaveFacility}
        />
      )}
    </div>
  );
}
