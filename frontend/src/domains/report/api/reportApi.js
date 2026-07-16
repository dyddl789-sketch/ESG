import apiClient from "../../../shared/api/apiClient";

export const reportApi = {
  generate: (data) => apiClient.post("/reports", data),
  getTemplates: () => apiClient.get("/reports/templates"),
  getFacilities: () => apiClient.get("/reports/facilities"),
  getReports: () => apiClient.get("/reports"),
  togglePublic: (id, isPublic) => apiClient.patch(`/reports/${id}/public?isPublic=${isPublic}`),
  deleteReport: (id) => apiClient.delete(`/reports/${id}`),
};