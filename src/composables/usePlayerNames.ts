import { ref } from 'vue'
import { playersRepo } from '../db'

export function usePlayerNames() {
  const playerNameMap = ref<Map<number, string>>(new Map())

  function playerName(uid: number | string): string {
    return playerNameMap.value.get(Number(uid)) || '#' + uid
  }

  async function loadPlayerNames() {
    const all = await playersRepo.getAll()
    const map = new Map<number, string>()
    for (const p of all) {
      const name = p.nicknames?.[p.primaryNickIndex ?? 0] || p.nicknames?.[0] || '#' + p.osuUid
      map.set(p.osuUid, name)
    }
    playerNameMap.value = map
  }

  return { playerNameMap, playerName, loadPlayerNames }
}