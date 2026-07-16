import apiClient from "../../../shared/api/apiClient";

const unwrap = (response) => response.data?.data;

const dashboardApi = {
  getSummary: async (year, month, facilityId) => unwrap(await apiClient.get("/dashboard/summary", {
    params: {
      year,
      ...(month ? { month } : {}),
      ...(facilityId ? { facilityId } : {}),
    },
  })),
};

export const getDashboardSummary = dashboardApi.getSummary;
export default dashboardApi;
