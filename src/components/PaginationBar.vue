<template>
  <nav v-if="totalPages > 1" class="pagination" aria-label="分页">
    <button
      type="button"
      class="page-btn page-btn--arrow"
      :disabled="page <= 1"
      aria-label="上一页"
      @click="go(page - 1)"
    >
      <AppIcon name="chevron-left" :size="16" />
    </button>

    <template v-for="(item, i) in pages" :key="i">
      <span v-if="item === '…'" class="page-ellipsis">…</span>
      <button
        v-else
        type="button"
        class="page-btn"
        :class="{ active: item === page }"
        :aria-current="item === page ? 'page' : undefined"
        @click="go(item as number)"
      >{{ item }}</button>
    </template>

    <button
      type="button"
      class="page-btn page-btn--arrow"
      :disabled="page >= totalPages"
      aria-label="下一页"
      @click="go(page + 1)"
    >
      <AppIcon name="chevron-right" :size="16" />
    </button>
  </nav>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import AppIcon from './AppIcon.vue'

const props = defineProps<{
  page: number
  totalPages: number
}>()

const emit = defineEmits<{
  (e: 'update:page', page: number): void
}>()

const pages = computed<(number | '…')[]>(() => {
  const total = props.totalPages
  const current = props.page
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)

  const list: (number | '…')[] = [1]
  const start = Math.max(2, current - 1)
  const end = Math.min(total - 1, current + 1)

  if (start > 2) list.push('…')
  for (let i = start; i <= end; i++) list.push(i)
  if (end < total - 1) list.push('…')
  list.push(total)
  return list
})

function go(target: number) {
  if (target < 1 || target > props.totalPages || target === props.page) return
  emit('update:page', target)
}
</script>

<style scoped>
.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 6px;
  padding-top: 8px;
}

.page-btn {
  min-width: 38px;
  height: 38px;
  padding: 0 10px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--border-default);
  border-radius: var(--radius-sm);
  background: var(--bg-card);
  color: var(--text-secondary);
  font-size: var(--font-size-base);
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  transition: all 0.16s ease;
}

.page-btn:hover:not(:disabled):not(.active) {
  border-color: var(--border-focus);
  color: var(--text-primary);
  transform: translateY(-1px);
}

.page-btn.active {
  background: var(--gradient-primary);
  color: #fff;
  border-color: transparent;
  box-shadow: var(--shadow-primary);
}

.page-btn:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

.page-ellipsis {
  min-width: 28px;
  text-align: center;
  color: var(--text-faint);
  user-select: none;
}

@media (max-width: 640px) {
  .page-btn {
    min-width: 34px;
    height: 34px;
    padding: 0 8px;
    font-size: var(--font-size-sm);
  }
}
</style>
