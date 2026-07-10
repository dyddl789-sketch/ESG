import { useState, useEffect, useMemo } from "react";
import PageHeader from "../../../shared/components/PageHeader";
import Card from "../../../shared/components/Card";
import DataTable from "../../../shared/components/DataTable";
import Button from "../../../shared/components/Button";
import indicatorApi from "../api/indicatorApi";
import IndicatorFormModal from "../components/IndicatorFormModal";
import { adminColors } from "../components/adminStyles";
import { AdminBadge, AdminTableContainer, AdminSelect } from "../components/AdminUI";

const CATEGORY_LABELS = { ENVIRONMENT: "환경", SOCIAL: "사회", GOVERNANCE: "거버넌스" };
const VALUE_TYPE_LABELS = { QUANTITATIVE: "정량", QUALITATIVE: "정성" };

export default function IndicatorAdminPage() {
  const [indicators, setIndicators] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [showFormModal, setShowFormModal] = useState(false);
  const [editingIndicator, setEditingIndicator] = useState(null);

  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [valueTypeFilter, setValueTypeFilter] = useState("ALL");
  const [activeFilter, setActiveFilter] = useState("ALL");

  const fetchIndicators = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await indicatorApi.getIndicators();
      setIndicators(res.data);
    } catch (err) {
      setError("ESG 지표 목록을 불러오는데 실패했습니다.");
      console.error("Failed to fetch indicators:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIndicators();
  }, []);

  const handleRegister = () => {
    setEditingIndicator(null);
    setShowFormModal(true);
  };

  const handleEdit = (indicator) => {
    setEditingIndicator(indicator);
    setShowFormModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm("정말로 이 지표를 삭제하시겠습니까?")) {
      try {
        await indicatorApi.deleteIndicator(id);
        await fetchIndicators();
      } catch (err) {
        console.error("Failed to delete indicator:", err);
        alert("삭제에 실패했습니다.");
      }
    }
  };

  const handleSave = async (formData) => {
    try {
      if (editingIndicator) {
        await indicatorApi.updateIndicator(editingIndicator.id, formData);
      } else {
        await indicatorApi.createIndicator(formData);
      }
      setShowFormModal(false);
      setEditingIndicator(null);
      await fetchIndicators();
    } catch (err) {
      console.error("Failed to save indicator:", err);
      alert("저장에 실패했습니다.");
    }
  };

  const filteredIndicators = useMemo(() => {
    return indicators.filter((i) => {
      if (categoryFilter !== "ALL" && i.category !== categoryFilter) return false;
      if (valueTypeFilter !== "ALL" && i.value_type !== valueTypeFilter) return false;
      if (activeFilter !== "ALL" && String(i.is_active) !== activeFilter) return false;
      return true;
    });
  }, [indicators, categoryFilter, valueTypeFilter, activeFilter]);

  if (loading) return <div className="page-stack">로딩 중...</div>;
  if (error) return <div className="page-stack error-message">오류: {error}</div>;

  return (
    <div className="page-stack">
      <PageHeader
        breadcrumbs={["플랫폼 관리", "ESG 지표 관리"]}
        title="ESG 지표 관리"
        description="업종별 필수 지표, 단위, 정량·정성 구분을 관리합니다."
        actions={
          <Button
            onClick={handleRegister}
            style={{ backgroundColor: adminColors.primary, borderColor: adminColors.primary }}
          >
            지표 등록
          </Button>
        }
      />

      <Card style={{ padding: 0, overflow: "hidden", borderRadius: "12px", boxShadow: "0 4px 20px rgba(0,0,0,0.05)" }}>
        <div
          style={{
            padding: "16px 20px",
            borderBottom: `1px solid ${adminColors.border}`,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            backgroundColor: "#fafafa",
            flexWrap: "wrap",
            gap: "12px",
          }}
        >
          <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <label style={{ fontSize: "0.85rem", fontWeight: "600", color: adminColors.textSecondary, whiteSpace: "nowrap" }}>
                영역
              </label>
              <AdminSelect
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                style={{ width: "auto", minWidth: "130px" }}
              >
                <option value="ALL">전체</option>
                <option value="ENVIRONMENT">환경 (E)</option>
                <option value="SOCIAL">사회 (S)</option>
                <option value="GOVERNANCE">거버넌스 (G)</option>
              </AdminSelect>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <label style={{ fontSize: "0.85rem", fontWeight: "600", color: adminColors.textSecondary, whiteSpace: "nowrap" }}>
                유형
              </label>
              <AdminSelect
                value={valueTypeFilter}
                onChange={(e) => setValueTypeFilter(e.target.value)}
                style={{ width: "auto", minWidth: "110px" }}
              >
                <option value="ALL">전체</option>
                <option value="QUANTITATIVE">정량</option>
                <option value="QUALITATIVE">정성</option>
              </AdminSelect>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <label style={{ fontSize: "0.85rem", fontWeight: "600", color: adminColors.textSecondary, whiteSpace: "nowrap" }}>
                상태
              </label>
              <AdminSelect
                value={activeFilter}
                onChange={(e) => setActiveFilter(e.target.value)}
                style={{ width: "auto", minWidth: "110px" }}
              >
                <option value="ALL">전체</option>
                <option value="true">사용 중</option>
                <option value="false">중지됨</option>
              </AdminSelect>
            </div>
          </div>
          <div style={{ fontSize: "0.85rem", color: adminColors.textSecondary }}>
            검색 결과: <strong style={{ color: adminColors.textPrimary }}>{filteredIndicators.length}</strong>건
          </div>
        </div>

        <AdminTableContainer>
          <DataTable
            rows={filteredIndicators}
            rowKey="indicator_code"
            onRowClick={handleEdit}
            columns={[
              {
                key: "indicator_code",
                label: "지표코드",
                render: (v) => (
                  <span style={{ fontFamily: "monospace", fontSize: "0.85rem", color: adminColors.textSecondary, fontWeight: "600" }}>
                    {v}
                  </span>
                ),
              },
              {
                key: "category",
                label: "영역",
                render: (v) => {
                  const typeMap = { ENVIRONMENT: "success", SOCIAL: "default", GOVERNANCE: "info" };
                  return <AdminBadge type={typeMap[v]}>{CATEGORY_LABELS[v] ?? v}</AdminBadge>;
                },
              },
              {
                key: "title",
                label: "지표명",
                render: (v) => <span style={{ fontWeight: "600", color: adminColors.textPrimary }}>{v}</span>,
              },
              { key: "value_type", label: "유형", render: (v) => VALUE_TYPE_LABELS[v] ?? v },
              { key: "unit", label: "단위", render: (v) => v || "-" },
              {
                key: "is_active",
                label: "상태",
                render: (v) => <AdminBadge type={v ? "success" : "danger"}>{v ? "사용 중" : "중지"}</AdminBadge>,
              },
              {
                key: "id",
                label: "관리",
                render: (_, row) => (
                  <div style={{ display: "flex", gap: "6px" }}>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEdit(row);
                      }}
                      style={{ borderRadius: "6px", fontSize: "0.85rem" }}
                    >
                      수정
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(row.id);
                      }}
                      style={{
                        borderRadius: "6px",
                        fontSize: "0.85rem",
                        color: adminColors.danger,
                        borderColor: adminColors.danger,
                      }}
                    >
                      삭제
                    </Button>
                  </div>
                ),
              },
            ]}
          />
        </AdminTableContainer>
      </Card>

      {showFormModal && (
        <IndicatorFormModal
          indicator={editingIndicator}
          onClose={() => setShowFormModal(false)}
          onSave={handleSave}
        />
      )}
    </div>
  );
}