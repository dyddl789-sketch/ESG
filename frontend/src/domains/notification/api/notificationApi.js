import apiClient from "../../../shared/api/apiClient";

const unwrap = (response) => response.data?.data ?? response.data;

export const notificationApi = {
  list: async (params = {}) => unwrap(await apiClient.get("/notifications", { params })),
  unreadCount: async () => unwrap(await apiClient.get("/notifications/unread-count")),
  markRead: async (id) => unwrap(await apiClient.patch(`/notifications/${id}/read`)),
  markAllRead: async () => unwrap(await apiClient.patch("/notifications/read-all")),
};
