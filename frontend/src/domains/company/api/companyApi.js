import axios from "../../../shared/api/apiClient";

const companyApi = {
  // 기업 기본정보 조회
  getCompany: async () => {
    const response = await axios.get("/api/companies/me");
    return response.data;
  },

  // 기업 기본정보 수정
  updateCompany: async (data) => {
    const response = await axios.put("/api/companies/me", data);
    return response.data;
  },

  // 사업장 목록 조회
  getFacilities: async () => {
    const response = await axios.get("/api/companies/me/facilities");
    return response.data;
  },

  // 사업장 등록
  createFacility: async (data) => {
    const response = await axios.post("/api/companies/me/facilities", data);
    return response.data;
  },

  // 사업장 수정
  updateFacility: async (id, data) => {
    const response = await axios.put(`/api/companies/me/facilities/${id}`, data);
    return response.data;
  },

  // 사업장 삭제
  deleteFacility: async (id) => {
    const response = await axios.delete(`/api/companies/me/facilities/${id}`);
    return response.data;
  },
};

export default companyApi;
