import { ref } from 'vue'

export function useToast(timeout = 2000) {
  const toast = ref(null)

  let timerId = null

function showToast(text, type = 'success') {
  clearTimeout(timerId)
  toast.value = { text, type }
  timerId = setTimeout(() => { toast.value = null }, timeout)
}

  return { toast, showToast }
}