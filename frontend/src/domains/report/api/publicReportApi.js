import apiClient from "../../../shared/api/apiClient";

export const publicReportApi = {
  list: () => apiClient.get("/public/reports"),
};