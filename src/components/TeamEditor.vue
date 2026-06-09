<template>
  <div class="team-card card--bordered">
    <div class="team-header">
      <span class="team-index">{{ isNew ? '新队伍' : '#' + (index + 1) }}</span>
      <div class="new-record-actions">
        <button type="button" class="btn btn-sm btn-secondary" @click="$emit('cancel')">取消</button>
        <button type="button" class="btn btn-sm btn-primary" @click="confirm">确认</button>
      </div>
    </div>

    <div class="team-fields">
      <div class="team-field">
        <label class="field-label-sm">队伍名称</label>
        <input
          v-model="form.name"
          class="input"
          placeholder="队伍名称"
          @keydown.enter.prevent="confirm"
        />
      </div>

      <div class="team-field">
        <label class="field-label-sm">队员</label>
        <div class="tag-wrapper">
          <span v-for="(uid, mi) in form.members" :key="'m' + mi" class="tag-chip tag-chip--linked">
            {{ playerName(uid) }}
            <button type="button" class="icon-btn tag-remove" @click="removeMember(mi)">×</button>
          </span>
          <div class="member-search-wrap">
            <input
              v-model="memberInput" class="tag-input"
              placeholder="搜索玩家名称或UID添加..."
              @input="onSearch"
              @keydown.enter.prevent="addFirstResult"
              @focus="onSearch"
              @blur="onBlur"
            />
            <div v-if="searchResults?.length" class="member-dropdown">
              <div
                v-for="p in searchResults" :key="p.osuUid"
                class="member-dropdown-item"
                @mousedown.prevent="selectMember(p)"
              >
                <span class="member-dd-name">{{ p.nicknames?.[p.primaryNickIndex ?? 0] || p.nicknames?.[0] || '#' + p.osuUid }}</span>
                <span class="member-dd-uid">#{{ p.osuUid }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref, onMounted } from 'vue'
import { playersRepo } from '../db'
import { usePlayerNames } from '../composables/usePlayerNames'
import { useToast } from '../composables/useToast'

const props = defineProps({
  team: { type: Object, default: null },
  index: { type: Number, default: 0 }
})

const emit = defineEmits(['save', 'cancel'])

const isNew = !props.team
const { playerNameMap, playerName, loadPlayerNames } = usePlayerNames()

const form = reactive({
  name: props.team?.name || '',
  members: [...(props.team?.members || [])]
})

const memberInput = ref('')
const searchResults = ref(null)

// ---- 队员搜索 ----
let searchTimer = null
async function onSearch() {
  const kw = memberInput.value.trim()
  if (!kw) { searchResults.value = null; return }
  clearTimeout(searchTimer)
  searchTimer = setTimeout(async () => {
    const all = await playersRepo.getAll()
    const q = kw.toLowerCase()
    searchResults.value = all.filter(p =>
      String(p.osuUid).includes(q) || (p.nicknames || []).some(n => n.toLowerCase().includes(q))
    ).slice(0, 8)
  }, 200)
}

function addFirstResult() {
  if (searchResults.value?.length) selectMember(searchResults.value[0])
}

function selectMember(player) {
  const uid = Number(player.osuUid)
  if (uid && !form.members.includes(uid)) {
    form.members.push(uid)
    playerNameMap.value.set(uid, player.nicknames?.[0] || '#' + uid)
  }
  memberInput.value = ''
  searchResults.value = null
}

function onBlur() {
  setTimeout(() => { searchResults.value = null }, 150)
}

function removeMember(i) {
  form.members.splice(i, 1)
}

const { toast, showToast } = useToast()

function confirm() {
  if (!form.name.trim()) {
    showToast('队伍名称不能为空', 'error')
    return
  }
  emit('save', {
    name: form.name.trim(),
    members: [...form.members]
  })
}

onMounted(() => loadPlayerNames())
</script>