<template>
  <div class="search-view">
    <template v-if="showEditor">
      <div class="editor-header">
        <h2>🏆 创建赛事</h2>
        <button class="btn btn-outline" @click="showEditor = false">取消</button>
      </div>
      <TournamentEditor @saved="onSaved" />
    </template>

    <template v-else>
    <div class="search-header">
      <div class="search-bar">
        <AppIcon name="search" :size="18" class="search-icon" />
        <input
          ref="searchInputRef"
          v-model="keyword"
          class="search-input"
          placeholder="搜索赛事名称 / 届次 / 队伍 / 队员..."
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
        <option value="uidAsc">ID ↑</option>
        <option value="uidDesc">ID ↓</option>
        <option value="nameAsc">名称 ↑</option>
        <option value="nameDesc">名称 ↓</option>
      </select>
      <button class="btn btn-primary btn-create" @click="showEditor = true">
        <AppIcon name="plus" :size="16" />
        <span>新建</span>
      </button>
    </div>

    <div class="filter-row">
      <span class="result-count">共 {{ totalCount }} 场赛事</span>
    </div>

    <div class="player-grid">
      <template v-if="loading">
        <div v-for="n in 6" :key="n" class="skeleton-card"></div>
      </template>
      <div v-else-if="!tournaments.length" class="empty-state">
        <span class="empty-state__icon"><AppIcon :name="keyword ? 'search' : 'trophy'" :size="26" /></span>
        <span class="empty-state__title">{{ keyword ? '没有找到匹配的赛事' : '还没有任何赛事记录' }}</span>
        <span>{{ keyword ? '换个关键词再试试' : '点击右上角「新建」创建第一场赛事' }}</span>
      </div>
      <template v-else>
        <router-link
          v-for="t in tournaments"
          :key="t.id"
          :to="'/tournaments/' + t.id"
          class="tournament-card"
        >
          <div class="card-top">
            <div class="card-top-info">
              <div class="card-title-wrap">
                <span class="card-title">{{ t.name }}</span>
                <span v-if="t.edition" class="card-edition">{{ t.edition }}</span>
              </div>
              <span v-if="t.ts || t.ms" class="card-format">{{ t.ts }}v{{ t.ms }} 赛制 · {{ t.teams?.length || 0 }} 支队伍</span>
            </div>
            <span class="card-go"><AppIcon name="chevron-right" :size="18" /></span>
          </div>

          <div v-if="t.teams && t.teams.length" class="card-teams">
            <div v-for="team in topTeams(t)" :key="team.name" class="card-team-row">
              <span class="card-team-rank" :class="podiumRankBadgeClass(team.rank)">
                {{ team.rank || '-' }}
              </span>
              <span class="card-team-name">{{ team.name }}</span>
            </div>
            <div v-if="t.teams.length > 3" class="card-more">+{{ t.teams.length - 3 }} 支队伍</div>
          </div>
        </router-link>
      </template>
    </div>

    <PaginationBar v-model:page="currentPage" :total-pages="totalPages" @update:page="loadTournaments" />
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { tournamentRepo } from '../db'
import TournamentEditor from '../components/TournamentEditor.vue'
import AppIcon from '../components/AppIcon.vue'
import PaginationBar from '../components/PaginationBar.vue'
import type { Tournament, Team } from '../types'

const totalPages = computed(() => Math.ceil(totalCount.value / pageSize) || 1)

function onSortChange() {
  currentPage.value = 1
  loadTournaments()
}

const keyword = ref('')
const sortBy = ref('updatedDesc')
const searchInputRef = ref<HTMLInputElement | null>(null)
const tournaments = ref<Tournament[]>([])
const totalCount = ref(0)
const currentPage = ref(1)
const pageSize = 18
const loading = ref(false)
const showEditor = ref(false)

function onSaved() {
  showEditor.value = false
  loadTournaments()
}

function sortTournaments(list: Tournament[]): Tournament[] {
  const sorted = [...list]
  if (sortBy.value === 'updatedDesc') {
    return sorted.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0))
  }
  sorted.sort((a, b) => {
    let cmp = 0
    if (sortBy.value === 'uidAsc' || sortBy.value === 'uidDesc') {
      const va = Number(a.id) || 0
      const vb = Number(b.id) || 0
      cmp = va - vb
    } else {
      const na = (a.name || '').toLowerCase()
      const nb = (b.name || '').toLowerCase()
      cmp = na.localeCompare(nb, 'zh')
    }
    return sortBy.value.endsWith('Desc') ? -cmp : cmp
  })
  return sorted
}

function rankNumber(rank: string): number {
  const m = rank?.match(/^#(\d+)/)
  return m ? parseInt(m[1], 10) : Infinity
}

function topTeams(t: Tournament): Team[] {
  if (!t.teams?.length) return []
  return [...t.teams]
    .sort((a, b) => rankNumber(a.rank) - rankNumber(b.rank))
    .slice(0, 3)
}

async function loadTournaments() {
  loading.value = true
  try {
    const all = await tournamentRepo.search(keyword.value)
    const sorted = sortTournaments(all)
    totalCount.value = sorted.length
    const start = (currentPage.value - 1) * pageSize
    tournaments.value = sorted.slice(start, start + pageSize)
  } catch (err) {
    console.error('加载赛事列表失败:', err)
    tournaments.value = []
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
    loadTournaments()
  }, 280)
}

function clearSearch() {
  keyword.value = ''
  currentPage.value = 1
  loadTournaments()
}

function podiumRankBadgeClass(rank: string): string {
  if (rank === '#1') return 'card-team-rank--gold'
  if (rank === '#2') return 'card-team-rank--silver'
  if (rank === '#3') return 'card-team-rank--bronze'
  return ''
}

function onGlobalKeydown(e: KeyboardEvent) {
  const target = e.target as HTMLElement | null
  const typing = !!target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)
  if (e.key === '/' && !typing && !showEditor.value) {
    e.preventDefault()
    searchInputRef.value?.focus()
  }
}

onMounted(() => {
  loadTournaments()
  window.addEventListener('keydown', onGlobalKeydown)
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onGlobalKeydown)
})
</script>

<style scoped>
.search-header {
  display: flex;
  gap: 12px;
  align-items: center;
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

.filter-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 0 2px;
}

.result-count {
  font-size: var(--font-size-xs);
  color: var(--text-faint);
}

.tournament-card {
  position: relative;
  overflow: hidden;
  text-decoration: none;
  color: inherit;
  cursor: pointer;
  background: var(--bg-card);
  border-radius: var(--radius-lg);
  padding: 18px;
  box-shadow: var(--shadow-card);
  border: 1px solid var(--border-divider);
  display: flex;
  flex-direction: column;
  gap: 12px;
  transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
}

.tournament-card::before {
  content: '';
  position: absolute;
  inset: 0 0 auto 0;
  height: 3px;
  background: var(--gradient-primary);
  opacity: 0;
  transition: opacity 0.2s ease;
}

.tournament-card:hover {
  transform: translateY(-3px);
  border-color: var(--border-focus);
  box-shadow: var(--shadow-pop);
}

.tournament-card:hover::before {
  opacity: 1;
}

.card-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.card-top-info {
  display: flex;
  flex-direction: column;
  gap: 5px;
  min-width: 0;
}

.card-go {
  display: inline-flex;
  color: var(--text-faint);
  transition: transform 0.18s ease, color 0.18s ease;
}

.tournament-card:hover .card-go {
  color: var(--brand-pink);
  transform: translateX(3px);
}

.card-format {
  font-size: var(--font-size-xs);
  color: var(--text-muted);
}

.card-title-wrap {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.card-title {
  font-size: var(--font-size-lg);
  font-weight: 700;
  color: var(--text-primary);
}

.card-edition {
  font-size: var(--font-size-xs);
  color: var(--brand-pink);
  padding: 2px 8px;
  background: var(--brand-pink-soft);
  border-radius: 999px;
  font-weight: 600;
}

.card-teams {
  display: flex;
  flex-direction: column;
  gap: 6px;
  border-top: 1px solid var(--border-divider);
  padding-top: 12px;
}

.card-team-row {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
}

.card-team-rank {
  flex-shrink: 0;
  min-width: 32px;
  padding: 2px 6px;
  background: var(--bg-chip);
  border-radius: 6px;
  text-align: center;
  font-weight: 600;
  font-size: var(--font-size-xs);
  color: var(--text-muted);
}

.card-team-rank--gold {
  background: linear-gradient(135deg, var(--podium-gold-start), var(--podium-gold-end));
  color: var(--podium-gold-text);
}
.card-team-rank--silver {
  background: linear-gradient(135deg, var(--podium-silver-start), var(--podium-silver-end));
  color: var(--podium-silver-text);
}
.card-team-rank--bronze {
  background: linear-gradient(135deg, var(--podium-bronze-start), var(--podium-bronze-end));
  color: var(--podium-bronze-text);
}

.card-team-name {
  font-weight: 600;
  white-space: nowrap;
}

.card-more {
  font-size: var(--font-size-xs);
  color: var(--text-faint);
  text-align: center;
  padding-top: 2px;
}

.editor-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}

.editor-header h2 {
  margin: 0;
  font-size: var(--font-size-xl);
}

@media (max-width: 640px) {
  .btn-create span {
    display: none;
  }
  .btn-create {
    padding: 10px 12px;
  }
}
</style>