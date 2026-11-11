import { reactive } from 'vue'

export interface ConfirmOptions {
  title?: string
  message: string
  confirmText?: string
  cancelText?: string
  danger?: boolean
}

interface DialogState {
  open: boolean
  title: string
  message: string
  confirmText: string
  cancelText: string
  danger: boolean
  resolve: ((value: boolean) => void) | null
}

export const dialogState = reactive<DialogState>({
  open: false,
  title: '请确认',
  message: '',
  confirmText: '确认',
  cancelText: '取消',
  danger: false,
  resolve: null
})

/** 替代原生 confirm 的 Promise 化确认框 */
export function confirmAction(options: ConfirmOptions): Promise<boolean> {
  return new Promise((resolve) => {
    dialogState.title = options.title ?? '请确认'
    dialogState.message = options.message
    dialogState.confirmText = options.confirmText ?? '确认'
    dialogState.cancelText = options.cancelText ?? '取消'
    dialogState.danger = options.danger ?? false
    dialogState.resolve = resolve
    dialogState.open = true
  })
}

export function closeDialog(result: boolean) {
  dialogState.open = false
  dialogState.resolve?.(result)
  dialogState.resolve = null
}
