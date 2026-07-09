import React, { useState, useEffect } from "react";
import PageHeader from "../../../shared/components/PageHeader";
import Card from "../../../shared/components/Card";
import Button from "../../../shared/components/Button";
import { useAuth } from "../../../app/providers/AuthProvider";
import { ROLES } from "../../../app/config/roles";
import companyApi from "../api/companyApi";
import FacilityDetailModal from "../components/FacilityDetailModal";
import CompanyEditModal from "../components/CompanyEditModal";
import FacilityFormModal from "../components/FacilityFormModal";

// TODO: Toast/Alert 컴포넌트 추가 필요
const showToast = (message, type) => {
  console.log(`Toast: ${type} - ${message}`);
  // 실제 토스트 알림 구현 (예: react-toastify)
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

  const [showCompanyEditModal, setShowCompanyEditModal] = useState(false);

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

  const handleEditCompany = () => {
    setShowCompanyEditModal(true);
  };

  const handleSaveCompany = async (updatedCompany) => {
    try {
      await companyApi.updateCompany(updatedCompany);
      showToast("기업 정보가 성공적으로 수정되었습니다.", "success");
      setShowCompanyEditModal(false);
      fetchCompanyData(); // 데이터 새로고침
    } catch (err) {
      showToast("기업 정보 수정에 실패했습니다.", "error");
      console.error("Failed to update company:", err);
    }
  };

  const handleAddFacility = () => {
    setEditingFacility(null);
    setShowFacilityFormModal(true);
  };

  const handleEditFacility = (facility) => {
    setSelectedFacility(null); // 상세 모달 닫기
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
      fetchFacilitiesData(); // 데이터 새로고침
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
        fetchFacilitiesData(); // 데이터 새로고침
      } catch (err) {
        showToast("사업장 삭제에 실패했습니다.", "error");
        console.error("Failed to delete facility:", err);
      }
    }
  };

  if (loading) {
    return <div className="page-stack">로딩 중...</div>; // TODO: 스피너 컴포넌트 사용
  }

  if (error) {
    return <div className="page-stack error-message">오류: {error}</div>;
  }

  return (
    <div className="page-stack">
      <PageHeader
        breadcrumbs={["기업 설정", "기업·사업장 정보"]}
        title="기업·사업장 정보"
        description="ESG 데이터의 조직·사업장 기준정보를 관리합니다."
        actions={canManage && <Button onClick={handleEditCompany}>정보 수정</Button>}
      />
      <div className="two-cols">
        <Card title="기업 기본정보">
          <div className="detail-grid">
            {company ? (
              <>
                <div>
                  <span>기업명</span>
                  <strong>{company.name}</strong>
                </div>
                <div>
                  <span>업종</span>
                  <strong>{company.industry}</strong>
                </div>
                <div>
                  <span>기업규모</span>
                  <strong>{company.scale}</strong>
                </div>
                <div>
                  <span>사업자번호</span>
                  <strong>{company.businessNumber}</strong>
                </div>
                <div>
                  <span>대표자</span>
                  <strong>{company.representative}</strong>
                </div>
                <div>
                  <span>운영 상태</span>
                  <strong>사용 중</strong>
                </div>
              </>
            ) : (
              <div>기업 정보가 없습니다.</div>
            )}
          </div>
        </Card>
        <Card title="사업장">
          <div className="facility-list">
            {facilities.length > 0 ? (
              facilities.map((f) => (
                <article key={f.id} onClick={() => handleFacilityClick(f)} style={{ cursor: "pointer" }}>
                  <span>{f.id}</span>
                  <div>
                    <strong>{f.facility_name}</strong>
                    <small>{f.address}</small>
                  </div>
                  {/* 상세 버튼은 카드 클릭으로 대체되므로 제거 */}
                </article>
              ))
            ) : (
              <div>등록된 사업장이 없습니다.</div>
            )}
          </div>
          {canManage && (
            <div style={{ marginTop: "20px", textAlign: "right" }}>
              <Button onClick={handleAddFacility}>사업장 등록</Button>
            </div>
          )}
        </Card>
      </div>

      {showFacilityDetailModal && selectedFacility && (
        <FacilityDetailModal
          facility={selectedFacility}
          onClose={handleCloseFacilityDetailModal}
          onEdit={handleEditFacility}
          onDelete={handleDeleteFacility}
          canEdit={canManage}
        />
      )}

      {showCompanyEditModal && company && (
        <CompanyEditModal
          company={company}
          onClose={() => setShowCompanyEditModal(false)}
          onSave={handleSaveCompany}
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
