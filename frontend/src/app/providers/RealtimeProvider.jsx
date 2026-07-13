/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  connectEsgSocket,
  disconnectEsgSocket,
  subscribeEsgEvents,
} from "../../shared/realtime/esgSocket";

const RealtimeContext = createContext(null);
const MAX_NOTIFICATIONS = 20;

const notificationTypes = new Set([
  "COLLECTION_COMPLETED",
  "COLLECTION_FAILED",
  "FILE_VALIDATED",
  "FILE_UPLOAD_FAILED",
  "FILE_VALIDATION_FAILED",
  "APPROVAL_STATUS_CHANGED",
  "DASHBOARD_UPDATED",
  "AI_ANALYSIS_COMPLETED",
  "AI_ANALYSIS_FAILED",
]);

const normalizeEvent = (event) => ({
  ...event,
  id: event.id || `${event.type || "EVENT"}-${event.jobId || Date.now()}-${Math.random()}`,
  occurredAt: event.occurredAt || new Date().toISOString(),
});

export function RealtimeProvider({ children }) {
  const [connectionStatus, setConnectionStatus] = useState("CONNECTING");
  const [latestEvent, setLatestEvent] = useState(null);
  const [eventsByDomain, setEventsByDomain] = useState({});
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    const unsubscribe = subscribeEsgEvents((rawEvent) => {
      const event = normalizeEvent(rawEvent);

      if (event.type === "SOCKET_CONNECTED") {
        setConnectionStatus("CONNECTED");
      } else if (["SOCKET_DISCONNECTED", "SOCKET_ERROR"].includes(event.type)) {
        setConnectionStatus("RECONNECTING");
      }

      setLatestEvent(event);

      if (event.domain) {
        setEventsByDomain((current) => ({
          ...current,
          [event.domain.toLowerCase()]: event,
        }));
      }

      if (notificationTypes.has(event.type)) {
        setNotifications((current) => [event, ...current].slice(0, MAX_NOTIFICATIONS));
      }
    });

    connectEsgSocket();

    return () => {
      unsubscribe();
      disconnectEsgSocket();
    };
  }, []);

  const value = useMemo(() => ({
    connectionStatus,
    latestEvent,
    eventsByDomain,
    notifications,
    clearNotifications: () => setNotifications([]),
    eventFor: (domain) => eventsByDomain[domain?.toLowerCase()] || null,
  }), [connectionStatus, eventsByDomain, latestEvent, notifications]);

  return (
    <RealtimeContext.Provider value={value}>
      {children}
    </RealtimeContext.Provider>
  );
}

export function useRealtime() {
  const context = useContext(RealtimeContext);
  if (!context) {
    throw new Error("useRealtime must be used inside RealtimeProvider");
  }
  return context;
}
