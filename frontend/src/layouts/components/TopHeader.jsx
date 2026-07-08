import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../app/providers/AuthProvider";
import { ROLE_LABELS } from "../../app/config/roles";
import Icon from "../../shared/components/Icon";

export default function TopHeader({ collapsed }) {
  const { user, logout } = useAuth();
  const [loggingOut, setLoggingOut] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await logout();
      navigate("/login", { replace: true });
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <header className={`topbar ${collapsed ? "wide" : ""}`}>
      <div className="topbar-company"><strong>에코모빌리티 파츠 주식회사</strong><span>수출 중견 제조기업 ESG 통합관리</span></div>
      <div className="topbar-actions">
        <span className="verified-role">서버 인증 권한 · {ROLE_LABELS[user.role]}</span>
        <button className="icon-btn" type="button"><Icon name="bell" size={19} /><em>3</em></button>
        <div className="profile"><span className="avatar">{user.name.slice(0, 1)}</span><div><strong>{user.name}</strong><span>{user.email}</span></div></div>
        <button className="icon-btn" type="button" onClick={handleLogout} disabled={loggingOut} title="로그아웃"><Icon name="logout" size={19} /></button>
      </div>
    </header>
  );
}
