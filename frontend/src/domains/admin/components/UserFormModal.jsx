import { useState, useEffect } from "react";
import Button from "../../../shared/components/Button";
import { ROLES, ROLE_LABELS } from "../../../app/config/roles";
import userApi from "../api/userApi";
import {
  overlayStyle,
  contentStyle,
  headerStyle,
  titleStyle,
  closeBtnStyle,
  footerStyle,
  fieldGridStyle,
  fieldStyle,
  labelStyle,
  inputStyle,
} from "../../company/components/modalStyles";

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
    <div style={overlayStyle} onClick={onClose}>
      <div style={contentStyle} onClick={(e) => e.stopPropagation()}>
        <div style={headerStyle}>
          <h2 style={titleStyle}>사용자 등록</h2>
          <button style={closeBtnStyle} onClick={onClose}>&times;</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div style={fieldGridStyle}>
            <div style={fieldStyle}>
              <label style={labelStyle}>이름</label>
              <input name="name" value={formData.name} onChange={handleChange} required style={inputStyle} />
            </div>
            <div style={fieldStyle}>
              <label style={labelStyle}>이메일</label>
              <input type="email" name="email" value={formData.email} onChange={handleChange} required style={inputStyle} />
            </div>
            <div style={fieldStyle}>
              <label style={labelStyle}>로그인 ID</label>
              <input name="login_id" value={formData.login_id} onChange={handleChange} required style={inputStyle} />
            </div>
            <div style={fieldStyle}>
              <label style={labelStyle}>전화번호</label>
              <input name="phone_number" value={formData.phone_number} onChange={handleChange} style={inputStyle} />
            </div>
            <div style={fieldStyle}>
              <label style={labelStyle}>권한</label>
              <select name="role" value={formData.role} onChange={handleChange} style={inputStyle}>
                {Object.values(ROLES)
                .filter((r) => r !== ROLES.SYSTEM_ADMIN)
                .map((r) => (
                    <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                ))}
              </select>
            </div>
            {canHaveDepartment && (
              <div style={fieldStyle}>
                <label style={labelStyle}>소속</label>
                <select
                  name="department_id"
                  value={formData.department_id}
                  onChange={handleChange}
                  style={inputStyle}
                >
                  <option value="">선택 안 함</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.facility_name} - {d.dept_name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
          <div style={footerStyle}>
            <Button type="submit">등록</Button>
            <Button variant="secondary" onClick={onClose}>취소</Button>
          </div>
        </form>
      </div>
    </div>
  );
}