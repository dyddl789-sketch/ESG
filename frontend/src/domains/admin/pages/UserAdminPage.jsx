import { useState, useEffect } from "react";
import PageHeader from "../../../shared/components/PageHeader";
import Card from "../../../shared/components/Card";
import DataTable from "../../../shared/components/DataTable";
import Button from "../../../shared/components/Button";
import userApi from "../api/userApi";
import { ROLE_LABELS } from "../../../app/config/roles";
import UserDetailModal from "../components/UserDetailModal";
import UserFormModal from "../components/UserFormModal";
import { AdminBadge, AdminTableContainer } from "../components/AdminUI";

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
    let isMounted = true;

    userApi
      .getUsers()
      .then((res) => {
        if (isMounted) {
          setUsers(res.data);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError("사용자 목록을 불러오는데 실패했습니다.");
        }
        console.error("Failed to fetch users:", err);
      })
      .finally(() => {
        if (isMounted) {
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const openDetail = (user) => {
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
        actions={
          <Button 
            onClick={handleRegister}
            style={{ backgroundColor: '#2a7d55', borderColor: '#2a7d55' }}
          >
            사용자 등록
          </Button>
        }
      />
      <Card style={{ padding: 0, overflow: 'hidden', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
        <AdminTableContainer>
          <DataTable
            rows={users}
            onRowClick={openDetail}
            columns={[
              { 
                key: "name", 
                label: "이름",
                render: (v) => <span style={{ fontWeight: '600', color: '#1a1a1a' }}>{v}</span>
              },
              { key: "email", label: "이메일" },
              { key: "department_name", label: "소속" },
              { key: "phone_number", label: "전화번호", render: (v) => v || "-" },
              { 
                key: "role", 
                label: "권한", 
                render: (v) => (
                  <span style={{ 
                    display: 'inline-block', 
                    padding: '2px 8px', 
                    backgroundColor: '#f0f0f0', 
                    borderRadius: '4px', 
                    fontSize: '0.85rem',
                    color: '#555'
                  }}>
                    {ROLE_LABELS[v] ?? v}
                  </span>
                )
              },
              {
                key: "is_active",
                label: "상태",
                render: (v) => (
                  <AdminBadge type={v ? "success" : "danger"}>
                    {v ? "사용 중" : "비활성"}
                  </AdminBadge>
                ),
              },
              {
                key: "id",
                label: "상세",
                render: (_, row) => (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      openDetail(row);
                    }}
                    style={{ borderRadius: '6px', fontSize: '0.85rem' }}
                  >
                    상세보기
                  </Button>
                ),
              },
            ]}
          />
        </AdminTableContainer>
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
