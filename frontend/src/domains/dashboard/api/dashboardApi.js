import apiClient from "../../../shared/api/apiClient";

const unwrap = (response) => response.data?.data;

const dashboardApi = {
  getSummary: async (year) => unwrap(await apiClient.get("/dashboard/summary", { params: { year } })),
};

export const getDashboardSummary = dashboardApi.getSummary;
export default dashboardApi;
