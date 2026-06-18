<template>
  <EditorShell
    :is-edit="isEdit"
    edit-label="编辑玩家"
    add-label="添加玩家"
    :last-updated="lastUpdated"
    :toast="toast"
    @save="handleSave"
    @delete="() => remove(form.osuUid)"
  >
    <template #actions>
      <slot name="actions" />
    </template>

    <!-- osu UID -->
    <div class="field-group">
      <label class="field-label">osu UID <span class="required">*</span></label>
      <div class="uid-row">
        <input
          :value="form.osuUidInput"
          @input="onOsuUidInput"
          class="input uid-input"
          placeholder="请输入 osu 用户 ID"
          :disabled="isEdit"
        />
        <button
          v-if="!isEdit"
          type="button"
          class="btn btn-secondary btn-sm"
          :disabled="fetchingOsu || !form.osuUidInput"
          @click="fetchOsuPlayer"
        >
          {{ fetchingOsu ? '获取中...' : '从 osu! 获取' }}
        </button>
      </div>
      <p v-if="isEdit" class="hint muted">创建后不可修改</p>
    </div>

    <!-- 个人称呼 -->
    <div class="field-group">
      <label class="field-label">个人称呼 <span class="hint muted">(点击标签设为主显示名)</span></label>
      <div class="tag-wrapper">
        <span
          v-for="(n, i) in form.nicknames"
          :key="'n' + i"
          class="tag-chip"
          :class="{ 'tag-chip--primary': form.primaryNickIndex === i }"
          @click="togglePrimary(i)"
          :title="form.primaryNickIndex === i ? '当前主显示名，点击取消' : '点击设为主显示名'"
        >
          {{ n }}<button type="button" class="icon-btn tag-remove" @click.stop="removeNickname(i)">×</button>
        </span> 
        <input v-model="nickInput" class="tag-input" placeholder="回车添加多个" @keydown.enter.prevent="addNickname" />
      </div>
    </div>

    <!-- 联系方式 -->
    <TagField v-model="form.contacts.qq" label="📮 QQ号" />
    <TagField v-model="form.contacts.bili" label="📺 B站UID" />
    <TagField v-model="form.contacts.discord" label="💬 Discord" />
    <TagField v-model="form.contacts.twitter" label="🐦 推特" />

    <!-- 记录 -->
    <div class="field-group">
      <div class="records-label-row">
        <label class="field-label">📋 记录</label>
        <button type="button" class="btn-add-record" @click="addRecord">+ 添加记录</button>
      </div>

      <div v-if="form.records.length" class="records-list">
        <div v-for="(r, i) in form.records" :key="r.id" class="record-item">
          <div class="record-header">
            <LevelPicker v-model="r.level" />
            <button type="button" class="icon-btn record-remove" @click="removeRecord(i)">×</button>
          </div>
          <textarea v-model="r.text" class="textarea" rows="2" placeholder="输入记录内容..."></textarea>
        </div>
      </div>

      <div v-if="showNewRecord" class="record-item record-item--new">
        <div class="record-header">
          <LevelPicker v-model="newRecordLevel" />
          <div class="new-record-actions">
            <button type="button" class="btn btn-sm btn-secondary" @click="cancelNewRecord">取消</button>
            <button type="button" class="btn btn-sm btn-primary" @click="confirmNewRecord">确认</button>
          </div>
        </div>
        <textarea
          v-model="newRecordText" class="textarea" rows="2"
          placeholder="输入记录内容，回车或点击确认添加..."
          @keydown.enter.prevent="confirmNewRecord"
        ></textarea>
      </div>
    </div>
  </EditorShell>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { playersRepo } from '../db'
import { useEditor } from '../composables/useEditor'
import { useEntityCrud } from '../composables/useEntityCrud'
import { fetchOsuUser } from '../api/osu'
import EditorShell from './EditorShell.vue'
import TagField from './TagField.vue'
import LevelPicker from './LevelPicker.vue'

const props = defineProps({ player: { type: Object, default: null } })
const emit = defineEmits(['saved', 'deleted'])

const { isEdit, lastUpdated, toast, showToast } = useEditor(props.player)

const { save, remove } = useEntityCrud(playersRepo, {
  isEdit, showToast, emit, label: '这位玩家'
})

// 表单数据
const form = reactive({
  osuUid: props.player?.osuUid ?? null,
  osuUidInput: props.player ? String(props.player.osuUid) : '',
  nicknames: [],
  primaryNickIndex: 0,
  contacts: { qq: [], bili: [], discord: [], twitter: [] },
  records: []
})

if (props.player) {
  form.nicknames = [...(props.player.nicknames || [])]
  form.primaryNickIndex = props.player.primaryNickIndex ?? 0
  const c = props.player.contacts || {}
  form.contacts = { qq: [...(c.qq || [])], bili: [...(c.bili || [])], discord: [...(c.discord || [])], twitter: [...(c.twitter || [])] }
  form.records = (props.player?.records || []).map(r => ({ ...r }))
}

// ---- 昵称 ----
const nickInput = ref('')
function addNickname() {
  const val = nickInput.value.trim()
  if (!val || form.nicknames.includes(val)) return
  form.nicknames.push(val)
  nickInput.value = ''
}
function removeNickname(index) {
  form.nicknames.splice(index, 1)
  if (form.primaryNickIndex >= form.nicknames.length) {
    form.primaryNickIndex = Math.max(0, form.nicknames.length - 1)
  } else if (index < form.primaryNickIndex) {
    form.primaryNickIndex--
  }
}
function togglePrimary(idx) {
  form.primaryNickIndex = form.primaryNickIndex === idx ? 0 : idx
}

// ---- UID ----
const fetchingOsu = ref(false)

function onOsuUidInput(e) {
  const filtered = e.target.value.replace(/\D/g, '')
  form.osuUidInput = filtered
  e.target.value = filtered
}

async function fetchOsuPlayer() {
  const uid = Number(form.osuUidInput)
  if (!uid || uid < 1) return
  fetchingOsu.value = true
  try {
    const user = await fetchOsuUser(uid)
    if (!user) {
      showToast('未找到该 UID 对应的 osu! 玩家', 'error')
      return
    }
    // 如果还没有昵称，自动填入 osu! 用户名
    if (form.nicknames.length === 0 && user.username) {
      form.nicknames.push(user.username)
    }
    showToast(`已获取 osu! 玩家: ${user.username}`, 'success')
  } catch (err) {
    showToast(err.message || '获取失败', 'error')
  } finally {
    fetchingOsu.value = false
  }
}

// ---- 记录 ----
const showNewRecord = ref(false)
const newRecordText = ref('')
const newRecordLevel = ref('green')

function addRecord() { showNewRecord.value = true; newRecordText.value = ''; newRecordLevel.value = 'green' }
function cancelNewRecord() { showNewRecord.value = false; newRecordText.value = '' }
function confirmNewRecord() {
  const text = newRecordText.value.trim()
  if (!text) return
  form.records.push({ id: Date.now(), text, level: newRecordLevel.value })
  showNewRecord.value = false; newRecordText.value = ''
}
function removeRecord(index) { form.records.splice(index, 1) }

// ---- 保存 / 删除 ----
function buildData() {
  return {
    nicknames: JSON.parse(JSON.stringify(form.nicknames)),
    primaryNickIndex: form.primaryNickIndex,
    contacts: JSON.parse(JSON.stringify(form.contacts)),
    records: JSON.parse(JSON.stringify(form.records))
  }
}

async function handleSave() {
  await save({
    buildData,
    validate() {
      if (!form.osuUidInput) return '请填写 osu UID'
      const uid = Number(form.osuUidInput)
      if (!uid || uid < 1) return 'osu UID 必须是正整数'
    },
    beforeCreate(data) { data.osuUid = Number(form.osuUidInput) },
    id: form.osuUid,
    onError(err) {
      const msg = String(err.message || err)
      if (msg.includes('Key already exists') || err?.name === 'ConstraintError')
        showToast('该 osu UID 已存在', 'error')
      else
        showToast('保存失败', 'error')
      console.error(err)
    }
  })
}
</script>