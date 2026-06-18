import type { Player } from '../types'

export function hasAnyContact(player: Player | null | undefined): boolean {
  const c = player?.contacts
  if (!c) return false
  return !!(c.qq?.length || c.bili?.length || c.discord?.length || c.twitter?.length)
}