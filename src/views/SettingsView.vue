<template>
  <div>
    <header class="page-header">
      <h2 class="page-title">设置</h2>
      <p class="page-subtitle">个性化你的 osu!Finder</p>
    </header>

    <div class="settings-grid">
      <section class="setting-card">
        <div class="setting-header">
          <h3>主题</h3>
          <p class="muted">选择你喜欢的界面外观</p>
        </div>

        <div class="theme-options">
          <button
            type="button"
            class="theme-option"
            :class="{ active: currentTheme === 'light' }"
            @click="setTheme('light')"
          >
            <div class="theme-preview theme-preview--light">
              <div class="swatch"></div>
            </div>
            <span>浅色</span>
          </button>

          <button
            type="button"
            class="theme-option"
            :class="{ active: currentTheme === 'dark' }"
            @click="setTheme('dark')"
          >
            <div class="theme-preview theme-preview--dark">
              <div class="swatch"></div>
            </div>
            <span>深色</span>
          </button>
        </div>
      </section>

      <section class="setting-card">
        <div class="setting-header">
          <h3>osu! API</h3>
          <p class="muted">配置 API 凭证后可从 osu! 获取玩家基本信息</p>
        </div>

        <div class="api-config">
          <div class="field-group">
            <label class="field-label">Client ID</label>
            <input v-model="apiClientId" class="input" placeholder="输入 osu! OAuth Client ID" />
          </div>
          <div class="field-group">
            <label class="field-label">Client Secret</label>
            <input v-model="apiClientSecret" type="password" class="input" placeholder="输入 osu! OAuth Client Secret" />
          </div>
          <div class="api-actions">
            <button type="button" class="btn btn-primary" @click="saveApiConfig" :disabled="apiSaving">
              {{ apiSaving ? '验证中...' : '保存并验证' }}
            </button>
            <button v-if="hasApiConfig" type="button" class="btn btn-secondary" @click="clearApiConfig">清除凭证</button>
          </div>
          <p class="muted" style="margin-top: 8px; font-size: var(--font-size-xs);">
            在 <a href="https://osu.ppy.sh/home/account/edit#oauth" target="_blank" rel="noopener">osu! 账号设置 → OAuth</a> 创建新的 OAuth 应用获取凭证
          </p>
          <p class="muted" style="margin-top: 4px; font-size: var(--font-size-xs);">
            凭证仅保存在本机浏览器中，请勿在共用设备上保存。
          </p>
        </div>
      </section>

      <section class="setting-card">
        <div class="setting-header">
          <h3>数据管理</h3>
          <p class="muted">管理本地存储的数据</p>
        </div>

        <div class="data-stats">
          <div class="stat-item">
            <span class="stat-label">玩家数量</span>
            <span class="stat-value">{{ stats.playerCount }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">事迹数量</span>
            <span class="stat-value">{{ stats.recordCount }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">赛事数量</span>
            <span class="stat-value">{{ stats.tournamentCount }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">队伍数量</span>
            <span class="stat-value">{{ stats.teamCount }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">存储空间占用</span>
            <span class="stat-value">{{ formatBytes(stats.storageBytes) }}</span>
          </div>
        </div>

        <div class="data-actions">
          <button type="button" class="btn btn-danger" @click="handleClearPlayers">清空所有玩家</button>
          <button type="button" class="btn btn-danger" @click="handleClearTournaments">清空所有赛事</button>
        </div>
      </section>

      <section class="setting-card">
        <div class="setting-header">
          <h3>导出数据</h3>
          <p class="muted">导出为 JSON 文件发送给他人</p>
        </div>

        <div class="export-section">
          <div class="export-group">
            <span class="export-group-label">玩家数据</span>
            <div class="export-options">
              <button type="button" class="btn export-btn export-btn--green" @click="handleExport('green')">
                <span class="export-dot export-dot--green"></span>
                只导出绿色（公开事迹）
              </button>
              <button type="button" class="btn export-btn export-btn--yellow" @click="handleExport('yellow_and_below')">
                <span class="export-dot export-dot--green"></span>
                <span class="export-dot export-dot--yellow"></span>
                导出绿色 + 黄色
              </button>
              <button type="button" class="btn export-btn export-btn--red" @click="handleExport('all')">
                <span class="export-dot export-dot--green"></span>
                <span class="export-dot export-dot--yellow"></span>
                <span class="export-dot export-dot--red"></span>
                导出所有（含红色）
              </button>
            </div>
          </div>
          <div class="export-group">
            <span class="export-group-label">赛事数据</span>
            <div class="export-options">
              <button type="button" class="btn export-btn" @click="handleTournamentExport">
                <span class="export-dot export-dot--all"></span>
                导出所有赛事
              </button>
            </div>
          </div>
        </div>
      </section>

      <section class="setting-card">
        <div class="setting-header">
          <h3>导入数据</h3>
          <p class="muted">从 JSON 文件导入，已有数据将智能合并</p>
        </div>

        <div class="export-section">
          <div class="export-group">
            <span class="export-group-label">玩家数据</span>
            <div class="import-options">
              <label class="btn btn-primary import-btn">
                <span>选择 JSON 文件导入玩家</span>
                <input type="file" accept=".json,application/json" @change="handleImportPlayers" class="file-input" />
              </label>
              <p class="muted import-hint">已有玩家的昵称 / 联系方式将去重合并，已有记录不会重复添加</p>
            </div>
          </div>
          <div class="export-group">
            <span class="export-group-label">赛事数据</span>
            <div class="import-options">
              <label class="btn btn-primary import-btn">
                <span>选择 JSON 文件导入赛事</span>
                <input type="file" accept=".json,application/json" @change="handleImportTournaments" class="file-input" />
              </label>
              <p class="muted import-hint">已有赛事将按名称 + 届次合并，已有队伍不会被覆盖</p>
            </div>
          </div>
        </div>
      </section>

      <section class="setting-card">
        <div class="setting-header">
          <h3>关于</h3>
          <p class="muted">应用信息</p>
        </div>

        <ul class="info-list">
          <li><span>应用名称</span><span>osu!Finder</span></li>
          <li><span>版本</span><span>v{{ version }}</span></li>
          <li><span>框架</span><span>Vue {{ deps.vue }}</span></li>
          <li><span>路由</span><span>Vue Router {{ deps.vueRouter }}</span></li>
          <li><span>数据库</span><span>Dexie.js {{ deps.dexie }}</span></li>
          <li><span>构建工具</span><span>Vite {{ deps.vite }}</span></li>
          <li><span>存储位置</span><span>浏览器本地 (IndexedDB)</span></li>
          <li><span>数据同步</span><span>纯离线 · 不上传</span></li>
        </ul>
      </section>
    </div>

    <div v-if="toast" class="toast" :class="toast.type">{{ toast.text }}</div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { playersRepo, tournamentRepo } from '../db'
import { useToast } from '../composables/useToast'
import { getApiConfig, setApiConfig, removeApiConfig } from '../api/storage'
import { verifyCredentials } from '../api/osu'
import { version } from '../../package.json'

const stats = ref({ playerCount: 0, recordCount: 0, tournamentCount: 0, teamCount: 0, storageBytes: 0 })
const currentTheme = ref('light')
const { toast, showToast } = useToast()

// osu! API 凭证
const apiClientId = ref('')
const apiClientSecret = ref('')
const apiSaving = ref(false)
const hasApiConfig = ref(false)

function loadApiConfig() {
  const config = getApiConfig()
  if (config) {
    apiClientId.value = config.clientId || ''
    apiClientSecret.value = config.clientSecret || ''
    hasApiConfig.value = true
  }
}

async function saveApiConfig() {
  const id = apiClientId.value.trim()
  const secret = apiClientSecret.value.trim()
  if (!id || !secret) {
    showToast('请填写 Client ID 和 Client Secret', 'error')
    return
  }
  apiSaving.value = true
  try {
    const ok = await verifyCredentials(id, secret)
    if (!ok) {
      showToast('凭证验证失败，请检查是否正确', 'error')
      return
    }
    setApiConfig({ clientId: id, clientSecret: secret })
    hasApiConfig.value = true
    showToast('API 凭证保存成功', 'success')
  } catch {
    showToast('验证请求失败，请检查网络', 'error')
  } finally {
    apiSaving.value = false
  }
}

function clearApiConfig() {
  removeApiConfig()
  apiClientId.value = ''
  apiClientSecret.value = ''
  hasApiConfig.value = false
  showToast('API 凭证已清除', 'success')
}

const deps = {
  vue: '3.5.34',
  vueRouter: '4.6.4',
  dexie: '4.4.3',
  vite: '8.0.12'
}

onMounted(async () => {
  currentTheme.value =
    document.documentElement.getAttribute('data-theme') ||
    (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
  loadApiConfig()
  await refreshStats()
})

function setTheme(theme: string) {
  document.documentElement.setAttribute('data-theme', theme)
  currentTheme.value = theme
  localStorage.setItem('app-theme', theme)
  showToast('主题已切换', 'success')
}

async function handleClearPlayers() {
  if (!confirm('确定要删除所有玩家数据吗？此操作不可撤销。')) return
  try {
    const all = await playersRepo.getAll()
    for (const p of all) {
      await playersRepo.remove(p.osuUid)
    }
    showToast('已清空所有玩家', 'success')
  } catch (err) {
    console.error('清空玩家失败:', err)
    showToast('清空操作部分失败，请刷新后重试', 'error')
  }
  await refreshStats()
}

async function handleClearTournaments() {
  if (!confirm('确定要删除所有赛事数据吗？此操作不可撤销。')) return
  try {
    const all = await tournamentRepo.getAll()
    for (const t of all) {
      await tournamentRepo.remove(t.id as number)
    }
    showToast('已清空所有赛事', 'success')
  } catch (err) {
    console.error('清空赛事失败:', err)
    showToast('清空操作部分失败，请刷新后重试', 'error')
  }
  await refreshStats()
}

async function refreshStats() {
  const [playerStats, tourneyStats, estimate] = await Promise.all([
    playersRepo.getStats(),
    tournamentRepo.getStats(),
    navigator.storage?.estimate?.() ?? Promise.resolve(null)
  ])
  stats.value = {
    ...playerStats,
    tournamentCount: tourneyStats.tournamentCount,
    teamCount: tourneyStats.teamCount,
    storageBytes: estimate?.usage || 0
  }
}

async function handleExport(mode: string) {
  try {
    const data = await playersRepo.exportData(mode)
    if (!data.players?.length) {
      showToast('没有可导出的数据', 'error')
      return
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    const modeLabels: Record<string, string> = { green: '绿色', yellow_and_below: '黄色以内', all: '全部' }
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '')
    a.href = url
    a.download = `osufinder_${modeLabels[mode] || 'data'}_${dateStr}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    showToast(`已导出 ${data.players?.length} 位玩家`, 'success')
  } catch (err) {
    console.error(err)
    showToast('导出失败', 'error')
  }
}

async function handleImportPlayers(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files && input.files[0]
  if (!file) return
  try {
    const text = await file.text()
    const data = JSON.parse(text)
    if (!data || data.app !== 'osufinder' || !Array.isArray(data.players)) {
      throw new Error('文件格式不正确')
    }
    if (!confirm(`即将从文件导入 ${data.players?.length} 位玩家，是否继续？`)) {
      input.value = ''
      return
    }
    const result = await playersRepo.importData(data)
    await refreshStats()
    showToast(`导入成功：新增 ${result.added} 位，合并 ${result.merged} 位`, 'success')
  } catch (err) {
    console.error(err)
    showToast('导入失败：' + (err instanceof Error ? err.message : '文件格式错误'), 'error')
  } finally {
    input.value = ''
  }
}

async function handleTournamentExport() {
  try {
    const data = await tournamentRepo.exportData()
    if (!data.tournaments?.length) {
      showToast('没有可导出的赛事', 'error')
      return
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '')
    a.href = url
    a.download = `osufinder_tournaments_${dateStr}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    showToast(`已导出 ${data.tournaments?.length} 场赛事`, 'success')
  } catch (err) {
    console.error(err)
    showToast('导出赛事失败', 'error')
  }
}

async function handleImportTournaments(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files && input.files[0]
  if (!file) return
  try {
    const text = await file.text()
    const data = JSON.parse(text)
    if (!data || data.app !== 'osufinder' || !Array.isArray(data.tournaments)) {
      throw new Error('文件格式不正确')
    }
    if (!confirm(`即将从文件导入 ${data.tournaments?.length} 场赛事，是否继续？`)) {
      input.value = ''
      return
    }
    const result = await tournamentRepo.importData(data)
    await refreshStats()
    showToast(`导入成功：新增 ${result.added} 场，合并 ${result.merged} 场`, 'success')
  } catch (err) {
    console.error(err)
    showToast('导入失败：' + (err instanceof Error ? err.message : '文件格式错误'), 'error')
  } finally {
    input.value = ''
  }
}

function formatBytes(bytes: number): string {
  if (!bytes || bytes <= 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  let i = 0
  let value = bytes
  while (value >= 1024 && i < units.length - 1) {
    value /= 1024
    i++
  }
  return `${value.toFixed(value >= 10 || i === 0 ? 0 : 2)} ${units[i]}`
}
</script>

<style scoped>
.settings-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 20px;
}

@media (min-width: 800px) {
  .settings-grid {
    grid-template-columns: 1fr 1fr;
  }
  .setting-card:last-child {
    grid-column: 1 / -1;
  }
}

.export-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.export-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.export-group-label {
  font-size: var(--font-size-sm);
  font-weight: 600;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.export-options {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.export-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background: var(--bg-item);
  color: var(--text-secondary);
  border-radius: 10px;
  font-size: var(--font-size-base);
  font-family: inherit;
  font-weight: 500;
  cursor: pointer;
  border: 1px solid transparent;
  transition: all 0.15s ease;
  text-align: left;
}

.export-btn:hover {
  border-color: var(--border-focus);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.15);
}

.export-btn--green:hover {
  box-shadow: 0 4px 12px rgba(34, 197, 94, 0.2);
}

.export-btn--yellow:hover {
  box-shadow: 0 4px 12px rgba(234, 179, 8, 0.2);
}

.export-btn--red:hover {
  box-shadow: 0 4px 12px rgba(239, 68, 68, 0.2);
}

.export-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
}

.export-dot--green { background: var(--color-level-green); }
.export-dot--yellow { background: var(--color-level-yellow); }
.export-dot--red { background: var(--color-level-red); }
.export-dot--all { background: linear-gradient(135deg, var(--color-level-green) 0%, var(--color-level-red) 100%); }

.import-options {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.import-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 12px 20px;
  background: linear-gradient(135deg, var(--btn-primary-start) 0%, var(--btn-primary-end) 100%);
  color: var(--text-on-primary);
  border-radius: 10px;
  font-size: var(--font-size-base);
  font-weight: 500;
  cursor: pointer;
  transition: transform 0.15s, box-shadow 0.15s;
  width: auto;
  align-self: flex-start;
}

.import-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.35);
}

.file-input {
  display: none;
}

.import-hint {
  margin: 0;
  font-size: var(--font-size-xs);
}

/* API 配置 */
.api-config {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.field-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.field-label {
  font-size: var(--font-size-sm);
  font-weight: 600;
  color: var(--text-secondary);
}

.api-actions {
  display: flex;
  gap: 10px;
}

.api-config .input {
  padding: 10px 12px;
  border: 1px solid var(--border-default);
  border-radius: 8px;
  background: var(--bg-item);
  color: var(--text-primary);
  font-size: var(--font-size-base);
  font-family: inherit;
}

.api-config .input:focus {
  outline: none;
  border-color: var(--border-focus);
}
</style>
