<template>
  <div class="search-view">
    <div class="search-header">
      <div class="search-bar">
        <span class="search-icon">🔍</span>
        <input
          v-model="keyword"
          class="search-input"
          placeholder="搜索 UID / 称呼 / 备注 / 联系方式..."
          @input="onSearchInput"
        />
        <button v-if="keyword" class="icon-btn search-clear" @click="clearSearch">×</button>
      </div>
      <select v-model="sortBy" class="sort-select" @change="onSortChange">
        <option value="uidAsc">UID ↑</option>
        <option value="uidDesc">UID ↓</option>
        <option value="nameAsc">名称 ↑</option>
        <option value="nameDesc">名称 ↓</option>
      </select>
      <router-link to="/players/add" class="btn btn-primary">+ 新建</router-link>
    </div>

    <div class="player-grid">
      <div v-if="loading" class="empty-state">加载中...</div>
      <div v-else-if="!players.length" class="empty-state">
        {{ keyword ? '没有找到匹配的记录' : '还没有任何玩家记录' }}
      </div>
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
              :alt="(p.nicknames?.[p.primaryNickIndex ?? 0]) || p.nicknames?.[0] || '#' + p.osuUid"
              @error="onAvatarError(p.osuUid, $event)"
            />
            <span v-else class="avatar-fallback-icon">{{ avatarInitial(p) }}</span>
          </div>
          <div class="card-top-info">
            <span class="card-name">{{ primaryName(p) }}</span>
            <span class="card-date">{{ formatDate(p.updatedAt) }}</span>
          </div>
        </div>

        <div v-if="p.nicknames && p.nicknames.length" class="card-nicks">
          <span v-for="n in p.nicknames.slice(0, 5)" :key="n" class="nick-tag">{{ n }}</span>
          <span v-if="p.nicknames.length > 5" class="nick-tag muted">+{{ p.nicknames.length - 5 }}</span>
        </div>

        <div v-if="p.records && p.records.length" class="card-records">
          <div v-for="r in p.records" :key="r.id" class="record-chip" :class="'record-chip--' + r.level">
            <span class="record-dot"></span>
            <span class="record-text">{{ r.text }}</span>
          </div>
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
    </div>

    <div v-if="totalPages > 1" class="pagination">
      <button class="page-btn" :disabled="currentPage <= 1" @click="goToPage(currentPage - 1)">‹</button>
      <template v-for="p in totalPages" :key="p">
        <button
          v-if="p === 1 || p === totalPages || (p >= currentPage - 2 && p <= currentPage + 2)"
          class="page-btn"
          :class="{ active: p === currentPage }"
          @click="goToPage(p)"
        >{{ p }}</button>
        <span v-else-if="p === currentPage - 3 || p === currentPage + 3" class="page-ellipsis">…</span>
      </template>
      <button class="page-btn" :disabled="currentPage >= totalPages" @click="goToPage(currentPage + 1)">›</button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { playersRepo } from '../db'
import { formatDate } from '../utils/format'
import { hasAnyContact } from '../utils/player'

const keyword = ref('')
const sortBy = ref('uidAsc')
const players = ref([])
const loading = ref(false)
const failedAvatars = ref(new Set())
const currentPage = ref(1)
const pageSize = 18
const totalCount = ref(0)

const totalPages = computed(() => Math.max(1, Math.ceil(totalCount.value / pageSize)))

function sortPlayers(list) {
  const sorted = [...list]
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
    const sorted = sortPlayers(all)
    totalCount.value = sorted.length
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

let searchTimer = null
function onSearchInput() {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {
    currentPage.value = 1
    loadPlayers()
  }, 280)
}

function onSortChange() {
  currentPage.value = 1
  loadPlayers()
}

function clearSearch() {
  keyword.value = ''
  currentPage.value = 1
  loadPlayers()
}

function goToPage(page) {
  if (page < 1 || page > totalPages.value) return
  currentPage.value = page
  loadPlayers()
}

function primaryName(p) {
  return p.nicknames?.[p.primaryNickIndex ?? 0] || p.nicknames?.[0] || '#' + p.osuUid
}

function avatarInitial(p) {
  const name = primaryName(p)
  return name ? name[0].toUpperCase() : p.osuUid ? String(p.osuUid)[0] : '?'
}

function onAvatarError(uid) {
  failedAvatars.value.add(uid)
}

// 每次进入此路由都会重新 mount（无 KeepAlive），onMounted 即触发
onMounted(() => {
  loadPlayers()
})
</script>

<style scoped>
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
  width: 48px;
  height: 48px;
  border-radius: 50%;
  overflow: hidden;
  background: linear-gradient(135deg, var(--btn-primary-start) 0%, var(--btn-primary-end) 100%);
  flex-shrink: 0;
  border: 2px solid var(--bg-card);
  outline: 1px solid var(--border-default);
  display: flex;
  align-items: center;
  justify-content: center;
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
  color: var(--text-muted);
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
}

.card-date {
  font-size: var(--font-size-tiny);
  color: var(--text-faint);
  text-align: left;
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 6px;
  padding-top: 20px;
}

.page-btn {
  min-width: 36px;
  height: 36px;
  padding: 0 8px;
  border: 1px solid var(--border-default);
  border-radius: 8px;
  background: var(--bg-card);
  color: var(--text-primary);
  font-size: var(--font-size-base);
  cursor: pointer;
  transition: background 0.15s, border-color 0.15s;
}

.page-btn:hover:not(:disabled) {
  border-color: var(--border-focus);
  background: var(--bg-item);
}

.page-btn.active {
  background: linear-gradient(135deg, var(--btn-primary-start) 0%, var(--btn-primary-end) 100%);
  color: var(--text-on-primary);
  border-color: transparent;
}

.page-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.page-ellipsis {
  min-width: 36px;
  text-align: center;
  color: var(--text-muted);
  font-size: var(--font-size-base);
  user-select: none;
}
</style>