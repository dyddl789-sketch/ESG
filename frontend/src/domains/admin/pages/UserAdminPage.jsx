import { useState, useEffect } from "react";
import PageHeader from "../../../shared/components/PageHeader";
import Card from "../../../shared/components/Card";
import DataTable from "../../../shared/components/DataTable";
import Button from "../../../shared/components/Button";
import userApi from "../api/userApi";
import { ROLE_LABELS } from "../../../app/config/roles";
import UserDetailModal from "../components/UserDetailModal";
import UserFormModal from "../components/UserFormModal";

export default function UserAdminPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  const [showFormModal, setShowFormModal] = useState(false);

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

  const handleRowClick = (user) => {
    setSelectedUser(user);
    setShowDetailModal(true);
  };

  const handleCloseDetail = () => {
    setShowDetailModal(false);
    setSelectedUser(null);
  };

  const handleUpdateRole = async (id, role) => {
    try {
      await userApi.updateRole(id, role);
      await fetchUsers();
      setShowDetailModal(false);
      setSelectedUser(null);
    } catch (err) {
      console.error("Failed to update role:", err);
    }
  };

  const handleToggleActive = async (id, isActive) => {
    try {
      await userApi.updateActive(id, isActive);
      await fetchUsers();
      setShowDetailModal(false);
      setSelectedUser(null);
    } catch (err) {
      console.error("Failed to update active status:", err);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("정말로 이 사용자를 삭제하시겠습니까?")) {
      try {
        await userApi.deleteUser(id);
        await fetchUsers();
        setShowDetailModal(false);
        setSelectedUser(null);
      } catch (err) {
        console.error("Failed to delete user:", err);
      }
    }
  };

  const handleRegister = () => {
    setShowFormModal(true);
  };

  const handleSaveNewUser = async (formData) => {
  try {
    const res = await userApi.createUser(formData);
    await fetchUsers();
    setShowFormModal(false);
    alert(`사용자가 등록되었습니다.\n임시 비밀번호: ${res.data.temp_password}\n(사용자에게 안전하게 전달해주세요)`);
  } catch (err) {
    console.error("Failed to create user:", err);
  }
};

  if (loading) return <div className="page-stack">로딩 중...</div>;
  if (error) return <div className="page-stack error-message">오류: {error}</div>;

  return (
    <div className="page-stack">
      <PageHeader
        breadcrumbs={["플랫폼 관리", "사용자·권한 관리"]}
        title="사용자·권한 관리"
        description="3개 역할과 계정 활성 상태를 관리합니다."
        actions={<Button onClick={handleRegister}>사용자 등록</Button>}
      />
      <Card>
        <DataTable
          rows={users}
          onRowClick={handleRowClick}
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

      {showDetailModal && selectedUser && (
        <UserDetailModal
          user={selectedUser}
          onClose={handleCloseDetail}
          onUpdateRole={handleUpdateRole}
          onToggleActive={handleToggleActive}
          onDelete={handleDelete}
        />
      )}

      {showFormModal && (
        <UserFormModal
          onClose={() => setShowFormModal(false)}
          onSave={handleSaveNewUser}
        />
      )}
    </div>
  );
}