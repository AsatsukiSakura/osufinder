import { ref, type Ref } from 'vue'

export interface ToastMessage {
  text: string
  type: 'success' | 'error'
}

export function useToast(timeout = 2000) {
  const toast: Ref<ToastMessage | null> = ref(null)

  let timerId: ReturnType<typeof setTimeout> | null = null

  function showToast(text: string, type: 'success' | 'error' = 'success') {
    if (timerId) clearTimeout(timerId)
    toast.value = { text, type }
    timerId = setTimeout(() => { toast.value = null }, timeout)
  }

  return { toast, showToast }
}