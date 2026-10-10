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

<script setup lang="ts">
import { ref, computed } from 'vue'

const props = withDefaults(defineProps<{
  modelValue?: string[]
  label: string
  placeholder?: string
  hint?: string
}>(), {
  modelValue: () => [],
  placeholder: '回车添加多个',
  hint: ''
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: string[]): void
}>()

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

function remove(index: number) {
  const current = items.value
  const arr = [...current]
  arr.splice(index, 1)
  emit('update:modelValue', arr)
}
</script>