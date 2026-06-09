import { ref } from 'vue'
import { playersRepo } from '../db'

export function usePlayerNames() {
  const playerNameMap = ref(new Map())

  function playerName(uid) {
    return playerNameMap.value.get(Number(uid)) || '#' + uid
  }

  async function loadPlayerNames() {
    const all = await playersRepo.getAll()
    const map = new Map()
    for (const p of all) {
      const name = p.nicknames?.[p.primaryNickIndex ?? 0] || p.nicknames?.[0] || '#' + p.osuUid
      map.set(p.osuUid, name)
    }
    playerNameMap.value = map
  }

  return { playerNameMap, playerName, loadPlayerNames }
}