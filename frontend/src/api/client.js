import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api'
const ACCESS_KEY = 'jobTrackerAccessToken'
const REFRESH_KEY = 'jobTrackerRefreshToken'

export const apiClient = axios.create({ baseURL: API_BASE_URL, headers: { 'Content-Type': 'application/json' } })
const refreshClient = axios.create({ baseURL: API_BASE_URL })

export function saveTokens(tokens) {
  if (tokens.access) sessionStorage.setItem(ACCESS_KEY, tokens.access)
  if (tokens.refresh) sessionStorage.setItem(REFRESH_KEY, tokens.refresh)
}

export function clearTokens() {
  sessionStorage.removeItem(ACCESS_KEY)
  sessionStorage.removeItem(REFRESH_KEY)
}

export function hasSessionToken() {
  return Boolean(sessionStorage.getItem(ACCESS_KEY) || sessionStorage.getItem(REFRESH_KEY))
}

let refreshRequest
async function refreshAccessToken() {
  if (!refreshRequest) {
    const refresh = sessionStorage.getItem(REFRESH_KEY)
    if (!refresh) throw new Error('No refresh token is available.')
    refreshRequest = refreshClient.post('/auth/token/refresh/', { refresh })
      .then(({ data }) => {
        saveTokens(data)
        return data.access
      })
      .finally(() => { refreshRequest = null })
  }
  return refreshRequest
}

apiClient.interceptors.request.use((config) => {
  const access = sessionStorage.getItem(ACCESS_KEY)
  if (access) config.headers.Authorization = `Bearer ${access}`
  return config
})

apiClient.interceptors.response.use((response) => response, async (error) => {
  const request = error.config
  const url = request?.url || ''
  const isAuthRequest = /\/auth\/(token|token\/refresh|register)\//.test(url)
  if (error.response?.status !== 401 || !request || request._retried || isAuthRequest) throw error

  request._retried = true
  try {
    const access = await refreshAccessToken()
    request.headers.Authorization = `Bearer ${access}`
    return apiClient(request)
  } catch (refreshError) {
    clearTokens()
    window.dispatchEvent(new Event('auth:expired'))
    throw refreshError
  }
})

export async function restoreAccessToken() {
  if (sessionStorage.getItem(ACCESS_KEY)) return sessionStorage.getItem(ACCESS_KEY)
  if (sessionStorage.getItem(REFRESH_KEY)) return refreshAccessToken()
  return null
}
