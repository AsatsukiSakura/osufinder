import type { ApiConfig } from '../types'

const STORAGE_KEY = 'osufinder_api_config'

export function getApiConfig(): ApiConfig | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as ApiConfig
  } catch {
    return null
  }
}

export function setApiConfig(config: ApiConfig): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config))
}

export function removeApiConfig(): void {
  localStorage.removeItem(STORAGE_KEY)
}