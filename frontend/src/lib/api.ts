import axios from 'axios'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

export const upstreamsApi = {
  list: () => apiClient.get('/api/admin/upstreams'),
  get: (id: number) => apiClient.get(`/api/admin/upstreams/${id}`),
  create: (data: any) => apiClient.post('/api/admin/upstreams', data),
  update: (id: number, data: any) => apiClient.put(`/api/admin/upstreams/${id}`, data),
  delete: (id: number) => apiClient.delete(`/api/admin/upstreams/${id}`),
}

export const apiKeysApi = {
  list: (upstreamId?: number) => apiClient.get('/api/admin/keys', { params: { upstream_id: upstreamId } }),
  get: (id: number) => apiClient.get(`/api/admin/keys/${id}`),
  create: (data: any) => apiClient.post('/api/admin/keys', data),
  update: (id: number, data: any) => apiClient.put(`/api/admin/keys/${id}`, data),
  delete: (id: number) => apiClient.delete(`/api/admin/keys/${id}`),
  enable: (id: number) => apiClient.post(`/api/admin/keys/${id}/enable`),
  disable: (id: number) => apiClient.post(`/api/admin/keys/${id}/disable`),
}

export const headerConfigsApi = {
  list: (upstreamId?: number) => apiClient.get('/api/admin/headers', { params: { upstream_id: upstreamId } }),
  get: (id: number) => apiClient.get(`/api/admin/headers/${id}`),
  create: (data: any) => apiClient.post('/api/admin/headers', data),
  update: (id: number, data: any) => apiClient.put(`/api/admin/headers/${id}`, data),
  delete: (id: number) => apiClient.delete(`/api/admin/headers/${id}`),
}

export const rulesApi = {
  list: (upstreamId?: number) => apiClient.get('/api/admin/rules', { params: { upstream_id: upstreamId } }),
  get: (id: number) => apiClient.get(`/api/admin/rules/${id}`),
  create: (data: any) => apiClient.post('/api/admin/rules', data),
  update: (id: number, data: any) => apiClient.put(`/api/admin/rules/${id}`, data),
  delete: (id: number) => apiClient.delete(`/api/admin/rules/${id}`),
}

export const logsApi = {
  list: (params?: any) => apiClient.get('/api/admin/logs', { params }),
  get: (id: number) => apiClient.get(`/api/admin/logs/${id}`),
  stats: (days?: number) => apiClient.get('/api/admin/logs/stats/summary', { params: { days } }),
}

export const dashboardApi = {
  stats: () => apiClient.get('/api/admin/dashboard/stats'),
  realtime: (limit?: number) => apiClient.get('/api/admin/dashboard/realtime', { params: { limit } }),
}

export default apiClient
