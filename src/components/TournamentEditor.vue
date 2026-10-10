<template>
  <EditorShell
    :is-edit="isEdit"
    edit-label="编辑赛事"
    add-label="添加赛事"
    :last-updated="lastUpdated"
    :toast="toast"
    @save="handleSave"
    @delete="() => remove(props.tournament?.id)"
  >
    <template #actions>
      <slot name="actions" />
    </template>

    <div class="field-group">
      <label class="field-label">赛事名称 <span class="required">*</span></label>
      <input v-model="form.name" class="input" placeholder="请输入赛事名称" />
    </div>

    <div class="field-group">
      <label class="field-label">届次</label>
      <input v-model="form.edition" class="input" placeholder="如：第3届、2024夏季赛 等" />
    </div>

    <!-- 规模/赛制模块 -->
    <div class="field-group">
      <label class="field-label">规模设置</label>
      <div class="size-row">
        <div class="size-field">
          <span class="size-label">队伍人数 (ts)</span>
          <input v-model.number="form.ts" type="number" class="input size-input" min="1"/>
        </div>
        <div class="size-field">
          <span class="size-label">上场人数 (ms)</span>
          <input v-model.number="form.ms" type="number" class="input size-input" min="1" :max="form.ts"/>
        </div>
      </div>
      <p v-if="form.ts > 0 && form.ms > form.ts" class="hint" style="color: var(--color-level-red)">✗ 上场人数不能超过队伍人数</p>
      <p v-else-if="form.ts > 0 && form.ms > 0" class="hint muted">{{ form.ts }}v{{ form.ms }} 赛制</p>
    </div>

    <!-- 名次设置 -->
    <RankSetEditor v-model="form.rankSet" />

    <!-- 队伍管理 -->
    <div class="field-group">
      <div class="records-label-row">
        <label class="field-label">🏆 参赛队伍</label>
        <button type="button" class="btn-add-record" @click="addTeam">+ 添加队伍</button>
      </div>

      <div v-if="form.teams.length" class="teams-list">
        <template v-for="(team, i) in form.teams" :key="team._id">
          <!-- 编辑模式 -->
          <TeamEditor
            v-if="editingIndex === i"
            :team="team"
            :index="i"
            @save="(data) => updateTeam(i, data)"
            @cancel="editingIndex = -1"
          />
          <!-- 紧凑展示卡片 -->
          <div v-else class="team-card-compact">
            <span class="team-index">#{{ i + 1 }}</span>
            <div class="team-compact-info">
              <span class="team-compact-name">{{ team.name }}</span>
              <span class="team-compact-meta">{{ team.members.length }} 名队员</span>
            </div>
            <div class="rank-picker">
              <button
                type="button"
                class="rank-picker-btn"
                :class="rankClass(team.rank)"
                @click="toggleRankPicker(i)"
              >
                <span>{{ team.rank || '未设置' }}</span>
                <span class="rank-picker-arrow">▾</span>
              </button>
              <div v-if="openRankPicker === i" class="rank-picker-drop">
                <button
                  type="button"
                  class="rank-picker-opt rank-picker-opt--none"
                  @click="setRank(i, '')"
                >未设置</button>
                <button
                  v-for="opt in rankOptions"
                  :key="opt.value"
                  type="button"
                  class="rank-picker-opt"
                  :class="opt.class"
                  @click="setRank(i, opt.value)"
                >{{ opt.label }}</button>
              </div>
            </div>
            <div class="team-compact-actions">
              <button type="button" class="btn btn-sm btn-secondary" @click="editingIndex = i">编辑</button>
              <button type="button" class="icon-btn record-remove" @click="removeTeam(i)">×</button>
            </div>
          </div>
        </template>
      </div>

      <!-- 新建队伍 -->
      <TeamEditor
        v-if="showNewTeam"
        :index="form.teams.length"
        @save="confirmNewTeam"
        @cancel="showNewTeam = false"
      />
    </div>
  </EditorShell>
</template>

<script setup lang="ts">
import { computed, reactive, ref, onMounted, onBeforeUnmount } from 'vue'
import { tournamentRepo } from '../db'
import { useEditor } from '../composables/useEditor'
import { useEntityCrud } from '../composables/useEntityCrud'
import { usePlayerNames } from '../composables/usePlayerNames'
import EditorShell from './EditorShell.vue'
import TeamEditor from './TeamEditor.vue'
import RankSetEditor from './RankSetEditor.vue'
import type { Tournament, RankSetItem } from '../types'

interface FormTeam {
  _id: string
  name: string
  members: number[]
  rank: string
}

const props = defineProps<{ tournament?: Tournament | null }>()
const emit = defineEmits<{
  (e: 'saved'): void
  (e: 'deleted'): void
}>()

const { isEdit, lastUpdated, refreshLastUpdated, toast, showToast } = useEditor(props.tournament)
const { loadPlayerNames } = usePlayerNames()

const { save, remove } = useEntityCrud(tournamentRepo, {
  isEdit, showToast, emit, label: '这场赛事', refreshLastUpdated
})

// 名次集合 → 下拉选项
function rankItemDisplay(item: RankSetItem): string {
  return item.l === item.r ? `#${item.l}` : `#${item.l}~#${item.r}`
}

const rankOptions = computed(() => {
  const sorted = [...form.rankSet].sort((a, b) => a.l - b.l)
  return sorted.map(item => {
    const value = rankItemDisplay(item)
    return {
      value,
      label: value,
      class: item.l === 1 && item.r === 1 ? 'rank-picker-opt--gold'
          : item.l === 2 && item.r === 2 ? 'rank-picker-opt--silver'
          : item.l === 3 && item.r === 3 ? 'rank-picker-opt--bronze'
          : 'rank-picker-opt--range'
    }
  })
})

function rankClass(rank: string): string {
  if (rank === '#1') return 'rank-picker-btn--gold'
  if (rank === '#2') return 'rank-picker-btn--silver'
  if (rank === '#3') return 'rank-picker-btn--bronze'
  return ''
}

// 默认名次集合（单败：1, 2, 3~4, 5~8, 9~16）
const DEFAULT_RANK_SET: RankSetItem[] = [
  { l: 1, r: 1 }, { l: 2, r: 2 }, { l: 3, r: 3 }, { l: 4, r: 4 }, { l: 5, r: 6 }
]

// 历史数据兼容：匹配 rankSet 中的有效值
function normalizeRank(raw: string | undefined, rankSet: RankSetItem[]): string {
  if (!raw) return ''
  const sorted = [...rankSet].sort((a, b) => a.l - b.l)
  const match = sorted.find(opt => rankItemDisplay(opt) === raw)
  return match ? raw : ''
}

const initialRankSet = (props.tournament?.rankSet?.length ? props.tournament.rankSet : DEFAULT_RANK_SET).map(s => ({ ...s }))

let teamIdCounter = Date.now()
const form = reactive<{
  name: string
  edition: string
  ts: number
  ms: number
  rankSet: RankSetItem[]
  teams: FormTeam[]
}>({
  name: props.tournament?.name || '',
  edition: props.tournament?.edition || '',
  ts: props.tournament?.ts || 0,
  ms: props.tournament?.ms || 0,
  rankSet: initialRankSet,
  teams: (props.tournament?.teams || []).map(t => ({
    _id: 't' + (teamIdCounter++),
    name: t.name || '',
    members: ((t.members || []) as (number | { osuUid: number })[]).map(m =>
      typeof m === 'object' ? Number(m.osuUid) : Number(m)
    ).filter(uid => uid > 0),
    rank: normalizeRank(t.rank, initialRankSet)
  }))
})

const editingIndex = ref(-1)
const showNewTeam = ref(false)
const openRankPicker = ref(-1)

function toggleRankPicker(i: number) {
  openRankPicker.value = openRankPicker.value === i ? -1 : i
}

function setRank(i: number, value: string) {
  form.teams[i].rank = value
  openRankPicker.value = -1
}

function addTeam() { showNewTeam.value = true }
function confirmNewTeam(data: { name: string; members: number[] }) {
  form.teams.push({ _id: 't' + (teamIdCounter++), rank: '', ...data })
  showNewTeam.value = false
}
function updateTeam(i: number, data: { name: string; members: number[] }) {
  Object.assign(form.teams[i], data)
  editingIndex.value = -1
}
function removeTeam(i: number) { form.teams.splice(i, 1) }

function buildData() {
  return {
    name: form.name,
    edition: form.edition,
    ts: form.ts || 0,
    ms: form.ms || 0,
    rankSet: form.rankSet.map(s => ({ l: s.l, r: s.r })),
    teams: form.teams.map(t => ({ name: t.name, members: [...t.members], rank: t.rank }))
  }
}

async function handleSave() {
  if (!form.name.trim()) return showToast('请填写赛事名称', 'error')
  if (form.ts > 0 && form.ms > form.ts) return showToast('ms 不能 > ts', 'error')

  // 检查名次集合是否有效
  const sorted = [...form.rankSet].sort((a, b) => a.l - b.l)
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i].l <= sorted[i - 1].r) {
      return showToast(`名次区间「${rankItemDisplay(sorted[i - 1])}」与「${rankItemDisplay(sorted[i])}」重叠`, 'error')
    }
  }

  await save({ buildData, id: props.tournament?.id })
}

function onDocClick(e: MouseEvent) {
  const target = e.target as HTMLElement | null
  if (!target?.closest('.rank-picker')) {
    openRankPicker.value = -1
  }
}

onMounted(() => {
  loadPlayerNames()
  document.addEventListener('click', onDocClick)
})
onBeforeUnmount(() => document.removeEventListener('click', onDocClick))
</script>

<style scoped>
/* 名次选择器 */
.rank-picker {
  position: relative;
  flex-shrink: 0;
}

.rank-picker-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 90px;
  padding: 6px 12px;
  font-size: var(--font-size-sm);
  font-weight: 600;
  border: 1px solid var(--border-default);
  border-radius: var(--radius-sm);
  background: var(--bg-input);
  color: var(--text-primary);
  cursor: pointer;
  transition: border-color 0.15s, box-shadow 0.15s;
  font-family: inherit;
}

.rank-picker-btn:hover {
  border-color: var(--border-focus);
}

.rank-picker-arrow {
  font-size: var(--font-size-xs);
  color: var(--text-muted);
  margin-left: auto;
  transition: transform 0.15s;
}

.rank-picker-drop {
  position: absolute;
  top: calc(100% + 6px);
  left: 0;
  z-index: 100;
  min-width: 140px;
  background: var(--bg-card);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-card);
  padding: 6px;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.rank-picker-opt {
  display: flex;
  align-items: center;
  width: 100%;
  padding: 8px 12px;
  font-size: var(--font-size-sm);
  font-weight: 500;
  text-align: left;
  border: none;
  border-left: 3px solid transparent;
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--text-secondary);
  cursor: pointer;
  transition: background 0.12s, border-color 0.12s, color 0.12s;
  font-family: inherit;
}

.rank-picker-opt:hover {
  background: var(--bg-item-hover);
  color: var(--text-primary);
}

/* 未设置: 更弱化的样式 */
.rank-picker-opt--none {
  color: var(--text-muted);
  font-weight: 400;
  font-style: italic;
}

/* 金: 金色左边框 + 暖色悬浮底色 */
.rank-picker-opt--gold {
  border-left-color: var(--podium-gold-start);
  font-weight: 600;
}
.rank-picker-opt--gold:hover {
  background: rgba(255, 215, 0, 0.12);
  color: var(--text-primary);
}

/* 银: 灰色左边框 */
.rank-picker-opt--silver {
  border-left-color: var(--podium-silver-end);
  font-weight: 600;
}
.rank-picker-opt--silver:hover {
  background: rgba(168, 168, 168, 0.15);
  color: var(--text-primary);
}

/* 铜: 红铜色左边框 */
.rank-picker-opt--bronze {
  border-left-color: var(--podium-bronze-start);
  font-weight: 600;
}
.rank-picker-opt--bronze:hover {
  background: rgba(205, 127, 50, 0.15);
  color: var(--text-primary);
}

/* 普通名次选项悬浮 */
.rank-picker-opt--range:hover {
  background: var(--bg-item-hover);
}

/* 选中状态下的按钮样式 */
.rank-picker-btn--gold {
  border-color: var(--podium-gold-start);
  background: linear-gradient(135deg, var(--podium-gold-start), var(--podium-gold-end));
  color: var(--podium-gold-text);
}

.rank-picker-btn--silver {
  border-color: var(--podium-silver-start);
  background: linear-gradient(135deg, var(--podium-silver-start), var(--podium-silver-end));
  color: var(--podium-silver-text);
}

.rank-picker-btn--bronze {
  border-color: var(--podium-bronze-start);
  background: linear-gradient(135deg, var(--podium-bronze-start), var(--podium-bronze-end));
  color: var(--podium-bronze-text);
}
</style>