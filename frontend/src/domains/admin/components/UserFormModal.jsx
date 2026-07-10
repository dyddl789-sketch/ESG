import { useState } from "react";
import Button from "../../../shared/components/Button";
import { ROLES, ROLE_LABELS } from "../../../app/config/roles";
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
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    login_id: "",
    role: ROLES.EXTERNAL_USER,
    phone_number: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
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
                {Object.values(ROLES).map((r) => (
                  <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                ))}
              </select>
            </div>
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