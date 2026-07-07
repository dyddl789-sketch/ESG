import { useNavigate } from "react-router-dom";
import { useAuth } from "../../app/providers/AuthProvider";
import { ROLE_HOME, ROLE_LABELS, ROLES } from "../../app/config/roles";
import Icon from "../../shared/components/Icon";

export default function TopHeader({ collapsed }) {
  const { user, logout, switchRole } = useAuth();
  const navigate = useNavigate();
  const handleRole = (event) => navigate(switchRole(event.target.value));
  const handleLogout = () => { logout(); navigate("/"); };
  return (
    <header className={`topbar ${collapsed ? "wide" : ""}`}>
      <div className="topbar-company"><strong>에코모빌리티 파츠 주식회사</strong><span>수출 중견 제조기업 ESG 통합관리</span></div>
      <div className="topbar-actions">
        <label className="role-switch"><span>데모 권한</span><select value={user.role} onChange={handleRole}>{Object.values(ROLES).map((role) => <option key={role} value={role}>{ROLE_LABELS[role]}</option>)}</select></label>
        <button className="icon-btn" type="button"><Icon name="bell" size={19} /><em>3</em></button>
        <div className="profile"><span className="avatar">{user.name.slice(0, 1)}</span><div><strong>{user.name}</strong><span>{ROLE_LABELS[user.role]}</span></div></div>
        <button className="icon-btn" type="button" onClick={handleLogout} title="로그아웃"><Icon name="logout" size={19} /></button>
      </div>
    </header>
  );
}
