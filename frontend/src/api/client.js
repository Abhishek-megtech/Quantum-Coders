import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 60000,
})

export const detectMethane = ({ bbox, date, simulate = true, threshold = 0.45 }) =>
  api.get('/api/detect', { params: { bbox, date, simulate, threshold } }).then(r => r.data)

export const getFacilities = ({ bbox, limit = 50, sort_by = 'risk_score' } = {}) =>
  api.get('/api/facilities', { params: { bbox, limit, sort_by } }).then(r => r.data)

export const getTopPolluters = (n = 10) =>
  api.get('/api/facilities/ranking/top', { params: { n } }).then(r => r.data)

export const getAlerts = ({ severity, limit = 20, unacknowledged_only = false } = {}) =>
  api.get('/api/alerts', { params: { severity, limit, unacknowledged_only } }).then(r => r.data)

export const getTimeseries = (facility_id, days = 30) =>
  api.get('/api/timeseries', { params: { facility_id, days } }).then(r => r.data)

export const getGlobalTimeseries = (days = 30) =>
  api.get('/api/timeseries/global', { params: { days } }).then(r => r.data)

export const getHeatmap = () =>
  api.get('/api/heatmap').then(r => r.data)

export const runSimulation = (body) =>
  api.post('/api/simulate', body).then(r => r.data)

export const createAlertsWebSocket = () => {
  const wsUrl = BASE_URL.replace('http', 'ws') + '/ws/alerts'
  return new WebSocket(wsUrl)
}

export default api
