<template>
  <div class="field-group">
    <label class="field-label">
      {{ label }}
      <span v-if="hint" class="hint muted">{{ hint }}</span>
    </label>
    <div class="tag-wrapper">
      <span v-for="(item, i) in items" :key="i" class="tag-chip">
        {{ item }}
        <button type="button" class="icon-btn tag-remove" @click="remove(i)">×</button>
      </span>
      <input
        v-model="inputText"
        class="tag-input"
        :class="{ 'tag-input--error': dupFlash }"
        :placeholder="placeholder"
        @keydown.enter.prevent="add"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  modelValue: { type: Array, default: () => [] },
  label: { type: String, required: true },
  placeholder: { type: String, default: '回车添加多个' },
  hint: { type: String, default: '' }
})

const emit = defineEmits(['update:modelValue'])

const inputText = ref('')
const items = computed(() => props.modelValue)
const dupFlash = ref(false)

function add() {
  const val = inputText.value.trim()
  const current = items.value
  if (!val || current.includes(val)) {
    inputText.value = ''
    if (current.includes(val)) {
      dupFlash.value = true
      setTimeout(() => { dupFlash.value = false }, 600)
    }
    return
  }
  emit('update:modelValue', [...current, val])
  inputText.value = ''
}

function remove(index) {
  const current = items.value
  const arr = [...current]
  arr.splice(index, 1)
  emit('update:modelValue', arr)
}
</script>