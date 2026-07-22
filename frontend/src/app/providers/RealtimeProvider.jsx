/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import Swal from "sweetalert2";
import { useAuth } from "./AuthProvider";
import { notificationApi } from "../../domains/notification/api/notificationApi";
import {
  connectEsgSocket,
  disconnectEsgSocket,
  subscribeEsgEvents,
} from "../../shared/realtime/esgSocket";

const RealtimeContext = createContext(null);
const MAX_NOTIFICATIONS = 50;
const NOTIFICATION_POLL_INTERVAL = 10000;
const workflowTypes = new Set(["ESG_APPROVAL_REQUESTED", "ESG_APPROVED", "ESG_REJECTED"]);
const genericNotificationTypes = new Set([
  "COLLECTION_COMPLETED", "COLLECTION_FAILED", "FILE_VALIDATED", "FILE_UPLOAD_FAILED",
  "FILE_VALIDATION_FAILED", "DASHBOARD_UPDATED", "AI_ANALYSIS_COMPLETED", "AI_ANALYSIS_FAILED",
]);

const normalizeEvent = (event) => ({
  ...event,
  type: event.notificationType || event.type,
  id: event.id || `${event.type || "EVENT"}-${event.jobId || Date.now()}-${Math.random()}`,
  occurredAt: event.createdAt || event.occurredAt || new Date().toISOString(),
  read: Boolean(event.read),
});

const workflowTitle = (event) => event.title || ({
  ESG_APPROVAL_REQUESTED: "ESG 승인 요청",
  ESG_APPROVED: "ESG 데이터 승인 완료",
  ESG_REJECTED: "ESG 데이터 반려",
}[event.type] || "ESG 업무 알림");

const showWorkflowToast = (event) => {
  const icon = event.type === "ESG_REJECTED"
    ? "warning"
    : event.type === "ESG_APPROVED"
      ? "success"
      : "info";

  void Swal.fire({
    toast: true,
    position: "top-end",
    icon,
    title: workflowTitle(event),
    text: event.message || "새로운 ESG 업무 알림이 도착했습니다.",
    showConfirmButton: false,
    timer: 5000,
    timerProgressBar: true,
  });
};

export function RealtimeProvider({ children }) {
  const { user, isAuthenticated } = useAuth();
  const [connectionStatus, setConnectionStatus] = useState("DISCONNECTED");
  const [latestEvent, setLatestEvent] = useState(null);
  const [eventsByDomain, setEventsByDomain] = useState({});
  const [notifications, setNotifications] = useState([]);
  const initializedRef = useRef(false);
  const seenNotificationIdsRef = useRef(new Set());

  const rememberNotification = useCallback((event) => {
    if (event?.id != null) {
      seenNotificationIdsRef.current.add(String(event.id));
    }
  }, []);

  const isUnseenWorkflowNotification = useCallback((event) => (
    workflowTypes.has(event.type)
    && !event.read
    && event.id != null
    && !seenNotificationIdsRef.current.has(String(event.id))
  ), []);

  const loadNotifications = useCallback(async ({ notifyNew = false } = {}) => {
    if (!isAuthenticated) return;
    try {
      const rows = await notificationApi.list({ limit: MAX_NOTIFICATIONS });
      const normalizedRows = (rows || []).map(normalizeEvent);

      if (notifyNew && initializedRef.current) {
        normalizedRows
          .filter(isUnseenWorkflowNotification)
          .slice()
          .reverse()
          .forEach(showWorkflowToast);
      }

      normalizedRows.forEach(rememberNotification);
      initializedRef.current = true;
      setNotifications(normalizedRows);
    } catch (error) {
      console.error("알림 이력 조회 실패", error);
    }
  }, [isAuthenticated, isUnseenWorkflowNotification, rememberNotification]);

  useEffect(() => {
    if (!isAuthenticated || !user) {
      disconnectEsgSocket();
      initializedRef.current = false;
      seenNotificationIdsRef.current.clear();
      void Promise.resolve().then(() => {
        setConnectionStatus("DISCONNECTED");
        setNotifications([]);
      });
      return undefined;
    }

    void Promise.resolve().then(() => {
      setConnectionStatus("CONNECTING");
      return loadNotifications();
    });

    const unsubscribe = subscribeEsgEvents((rawEvent) => {
      const event = normalizeEvent(rawEvent);
      if (event.type === "SOCKET_CONNECTED") {
        setConnectionStatus("CONNECTED");
        void loadNotifications({ notifyNew: true });
      } else if (["SOCKET_DISCONNECTED", "SOCKET_ERROR"].includes(event.type)) {
        setConnectionStatus("RECONNECTING");
      }

      setLatestEvent(event);
      if (event.domain) {
        setEventsByDomain((current) => ({ ...current, [event.domain.toLowerCase()]: event }));
      }

      if (workflowTypes.has(event.type)) {
        const shouldToast = isUnseenWorkflowNotification(event);
        rememberNotification(event);
        setNotifications((current) => [event, ...current.filter((item) => item.id !== event.id)].slice(0, MAX_NOTIFICATIONS));
        if (shouldToast) showWorkflowToast(event);
      } else if (genericNotificationTypes.has(event.type)) {
        setNotifications((current) => [event, ...current].slice(0, MAX_NOTIFICATIONS));
      }
    });

    connectEsgSocket();

    const pollTimer = window.setInterval(() => {
      void loadNotifications({ notifyNew: true });
    }, NOTIFICATION_POLL_INTERVAL);

    const reconnectOnRefresh = () => {
      disconnectEsgSocket();
      connectEsgSocket();
      void loadNotifications({ notifyNew: true });
    };
    const refreshOnFocus = () => void loadNotifications({ notifyNew: true });

    window.addEventListener("auth:token-refreshed", reconnectOnRefresh);
    window.addEventListener("focus", refreshOnFocus);

    return () => {
      unsubscribe();
      window.clearInterval(pollTimer);
      window.removeEventListener("auth:token-refreshed", reconnectOnRefresh);
      window.removeEventListener("focus", refreshOnFocus);
      disconnectEsgSocket();
    };
  }, [isAuthenticated, isUnseenWorkflowNotification, loadNotifications, rememberNotification, user]);

  const markRead = useCallback(async (notification) => {
    if (!notification?.id || !workflowTypes.has(notification.type)) return notification;
    const updated = await notificationApi.markRead(notification.id);
    setNotifications((current) => current.map((item) => (
      item.id === notification.id ? normalizeEvent(updated || { ...item, read: true }) : item
    )));
    return updated;
  }, []);

  const markAllRead = useCallback(async () => {
    await notificationApi.markAllRead();
    setNotifications((current) => current.map((item) => ({ ...item, read: true })));
  }, []);

  const value = useMemo(() => ({
    connectionStatus,
    latestEvent,
    eventsByDomain,
    notifications,
    unreadCount: notifications.filter((item) => !item.read && workflowTypes.has(item.type)).length,
    markRead,
    markAllRead,
    reloadNotifications: loadNotifications,
    clearNotifications: () => setNotifications([]),
    eventFor: (domain) => eventsByDomain[domain?.toLowerCase()] || null,
  }), [connectionStatus, eventsByDomain, latestEvent, loadNotifications, markAllRead, markRead, notifications]);

  return <RealtimeContext.Provider value={value}>{children}</RealtimeContext.Provider>;
}

export function useRealtime() {
  const context = useContext(RealtimeContext);
  if (!context) throw new Error("useRealtime must be used inside RealtimeProvider");
  return context;
}
