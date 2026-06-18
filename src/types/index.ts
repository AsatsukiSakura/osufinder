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

// ===== DB 仓库接口 =====

export interface PlayerRepo {
  getAll(): Promise<Player[]>
  search(keyword: string): Promise<Player[]>
  searchPaginated(keyword: string, page: number, pageSize: number): Promise<{ items: Player[]; total: number }>
  getByOsuUid(osuUid: number): Promise<Player | undefined>
  create(data: Partial<Player> & { osuUid: number }): Promise<number>
  update(osuUid: number, data: Partial<Player>): Promise<void>
  remove(osuUid: number): Promise<void>
  count(): Promise<number>
  getStats(): Promise<{ playerCount: number; recordCount: number }>
  exportData(mode?: string): Promise<ExportData>
  importData(data: ExportData): Promise<{ added: number; merged: number; total: number }>
}

export interface TournamentRepo {
  getAll(): Promise<Tournament[]>
  search(keyword: string): Promise<Tournament[]>
  getById(id: number): Promise<Tournament | undefined>
  findByPlayerOsuUid(osuUid: number): Promise<Tournament[]>
  create(data: Partial<Tournament>): Promise<number>
  update(id: number, data: Partial<Tournament>): Promise<void>
  remove(id: number): Promise<void>
  count(): Promise<number>
  exportData(): Promise<ExportData>
  importData(data: ExportData): Promise<{ added: number; merged: number }>
  getStats(): Promise<{ tournamentCount: number; teamCount: number }>
}