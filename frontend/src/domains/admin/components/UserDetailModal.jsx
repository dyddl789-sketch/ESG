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
  fieldStyle,
  labelStyle,
  inputStyle,
} from "../../company/components/modalStyles";

export default function UserDetailModal({ user, onClose, onUpdateRole, onToggleActive, onDelete }) {
  const [role, setRole] = useState(user.role);

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div style={contentStyle} onClick={(e) => e.stopPropagation()}>
        <div style={headerStyle}>
          <h2 style={titleStyle}>{user.name}</h2>
          <button style={closeBtnStyle} onClick={onClose}>&times;</button>
        </div>

        <div className="detail-grid">
          <div>
            <span>이메일</span>
            <strong>{user.email}</strong>
          </div>
          <div>
            <span>소속</span>
            <strong>{user.department_name || "-"}</strong>
          </div>
          <div>
            <span>전화번호</span>
            <strong>{user.phone_number || "-"}</strong>
          </div>
          <div>
            <span>최근 로그인</span>
            <strong>
              {user.last_login_at ? new Date(user.last_login_at).toLocaleString() : "-"}
            </strong>
          </div>
        </div>

        <div style={{ marginTop: 20 }}>
          <div style={fieldStyle}>
            <label style={labelStyle}>권한 변경</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              style={inputStyle}
            >
              {Object.values(ROLES).map((r) => (
                <option key={r} value={r}>{ROLE_LABELS[r]}</option>
              ))}
            </select>
          </div>
        </div>

        <div style={footerStyle}>
          <Button
            variant={user.is_active ? "danger" : "secondary"}
            onClick={() => onToggleActive(user.id, !user.is_active)}
          >
            {user.is_active ? "비활성화" : "활성화"}
          </Button>
          <Button variant="danger" onClick={() => onDelete(user.id)}>삭제</Button>
          <Button onClick={() => onUpdateRole(user.id, role)}>권한 저장</Button>
        </div>
      </div>
    </div>
  );
}