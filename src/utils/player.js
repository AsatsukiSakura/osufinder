export function hasAnyContact(player) {
  const c = player?.contacts || {}
  return !!(c.qq?.length || c.bili?.length || c.discord?.length || c.twitter?.length)
}