<template>
  <div class="search-view">
    <div class="search-header">
      <div class="search-bar">
        <AppIcon name="search" :size="18" class="search-icon" />
        <input
          ref="searchInputRef"
          v-model="keyword"
          class="search-input"
          placeholder="搜索 UID / 称呼 / 备注 / 联系方式..."
          @input="onSearchInput"
          @keydown.esc="clearSearch"
        />
        <kbd v-if="!keyword" class="search-kbd" title="按 / 快速聚焦搜索">/</kbd>
        <button v-if="keyword" class="icon-btn search-clear" aria-label="清空搜索" @click="clearSearch">
          <AppIcon name="close" :size="16" />
        </button>
      </div>
      <select v-model="sortBy" class="sort-select" @change="onSortChange" aria-label="排序方式">
        <option value="updatedDesc">最近更新</option>
        <option value="uidAsc">UID ↑</option>
        <option value="uidDesc">UID ↓</option>
        <option value="nameAsc">名称 ↑</option>
        <option value="nameDesc">名称 ↓</option>
      </select>
      <router-link to="/players/add" class="btn btn-primary btn-create">
        <AppIcon name="plus" :size="16" />
        <span>新建</span>
      </router-link>
    </div>

    <div class="filter-row">
      <span class="filter-label">事迹等级</span>
      <div class="level-filter">
        <button
          v-for="opt in levelOptions"
          :key="opt.value"
          type="button"
          class="level-chip"
          :class="[`level-chip--${opt.value}`, { active: levelFilter === opt.value }]"
          @click="setLevelFilter(opt.value)"
        >
          <span v-if="opt.value !== 'all'" class="level-chip__dot"></span>
          {{ opt.label }}
        </button>
      </div>
      <span class="result-count">共 {{ totalCount }} 条</span>
    </div>

    <div class="player-grid">
      <template v-if="loading">
        <div v-for="n in 6" :key="n" class="skeleton-card"></div>
      </template>
      <div v-else-if="!players.length" class="empty-state">
        <span class="empty-state__icon"><AppIcon :name="keyword || levelFilter !== 'all' ? 'search' : 'users'" :size="26" /></span>
        <span class="empty-state__title">{{ keyword || levelFilter !== 'all' ? '没有找到匹配的记录' : '还没有任何玩家记录' }}</span>
        <span>{{ keyword || levelFilter !== 'all' ? '换个关键词或清除筛选试试' : '点击右上角「新建」添加第一位玩家' }}</span>
      </div>
      <template v-else>
        <router-link
          v-for="p in players"
          :key="p.osuUid"
          :to="'/players/' + p.osuUid"
          class="player-card"
        >
          <div class="card-top">
            <div class="card-avatar-wrap">
              <img
                v-if="!failedAvatars.has(p.osuUid)"
                class="card-avatar"
                :src="'https://a.ppy.sh/' + p.osuUid"
                :alt="primaryName(p)"
                loading="lazy"
                @error="onAvatarError(p.osuUid)"
              />
              <span v-else class="avatar-fallback-icon">{{ avatarInitial(p) }}</span>
            </div>
            <div class="card-top-info">
              <span class="card-name">{{ primaryName(p) }}</span>
              <span class="card-date">#{{ p.osuUid }} · {{ formatDate(p.updatedAt) }}</span>
            </div>
          </div>

          <div v-if="p.nicknames && p.nicknames.length" class="card-nicks">
            <span v-for="n in p.nicknames.slice(0, 5)" :key="n" class="nick-tag">{{ n }}</span>
            <span v-if="p.nicknames.length > 5" class="nick-tag muted">+{{ p.nicknames.length - 5 }}</span>
          </div>

          <div v-if="p.records && p.records.length" class="card-records">
            <div v-for="r in p.records.slice(0, 3)" :key="r.id" class="record-chip" :class="'record-chip--' + r.level">
              <span class="record-dot"></span>
              <span class="record-text">{{ r.text }}</span>
            </div>
            <span v-if="p.records.length > 3" class="record-more">还有 {{ p.records.length - 3 }} 条记录</span>
          </div>

          <div v-if="hasAnyContact(p)" class="card-contacts">
            <div v-if="p.contacts?.qq?.length" class="contact-row">
              <span class="contact-label">📮</span>
              <span class="contact-val" v-for="v in p.contacts.qq" :key="v">{{ v }}</span>
            </div>
            <div v-if="p.contacts?.bili?.length" class="contact-row">
              <span class="contact-label">📺</span>
              <span class="contact-val" v-for="v in p.contacts.bili" :key="v">{{ v }}</span>
            </div>
            <div v-if="p.contacts?.discord?.length" class="contact-row">
              <span class="contact-label">💬</span>
              <span class="contact-val" v-for="v in p.contacts.discord" :key="v">{{ v }}</span>
            </div>
            <div v-if="p.contacts?.twitter?.length" class="contact-row">
              <span class="contact-label">🐦</span>
              <span class="contact-val" v-for="v in p.contacts.twitter" :key="v">{{ v }}</span>
            </div>
          </div>
        </router-link>
      </template>
    </div>

    <PaginationBar v-model:page="currentPage" :total-pages="totalPages" @update:page="loadPlayers" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { playersRepo } from '../db'
import { formatDate } from '../utils/format'
import { hasAnyContact } from '../utils/player'
import AppIcon from '../components/AppIcon.vue'
import PaginationBar from '../components/PaginationBar.vue'
import type { Player, Level } from '../types'

const keyword = ref('')
const sortBy = ref('updatedDesc')
const searchInputRef = ref<HTMLInputElement | null>(null)
const levelFilter = ref<'all' | Level>('all')
const players = ref<Player[]>([])
const loading = ref(false)
const failedAvatars = ref<Set<number>>(new Set())
const currentPage = ref(1)
const pageSize = 18
const totalCount = ref(0)

const levelOptions = [
  { value: 'all' as const, label: '全部' },
  { value: 'green' as const, label: '绿色' },
  { value: 'yellow' as const, label: '黄色' },
  { value: 'red' as const, label: '红色' }
]

const totalPages = computed(() => Math.max(1, Math.ceil(totalCount.value / pageSize)))

function sortPlayers(list: Player[]): Player[] {
  const sorted = [...list]
  if (sortBy.value === 'updatedDesc') {
    return sorted.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0))
  }
  sorted.sort((a, b) => {
    let cmp = 0
    if (sortBy.value === 'uidAsc' || sortBy.value === 'uidDesc') {
      const va = Number(a.osuUid) || 0
      const vb = Number(b.osuUid) || 0
      cmp = va - vb
    } else {
      const na = (a.nicknames?.[a.primaryNickIndex ?? 0] || a.nicknames?.[0] || '#' + a.osuUid).toLowerCase()
      const nb = (b.nicknames?.[b.primaryNickIndex ?? 0] || b.nicknames?.[0] || '#' + b.osuUid).toLowerCase()
      cmp = na.localeCompare(nb, 'zh')
    }
    return sortBy.value.endsWith('Desc') ? -cmp : cmp
  })
  return sorted
}

async function loadPlayers() {
  loading.value = true
  failedAvatars.value = new Set()
  try {
    const all = await playersRepo.search(keyword.value)
    const filtered = levelFilter.value === 'all'
      ? all
      : all.filter((p) => (p.records || []).some((r) => r.level === levelFilter.value))
    const sorted = sortPlayers(filtered)
    totalCount.value = sorted.length
    if (currentPage.value > totalPages.value) currentPage.value = totalPages.value
    const start = (currentPage.value - 1) * pageSize
    players.value = sorted.slice(start, start + pageSize)
  } catch (err) {
    console.error('加载玩家列表失败:', err)
    players.value = []
    totalCount.value = 0
  } finally {
    loading.value = false
  }
}

let searchTimer: ReturnType<typeof setTimeout> | null = null
function onSearchInput() {
  if (searchTimer) clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {
    currentPage.value = 1
    loadPlayers()
  }, 280)
}

function onSortChange() {
  currentPage.value = 1
  loadPlayers()
}

function setLevelFilter(value: 'all' | Level) {
  levelFilter.value = value
  currentPage.value = 1
  loadPlayers()
}

function clearSearch() {
  keyword.value = ''
  currentPage.value = 1
  loadPlayers()
}

function primaryName(p: Player): string {
  return p.nicknames?.[p.primaryNickIndex ?? 0] || p.nicknames?.[0] || '#' + p.osuUid
}

function avatarInitial(p: Player): string {
  const name = primaryName(p)
  return name ? name[0].toUpperCase() : p.osuUid ? String(p.osuUid)[0] : '?'
}

function onAvatarError(uid: number) {
  failedAvatars.value.add(uid)
}

// 每次进入此路由都会重新 mount（无 KeepAlive），onMounted 即触发
function onGlobalKeydown(e: KeyboardEvent) {
  const target = e.target as HTMLElement | null
  const typing = !!target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)
  if (e.key === '/' && !typing) {
    e.preventDefault()
    searchInputRef.value?.focus()
  }
}

onMounted(() => {
  loadPlayers()
  window.addEventListener('keydown', onGlobalKeydown)
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onGlobalKeydown)
})
</script>

<style scoped>
.search-view {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.search-header {
  display: flex;
  gap: 12px;
  align-items: center;
  flex-shrink: 0;
  flex-wrap: wrap;
}

.search-bar {
  flex: 1;
  min-width: 200px;
}

.search-icon {
  color: var(--text-muted);
}

.search-kbd {
  flex-shrink: 0;
  padding: 1px 7px;
  font-family: var(--font-family-mono);
  font-size: 11px;
  line-height: 1.6;
  color: var(--text-faint);
  background: var(--bg-item);
  border: 1px solid var(--border-divider);
  border-radius: 5px;
}

.search-clear {
  display: inline-flex;
  padding: 2px;
  color: var(--text-muted);
  border-radius: 50%;
  transition: color 0.15s, background 0.15s;
}

.search-clear:hover {
  color: var(--text-primary);
  background: var(--bg-item);
}

.btn-create {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  box-shadow: var(--shadow-primary);
}

/* ---- 等级筛选 ---- */
.filter-row {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  padding: 0 2px;
}

.filter-label {
  font-size: var(--font-size-xs);
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--text-faint);
}

.level-filter {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.level-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  border-radius: 999px;
  border: 1px solid var(--border-default);
  background: var(--bg-card);
  color: var(--text-muted);
  font-size: var(--font-size-sm);
  font-family: inherit;
  cursor: pointer;
  transition: all 0.15s ease;
}

.level-chip:hover {
  border-color: var(--border-focus);
  color: var(--text-secondary);
  transform: translateY(-1px);
}

.level-chip.active {
  color: var(--text-primary);
  border-color: var(--border-focus);
  background: var(--gradient-primary-soft);
  font-weight: 600;
}

.level-chip__dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.level-chip--green .level-chip__dot { background: var(--color-level-green); }
.level-chip--yellow .level-chip__dot { background: var(--color-level-yellow); }
.level-chip--red .level-chip__dot { background: var(--color-level-red); }

.result-count {
  margin-left: auto;
  font-size: var(--font-size-xs);
  color: var(--text-faint);
}

/* ---- 卡片 ---- */
.player-card {
  text-decoration: none;
  color: inherit;
  cursor: pointer;
}

.card-top {
  display: flex;
  justify-content: flex-start;
  align-items: center;
  gap: 12px;
}

.card-avatar-wrap {
  position: relative;
  width: 50px;
  height: 50px;
  border-radius: 50%;
  overflow: hidden;
  background: var(--gradient-primary);
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 0 0 2px var(--bg-card), 0 0 0 3px var(--border-default);
  transition: box-shadow 0.2s ease;
}

.player-card:hover .card-avatar-wrap {
  box-shadow: 0 0 0 2px var(--bg-card), 0 0 0 3px var(--brand-pink);
}

.card-avatar {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.avatar-fallback-icon {
  font-size: 18px;
  font-weight: 700;
  color: #fff;
}

.card-top-info {
  display: flex;
  flex-direction: column;
  gap: 3px;
  flex: 1;
  min-width: 0;
}

.card-name {
  font-size: var(--font-size-md);
  font-weight: 700;
  color: var(--text-primary);
  text-align: left;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.card-date {
  font-size: var(--font-size-tiny);
  color: var(--text-faint);
  text-align: left;
  font-family: var(--font-family-mono);
}

.record-more {
  font-size: var(--font-size-xs);
  color: var(--text-faint);
  padding-left: 4px;
}

@media (max-width: 640px) {
  .btn-create span {
    display: none;
  }
  .btn-create {
    padding: 10px 12px;
  }
  .result-count {
    margin-left: 0;
  }
}
</style>
