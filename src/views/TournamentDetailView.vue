<template>
  <div class="detail-view">
    <div v-if="viewState === 'loading'" class="empty-state">加载中...</div>

    <div v-else-if="viewState === 'notfound'" class="empty-state">
      <div>该赛事不存在或已被删除</div>
      <router-link to="/tournaments/search" class="btn btn-primary btn-sm" style="margin-top: 16px;">← 返回列表</router-link>
    </div>
    <template v-else-if="viewState === 'viewing'">
      <div class="detail-header">
        <router-link to="/tournaments/search" class="link-back">← 返回列表</router-link>
        <button class="btn btn-primary btn-sm" @click="startEdit">✏️ 编辑</button>
      </div>

      <div class="tournament-card-detail">
        <div class="tournament-head">
          <h2 class="tournament-name">{{ tournament.name }}</h2>
          <span v-if="tournament.edition" class="tournament-edition">{{ tournament.edition }}</span>
        </div>

        <div v-if="tournament.teams && tournament.teams.length" class="teams-display">
          <h3 class="section-title">参赛队伍（{{ tournament.teams.length }}）</h3>
          <div class="teams-grid">
            <div
              v-for="(team, i) in sortedTeams"
              :key="i"
              class="team-detail-card"
              :class="podiumCardClass(team.rank)"
            >
              <div class="team-detail-rank" :class="podiumRankClass(team.rank)">
                {{ team.rank || '-' }}
              </div>
              <div class="team-detail-info">
                <span class="team-detail-name">{{ team.name }}</span>
                <span v-if="team.members && team.members.length" class="team-detail-members">
                  <template v-for="(uid, mi) in team.members" :key="mi">
                    <router-link :to="'/players/' + uid" class="member-link">{{ playerName(uid) }}</router-link>
                    <span v-if="mi < team.members.length - 1"> / </span>
                  </template>
                </span>
              </div>
            </div>
          </div>
        </div>

        <div v-else class="empty-section">暂无参赛队伍</div>
      </div>
    </template>

    <template v-else-if="viewState === 'editing'">
      <div class="detail-header">
        <router-link to="/tournaments/search" class="link-back">← 返回列表</router-link>
        <button class="btn btn-secondary btn-sm" @click="cancelEdit">取消</button>
      </div>

      <TournamentEditor
        :tournament="tournament"
        @saved="onSaved"
        @deleted="onDeleted"
      />
    </template>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { tournamentRepo } from '../db'
import TournamentEditor from '../components/TournamentEditor.vue'
import { usePlayerNames } from '../composables/usePlayerNames'

const route = useRoute()
const router = useRouter()

const tournament = ref(null)
const loading = ref(true)
const isEditing = ref(false)
const { playerNameMap, playerName, loadPlayerNames } = usePlayerNames()

const viewState = computed(() => {
  if (loading.value) return 'loading'
  if (!tournament.value) return 'notfound'
  return isEditing.value ? 'editing' : 'viewing'
})

const sortedTeams = computed(() => {
  if (!tournament.value?.teams) return []
  return [...tournament.value.teams].map(t => {
    const num = parseFloat(t.rank?.replace('#', ''))
    return {
      ...t,
      _sortKey: isNaN(num) ? Infinity : num
    }
  }).sort((a, b) => a._sortKey - b._sortKey)
})

function podiumCardClass(rank) {
  if (rank === '#1') return 'team-detail-card--gold'
  if (rank === '#2') return 'team-detail-card--silver'
  if (rank === '#3') return 'team-detail-card--bronze'
  return ''
}

function podiumRankClass(rank) {
  if (rank === '#1') return 'team-detail-rank--gold'
  if (rank === '#2') return 'team-detail-rank--silver'
  if (rank === '#3') return 'team-detail-rank--bronze'
  return ''
}

async function loadTournament() {
  loading.value = true
  try {
    const id = Number(route.params.id)
    if (!id) {
      loading.value = false
      return
    }
    const [t] = await Promise.all([
      tournamentRepo.getById(id),
      loadPlayerNames()
    ])
    tournament.value = t
  } catch (err) {
    console.error('加载赛事详情失败:', err)
    tournament.value = null
  } finally {
    loading.value = false
  }
}

function startEdit() {
  isEditing.value = true
}

function cancelEdit() {
  isEditing.value = false
}

function onSaved() {
  isEditing.value = false
  loadTournament()
}

function onDeleted() {
  setTimeout(() => {
    router.push('/tournaments/search')
  }, 500)
}

onMounted(() => {
  loadTournament()
})
</script>

<style scoped>
.tournament-card-detail {
  background: var(--bg-card);
  border-radius: var(--radius-lg);
  padding: 28px;
  box-shadow: var(--shadow-card);
}

.tournament-head {
  display: flex;
  align-items: baseline;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 20px;
  padding-bottom: 18px;
  border-bottom: 1px solid var(--border-divider);
}

.tournament-name {
  font-size: var(--font-size-3xl);
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
}

.tournament-edition {
  font-size: var(--font-size-base);
  color: var(--text-muted);
  padding: 4px 12px;
  background: var(--bg-item);
  border-radius: var(--radius-sm);
}

.teams-display {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.section-title {
  font-size: var(--font-size-base);
  font-weight: 600;
  color: var(--text-secondary);
  margin: 0;
}

.teams-grid {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.team-detail-card {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 16px;
  background: var(--bg-item);
  border-radius: var(--radius-md);
  border-left: 4px solid var(--border-default);
  transition: border-color 0.15s;
}

.team-detail-card--gold { border-left-color: var(--podium-gold-start); }
.team-detail-card--silver { border-left-color: var(--podium-silver-end); }
.team-detail-card--bronze { border-left-color: var(--podium-bronze-start); }

.team-detail-rank {
  flex-shrink: 0;
  min-width: 44px;
  padding: 4px 10px;
  background: var(--bg-chip);
  border-radius: var(--radius-sm);
  text-align: center;
  font-weight: 700;
  font-size: var(--font-size-sm);
  color: var(--text-muted);
}

.team-detail-rank--gold {
  background: linear-gradient(135deg, var(--podium-gold-start), var(--podium-gold-end));
  color: var(--podium-gold-text);
}
.team-detail-rank--silver {
  background: linear-gradient(135deg, var(--podium-silver-start), var(--podium-silver-end));
  color: var(--podium-silver-text);
}
.team-detail-rank--bronze {
  background: linear-gradient(135deg, var(--podium-bronze-start), var(--podium-bronze-end));
  color: var(--podium-bronze-text);
}

.team-detail-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.team-detail-name {
  font-weight: 600;
  font-size: var(--font-size-md);
  color: var(--text-primary);
}

.team-detail-members {
  font-size: var(--font-size-sm);
  color: var(--text-muted);
}

.member-link {
  color: var(--text-secondary);
  text-decoration: none;
  font-weight: 500;
  transition: color 0.15s;
}

.member-link:hover {
  color: var(--border-focus);
  text-decoration: underline;
}

.empty-section {
  padding: 40px 0;
  text-align: center;
  color: var(--text-muted);
  font-size: var(--font-size-base);
}
</style>