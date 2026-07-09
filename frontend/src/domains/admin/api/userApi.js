import axios from "../../../shared/api/apiClient";

const userApi = {
  getUsers: async () => {
    const response = await axios.get("/admin/users");
    return response.data;
  },
  createUser: async (data) => {
    const response = await axios.post("/admin/users", data);
    return response.data;
  },
  updateUser: async (id, data) => {
    const response = await axios.put(`/admin/users/${id}`, data);
    return response.data;
  },
  deleteUser: async (id) => {
    const response = await axios.delete(`/admin/users/${id}`);
    return response.data;
  },
};

export default userApi;