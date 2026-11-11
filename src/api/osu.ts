import { getApiConfig } from './storage'
import type { OsuUser } from '../types'

// 开发环境通过 Vite proxy 转发，避免浏览器 CORS 限制
// 生产环境部署时需要配置自己的反向代理
const TOKEN_URL = '/api/osu-token'
const API_BASE = '/api/osu-v2'
const REQUEST_TIMEOUT = 12000

let cachedToken: string | null = null
let tokenExpiresAt = 0

/** 带超时的 fetch，避免网络异常时界面一直转圈 */
async function fetchWithTimeout(input: string, init: RequestInit = {}, timeout = REQUEST_TIMEOUT): Promise<Response> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeout)
  try {
    return await fetch(input, { ...init, signal: controller.signal })
  } catch (err) {
    if ((err as Error)?.name === 'AbortError') {
      throw new Error('请求超时，请检查网络或代理设置')
    }
    throw new Error('网络请求失败，请检查网络或代理设置')
  } finally {
    clearTimeout(timer)
  }
}

/**
 * 获取 access token（自动缓存 + 自动刷新）
 * @param force 强制重新获取（token 失效时使用）
 */
async function getToken(force = false): Promise<string> {
  if (!force && cachedToken && Date.now() < tokenExpiresAt - 60000) {
    return cachedToken!
  }

  const config = getApiConfig()
  if (!config || !config.clientId || !config.clientSecret) {
    throw new Error('请先在设置中配置 osu! API 凭证')
  }

  const body = new URLSearchParams({
    client_id: config.clientId,
    client_secret: config.clientSecret,
    grant_type: 'client_credentials',
    scope: 'public'
  })

  const res = await fetchWithTimeout(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString()
  })

  if (!res.ok) {
    if (res.status === 401 || res.status === 403) {
      throw new Error('API 凭证无效，请在设置中重新配置')
    }
    throw new Error(`获取 osu! token 失败 (${res.status})`)
  }

  const data = await res.json()
  cachedToken = data.access_token as string
  tokenExpiresAt = Date.now() + (data.expires_in || 86400) * 1000
  return cachedToken!
}

/** 清空内存中的 token 缓存（凭证变更时调用） */
export function clearTokenCache() {
  cachedToken = null
  tokenExpiresAt = 0
}

/**
 * 调用 osu! API v2，401 时自动刷新 token 重试一次
 */
async function apiCall<T = unknown>(path: string, retried = false): Promise<T | null> {
  const token = await getToken(retried)
  const res = await fetchWithTimeout(`${API_BASE}${path}`, {
    headers: { Authorization: `Bearer ${token}` }
  })
  if (res.status === 401 && !retried) {
    clearTokenCache()
    return apiCall<T>(path, true)
  }
  if (!res.ok) {
    if (res.status === 404) return null
    if (res.status === 429) throw new Error('osu! API 请求过于频繁，请稍后再试')
    throw new Error(`osu! API 请求失败 (${res.status})`)
  }
  return res.json() as Promise<T>
}

/**
 * 通过 UID 获取玩家信息
 */
export async function fetchOsuUser(uid: number): Promise<OsuUser | null> {
  return apiCall<OsuUser>(`/users/${uid}/osu?key=id`)
}

/**
 * 通过用户名反向搜索玩家信息（获取 UID）
 */
export async function fetchOsuUserByName(username: string): Promise<OsuUser | null> {
  return apiCall<OsuUser>(`/users/${encodeURIComponent(username)}/osu?key=username`)
}

/**
 * 验证 API 凭证是否有效
 */
export async function verifyCredentials(clientId: string, clientSecret: string): Promise<boolean> {
  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    grant_type: 'client_credentials',
    scope: 'public'
  })
  const res = await fetchWithTimeout(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString()
  })
  if (res.ok) {
    // 新凭证可用，作废旧缓存
    clearTokenCache()
  }
  return res.ok
}
