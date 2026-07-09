import axios from "../../../shared/api/apiClient";

const indicatorApi = {
  getIndicators: async () => {
    const response = await axios.get("/admin/indicators");
    return response.data;
  },
  createIndicator: async (data) => {
    const response = await axios.post("/admin/indicators", data);
    return response.data;
  },
  updateIndicator: async (id, data) => {
    const response = await axios.put(`/admin/indicators/${id}`, data);
    return response.data;
  },
  deleteIndicator: async (id) => {
    const response = await axios.delete(`/admin/indicators/${id}`);
    return response.data;
  },
};

export default indicatorApi;