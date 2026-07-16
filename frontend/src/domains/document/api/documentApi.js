import apiClient from "../../../shared/api/apiClient";

const unwrap = (response) => response.data?.data ?? response.data;

export const documentApi = {
  helper: async (fileUrl) => unwrap(await apiClient.post("/document-analysis/helper", null, { params: { fileUrl } })),
  submit: async (payload) => unwrap(await apiClient.post("/document-analysis/submit", payload)),
};
