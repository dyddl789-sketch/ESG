import axios from "../../../shared/api/apiClient";

const scoreApi = {
  getYearlyScores: async () => {
    const response = await axios.get("/public/scores", {
      params: { reporting_period: "YEARLY" },
    });
    return response.data;
  },
};

export default scoreApi;