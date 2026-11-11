import Dexie from 'dexie'
import type { Table } from 'dexie'
import type {
  Player, PlayerContacts, PlayerRecord, PlayerExport,
  Tournament, Team, TournamentExport,
  ExportData, Level
} from '../types'

interface PlayerTable extends Omit<Player, 'osuUid'> {
  osuUid: number
}

export const db = new Dexie('osufinder_v3') as Dexie & {
  players: Table<PlayerTable, number>
  tournaments: Table<Tournament, number>
}

db.version(1).stores({})

db.version(7).stores({
  players: 'osuUid',
  tournaments: '++id'
})

// v8：补齐索引。赛事导入依赖 name 索引（v7 中未建索引会直接抛错）
db.version(8).stores({
  players: 'osuUid, updatedAt',
  tournaments: '++id, name'
})

const emptyContacts = (): PlayerContacts => ({
  qq: [],
  bili: [],
  discord: [],
  twitter: []
})

let teamIdSeed = 0

/** 统一联系方式结构，缺失字段补空数组，非字符串值丢弃 */
export function normalizeContacts(raw?: Partial<PlayerContacts> | null): PlayerContacts {
  const pick = (v: unknown): string[] =>
    Array.isArray(v)
      ? Array.from(new Set(v.map((x) => String(x).trim()).filter(Boolean)))
      : []
  return {
    qq: pick(raw?.qq),
    bili: pick(raw?.bili),
    discord: pick(raw?.discord),
    twitter: pick(raw?.twitter)
  }
}

/** 统一记录结构，过滤空文本 */
export function normalizeRecords(raw?: unknown[] | null): PlayerRecord[] {
  if (!Array.isArray(raw)) return []
  const levels: Level[] = ['green', 'yellow', 'red']
  return raw
    .map((item, index) => {
      const r = (item || {}) as Partial<PlayerRecord>
      const text = String(r.text ?? '').trim()
      return {
        id: typeof r.id === 'number' ? r.id : Date.now() + index,
        text,
        level: levels.includes(r.level as Level) ? (r.level as Level) : 'green'
      }
    })
    .filter((r) => r.text.length > 0)
}

/** 统一队伍结构，保证 _id 唯一，队员为正整数 UID */
export function normalizeTeams(raw?: unknown[] | null): Team[] {
  if (!Array.isArray(raw)) return []
  const seen = new Set<string>()
  const teams: Team[] = []
  for (const item of raw) {
    const t = (item || {}) as Partial<Team> & { members?: unknown[] }
    const name = String(t.name ?? '').trim()
    if (!name) continue
    let id = String(t._id ?? '').trim()
    if (!id || seen.has(id)) id = `team_${Date.now()}_${teamIdSeed++}`
    seen.add(id)
    teams.push({
      _id: id,
      name,
      members: Array.isArray(t.members)
        ? Array.from(new Set(
            t.members
              .map((m) => (typeof m === 'object' && m !== null ? Number((m as { osuUid?: unknown }).osuUid) : Number(m)))
              .filter((uid) => Number.isInteger(uid) && uid > 0)
          ))
        : [],
      rank: String(t.rank ?? '').trim()
    })
  }
  return teams
}

// 通用全表扫描：读取全部记录 → 可选过滤 → 按 updatedAt 降序排列
async function scanTable<T extends { updatedAt?: number }>(
  table: Table<T>,
  filterFn?: (item: T) => boolean
): Promise<T[]> {
  const all = await table.toArray()
  const filtered = filterFn ? all.filter(filterFn) : all
  return filtered.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0))
}

function matchPlayer(p: PlayerTable, kw: string): boolean {
  if (String(p.osuUid || '').includes(kw)) return true
  if ((p.nicknames || []).some((n) => n.toLowerCase().includes(kw))) return true

  const c = p.contacts || emptyContacts()
  const contactVals = [...c.qq, ...c.bili, ...c.discord, ...c.twitter]
  if (contactVals.some((v) => v.toLowerCase().includes(kw))) return true

  if ((p.records || []).some((r) => r.text.toLowerCase().includes(kw))) return true

  return false
}

function matchTournament(t: Tournament, kw: string): boolean {
  if ((t.name || '').toLowerCase().includes(kw)) return true
  if ((t.edition || '').toLowerCase().includes(kw)) return true

  const teams = t.teams || []
  if (teams.some((team) => (team.name || '').toLowerCase().includes(kw))) return true
  if (teams.some((team) => (team.members || []).some((m) => String(m).includes(kw)))) return true

  return false
}

/** 合并两队队员与名次信息 */
function mergeTeams(existing: Team[], incoming: Team[]): Team[] {
  const result = existing.map((t) => ({ ...t, members: [...t.members] }))
  for (const inc of incoming) {
    const target = result.find((t) => t._id === inc._id)
      || result.find((t) => t.name.toLowerCase() === inc.name.toLowerCase())
    if (!target) {
      result.push({ ...inc, members: [...inc.members] })
      continue
    }
    target.members = Array.from(new Set([...target.members, ...inc.members]))
    if (!target.rank && inc.rank) target.rank = inc.rank
    if (!target.name && inc.name) target.name = inc.name
  }
  return result
}

export const playersRepo = {
  getAll(): Promise<PlayerTable[]> {
    return scanTable(db.players)
  },

  async search(keyword: string): Promise<PlayerTable[]> {
    const kw = keyword.trim().toLowerCase()
    if (!kw) return this.getAll()

    const osuUidNum = Number(kw)
    if (osuUidNum > 0 && String(osuUidNum) === kw) {
      const exact = await db.players.get(osuUidNum)
      if (exact) {
        const rest = await scanTable(db.players, (p) => p.osuUid !== osuUidNum && matchPlayer(p, kw))
        return [exact, ...rest]
      }
    }

    return scanTable(db.players, (p) => matchPlayer(p, kw))
  },

  async getByOsuUid(osuUid: number) {
    return await db.players.get(osuUid)
  },

  async exists(osuUid: number) {
    return (await db.players.get(osuUid)) !== undefined
  },

  async create(data: { osuUid: number; nicknames?: string[]; primaryNickIndex?: number; contacts?: PlayerContacts; records?: PlayerRecord[] }) {
    const now = Date.now()
    return await db.players.add({
      osuUid: data.osuUid,
      nicknames: Array.from(new Set((data.nicknames || []).map((n) => n.trim()).filter(Boolean))),
      primaryNickIndex: data.primaryNickIndex ?? 0,
      contacts: normalizeContacts(data.contacts),
      records: normalizeRecords(data.records),
      createdAt: now,
      updatedAt: now
    })
  },

  async update(osuUid: number, data: { nicknames?: string[]; primaryNickIndex?: number; contacts?: PlayerContacts; records?: PlayerRecord[] }) {
    const changes: { nicknames?: string[]; primaryNickIndex?: number; contacts?: PlayerContacts; records?: PlayerRecord[]; updatedAt: number } = { updatedAt: Date.now() }
    if (data.nicknames !== undefined) changes.nicknames = Array.from(new Set(data.nicknames.map((n) => n.trim()).filter(Boolean)))
    if (data.primaryNickIndex !== undefined) changes.primaryNickIndex = data.primaryNickIndex
    if (data.contacts !== undefined) changes.contacts = normalizeContacts(data.contacts)
    if (data.records !== undefined) changes.records = normalizeRecords(data.records)
    return await db.players.update(osuUid, changes)
  },

  async remove(osuUid: number) {
    return await db.players.delete(osuUid)
  },

  async count() {
    return await db.players.count()
  },

  async clearAll() {
    return await db.players.clear()
  },

  async getStats() {
    const all = await this.getAll()
    let recordCount = 0
    for (const p of all) {
      recordCount += (p.records || []).length
    }
    return { playerCount: all.length, recordCount }
  },

  async exportData(mode = 'all'): Promise<ExportData> {
    const all = await this.getAll()
    const levelMap: Record<string, Level[]> = {
      green: ['green'],
      yellow_and_below: ['green', 'yellow'],
      all: ['green', 'yellow', 'red']
    }
    const allowedLevels = levelMap[mode] || ['green', 'yellow', 'red']
    const players: PlayerExport[] = all.map(p => ({
      osuUid: p.osuUid,
      nicknames: p.nicknames || [],
      primaryNickIndex: p.primaryNickIndex ?? 0,
      contacts: normalizeContacts(p.contacts),
      records: normalizeRecords(p.records).filter(r => allowedLevels.includes(r.level)),
      createdAt: p.createdAt,
      updatedAt: p.updatedAt
    }))
    return {
      schemaVersion: 1,
      app: 'osufinder',
      exportedAt: Date.now(),
      exportMode: mode,
      playerCount: players.length,
      players
    }
  },

  async importData(data: ExportData) {
    if (!data || !data.players || !Array.isArray(data.players)) {
      throw new Error('文件格式不正确')
    }
    let added = 0
    let merged = 0
    const now = Date.now()
    for (const incoming of data.players) {
      // 归一化 UID：JSON 中可能是字符串 "12345"，与库里的数字键 12345 不匹配
      const osuUid = Number(incoming.osuUid)
      if (!Number.isInteger(osuUid) || osuUid < 1) continue
      const incomingNicknames = Array.from(new Set((incoming.nicknames || []).map((n) => String(n).trim()).filter(Boolean)))
      // 兼容旧导出格式 primaryNickname（字符串）→ primaryNickIndex（索引）
      let incomingIndex = incoming.primaryNickIndex ?? 0
      if (incoming.primaryNickname && (incoming as { primaryNickIndex?: number }).primaryNickIndex === undefined) {
        const found = incomingNicknames.indexOf(incoming.primaryNickname)
        if (found >= 0) incomingIndex = found
      }
      const existing = await db.players.get(osuUid)
      if (!existing) {
        await db.players.add({
          osuUid,
          nicknames: incomingNicknames,
          primaryNickIndex: incomingIndex,
          contacts: normalizeContacts(incoming.contacts),
          records: normalizeRecords(incoming.records),
          createdAt: incoming.createdAt || now,
          updatedAt: now
        })
        added++
      } else {
        const mergedNicknames = Array.from(new Set([...(existing.nicknames || []), ...incomingNicknames]))
        const existingContacts = normalizeContacts(existing.contacts)
        const incomingContacts = normalizeContacts(incoming.contacts)
        const mergedContacts: PlayerContacts = {
          qq: Array.from(new Set([...existingContacts.qq, ...incomingContacts.qq])),
          bili: Array.from(new Set([...existingContacts.bili, ...incomingContacts.bili])),
          discord: Array.from(new Set([...existingContacts.discord, ...incomingContacts.discord])),
          twitter: Array.from(new Set([...existingContacts.twitter, ...incomingContacts.twitter]))
        }
        const existingRecords = normalizeRecords(existing.records)
        const existingTexts = new Set(existingRecords.map(r => r.text.toLowerCase()))
        const newRecords = normalizeRecords(incoming.records).filter(r => !existingTexts.has(r.text.toLowerCase()))
        const mergedRecords = [...existingRecords, ...newRecords]
        const existingPrimaryNick = (existing.nicknames || [])[existing.primaryNickIndex ?? 0]
        let mergedPrimaryIndex = 0
        if (existingPrimaryNick) {
          const newIdx = mergedNicknames.indexOf(existingPrimaryNick)
          if (newIdx >= 0) mergedPrimaryIndex = newIdx
        }
        await db.players.update(osuUid, {
          nicknames: mergedNicknames,
          primaryNickIndex: mergedPrimaryIndex,
          contacts: mergedContacts,
          records: mergedRecords,
          updatedAt: now
        })
        merged++
      }
    }
    return { added, merged, total: added + merged }
  }
}

export const tournamentRepo = {
  getAll(): Promise<Tournament[]> {
    return scanTable(db.tournaments)
  },

  search(keyword: string): Promise<Tournament[]> {
    const kw = keyword.trim().toLowerCase()
    if (!kw) return this.getAll()
    return scanTable(db.tournaments, (t) => matchTournament(t, kw))
  },

  getById(id: number) {
    return db.tournaments.get(id)
  },

  findByPlayerOsuUid(osuUid: number | string): Promise<Tournament[]> {
    const uid = Number(osuUid)
    if (!uid) return Promise.resolve([])
    return scanTable(db.tournaments, (t) =>
      (t.teams || []).some((team) => (team.members || []).includes(uid))
    )
  },

  async create(data: { name: string; edition?: string; ts?: number; ms?: number; rankSet?: { l: number; r: number }[]; teams?: Team[] }) {
    const now = Date.now()
    return await db.tournaments.add({
      name: data.name.trim(),
      edition: data.edition || '',
      ts: data.ts || 0,
      ms: data.ms || 0,
      rankSet: data.rankSet || [],
      teams: normalizeTeams(data.teams),
      createdAt: now,
      updatedAt: now
    })
  },

  async update(id: number, data: { name?: string; edition?: string; ts?: number; ms?: number; rankSet?: { l: number; r: number }[]; teams?: Team[] }) {
    const changes: { name?: string; edition?: string; ts?: number; ms?: number; rankSet?: { l: number; r: number }[]; teams?: Team[]; updatedAt: number } = { updatedAt: Date.now() }
    if (data.name !== undefined) changes.name = data.name.trim()
    if (data.edition !== undefined) changes.edition = data.edition
    if (data.ts !== undefined) changes.ts = data.ts
    if (data.ms !== undefined) changes.ms = data.ms
    if (data.rankSet !== undefined) changes.rankSet = data.rankSet
    if (data.teams !== undefined) changes.teams = normalizeTeams(data.teams)
    return await db.tournaments.update(id, changes)
  },

  async remove(id: number) {
    return await db.tournaments.delete(id)
  },

  async count() {
    return await db.tournaments.count()
  },

  async clearAll() {
    return await db.tournaments.clear()
  },

  async exportData(): Promise<ExportData> {
    const all = await this.getAll()
    const tournaments: TournamentExport[] = all.map(t => ({
      name: t.name,
      edition: t.edition || '',
      ts: t.ts || 0,
      ms: t.ms || 0,
      rankSet: t.rankSet || [],
      teams: normalizeTeams(t.teams),
      createdAt: t.createdAt,
      updatedAt: t.updatedAt
    }))
    return {
      schemaVersion: 1,
      app: 'osufinder',
      exportedAt: Date.now(),
      tournamentCount: tournaments.length,
      tournaments
    }
  },

  async importData(data: ExportData) {
    if (!data || !data.tournaments || !Array.isArray(data.tournaments)) {
      throw new Error('文件格式不正确')
    }
    let added = 0
    let merged = 0
    const now = Date.now()
    for (const incoming of data.tournaments) {
      const name = String(incoming.name ?? '').trim()
      if (!name) continue
      const edition = String(incoming.edition ?? '').trim()
      const incomingTeams = normalizeTeams(incoming.teams)
      const existing = await db.tournaments
        .where('name').equals(name)
        .filter(t => (t.edition || '') === edition)
        .first()
      if (!existing) {
        await db.tournaments.add({
          name,
          edition,
          ts: incoming.ts || 0,
          ms: incoming.ms || 0,
          rankSet: incoming.rankSet || [],
          teams: incomingTeams,
          createdAt: incoming.createdAt || now,
          updatedAt: now
        })
        added++
      } else {
        await db.tournaments.update(existing.id!, {
          ts: incoming.ts || existing.ts || 0,
          ms: incoming.ms || existing.ms || 0,
          rankSet: (incoming.rankSet && incoming.rankSet.length) ? incoming.rankSet : (existing.rankSet || []),
          teams: mergeTeams(normalizeTeams(existing.teams), incomingTeams),
          updatedAt: now
        })
        merged++
      }
    }
    return { added, merged }
  },

  async getStats() {
    const all = await this.getAll()
    let teamCount = 0
    for (const t of all) {
      teamCount += (t.teams || []).length
    }
    return {
      tournamentCount: all.length,
      teamCount
    }
  }
}
