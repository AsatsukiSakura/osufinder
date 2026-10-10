<template>
  <div class="level-picker">
    <button
      v-for="lvl in levels"
      :key="lvl"
      type="button"
      class="level-btn"
      :class="['level-btn--' + lvl, { 'level-btn--active': modelValue === lvl }]"
      @click="$emit('update:modelValue', lvl)"
      :title="title(lvl)"
    >
      <span class="level-dot"></span>
    </button>
  </div>
</template>

<script setup lang="ts">
import type { Level } from '../types'
import { getLevelFullLabel } from '../utils/level'

withDefaults(defineProps<{
  modelValue?: Level
  levels?: Level[]
}>(), {
  modelValue: 'green',
  levels: () => ['green', 'yellow', 'red']
})

defineEmits<{
  (e: 'update:modelValue', value: Level): void
}>()

function title(lvl: Level) {
  return getLevelFullLabel(lvl)
}
</script>