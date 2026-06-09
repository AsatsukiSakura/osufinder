<template>
  <div class="field-group">
    <label class="field-label">名次设置</label>

    <div class="rank-tags-container">
      <div
        v-for="(item, i) in items"
        :key="i"
        class="rank-tag"
        :class="podiumClass(item)"
      >
        <span class="rank-tag-text">{{ display(item) }}</span>
        <button type="button" class="rank-tag-remove" @click="remove(i)">×</button>
      </div>

      <!-- 添加弹窗 -->
      <div v-if="showAdd" class="rank-add-popup">
        <input
          v-model="newL"
          type="number"
          class="rank-add-input"
          placeholder="起始"
          min="1"
          @keydown.enter="handleAdd"
        />
        <span class="rank-add-sep">~</span>
        <input
          v-model="newR"
          type="number"
          class="rank-add-input"
          placeholder="结束"
          :min="newL"
          @keydown.enter="handleAdd"
        />
        <button type="button" class="rank-add-confirm" @click="handleAdd">✓</button>
        <button type="button" class="rank-add-cancel" @click="cancelAdd">×</button>
      </div>

      <button v-else type="button" class="rank-add-btn" @click="showAdd = true">
        <span class="add-icon">+</span>
        <span>添加名次区间</span>
      </button>
    </div>

    <p v-if="addError" class="hint" style="color: var(--color-level-red)">⚠{{ addError }}</p>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  modelValue: { type: Array, default: () => [] }
})

const emit = defineEmits(['update:modelValue'])

const items = computed(() => props.modelValue)

const showAdd = ref(false)
const newL = ref('')
const newR = ref('')
const addError = ref('')

function display(item) {
  return item.l === item.r ? `#${item.l}` : `#${item.l}~#${item.r}`
}

function podiumClass(item) {
  if (item.l === 1 && item.r === 1) return 'rank-tag--gold'
  if (item.l === 2 && item.r === 2) return 'rank-tag--silver'
  if (item.l === 3 && item.r === 3) return 'rank-tag--bronze'
  return ''
}

function validate(l, r) {
  if (!l || l < 1) return '起始名次必须 ≥ 1'
  if (!r || r < l) return '结束名次必须 ≥ 起始名次'
  // 检查是否与现有区间重叠
  const s = [...items.value].sort((a, b) => a.l - b.l)
  for (const item of s) {
    if (!(r < item.l || l > item.r)) {
      return `与「${display(item)}」区间重叠`
    }
  }
  return null
}

function handleAdd() {
  const l = parseInt(newL.value)
  const r = parseInt(newR.value)
  const err = validate(l, r)
  if (err) {
    addError.value = err
    return
  }
  emit('update:modelValue', [...items.value, { l, r }])
  cancelAdd()
}

function cancelAdd() {
  showAdd.value = false
  newL.value = ''
  newR.value = ''
  addError.value = ''
}

function remove(i) {
  emit('update:modelValue', items.value.filter((_, idx) => idx !== i))
}
</script>