import { ref } from 'vue'
import { formatDateTime } from '../utils/format'
import type { Player, Tournament } from '../types'

export function useEditor(entityRef: Player | Tournament | null | undefined) {
  const isEdit = ref(!!entityRef)
  const lastUpdated = ref(entityRef?.updatedAt ? '最后更新: ' + formatDateTime(entityRef.updatedAt) : '')

  function refreshLastUpdated(entity?: { updatedAt?: number } | null) {
    if (entity?.updatedAt) {
      lastUpdated.value = '最后更新: ' + formatDateTime(entity.updatedAt)
    } else {
      lastUpdated.value = '刚刚更新'
    }
  }

  return { isEdit, lastUpdated, refreshLastUpdated }
}
