export function useEntityCrud(repo, { isEdit, showToast, emit, label, refreshLastUpdated }) {
  async function save({ buildData, validate, beforeCreate, id, onError }) {
    const errMsg = validate?.()
    if (errMsg) {
      showToast(errMsg, 'error')
      return
    }
    try {
      const data = buildData()
      if (beforeCreate) beforeCreate(data)
      let result
      if (isEdit.value) {
        await repo.update(id, data)
      } else {
        result = await repo.create(data)
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

  async function remove(id) {
    if (!id || !isEdit.value) return
    if (!confirm(`确定要删除${label}吗？`)) return
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