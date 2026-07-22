import apiClient from "../../../shared/api/apiClient";

const unwrap = (response) => response.data?.data ?? response.data;

export const externalBenchmarkApi = {
  get: async (year) => unwrap(await apiClient.get("/external-benchmarks", { params: year ? { year } : {} })),
  sync: async () => unwrap(await apiClient.post("/external-benchmarks/sync")),
};
