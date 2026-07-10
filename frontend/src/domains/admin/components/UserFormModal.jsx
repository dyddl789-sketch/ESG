import { useState, useEffect } from "react";
import Button from "../../../shared/components/Button";
import { ROLES, ROLE_LABELS } from "../../../app/config/roles";
import userApi from "../api/userApi";
import { adminModalStyles, adminColors } from "../components/adminStyles";
import { AdminInput, AdminSelect } from "../components/AdminUI";

export default function UserFormModal({ onClose, onSave }) {
  const [departments, setDepartments] = useState([]);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    login_id: "",
    role: ROLES.EXTERNAL_USER,
    phone_number: "",
    department_id: "",
  });

  const canHaveDepartment = formData.role !== ROLES.EXTERNAL_USER;

  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const res = await userApi.getDepartments();
        setDepartments(res.data);
      } catch (err) {
        console.error("Failed to fetch departments:", err);
      }
    };
    fetchDepartments();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
      ...(name === "role" && value === ROLES.EXTERNAL_USER ? { department_id: "" } : {}),
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div style={adminModalStyles.overlay} onClick={onClose}>
      <div style={adminModalStyles.content} onClick={(e) => e.stopPropagation()}>
        <div style={adminModalStyles.header}>
          <h2 style={adminModalStyles.title}>새 사용자 등록</h2>
          <button style={adminModalStyles.closeBtn} onClick={onClose}>&times;</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div style={adminModalStyles.body}>
            <div style={{ ...adminModalStyles.fieldGrid, marginBottom: '8px' }}>
              <div style={adminModalStyles.field}>
                <label style={adminModalStyles.label}>이름 <span style={{ color: adminColors.danger }}>*</span></label>
                <AdminInput name="name" value={formData.name} onChange={handleChange} placeholder="성함 입력" required />
              </div>
              <div style={adminModalStyles.field}>
                <label style={adminModalStyles.label}>이메일 <span style={{ color: adminColors.danger }}>*</span></label>
                <AdminInput type="email" name="email" value={formData.email} onChange={handleChange} placeholder="example@domain.com" required />
              </div>
            </div>

            <div style={adminModalStyles.fieldGrid}>
              <div style={adminModalStyles.field}>
                <label style={adminModalStyles.label}>로그인 ID <span style={{ color: adminColors.danger }}>*</span></label>
                <AdminInput name="login_id" value={formData.login_id} onChange={handleChange} placeholder="아이디 입력" required />
              </div>
              <div style={adminModalStyles.field}>
                <label style={adminModalStyles.label}>전화번호</label>
                <AdminInput name="phone_number" value={formData.phone_number} onChange={handleChange} placeholder="010-0000-0000" />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '20px', marginTop: '8px' }}>
              <div style={{ ...adminModalStyles.field, flex: 1 }}>
                <label style={adminModalStyles.label}>권한 설정 <span style={{ color: adminColors.danger }}>*</span></label>
                <AdminSelect name="role" value={formData.role} onChange={handleChange}>
                  {Object.values(ROLES)
                  .filter((r) => r !== ROLES.SYSTEM_ADMIN)
                  .map((r) => (
                      <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                  ))}
                </AdminSelect>
              </div>
              {canHaveDepartment && (
                <div style={{ ...adminModalStyles.field, flex: 1 }}>
                  <label style={adminModalStyles.label}>소속 부서</label>
                  <AdminSelect
                    name="department_id"
                    value={formData.department_id}
                    onChange={handleChange}
                  >
                    <option value="">선택 안 함</option>
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.facility_name} - {d.dept_name}
                      </option>
                    ))}
                  </AdminSelect>
                </div>
              )}
            </div>
            
            <div style={{ 
              marginTop: '12px', 
              padding: '12px 16px', 
              backgroundColor: adminColors.infoLight, 
              borderRadius: '8px',
              fontSize: '0.85rem',
              color: adminColors.info,
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <span>ℹ️</span>
              <span>등록 시 시스템에서 임시 비밀번호가 자동 생성되어 안내됩니다.</span>
            </div>
          </div>
          
          <div style={adminModalStyles.footer}>
            <Button variant="secondary" onClick={onClose} style={{ minWidth: '80px' }}>취소</Button>
            <Button 
              type="submit" 
              style={{ 
                backgroundColor: adminColors.primary, 
                borderColor: adminColors.primary,
                minWidth: '100px',
                fontWeight: '600'
              }}
            >
              사용자 등록 완료
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
