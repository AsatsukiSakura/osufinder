// ===== 联系方式和记录级别 =====

export type ContactType = 'qq' | 'bili' | 'discord' | 'twitter'

export type Level = 'green' | 'yellow' | 'red'

// ===== 玩家 =====

export interface PlayerContacts {
  qq: string[]
  bili: string[]
  discord: string[]
  twitter: string[]
}

export interface PlayerRecord {
  id: number
  text: string
  level: Level
}

export interface Player {
  osuUid: number
  nicknames: string[]
  primaryNickIndex: number
  contacts: PlayerContacts
  records: PlayerRecord[]
  createdAt: number
  updatedAt: number
}

// ===== 赛事 =====

export interface RankSetItem {
  l: number
  r: number
}

export interface Team {
  _id: string
  name: string
  members: number[]
  rank: string
}

export interface Tournament {
  id?: number
  name: string
  edition: string
  ts: number
  ms: number
  rankSet: RankSetItem[]
  teams: Team[]
  createdAt: number
  updatedAt: number
}

// ===== API =====

export interface ApiConfig {
  clientId: string
  clientSecret: string
}

export interface OsuUser {
  id: number
  username: string
  avatar_url: string
  country_code: string
  // ... 更多字段按需
}

// ===== 导出/导入 =====

export interface ExportData {
  schemaVersion: number
  app: string
  exportedAt: number
  exportMode?: string
  playerCount?: number
  players?: PlayerExport[]
  tournamentCount?: number
  tournaments?: TournamentExport[]
}

export interface PlayerExport {
  osuUid: number
  nicknames: string[]
  primaryNickIndex: number
  primaryNickname?: string
  contacts: PlayerContacts
  records: PlayerRecord[]
  createdAt: number
  updatedAt: number
}

export interface TournamentExport {
  name: string
  edition: string
  ts: number
  ms: number
  rankSet: RankSetItem[]
  teams: Team[]
  createdAt: number
  updatedAt: number
}
