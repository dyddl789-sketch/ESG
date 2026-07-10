import { useState } from "react";
import Button from "../../../shared/components/Button";
import { ROLES, ROLE_LABELS } from "../../../app/config/roles";
import { adminModalStyles, adminColors } from "../components/adminStyles";
import { AdminBadge, AdminSelect, AdminDetailGrid, AdminDetailItem } from "../components/AdminUI";

export default function UserDetailModal({ user, onClose, onUpdateRole, onToggleActive, onDelete }) {
  const [role, setRole] = useState(user.role);
  const isSystemAdmin = user.role === ROLES.SYSTEM_ADMIN;

  return (
    <div style={adminModalStyles.overlay} onClick={onClose}>
      <div style={{ ...adminModalStyles.content, maxWidth: '550px' }} onClick={(e) => e.stopPropagation()}>
        <div style={adminModalStyles.header}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <h2 style={adminModalStyles.title}>{user.name}</h2>
            <AdminBadge type={user.is_active ? "success" : "danger"}>
              {user.is_active ? "활성 계정" : "비활성 계정"}
            </AdminBadge>
          </div>
          <button style={adminModalStyles.closeBtn} onClick={onClose}>&times;</button>
        </div>

        <div style={adminModalStyles.body}>
          <AdminDetailGrid>
            <AdminDetailItem label="이메일" value={user.email} />
            <AdminDetailItem label="소속 부서" value={user.department_name} />
            <AdminDetailItem label="전화번호" value={user.phone_number} />
            <AdminDetailItem 
              label="최근 로그인" 
              value={user.last_login_at ? new Date(user.last_login_at).toLocaleString() : "로그인 기록 없음"} 
            />
            <AdminDetailItem label="현재 권한" value={ROLE_LABELS[user.role] || user.role} />
          </AdminDetailGrid>

          {!isSystemAdmin && (
            <div style={{ 
              marginTop: '32px', 
              padding: '20px', 
              backgroundColor: '#f9fbf9', 
              borderRadius: '12px',
              border: '1px solid #edf2ed'
            }}>
              <div style={adminModalStyles.field}>
                <label style={adminModalStyles.label}>권한 설정 변경</label>
                <AdminSelect
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                >
                  {Object.values(ROLES)
                    .filter((r) => r !== ROLES.SYSTEM_ADMIN)
                    .map((r) => (
                      <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                    ))}
                </AdminSelect>
                <p style={{ fontSize: '0.8rem', color: '#888', marginTop: '4px' }}>
                  사용자의 시스템 접근 권한 수준을 변경할 수 있습니다.
                </p>
              </div>
            </div>
          )}
        </div>

        <div style={adminModalStyles.footer}>
          {!isSystemAdmin && (
            <>
              <div style={{ marginRight: 'auto' }}>
                <Button 
                  variant="outline" 
                  onClick={() => onDelete(user.id)}
                  style={{ color: adminColors.danger, borderColor: adminColors.danger }}
                >
                  사용자 삭제
                </Button>
              </div>
              <Button
                variant="secondary"
                onClick={() => onToggleActive(user.id, !user.is_active)}
                style={{ minWidth: '100px' }}
              >
                {user.is_active ? "계정 비활성화" : "계정 활성화"}
              </Button>
              <Button 
                onClick={() => onUpdateRole(user.id, role)}
                style={{ backgroundColor: adminColors.primary, borderColor: adminColors.primary, minWidth: '100px' }}
              >
                변경사항 저장
              </Button>
            </>
          )}
          {isSystemAdmin && (
            <Button variant="secondary" onClick={onClose}>닫기</Button>
          )}
        </div>
      </div>
    </div>
  );
}
