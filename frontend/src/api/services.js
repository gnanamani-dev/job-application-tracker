import { apiClient } from './client.js'

export const authApi = {
  register: (values) => apiClient.post('/auth/register/', values).then(({ data }) => data),
  login: (values) => apiClient.post('/auth/token/', values).then(({ data }) => data),
  currentUser: () => apiClient.get('/auth/me/').then(({ data }) => data),
}

export const applicationsApi = {
  list: (params) => apiClient.get('/applications/', { params }).then(({ data }) => data),
  get: (id) => apiClient.get(`/applications/${id}/`).then(({ data }) => data),
  create: (values) => apiClient.post('/applications/', values).then(({ data }) => data),
  update: (id, values) => apiClient.patch(`/applications/${id}/`, values).then(({ data }) => data),
  remove: (id) => apiClient.delete(`/applications/${id}/`),
}

export const dashboardApi = {
  summary: () => apiClient.get('/dashboard/summary/').then(({ data }) => data),
  analytics: () => apiClient.get('/analytics/applications/').then(({ data }) => data),
}

export function getApiErrorMessage(error) {
  const data = error.response?.data
  if (!data) return 'Unable to reach the server. Check that Django is running and try again.'
  if (typeof data.detail === 'string') return data.detail
  const labels = { password_confirmation: 'Password confirmation', applied_date: 'Applied date', job_url: 'Job URL', non_field_errors: '' }
  return Object.entries(data).map(([field, messages]) => {
    const label = labels[field] ?? field.replaceAll('_', ' ')
    const message = Array.isArray(messages) ? messages.join(' ') : typeof messages === 'object' ? JSON.stringify(messages) : messages
    return `${label ? `${label}: ` : ''}${message}`
  }).join(' ')
}
