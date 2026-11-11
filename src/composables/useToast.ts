import { ref } from 'vue'

export type ToastType = 'success' | 'error' | 'info'

export interface ToastItem {
  id: number
  text: string
  type: ToastType
}

// 全局 toast 队列：任何位置调用 showToast 都会显示在 ToastHost 中
const toasts = ref<ToastItem[]>([])
let seed = 0

export function showToast(text: string, type: ToastType = 'success', duration = 2600) {
  const id = ++seed
  toasts.value = [...toasts.value, { id, text, type }]
  setTimeout(() => dismissToast(id), duration)
}

export function dismissToast(id: number) {
  toasts.value = toasts.value.filter((t) => t.id !== id)
}

export function useToast() {
  return { toasts, showToast, dismissToast }
}
