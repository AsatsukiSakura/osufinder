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
        <span class="search-icon">🔍</span>
        <input
          v-model="keyword"
          class="search-input"
          placeholder="搜索赛事名称 / 届次 / 队伍 / 队员..."
          @input="onSearchInput"
        />
        <button v-if="keyword" class="icon-btn search-clear" @click="clearSearch">×</button>
      </div>
      <select v-model="sortBy" class="sort-select" @change="onSortChange">
        <option value="uidAsc">ID ↑</option>
        <option value="uidDesc">ID ↓</option>
        <option value="nameAsc">名称 ↑</option>
        <option value="nameDesc">名称 ↓</option>
      </select>
      <button class="btn btn-primary" @click="showEditor = true">+ 新建</button>
    </div>

    <div class="player-grid">
      <div v-if="loading" class="empty-state">加载中...</div>
      <div v-else-if="!tournaments.length" class="empty-state">
        {{ keyword ? '没有找到匹配的赛事' : '还没有任何赛事记录' }}
      </div>
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
          </div>
        </div>

        <div v-if="t.teams && t.teams.length" class="card-teams">
          <div v-for="team in topTeams(t)" :key="team._id || team.name" class="card-team-row">
            <span class="card-team-rank" :class="podiumRankBadgeClass(team.rank)">
              {{ team.rank || '-' }}
            </span>
            <span class="card-team-name">{{ team.name }}</span>
          </div>
          <div v-if="t.teams.length > 3" class="card-more">+{{ t.teams.length - 3 }} 支队伍</div>
        </div>
      </router-link>
    </div>

    <div v-if="totalPages > 1" class="pagination">
      <button class="btn btn-sm btn-outline" :disabled="currentPage <= 1" @click="goPage(currentPage - 1)">← 上一页</button>
      <span class="pagination-info">{{ currentPage }} / {{ totalPages }}</span>
      <button class="btn btn-sm btn-outline" :disabled="currentPage >= totalPages" @click="goPage(currentPage + 1)">下一页 →</button>
    </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { tournamentRepo } from '../db'
import TournamentEditor from '../components/TournamentEditor.vue'

const totalPages = computed(() => Math.ceil(totalCount.value / pageSize) || 1)

function goPage(page) {
  currentPage.value = page
  loadTournaments()
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

function onSortChange() {
  currentPage.value = 1
  loadTournaments()
}

const keyword = ref('')
const sortBy = ref('uidAsc')
const tournaments = ref([])
const totalCount = ref(0)
const currentPage = ref(1)
const pageSize = 18
const loading = ref(false)
const showEditor = ref(false)

function onSaved() {
  showEditor.value = false
  loadTournaments()
}

function sortTournaments(list) {
  const sorted = [...list]
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

function rankNumber(rank) {
  const m = rank?.match(/^#(\d+)/)
  return m ? parseInt(m[1]) : Infinity
}

function topTeams(t) {
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

let searchTimer = null
function onSearchInput() {
  clearTimeout(searchTimer)
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

function podiumRankBadgeClass(rank) {
  if (rank === '#1') return 'card-team-rank--gold'
  if (rank === '#2') return 'card-team-rank--silver'
  if (rank === '#3') return 'card-team-rank--bronze'
  return ''
}

onMounted(() => {
  loadTournaments()
})
</script>

<style scoped>
.tournament-card {
  text-decoration: none;
  color: inherit;
  cursor: pointer;
  background: var(--bg-card);
  border-radius: 14px;
  padding: 18px;
  box-shadow: var(--shadow-card);
  border: 1px solid var(--border-default);
  display: flex;
  flex-direction: column;
  gap: 10px;
  transition: box-shadow 0.2s, border-color 0.2s;
}

.tournament-card:hover {
  border-color: var(--border-focus);
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
  color: var(--text-muted);
  padding: 2px 8px;
  background: var(--bg-chip);
  border-radius: 6px;
  font-weight: 600;
}

.card-teams {
  display: flex;
  flex-direction: column;
  gap: 6px;
  border-top: 1px solid var(--border-divider);
  padding-top: 10px;
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
  color: var(--text-muted);
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
</style>