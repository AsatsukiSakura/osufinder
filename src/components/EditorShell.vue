<template>
  <div class="editor-wrap">
    <div class="editor-header">
      <h3>{{ isEdit ? editLabel : addLabel }}</h3>
      <slot name="actions" />
    </div>

    <form @submit.prevent="$emit('save')" class="form">
      <slot />

      <div class="editor-actions">
        <span class="muted">{{ lastUpdated }}</span>
        <div class="actions-right">
          <button v-if="isEdit" type="button" class="btn btn-danger" @click="$emit('delete')">删除</button>
          <button type="submit" class="btn btn-primary">保存</button>
        </div>
      </div>
    </form>

    <div v-if="toast" class="toast" :class="toast.type">{{ toast.text }}</div>
  </div>
</template>

<script setup lang="ts">
import type { ToastMessage } from '../composables/useToast'

defineProps<{
  isEdit?: boolean
  editLabel?: string
  addLabel?: string
  lastUpdated?: string
  toast?: ToastMessage | null
}>()

defineEmits<{
  (e: 'save'): void
  (e: 'delete'): void
}>()
</script>