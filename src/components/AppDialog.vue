<template>
  <Teleport to="body">
    <Transition name="dialog">
      <div v-if="dialogState.open" class="dialog-backdrop" @click.self="closeDialog(false)">
        <div class="dialog-panel" role="dialog" aria-modal="true" :aria-label="dialogState.title">
          <h3 class="dialog-title">{{ dialogState.title }}</h3>
          <p class="dialog-message">{{ dialogState.message }}</p>
          <div class="dialog-actions">
            <button type="button" class="btn btn-secondary" @click="closeDialog(false)">
              {{ dialogState.cancelText }}
            </button>
            <button
              type="button"
              class="btn"
              :class="dialogState.danger ? 'btn-danger-solid' : 'btn-primary'"
              @click="closeDialog(true)"
            >
              {{ dialogState.confirmText }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted } from 'vue'
import { dialogState, closeDialog } from '../composables/useDialog'

function onKeydown(e: KeyboardEvent) {
  if (dialogState.open && e.key === 'Escape') {
    e.preventDefault()
    closeDialog(false)
  }
}

onMounted(() => window.addEventListener('keydown', onKeydown))
onBeforeUnmount(() => window.removeEventListener('keydown', onKeydown))
</script>

<style scoped>
.dialog-backdrop {
  position: fixed;
  inset: 0;
  z-index: 1300;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  background: var(--bg-overlay);
  backdrop-filter: blur(4px);
}

.dialog-panel {
  width: min(420px, 100%);
  padding: 26px;
  border-radius: var(--radius-lg);
  background: var(--bg-elevated);
  border: 1px solid var(--border-default);
  box-shadow: var(--shadow-pop);
}

.dialog-title {
  margin: 0 0 10px;
  font-size: var(--font-size-xl);
  font-weight: 700;
  color: var(--text-primary);
}

.dialog-message {
  margin: 0 0 22px;
  font-size: var(--font-size-base);
  line-height: 1.65;
  color: var(--text-muted);
  word-break: break-word;
}

.dialog-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.dialog-enter-active,
.dialog-leave-active {
  transition: opacity 0.2s ease;
}

.dialog-enter-active .dialog-panel,
.dialog-leave-active .dialog-panel {
  transition: transform 0.2s ease;
}

.dialog-enter-from,
.dialog-leave-to {
  opacity: 0;
}

.dialog-enter-from .dialog-panel,
.dialog-leave-to .dialog-panel {
  transform: translateY(12px) scale(0.98);
}
</style>
