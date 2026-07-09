import { useState, useEffect } from "react";
import PageHeader from "../../../shared/components/PageHeader";
import Card from "../../../shared/components/Card";
import DataTable from "../../../shared/components/DataTable";
import Button from "../../../shared/components/Button";
import userApi from "../api/userApi";
import { ROLE_LABELS } from "../../../app/config/roles";

export default function UserAdminPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await userApi.getUsers();
      setUsers(res.data);
    } catch (err) {
      setError("사용자 목록을 불러오는데 실패했습니다.");
      console.error("Failed to fetch users:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  if (loading) return <div className="page-stack">로딩 중...</div>;
  if (error) return <div className="page-stack error-message">오류: {error}</div>;

  return (
    <div className="page-stack">
      <PageHeader
        breadcrumbs={["플랫폼 관리", "사용자·권한 관리"]}
        title="사용자·권한 관리"
        description="3개 역할과 계정 활성 상태를 관리합니다."
        actions={<Button>사용자 등록</Button>}
      />
      <Card>
        <DataTable
          rows={users}
          columns={[
            { key: "name", label: "이름" },
            { key: "email", label: "이메일" },
            { key: "department_name", label: "소속" },
            { key: "role", label: "권한", render: (v) => ROLE_LABELS[v] ?? v },
            {
              key: "is_active",
              label: "상태",
              render: (v) => (
                <span className={v ? "success-text" : "danger-text"}>
                  {v ? "사용 중" : "비활성"}
                </span>
              ),
            },
          ]}
        />
      </Card>
    </div>
  );
}