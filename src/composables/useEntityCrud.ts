import type { Ref } from 'vue'
import { showToast } from './useToast'
import { confirmAction } from './useDialog'

export interface CrudRepo {
  create(data: Record<string, unknown>): Promise<unknown>
  update(id: number | string, data: Record<string, unknown>): Promise<unknown>
  remove(id: number | string): Promise<void>
}

export interface CrudContext {
  isEdit: Ref<boolean>
  emit(event: string, ...args: unknown[]): void
  label: string
  refreshLastUpdated?: (entity?: { updatedAt?: number } | null) => void
}

export interface SaveOptions {
  buildData: () => Record<string, unknown>
  validate?: () => string | undefined
  beforeCreate?: (data: Record<string, unknown>) => void
  id: number | string | null | undefined
  onError?: (err: unknown) => void
}

export function useEntityCrud(repo: CrudRepo, { isEdit, emit, label, refreshLastUpdated }: CrudContext) {
  async function save({ buildData, validate, beforeCreate, id, onError }: SaveOptions) {
    const errMsg = validate?.()
    if (errMsg) {
      showToast(errMsg, 'error')
      return
    }
    try {
      const data = buildData()
      if (beforeCreate) beforeCreate(data)
      let result: { createdAt?: number } | undefined
      if (isEdit.value) {
        await repo.update(id as number, data)
      } else {
        result = await repo.create(data) as { createdAt?: number } | undefined
      }
      if (refreshLastUpdated) {
        refreshLastUpdated(
          isEdit.value
            ? { updatedAt: Date.now() }
            : result ? { updatedAt: result.createdAt || Date.now() } : { updatedAt: Date.now() }
        )
      }
      emit('saved')
      showToast(isEdit.value ? '已更新' : '已保存', 'success')
    } catch (err) {
      if (onError) {
        onError(err)
        return
      }
      showToast('保存失败', 'error')
      console.error(err)
    }
  }

  async function remove(id: number | string | null | undefined) {
    if (!id || !isEdit.value) return
    const ok = await confirmAction({
      title: `删除${label}`,
      message: `确定要删除${label}吗？此操作不可撤销。`,
      confirmText: '删除',
      danger: true
    })
    if (!ok) return
    try {
      await repo.remove(id)
      emit('deleted')
      showToast('已删除', 'success')
    } catch (err) {
      showToast('删除失败', 'error')
      console.error(err)
    }
  }

  return { save, remove }
}
