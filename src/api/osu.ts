import { getApiConfig } from './storage'
import type { OsuUser } from '../types'

// 开发环境通过 Vite proxy 转发，避免浏览器 CORS 限制
// 生产环境部署时需要配置自己的反向代理
const TOKEN_URL = '/api/osu-token'
const API_BASE = '/api/osu-v2'

let cachedToken: string | null = null
let tokenExpiresAt = 0

/**
 * 获取 access token（自动缓存 + 自动刷新）
 */
async function getToken(): Promise<string> {
  if (cachedToken && Date.now() < tokenExpiresAt - 60000) {
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

  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString()
  })

  if (!res.ok) {
    throw new Error(`获取 osu! token 失败 (${res.status})`)
  }

  const data = await res.json()
  cachedToken = data.access_token as string
  tokenExpiresAt = Date.now() + (data.expires_in || 86400) * 1000
  return cachedToken!
}

/**
 * 调用 osu! API v2
 */
async function apiCall<T = unknown>(path: string): Promise<T | null> {
  const token = await getToken()
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { Authorization: `Bearer ${token}` }
  })
  if (!res.ok) {
    if (res.status === 404) return null
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
  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString()
  })
  return res.ok
}