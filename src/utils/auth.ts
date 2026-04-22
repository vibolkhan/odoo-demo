const AUTH_STORAGE_KEY = 'odoo-demo-authenticated'
const AUTH_USERNAME_KEY = 'odoo-demo-username'

const canUseStorage = () => typeof window !== 'undefined'

export const isAuthenticated = () =>
  canUseStorage() && localStorage.getItem(AUTH_STORAGE_KEY) === 'true'

export const getStoredUsername = () =>
  canUseStorage() ? localStorage.getItem(AUTH_USERNAME_KEY) ?? '' : ''

export const login = (username: string) => {
  if (!canUseStorage()) {
    return
  }

  localStorage.setItem(AUTH_STORAGE_KEY, 'true')
  localStorage.setItem(AUTH_USERNAME_KEY, username)
}

export const logout = () => {
  if (!canUseStorage()) {
    return
  }

  localStorage.removeItem(AUTH_STORAGE_KEY)
  localStorage.removeItem(AUTH_USERNAME_KEY)
}
