import Dexie from 'dexie'

export const db = new Dexie('osufinder_v3')

db.version(1).stores({})

db.version(7).stores({
  players: 'osuUid',
  tournaments: '++id'
})

const emptyContacts = () => ({
  qq: [],
  bili: [],
  discord: [],
  twitter: []
})

// 通用全表扫描：读取全部记录 → 可选过滤 → 按 updatedAt 降序排列
async function scanTable(table, filterFn) {
  const all = await table.toArray()
  const filtered = filterFn ? all.filter(filterFn) : all
  return filtered.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0))
}

function matchPlayer(p, kw) {
  if (String(p.osuUid || '').includes(kw)) return true
  if ((p.nicknames || []).some((n) => n.toLowerCase().includes(kw))) return true

  const c = p.contacts || emptyContacts()
  const contactVals = [...c.qq, ...c.bili, ...c.discord, ...c.twitter]
  if (contactVals.some((v) => v.toLowerCase().includes(kw))) return true

  if ((p.records || []).some((r) => r.text.toLowerCase().includes(kw))) return true

  return false
}

function matchTournament(t, kw) {
  if ((t.name || '').toLowerCase().includes(kw)) return true
  if ((t.edition || '').toLowerCase().includes(kw)) return true

  const teams = t.teams || []
  if (teams.some((team) => (team.name || '').toLowerCase().includes(kw))) return true
  if (teams.some((team) => (team.members || []).some((m) => String(m).includes(kw)))) return true

  return false
}

export const playersRepo = {
  getAll() {
    return scanTable(db.players)
  },

  async search(keyword) {
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

    if (kw.length < 2) return []
    return scanTable(db.players, (p) => matchPlayer(p, kw))
  },

  async searchPaginated(keyword, page = 1, pageSize = 20) {
    const all = await this.search(keyword)
    const total = all.length
    const start = (page - 1) * pageSize
    const items = all.slice(start, start + pageSize)
    return { items, total }
  },

  async getByOsuUid(osuUid) {
    return await db.players.get(osuUid)
  },

  async create(data) {
    const now = Date.now()
    return await db.players.add({
      osuUid: data.osuUid,
      nicknames: data.nicknames || [],
      primaryNickIndex: data.primaryNickIndex ?? 0,
      contacts: data.contacts || emptyContacts(),
      records: data.records || [],
      createdAt: now,
      updatedAt: now
    })
  },

  async update(osuUid, data) {
    return await db.players.update(osuUid, {
      nicknames: data.nicknames || [],
      primaryNickIndex: data.primaryNickIndex ?? 0,
      contacts: data.contacts || emptyContacts(),
      records: data.records || [],
      updatedAt: Date.now()
    })
  },

  async remove(osuUid) {
    return await db.players.delete(osuUid)
  },

  async count() {
    return await db.players.count()
  },

  async getStats() {
    const all = await this.getAll()
    let recordCount = 0
    for (const p of all) {
      recordCount += (p.records || []).length
    }
    return { playerCount: all.length, recordCount }
  },

  async exportData(mode = 'all') {
    const all = await this.getAll()
    const levelMap = { green: ['green'], yellow_and_below: ['green', 'yellow'], all: ['green', 'yellow', 'red'] }
    const allowedLevels = levelMap[mode] || ['green', 'yellow', 'red']
    const players = all.map(p => ({
      osuUid: p.osuUid,
      nicknames: p.nicknames || [],
      primaryNickIndex: p.primaryNickIndex ?? 0,
      contacts: p.contacts || emptyContacts(),
      records: (p.records || []).filter(r => allowedLevels.includes(r.level)),
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

  async importData(data) {
    if (!data || !data.players || !Array.isArray(data.players)) {
      throw new Error('文件格式不正确')
    }
    let added = 0
    let merged = 0
    const now = Date.now()
    for (const incoming of data.players) {
      if (!incoming.osuUid) continue
      // 兼容旧导出格式 primaryNickname（字符串）→ primaryNickIndex（索引）
      let incomingIndex = incoming.primaryNickIndex ?? 0
      if (incoming.primaryNickname && (!incoming.primaryNickIndex && incoming.primaryNickIndex !== 0)) {
        const found = (incoming.nicknames || []).indexOf(incoming.primaryNickname)
        if (found >= 0) incomingIndex = found
      }
      const existing = await db.players.get(incoming.osuUid)
      if (!existing) {
        await db.players.add({
          osuUid: incoming.osuUid,
          nicknames: incoming.nicknames || [],
          primaryNickIndex: incomingIndex,
          contacts: incoming.contacts || emptyContacts(),
          records: incoming.records || [],
          createdAt: incoming.createdAt || now,
          updatedAt: now
        })
        added++
      } else {
        const mergedNicknames = Array.from(new Set([...(existing.nicknames || []), ...(incoming.nicknames || [])]))
        const existingContacts = existing.contacts || emptyContacts()
        const incomingContacts = incoming.contacts || emptyContacts()
        const mergedContacts = {
          qq: Array.from(new Set([...existingContacts.qq, ...incomingContacts.qq])),
          bili: Array.from(new Set([...existingContacts.bili, ...incomingContacts.bili])),
          discord: Array.from(new Set([...existingContacts.discord, ...incomingContacts.discord])),
          twitter: Array.from(new Set([...existingContacts.twitter, ...incomingContacts.twitter]))
        }
        const existingTexts = new Set((existing.records || []).map(r => r.text.trim().toLowerCase()))
        const newRecords = (incoming.records || []).filter(r => !existingTexts.has(r.text.trim().toLowerCase()))
        const mergedRecords = [...(existing.records || []), ...newRecords]
        const existingPrimaryNick = (existing.nicknames || [])[existing.primaryNickIndex ?? 0]
        let mergedPrimaryIndex = 0
        if (existingPrimaryNick) {
          const newIdx = mergedNicknames.indexOf(existingPrimaryNick)
          if (newIdx >= 0) mergedPrimaryIndex = newIdx
        }
        await db.players.update(incoming.osuUid, {
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
  getAll() {
    return scanTable(db.tournaments)
  },

  search(keyword) {
    const kw = keyword.trim().toLowerCase()
    if (!kw) return this.getAll()
    if (kw.length < 2) return []
    return scanTable(db.tournaments, (t) => matchTournament(t, kw))
  },

  getById(id) {
    return db.tournaments.get(id)
  },

  findByPlayerOsuUid(osuUid) {
    const uid = Number(osuUid)
    if (!uid) return []
    return scanTable(db.tournaments, (t) =>
      (t.teams || []).some((team) => (team.members || []).includes(uid))
    )
  },

  async create(data) {
    const now = Date.now()
    return await db.tournaments.add({
      name: data.name,
      edition: data.edition || '',
      ts: data.ts || 0,
      ms: data.ms || 0,
      rankSet: data.rankSet || [],
      teams: data.teams || [],
      createdAt: now,
      updatedAt: now
    })
  },

  async update(id, data) {
    return await db.tournaments.update(id, {
      name: data.name,
      edition: data.edition || '',
      ts: data.ts || 0,
      ms: data.ms || 0,
      rankSet: data.rankSet || [],
      teams: data.teams || [],
      updatedAt: Date.now()
    })
  },

  async remove(id) {
    return await db.tournaments.delete(id)
  },

  async count() {
    return await db.tournaments.count()
  },

  async exportData() {
    const all = await this.getAll()
    const tournaments = all.map(t => ({
      name: t.name,
      edition: t.edition || '',
      ts: t.ts || 0,
      ms: t.ms || 0,
      rankSet: t.rankSet || [],
      teams: t.teams || [],
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

  async importData(data) {
    if (!data || !data.tournaments || !Array.isArray(data.tournaments)) {
      throw new Error('文件格式不正确')
    }
    let added = 0
    let merged = 0
    const now = Date.now()
    for (const incoming of data.tournaments) {
      if (!incoming.name) continue
      const existing = await db.tournaments
        .where('name').equals(incoming.name)
        .and(t => t.edition === (incoming.edition || ''))
        .first()
      if (!existing) {
        await db.tournaments.add({
          name: incoming.name,
          edition: incoming.edition || '',
          ts: incoming.ts || 0,
          ms: incoming.ms || 0,
          rankSet: incoming.rankSet || [],
          teams: incoming.teams || [],
          createdAt: incoming.createdAt || now,
          updatedAt: now
        })
        added++
      } else {
        await db.tournaments.update(existing.id, {
          name: incoming.name,
          edition: incoming.edition || '',
          ts: incoming.ts || 0,
          ms: incoming.ms || 0,
          rankSet: incoming.rankSet || [],
          teams: existing.teams && existing.teams.length > 0 ? existing.teams : (incoming.teams || []),
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