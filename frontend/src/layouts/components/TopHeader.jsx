import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../app/providers/AuthProvider";
import { useRealtime } from "../../app/providers/RealtimeProvider";
import { ROLE_LABELS } from "../../app/config/roles";
import Icon from "../../shared/components/Icon";

const eventTitle = (event) => event.title || ({
  ESG_APPROVAL_REQUESTED: "ESG 승인 요청",
  ESG_APPROVED: "ESG 데이터 승인 완료",
  ESG_REJECTED: "ESG 데이터 반려",
  COLLECTION_COMPLETED: "데이터 등록 완료",
  COLLECTION_FAILED: "데이터 등록 오류",
  AI_ANALYSIS_COMPLETED: "문서 분석 완료",
  AI_ANALYSIS_FAILED: "문서 분석 오류",
}[event.type] || "ESG 운영 알림");

const formatTime = (value) => value ? new Date(value).toLocaleString("ko-KR", {
  month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit",
}) : "방금 전";

export default function TopHeader() {
  const { user, logout } = useAuth();
  const { connectionStatus, notifications, unreadCount, markRead, markAllRead } = useRealtime();
  const [loggingOut, setLoggingOut] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const navigate = useNavigate();
  const panelRef = useRef(null);

  useEffect(() => {
    const close = (event) => {
      if (panelRef.current && !panelRef.current.contains(event.target)) setNotificationOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const handleLogout = async () => {
    setLoggingOut(true);
    try { await logout(); navigate("/login", { replace: true }); }
    finally { setLoggingOut(false); }
  };

  const openNotification = async (notification) => {
    try { await markRead(notification); } catch (error) { console.error("알림 읽음 처리 실패", error); }
    setNotificationOpen(false);
    if (notification.targetUrl) navigate(notification.targetUrl);
  };

  return (
    <header className="topbar">
      <div className="topbar-company"><strong>에코모빌리티 파츠 주식회사</strong><span>중견 자동차 부품 제조기업 ESG 통합관리</span></div>
      <div className="topbar-actions">
        <span className="verified-role">{ROLE_LABELS[user.role]}</span>
        <span className={`socket-state socket-${connectionStatus.toLowerCase()}`}><i />{connectionStatus === "CONNECTED" ? "실시간 연결" : "재연결 중"}</span>
        <div className="notification-wrap" ref={panelRef}>
          <button className="icon-btn" type="button" aria-label="알림 보기" onClick={() => setNotificationOpen((current) => !current)}>
            <Icon name="bell" size={19} />{unreadCount > 0 && <em>{Math.min(unreadCount, 99)}</em>}
          </button>
          {notificationOpen && (
            <div className="notification-panel">
              <div className="notification-head"><div><strong>업무 알림</strong><span>승인 요청·승인·반려 이력</span></div><button type="button" onClick={() => void markAllRead()}>모두 읽음</button></div>
              <div className="notification-list">
                {notifications.length === 0 ? <div className="notification-empty">새로운 알림이 없습니다.</div> : notifications.slice(0, 12).map((event) => (
                  <button type="button" className={`notification-item ${event.read ? "is-read" : "is-unread"}`} key={event.id} onClick={() => void openNotification(event)}>
                    <span className={`notification-dot status-${String(event.type || "INFO").toLowerCase()}`} />
                    <div><strong>{eventTitle(event)}</strong><p>{event.message}</p><small>{formatTime(event.occurredAt)}</small></div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
        <div className="profile"><span className="avatar">{user.name.slice(0, 1)}</span><div><strong>{user.name}</strong><span>{user.email}</span></div></div>
        <button className="icon-btn" type="button" onClick={handleLogout} disabled={loggingOut} title="로그아웃"><Icon name="logout" size={19} /></button>
      </div>
    </header>
  );
}
