import { ref } from 'vue'
import { useToast } from './useToast'
import { formatDateTime } from '../utils/format'

export function useEditor(entityRef) {
  const isEdit = ref(!!entityRef)
  const lastUpdated = ref(entityRef?.updatedAt ? '最后更新: ' + formatDateTime(entityRef.updatedAt) : '')

  function refreshLastUpdated(entity) {
    if (entity?.updatedAt) {
      lastUpdated.value = '最后更新: ' + formatDateTime(entity.updatedAt)
    } else {
      lastUpdated.value = '刚刚更新'
    }
  }

  return {
    isEdit,
    lastUpdated,
    refreshLastUpdated,
    ...useToast()
  }
}