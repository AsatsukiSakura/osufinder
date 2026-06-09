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

<script setup>
import { getLevelFullLabel } from '../utils/level'

defineProps({
  modelValue: { type: String, default: 'green' },
  levels: { type: Array, default: () => ['green', 'yellow', 'red'] }
})

defineEmits(['update:modelValue'])

function title(lvl) {
  return getLevelFullLabel(lvl)
}
</script>