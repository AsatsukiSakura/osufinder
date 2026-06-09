<template>
  <div class="detail-view">
    <div v-if="loading" class="empty-state">加载中...</div>
    <div v-else-if="!player" class="empty-state">
      <div>该玩家不存在或已被删除</div>
      <router-link to="/players/search" class="btn btn-primary btn-sm" style="margin-top: 16px;">← 返回列表</router-link>
    </div>

    <div v-else>
      <div class="detail-header">
        <router-link to="/players/search" class="link-back">← 返回列表</router-link>
        <div class="detail-actions">
          <button v-if="!isEditing" class="btn btn-primary btn-sm" @click="startEdit">✏️ 编辑</button>
          <button v-if="isEditing" class="btn btn-secondary btn-sm" @click="cancelEdit">取消</button>
        </div>
      </div>

      <div v-if="!isEditing" class="profile-card">
        <!-- 头像 + 主名称 -->
        <div class="profile-top">
          <div class="profile-avatar-wrap">
            <img
              class="profile-avatar"
              :src="avatarUrl"
              :alt="primaryName(player)"
              @error="avatarFailed = true"
            />
            <div v-if="avatarFailed" class="avatar-fallback">
              <span class="avatar-fallback-icon">?</span>
            </div>
          </div>
          <div class="profile-headline">
            <h1 class="profile-name">{{ primaryName(player) }}</h1>
            <span class="profile-uid-tag">#{{ player.osuUid }}</span>
            <a
              class="osu-link"
              :href="'https://osu.ppy.sh/users/' + player.osuUid"
              target="_blank"
              rel="noopener noreferrer"
            >osu! 主页</a>
          </div>
        </div>

        <!-- 个人称呼 -->
        <div v-if="player.nicknames && player.nicknames.length" class="profile-section">
          <h3 class="section-title">个人称呼</h3>
          <div class="card-nicks">
            <span
              v-for="(n, i) in player.nicknames"
              :key="n"
              class="nick-tag"
              :class="{ 'nick-tag--primary': i === (player.primaryNickIndex ?? 0) }"
            >{{ n }}</span>
          </div>
        </div>

        <!-- 联系方式 -->
        <div v-if="hasContacts" class="profile-section">
          <h3 class="section-title">联系方式</h3>
          <div class="contacts-grid">
            <template v-for="item in contactList" :key="item.type">
              <div v-if="item.values.length" class="contact-block">
                <span class="contact-icon">{{ item.icon }}</span>
                <span class="contact-label">{{ item.label }}</span>
                <div class="contact-values">
                  <span v-for="v in item.values" :key="v" class="contact-val">{{ v }}</span>
                </div>
              </div>
            </template>
          </div>
        </div>

        <!-- 记录 -->
        <div v-if="player.records && player.records.length" class="profile-section">
          <h3 class="section-title">记录 ({{ player.records.length }})</h3>
          <div class="records-list">
            <div v-for="r in player.records" :key="r.id" class="detail-record" :class="'detail-record--' + r.level">
              <span class="record-level-tag">{{ getLevelLabel(r.level) }}</span>
              <span class="record-text">{{ r.text }}</span>
            </div>
          </div>
        </div>

        <!-- 参赛记录 -->
        <div v-if="tournaments && tournaments.length" class="profile-section">
          <h3 class="section-title">参赛记录 ({{ tournaments.length }})</h3>
          <div class="tournament-history">
            <div v-for="t in tournaments" :key="t.id" class="tournament-history-item">
              <router-link :to="'/tournaments/' + t.id" class="th-tournament">
                <span class="th-name">{{ t.name }}</span>
                <span v-if="t.edition" class="th-edition">{{ t.edition }}</span>
              </router-link>
              <div class="th-teams">
                <span v-for="team in getPlayerTeams(t)" :key="team._id || team.name" class="th-team-tag">
                  {{ team.name }}
                  <span v-if="team.rank" class="th-rank" :class="rankBadgeClass(team.rank)">{{ team.rank }}</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <PlayerEditor
        v-else
        :player="player"
        @saved="onSaved"
        @deleted="onDeleted"
      />
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { playersRepo, tournamentRepo } from '../db'
import PlayerEditor from '../components/PlayerEditor.vue'
import { getLevelLabel } from '../utils/level'
import { hasAnyContact } from '../utils/player'

const route = useRoute()
const router = useRouter()

const player = ref(null)
const loading = ref(true)
const isEditing = ref(false)
const avatarFailed = ref(false)
const tournaments = ref([])

const avatarUrl = computed(() => {
  if (!player.value?.osuUid) return ''
  return `https://a.ppy.sh/${player.value.osuUid}`
})

const hasContacts = computed(() => hasAnyContact(player.value))

const contactList = computed(() => [
  { type: 'qq',      icon: '📮', label: 'QQ',      values: player.value?.contacts?.qq || [] },
  { type: 'bili',    icon: '📺', label: 'B站',      values: player.value?.contacts?.bili || [] },
  { type: 'discord', icon: '💬', label: 'Discord',  values: player.value?.contacts?.discord || [] },
  { type: 'twitter', icon: '🐦', label: 'Twitter',  values: player.value?.contacts?.twitter || [] },
])

function primaryName(p) {
  return p.nicknames?.[p.primaryNickIndex ?? 0] || p.nicknames?.[0] || '#' + p.osuUid
}

function getPlayerTeams(t) {
  const uid = Number(route.params.osuUid)
  return (t.teams || []).filter(team =>
    (team.members || []).includes(uid)
  )
}

function rankBadgeClass(rank) {
  if (rank === '#1') return 'th-rank--gold'
  if (rank === '#2') return 'th-rank--silver'
  if (rank === '#3') return 'th-rank--bronze'
  return 'th-rank--default'
}

function startEdit() { isEditing.value = true }
function cancelEdit() { isEditing.value = false }

function onSaved() {
  isEditing.value = false
  loadPlayer()
}

function onDeleted() {
  setTimeout(() => router.push('/players/search'), 500)
}

onMounted(() => { loadPlayer() })

async function loadPlayer() {
  loading.value = true
  avatarFailed.value = false
  try {
    const uid = Number(route.params.osuUid)
    if (!uid) { loading.value = false; return }
    player.value = await playersRepo.getByOsuUid(uid)
    if (player.value) {
      tournaments.value = await tournamentRepo.findByPlayerOsuUid(uid)
    }
  } catch (err) {
    console.error('加载玩家详情失败:', err)
    player.value = null
    tournaments.value = []
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.detail-view {
  display: flex;
  flex-direction: column;
  gap: var(--radius-lg);
}

.detail-actions {
  display: flex;
  gap: 8px;
}

/* ---- 卡片主体 ---- */
.profile-card {
  background: var(--bg-card);
  border-radius: var(--radius-lg);
  padding: 28px;
  box-shadow: var(--shadow-card);
  display: flex;
  flex-direction: column;
  gap: var(--font-size-2xl);
}

/* ---- 头像 + 名称区 ---- */
.profile-top {
  display: flex;
  align-items: center;
  gap: var(--font-size-2xl);
}

.profile-avatar-wrap {
  position: relative;
  width: 120px;
  height: 120px;
  flex-shrink: 0;
  border-radius: 50%;
  overflow: hidden;
  background: var(--bg-item);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  border: 3px solid var(--border-default);
}

.profile-avatar {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.avatar-fallback {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, var(--btn-primary-start), var(--btn-primary-end));
  color: var(--text-on-primary);
}

.avatar-fallback-icon {
  font-size: var(--font-size-4xl);
  font-weight: 700;
}

.profile-headline {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
}

.profile-name {
  font-size: var(--font-size-3xl);
  font-weight: 700;
  color: var(--text-primary);
  line-height: 1.3;
  word-break: break-word;
  margin: 0;
}

.profile-uid-tag {
  display: inline-block;
  align-self: flex-start;
  font-size: var(--font-size-sm);
  font-weight: 600;
  color: var(--text-muted);
  background: var(--bg-chip);
  padding: 2px 10px;
  border-radius: var(--radius-sm);
  font-family: var(--font-family-mono);
}

.osu-link {
  display: inline-block;
  align-self: flex-start;
  font-size: var(--font-size-sm);
  color: var(--border-focus);
  text-decoration: none;
  padding: 2px 0;
  transition: opacity 0.15s;
}

.osu-link:hover { opacity: 0.8; }

/* ---- 分区 ---- */
.profile-section {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding-top: 18px;
  border-top: 1px solid var(--border-divider);
}

.section-title {
  font-size: var(--font-size-sm);
  font-weight: 600;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin: 0;
}

/* ---- 昵称标签 ---- */
.nick-tag--primary {
  color: var(--text-on-primary);
  background: linear-gradient(135deg, var(--btn-primary-start), var(--btn-primary-end));
  font-weight: 600;
}

/* ---- 联系方式 ---- */
.contacts-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 10px;
}

.contact-block {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 10px 14px;
  background: var(--bg-item);
  border-radius: var(--radius-md);
}

.contact-icon {
  font-size: var(--font-size-lg);
  flex-shrink: 0;
  line-height: 1;
}

.contact-label {
  font-size: var(--font-size-xs);
  font-weight: 600;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  flex-shrink: 0;
  padding-top: 2px;
}

.contact-values {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.contact-val {
  font-size: var(--font-size-sm);
  font-weight: 500;
  color: var(--text-primary);
  font-family: var(--font-family-mono);
}

/* ---- 记录 ---- */
.records-list {
  gap: 8px;
}

.detail-record {
  display: block;
  padding: 10px 14px;
  background: var(--bg-item);
  border-radius: var(--radius-md);
  border-left: 3px solid var(--border-default);
}

.detail-record--green  { border-left-color: var(--color-level-green); background: rgba(34, 197, 94, 0.08); }
.detail-record--yellow { border-left-color: var(--color-level-yellow); background: rgba(234, 179, 8, 0.08); }
.detail-record--red    { border-left-color: var(--color-level-red); background: rgba(239, 68, 68, 0.08); }

.record-level-tag {
  display: inline-block;
  font-size: var(--font-size-xs);
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 6px;
  white-space: nowrap;
  margin-right: 8px;
  vertical-align: top;
}

.detail-record--green  .record-level-tag { background: rgba(34, 197, 94, 0.15); color: var(--color-level-green); }
.detail-record--yellow .record-level-tag { background: rgba(234, 179, 8, 0.15); color: var(--color-level-yellow); }
.detail-record--red    .record-level-tag { background: rgba(239, 68, 68, 0.15); color: var(--color-level-red); }

.record-text {
  font-size: var(--font-size-base);
  color: var(--text-secondary);
  line-height: 1.5;
  word-break: break-word;
}

/* ---- 参赛记录 ---- */
.tournament-history {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.tournament-history-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 10px 14px;
  background: var(--bg-item);
  border-radius: var(--radius-md);
}

.th-tournament {
  display: flex;
  align-items: center;
  gap: 8px;
  text-decoration: none;
  color: var(--text-primary);
}

.th-tournament:hover .th-name {
  color: var(--border-focus);
  text-decoration: underline;
}

.th-name {
  font-size: var(--font-size-base);
  font-weight: 600;
  transition: color 0.15s;
}

.th-edition {
  font-size: var(--font-size-xs);
  color: var(--text-muted);
  padding: 1px 8px;
  background: var(--bg-chip);
  border-radius: 6px;
}

.th-teams {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.th-team-tag {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 3px 10px;
  background: var(--bg-card);
  border-radius: var(--radius-sm);
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
}

.th-rank {
  font-weight: 700;
  font-size: var(--font-size-xs);
  padding: 1px 6px;
  border-radius: 6px;
}

.th-rank--default {
  background: var(--bg-chip);
  color: var(--text-muted);
}

.th-rank--gold {
  background: linear-gradient(135deg, var(--podium-gold-start), var(--podium-gold-end));
  color: var(--podium-gold-text);
}
.th-rank--silver {
  background: linear-gradient(135deg, var(--podium-silver-start), var(--podium-silver-end));
  color: var(--podium-silver-text);
}
.th-rank--bronze {
  background: linear-gradient(135deg, var(--podium-bronze-start), var(--podium-bronze-end));
  color: var(--podium-bronze-text);
}
</style>
