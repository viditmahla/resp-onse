import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const api = axios.create({ baseURL: API });

export const fetchDashboardOverview = (feedstock = "calcite", omega = 5) =>
  api.get(`/dashboard/overview?feedstock=${feedstock}&omega=${omega}`).then(r => r.data);

export const fetchSummary = (feedstock = "calcite", omega = 5) =>
  api.get(`/summary?feedstock=${feedstock}&omega=${omega}`).then(r => r.data);

export const fetchRegionsCdr = (feedstock = "calcite", omega = 5) =>
  api.get(`/regions/cdr?feedstock=${feedstock}&omega=${omega}`).then(r => r.data);

export const fetchStatesCdr = (feedstock = "calcite", omega = 5) =>
  api.get(`/states/cdr?feedstock=${feedstock}&omega=${omega}`).then(r => r.data);

export const fetchTopRivers = (feedstock = "calcite", omega = 5, limit = 20) =>
  api.get(`/rivers/top?feedstock=${feedstock}&omega=${omega}&limit=${limit}`).then(r => r.data);

export const fetchSamples = (feedstock = "calcite", omega = 5, region, state, limit = 200) => {
  let url = `/samples?feedstock=${feedstock}&omega=${omega}&limit=${limit}`;
  if (region) url += `&region=${encodeURIComponent(region)}`;
  if (state) url += `&state=${encodeURIComponent(state)}`;
  return api.get(url).then(r => r.data);
};

export const fetchMapData = (feedstock = "calcite", omega = 5) =>
  api.get(`/samples/map?feedstock=${feedstock}&omega=${omega}`).then(r => r.data);

export const fetchFilters = (feedstock = "calcite", omega = 5) =>
  api.get(`/filters?feedstock=${feedstock}&omega=${omega}`).then(r => r.data);

export const fetchDistributions = (feedstock = "calcite", omega = 5) =>
  api.get(`/analytics/distributions?feedstock=${feedstock}&omega=${omega}`).then(r => r.data);

export const fetchScatterData = (feedstock = "calcite", omega = 5, xField = "discharge", yField = "cdr_t_yr") =>
  api.get(`/analytics/scatter?feedstock=${feedstock}&omega=${omega}&x_field=${xField}&y_field=${yField}`).then(r => r.data);

export const fetchFeedstocks = () =>
  api.get("/feedstocks").then(r => r.data);

export const uploadFeedstock = (file, feedstockName, omegaThreshold) => {
  const formData = new FormData();
  formData.append("file", file);
  return api.post(`/feedstock/upload?feedstock_name=${encodeURIComponent(feedstockName)}&omega_threshold=${omegaThreshold}`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  }).then(r => r.data);
};

export const fetchComparison = (feedstock = "calcite") =>
  api.get(`/comparison?feedstock=${feedstock}`).then(r => r.data);

export const sendChatMessage = (message, sessionId = "default") =>
  api.post("/chat", { message, session_id: sessionId }).then(r => r.data);

export const fetchChatHistory = (sessionId = "default") =>
  api.get(`/chat/history?session_id=${sessionId}`).then(r => r.data);
