const listeners = new Set();

let socket = null;
let retryTimer = null;
let retryCount = 0;
let manualClose = false;

const MAX_RETRY_DELAY = 15000;

const resolveUrl = () => {
  const explicitUrl = import.meta.env.VITE_WS_URL;
  if (explicitUrl) {
    return explicitUrl;
  }

  const backendUrl = import.meta.env.VITE_BACKEND_URL;
  if (backendUrl) {
    return `${backendUrl.replace(/^http/, "ws")}/ws/esg`;
  }

  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  return `${protocol}//${window.location.host}/ws/esg`;
};

const notify = (payload) => {
  listeners.forEach((listener) => listener(payload));
};

const scheduleReconnect = () => {
  if (manualClose || retryTimer) {
    return;
  }

  const delay = Math.min(1000 * (2 ** retryCount), MAX_RETRY_DELAY);
  retryTimer = window.setTimeout(() => {
    retryTimer = null;
    retryCount += 1;
    connectEsgSocket();
  }, delay);
};

export const connectEsgSocket = () => {
  manualClose = false;

  if (socket && [WebSocket.OPEN, WebSocket.CONNECTING].includes(socket.readyState)) {
    return socket;
  }

  socket = new WebSocket(resolveUrl());

  socket.onopen = () => {
    retryCount = 0;
    notify({
      type: "SOCKET_CONNECTED",
      status: "CONNECTED",
      message: "실시간 알림 연결이 활성화되었습니다.",
      occurredAt: new Date().toISOString(),
    });
  };

  socket.onmessage = (messageEvent) => {
    try {
      notify(JSON.parse(messageEvent.data));
    } catch {
      notify({
        type: "SOCKET_MESSAGE_INVALID",
        status: "WARNING",
        message: "해석할 수 없는 실시간 메시지를 수신했습니다.",
        occurredAt: new Date().toISOString(),
      });
    }
  };

  socket.onerror = () => {
    notify({
      type: "SOCKET_ERROR",
      status: "ERROR",
      message: "실시간 알림 서버 연결을 확인하고 있습니다.",
      occurredAt: new Date().toISOString(),
    });
  };

  socket.onclose = () => {
    socket = null;
    notify({
      type: "SOCKET_DISCONNECTED",
      status: "DISCONNECTED",
      message: "실시간 알림 연결이 끊겨 자동 재연결을 시도합니다.",
      occurredAt: new Date().toISOString(),
    });
    scheduleReconnect();
  };

  return socket;
};

export const disconnectEsgSocket = () => {
  manualClose = true;
  window.clearTimeout(retryTimer);
  retryTimer = null;
  retryCount = 0;

  if (socket) {
    socket.close(1000, "application shutdown");
    socket = null;
  }
};

export const subscribeEsgEvents = (listener) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};
