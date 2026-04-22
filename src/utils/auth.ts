import { Capacitor, CapacitorHttp } from '@capacitor/core'

const AUTH_STORAGE_KEY = 'odoo-demo-authenticated'
const AUTH_USERNAME_KEY = 'odoo-demo-username'
const AUTH_UID_KEY = 'odoo-demo-uid'

const ODOO_BASE_URL = 'https://mrp.staging-sourceamax.asia'
const WEB_PROXY_BASE = '/odoo-api'
const AUTH_ENDPOINT = '/web/session/authenticate'
const LOGOUT_ENDPOINT = '/web/session/destroy'
const ODOO_DATABASE = 'memot_rubber_plantation_staging'
export const DEFAULT_ALLOWED_COMPANY_IDS = [1]
export const DEFAULT_COMPANY_ID = 1

type OdooJsonRpcError = {
  data?: {
    message?: string
  }
  message?: string
}

type OdooAuthenticateResult = {
  uid?: number
  username?: string
}

type OdooJsonRpcResponse<T> = {
  error?: OdooJsonRpcError
  result?: T
}

const canUseStorage = () => typeof window !== 'undefined'

const clearStoredAuth = () => {
  if (!canUseStorage()) {
    return
  }

  localStorage.removeItem(AUTH_STORAGE_KEY)
  localStorage.removeItem(AUTH_USERNAME_KEY)
  localStorage.removeItem(AUTH_UID_KEY)
}

const getErrorMessage = (error: OdooJsonRpcError) =>
  error.data?.message || error.message || 'Login failed. Please try again.'

export const isNativePlatform = () => Capacitor.isNativePlatform()

export const buildUrl = (path: string) => {
  if (isNativePlatform()) {
    return `${ODOO_BASE_URL}${path}`
  }

  if (import.meta.env.DEV) {
    return `${WEB_PROXY_BASE}${path}`
  }

  return `${ODOO_BASE_URL}${path}`
}

export const postJsonRpc = async <T>(
  path: string,
  params: Record<string, unknown>
) => {
  const payload = {
    jsonrpc: '2.0',
    method: 'call',
    params,
    id: 1,
  }

  try {
    if (isNativePlatform()) {
      const response = await CapacitorHttp.post({
        url: buildUrl(path),
        headers: {
          'Content-Type': 'application/json',
        },
        data: payload,
      })

      if (response.status < 200 || response.status >= 300) {
        throw new Error(`Request failed with status ${response.status}.`)
      }

      return response.data as OdooJsonRpcResponse<T>
    }

    const response = await fetch(buildUrl(path), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      throw new Error(`Request failed with status ${response.status}.`)
    }

    return (await response.json()) as OdooJsonRpcResponse<T>
  } catch (error) {
    if (error instanceof Error && error.message === 'Failed to fetch') {
      throw new Error(
        'Network request was blocked before reaching the server. This is usually a CORS or connectivity issue.'
      )
    }

    throw error
  }
}

export const isAuthenticated = () =>
  canUseStorage() && localStorage.getItem(AUTH_STORAGE_KEY) === 'true'

export const getStoredUsername = () =>
  canUseStorage() ? localStorage.getItem(AUTH_USERNAME_KEY) ?? '' : ''

export const getStoredUserId = () =>
  canUseStorage() ? localStorage.getItem(AUTH_UID_KEY) ?? '' : ''

export const login = async (username: string, password: string) => {
  const payload = await postJsonRpc<OdooAuthenticateResult>(AUTH_ENDPOINT, {
    db: ODOO_DATABASE,
    login: username,
    password,
  })

  if (payload.error) {
    clearStoredAuth()
    throw new Error(getErrorMessage(payload.error))
  }

  const authenticatedUser = payload.result?.username || username.trim()
  const userId = payload.result?.uid

  if (canUseStorage()) {
    localStorage.setItem(AUTH_STORAGE_KEY, 'true')
    localStorage.setItem(AUTH_USERNAME_KEY, authenticatedUser)

    if (typeof userId === 'number') {
      localStorage.setItem(AUTH_UID_KEY, String(userId))
    } else {
      localStorage.removeItem(AUTH_UID_KEY)
    }
  }

  return payload.result
}

export const logout = async () => {
  try {
    await postJsonRpc(LOGOUT_ENDPOINT, {})
  } catch {
    // Clear local auth even if the remote session destroy call fails.
  } finally {
    clearStoredAuth()
  }
}
