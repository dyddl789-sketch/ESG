import { useState, useEffect } from "react";
import PageHeader from "../../../shared/components/PageHeader";
import Card from "../../../shared/components/Card";
import DataTable from "../../../shared/components/DataTable";
import Button from "../../../shared/components/Button";
import indicatorApi from "../api/indicatorApi";

const CATEGORY_LABELS = {
  ENVIRONMENT: "환경",
  SOCIAL: "사회",
  GOVERNANCE: "거버넌스",
};

const VALUE_TYPE_LABELS = {
  QUANTITATIVE: "정량",
  QUALITATIVE: "정성",
};

export default function IndicatorAdminPage() {
  const [indicators, setIndicators] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

  if (loading) return <div className="page-stack">로딩 중...</div>;
  if (error) return <div className="page-stack error-message">오류: {error}</div>;

  return (
    <div className="page-stack">
      <PageHeader
        breadcrumbs={["플랫폼 관리", "ESG 지표 관리"]}
        title="ESG 지표 관리"
        description="업종별 필수 지표, 단위, 정량·정성 구분을 관리합니다."
        actions={<Button>지표 등록</Button>}
      />
      <Card>
        <DataTable
          rows={indicators}
          rowKey="indicator_code"
          columns={[
            { key: "indicator_code", label: "지표코드" },
            { key: "category", label: "영역", render: (v) => CATEGORY_LABELS[v] ?? v },
            { key: "title", label: "지표명" },
            { key: "value_type", label: "유형", render: (v) => VALUE_TYPE_LABELS[v] ?? v },
            { key: "unit", label: "단위" },
            {
              key: "is_active",
              label: "상태",
              render: (v) => <span className="success-text">{v ? "사용" : "중지"}</span>,
            },
          ]}
        />
      </Card>
    </div>
  );
}