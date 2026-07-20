import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../app/providers/AuthProvider";
import { useRealtime } from "../../app/providers/RealtimeProvider";
import { ROLE_LABELS } from "../../app/config/roles";
import Icon from "../../shared/components/Icon";

const eventTitle = (event) => {
  const labels = {
    COLLECTION_COMPLETED: "데이터 등록 완료",
    COLLECTION_FAILED: "데이터 등록 오류",
    FILE_VALIDATED: "파일 검증 완료",
    FILE_UPLOAD_FAILED: "파일 업로드 오류",
    APPROVAL_STATUS_CHANGED: "승인 상태 변경",
    DASHBOARD_UPDATED: "대시보드 갱신",
    AI_ANALYSIS_COMPLETED: "문서 분석 완료",
    AI_ANALYSIS_FAILED: "문서 분석 오류",
  };

  return labels[event.type] || "ESG 운영 알림";
};

const formatTime = (value) => {
  if (!value) {
    return "방금 전";
  }

  return new Date(value).toLocaleTimeString("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

export default function TopHeader({ collapsed }) {
  const { user, logout } = useAuth();
  const {
    connectionStatus,
    notifications,
    clearNotifications,
  } = useRealtime();
  const [loggingOut, setLoggingOut] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
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
      <div className="topbar-company">
        <strong>에코모빌리티 파츠 주식회사</strong>
        <span>수출 중견 제조기업 ESG 통합관리</span>
      </div>

      <div className="topbar-actions">
        <span className="verified-role">서버 인증 권한 · {ROLE_LABELS[user.role]}</span>
        <span className={`socket-state socket-${connectionStatus.toLowerCase()}`}>
          <i />
          {connectionStatus === "CONNECTED" ? "실시간 연결" : "재연결 중"}
        </span>

        <div className="notification-wrap">
          <button
            className="icon-btn"
            type="button"
            aria-label="알림 보기"
            onClick={() => setNotificationOpen((current) => !current)}
          >
            <Icon name="bell" size={19} />
            {notifications.length > 0 && <em>{Math.min(notifications.length, 9)}</em>}
          </button>

          {notificationOpen && (
            <div className="notification-panel">
              <div className="notification-head">
                <div>
                  <strong>실시간 알림</strong>
                  <span>등록·검토·승인 상태 변경</span>
                </div>
                <button type="button" onClick={clearNotifications}>모두 지우기</button>
              </div>

              <div className="notification-list">
                {notifications.length === 0 ? (
                  <div className="notification-empty">새로운 알림이 없습니다.</div>
                ) : notifications.slice(0, 6).map((event) => (
                  <article key={event.id}>
                    <span className={`notification-dot status-${String(event.status || "INFO").toLowerCase()}`} />
                    <div>
                      <strong>{eventTitle(event)}</strong>
                      <p>{event.message}</p>
                      <small>{formatTime(event.occurredAt)}</small>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="profile">
          <span className="avatar">{user.name.slice(0, 1)}</span>
          <div>
            <strong>{user.name}</strong>
            <span>{user.email}</span>
          </div>
        </div>

        <button
          className="icon-btn"
          type="button"
          onClick={handleLogout}
          disabled={loggingOut}
          title="로그아웃"
        >
          <Icon name="logout" size={19} />
        </button>
      </div>
    </header>
  );
}
