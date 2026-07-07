import apiClient from "../../../shared/api/apiClient";
export const integrationApi = { list: () => apiClient.get("/integrations"), run: (id) => apiClient.post(`/integrations/${id}/run`) };
