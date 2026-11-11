<template>
  <Teleport to="body">
    <div class="toast-host" aria-live="polite">
      <TransitionGroup name="toast">
        <div
          v-for="item in toasts"
          :key="item.id"
          class="toast-item"
          :class="'toast-item--' + item.type"
          role="status"
          @click="dismissToast(item.id)"
        >
          <span class="toast-icon">
            <AppIcon :name="iconName(item.type)" :size="17" />
          </span>
          <span class="toast-text">{{ item.text }}</span>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import AppIcon from './AppIcon.vue'
import { useToast, dismissToast, type ToastType } from '../composables/useToast'

const { toasts } = useToast()

function iconName(type: ToastType): string {
  if (type === 'error') return 'alert'
  if (type === 'info') return 'info'
  return 'check'
}
</script>

<style scoped>
.toast-host {
  position: fixed;
  right: 24px;
  bottom: 24px;
  z-index: 1200;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 10px;
  pointer-events: none;
}

.toast-item {
  display: flex;
  align-items: center;
  gap: 10px;
  max-width: min(380px, calc(100vw - 32px));
  padding: 12px 18px 12px 14px;
  border-radius: var(--radius-md);
  background: var(--bg-elevated);
  color: var(--text-primary);
  border: 1px solid var(--border-default);
  box-shadow: var(--shadow-pop);
  font-size: var(--font-size-sm);
  font-weight: 500;
  pointer-events: auto;
  cursor: pointer;
  backdrop-filter: blur(12px);
}

.toast-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  border-radius: 50%;
  flex-shrink: 0;
}

.toast-item--success .toast-icon {
  color: var(--color-level-green);
  background: color-mix(in srgb, var(--color-level-green) 16%, transparent);
}

.toast-item--error .toast-icon {
  color: var(--color-level-red);
  background: color-mix(in srgb, var(--color-level-red) 16%, transparent);
}

.toast-item--info .toast-icon {
  color: var(--brand-pink);
  background: color-mix(in srgb, var(--brand-pink) 16%, transparent);
}

.toast-text {
  line-height: 1.45;
  word-break: break-word;
}

.toast-enter-active,
.toast-leave-active {
  transition: opacity 0.22s ease, transform 0.22s ease;
}

.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateY(10px) scale(0.98);
}

@media (max-width: 640px) {
  .toast-host {
    left: 16px;
    right: 16px;
    bottom: 16px;
    align-items: stretch;
  }
  .toast-item {
    max-width: none;
  }
}
</style>
