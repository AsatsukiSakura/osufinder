<template>
  <div class="settings-view">
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
            :class="{ active: mode === 'light' }"
            @click="changeTheme('light')"
          >
            <div class="theme-preview theme-preview--light">
              <span class="swatch"></span>
            </div>
            <span class="theme-option-label"><AppIcon name="sun" :size="14" /> 浅色</span>
          </button>

          <button
            type="button"
            class="theme-option"
            :class="{ active: mode === 'dark' }"
            @click="changeTheme('dark')"
          >
            <div class="theme-preview theme-preview--dark">
              <span class="swatch"></span>
            </div>
            <span class="theme-option-label"><AppIcon name="moon" :size="14" /> 深色</span>
          </button>

          <button
            type="button"
            class="theme-option"
            :class="{ active: mode === 'system' }"
            @click="changeTheme('system')"
          >
            <div class="theme-preview theme-preview--system">
              <span class="swatch"></span>
            </div>
            <span class="theme-option-label"><AppIcon name="monitor" :size="14" /> 跟随系统</span>
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
          <p class="muted hint-line">
            在 <a href="https://osu.ppy.sh/home/account/edit#oauth" target="_blank" rel="noopener">osu! 账号设置 → OAuth</a> 创建新的 OAuth 应用获取凭证
          </p>
          <p class="muted hint-line">
            凭证仅保存在本机浏览器中，请勿在共用设备上保存。
          </p>
        </div>
      </section>

      <section class="setting-card">
        <div class="setting-header">
          <h3>数据概览</h3>
          <p class="muted">当前本地存储的数据量</p>
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
            <span class="stat-label">存储占用</span>
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
            <span class="export-group-label">整包备份</span>
            <div class="export-options">
              <button type="button" class="btn export-btn" @click="handleBackupExport">
                <span class="export-dot export-dot--all"></span>
                导出玩家 + 赛事完整备份
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
              <p class="muted import-hint">已有赛事将按名称 + 届次合并，队伍会按 ID 合并而非覆盖</p>
            </div>
          </div>
          <div class="export-group">
            <span class="export-group-label">整包恢复</span>
            <div class="import-options">
              <label class="btn btn-secondary import-btn">
                <span>选择备份文件整体恢复</span>
                <input type="file" accept=".json,application/json" @change="handleImportBackup" class="file-input" />
              </label>
              <p class="muted import-hint">自动识别文件中的玩家与赛事数据，并分别合并</p>
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
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { playersRepo, tournamentRepo } from '../db'
import { showToast } from '../composables/useToast'
import { confirmAction } from '../composables/useDialog'
import { useTheme, type ThemeMode } from '../composables/useTheme'
import { getApiConfig, setApiConfig, removeApiConfig } from '../api/storage'
import { verifyCredentials } from '../api/osu'
import AppIcon from '../components/AppIcon.vue'
import type { ExportData } from '../types'
import { version, dependencies, devDependencies } from '../../package.json'

const stats = ref({ playerCount: 0, recordCount: 0, tournamentCount: 0, teamCount: 0, storageBytes: 0 })
const { mode, setTheme: applyThemeMode } = useTheme()

// osu! API 凭证
const apiClientId = ref('')
const apiClientSecret = ref('')
const apiSaving = ref(false)
const hasApiConfig = ref(false)

function stripRange(v: string) {
  return v.replace(/^[^\d]*/, '')
}

const deps = {
  vue: stripRange(dependencies.vue),
  vueRouter: stripRange(dependencies['vue-router']),
  dexie: stripRange(dependencies.dexie),
  vite: stripRange(devDependencies.vite)
}

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

onMounted(async () => {
  loadApiConfig()
  await refreshStats()
})

function changeTheme(next: ThemeMode) {
  applyThemeMode(next)
}

async function handleClearPlayers() {
  const ok = await confirmAction({
    title: '清空所有玩家',
    message: '确定要删除所有玩家数据吗？此操作不可撤销。',
    confirmText: '清空',
    danger: true
  })
  if (!ok) return
  try {
    await playersRepo.clearAll()
    showToast('已清空所有玩家', 'success')
  } catch (err) {
    console.error('清空玩家失败:', err)
    showToast('清空失败，请刷新后重试', 'error')
  }
  await refreshStats()
}

async function handleClearTournaments() {
  const ok = await confirmAction({
    title: '清空所有赛事',
    message: '确定要删除所有赛事数据吗？此操作不可撤销。',
    confirmText: '清空',
    danger: true
  })
  if (!ok) return
  try {
    await tournamentRepo.clearAll()
    showToast('已清空所有赛事', 'success')
  } catch (err) {
    console.error('清空赛事失败:', err)
    showToast('清空失败，请刷新后重试', 'error')
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

function downloadJson(data: unknown, filename: string) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

function dateStamp() {
  return new Date().toISOString().slice(0, 10).replace(/-/g, '')
}

async function handleExport(modeKey: string) {
  try {
    const data = await playersRepo.exportData(modeKey)
    if (!data.players?.length) {
      showToast('没有可导出的数据', 'error')
      return
    }
    const modeLabels: Record<string, string> = { green: '绿色', yellow_and_below: '黄色以内', all: '全部' }
    downloadJson(data, `osufinder_${modeLabels[modeKey] || 'data'}_${dateStamp()}.json`)
    showToast(`已导出 ${data.players.length} 位玩家`, 'success')
  } catch (err) {
    console.error(err)
    showToast('导出失败', 'error')
  }
}

async function handleBackupExport() {
  try {
    const [playerData, tournamentData] = await Promise.all([
      playersRepo.exportData('all'),
      tournamentRepo.exportData()
    ])
    if (!playerData.players?.length && !tournamentData.tournaments?.length) {
      showToast('没有可导出的数据', 'error')
      return
    }
    downloadJson(
      {
        app: 'osufinder',
        kind: 'backup',
        exportedAt: Date.now(),
        players: playerData.players || [],
        tournaments: tournamentData.tournaments || []
      },
      `osufinder_backup_${dateStamp()}.json`
    )
    showToast('完整备份已导出', 'success')
  } catch (err) {
    console.error(err)
    showToast('导出备份失败', 'error')
  }
}

async function readJsonFile(event: Event): Promise<ExportData | null> {
  const input = event.target as HTMLInputElement
  const file = input.files && input.files[0]
  if (!file) return null
  try {
    const data = JSON.parse(await file.text()) as Record<string, unknown>
    if (!data || data.app !== 'osufinder') throw new Error('文件格式不正确')
    return data as unknown as ExportData
  } finally {
    input.value = ''
  }
}

async function handleImportPlayers(event: Event) {
  try {
    const data = await readJsonFile(event)
    if (!data) return
    if (!Array.isArray(data.players)) throw new Error('文件中没有玩家数据')
    const count = data.players.length
    const ok = await confirmAction({
      title: '导入玩家',
      message: `即将从文件导入 ${count} 位玩家，已有数据会自动合并，是否继续？`,
      confirmText: '导入'
    })
    if (!ok) return
    const result = await playersRepo.importData(data)
    await refreshStats()
    showToast(`导入成功：新增 ${result.added} 位，合并 ${result.merged} 位`, 'success')
  } catch (err) {
    console.error(err)
    showToast('导入失败：' + (err instanceof Error ? err.message : '文件格式错误'), 'error')
  }
}

async function handleImportTournaments(event: Event) {
  try {
    const data = await readJsonFile(event)
    if (!data) return
    if (!Array.isArray(data.tournaments)) throw new Error('文件中没有赛事数据')
    const count = data.tournaments.length
    const ok = await confirmAction({
      title: '导入赛事',
      message: `即将从文件导入 ${count} 场赛事，已有数据会自动合并，是否继续？`,
      confirmText: '导入'
    })
    if (!ok) return
    const result = await tournamentRepo.importData(data)
    await refreshStats()
    showToast(`导入成功：新增 ${result.added} 场，合并 ${result.merged} 场`, 'success')
  } catch (err) {
    console.error(err)
    showToast('导入失败：' + (err instanceof Error ? err.message : '文件格式错误'), 'error')
  }
}

async function handleImportBackup(event: Event) {
  try {
    const data = await readJsonFile(event)
    if (!data) return
    const hasPlayers = Array.isArray(data.players) && data.players.length > 0
    const hasTournaments = Array.isArray(data.tournaments) && data.tournaments.length > 0
    if (!hasPlayers && !hasTournaments) throw new Error('备份文件中没有数据')
    const ok = await confirmAction({
      title: '恢复备份',
      message: `即将恢复 ${hasPlayers ? (data.players as unknown[]).length + ' 位玩家' : ''}${hasPlayers && hasTournaments ? ' 与 ' : ''}${hasTournaments ? (data.tournaments as unknown[]).length + ' 场赛事' : ''}，是否继续？`,
      confirmText: '恢复'
    })
    if (!ok) return
    const parts: string[] = []
    if (hasPlayers) {
      const r = await playersRepo.importData(data)
      parts.push(`玩家新增 ${r.added} / 合并 ${r.merged}`)
    }
    if (hasTournaments) {
      const r = await tournamentRepo.importData(data)
      parts.push(`赛事新增 ${r.added} / 合并 ${r.merged}`)
    }
    await refreshStats()
    showToast('恢复完成：' + parts.join('，'), 'success')
  } catch (err) {
    console.error(err)
    showToast('恢复失败：' + (err instanceof Error ? err.message : '文件格式错误'), 'error')
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
.settings-view {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.settings-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 20px;
}

@media (min-width: 900px) {
  .settings-grid {
    grid-template-columns: 1fr 1fr;
  }
  .setting-card:last-child {
    grid-column: 1 / -1;
  }
}

.theme-options {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.theme-option {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 12px;
  border: 1px solid var(--border-default);
  border-radius: var(--radius-md);
  background: var(--bg-item);
  cursor: pointer;
  font-family: inherit;
  transition: border-color 0.15s, box-shadow 0.15s, transform 0.15s;
}

.theme-option:hover {
  border-color: var(--border-focus);
  transform: translateY(-1px);
}

.theme-option.active {
  border-color: var(--brand-pink);
  box-shadow: 0 0 0 3px var(--brand-pink-soft);
}

.theme-preview {
  height: 56px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--border-divider);
  display: flex;
  align-items: flex-end;
  padding: 8px;
}

.theme-preview .swatch {
  display: block;
  width: 28px;
  height: 16px;
  border-radius: 5px;
  background: var(--gradient-primary);
}

.theme-preview--light {
  background: linear-gradient(160deg, #ffffff 0%, #f1f2f9 100%);
}

.theme-preview--dark {
  background: linear-gradient(160deg, #1c1d29 0%, #111219 100%);
}

.theme-preview--system {
  background: linear-gradient(135deg, #ffffff 0% 50%, #17181f 50% 100%);
}

.theme-option-label {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  font-weight: 500;
}

.theme-option.active .theme-option-label {
  color: var(--text-primary);
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
  border-radius: var(--radius-md);
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
  box-shadow: var(--shadow-card);
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
.export-dot--all { background: var(--gradient-primary); }

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
  border-radius: var(--radius-md);
  font-size: var(--font-size-base);
  font-weight: 500;
  cursor: pointer;
  width: auto;
  align-self: flex-start;
}

.file-input {
  display: none;
}

.import-hint {
  margin: 0;
  font-size: var(--font-size-xs);
}

.api-config {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.field-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.field-label {
  font-size: var(--font-size-sm);
  font-weight: 600;
  color: var(--text-secondary);
}

.api-actions,
.data-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.hint-line {
  margin: 0;
  font-size: var(--font-size-xs);
  line-height: 1.6;
}

.hint-line a {
  color: var(--brand-pink);
}
</style>
