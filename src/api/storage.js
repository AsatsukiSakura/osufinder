const STORAGE_KEY = 'osufinder_api_config'

export function getApiConfig() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw)
  } catch {
    return null
  }
}

export function setApiConfig(config) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config))
}

export function removeApiConfig() {
  localStorage.removeItem(STORAGE_KEY)
}
