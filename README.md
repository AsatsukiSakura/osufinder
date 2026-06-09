# osu!Finder

osu! 玩家与赛事数据管理工具，纯前端应用，数据存储在浏览器本地。

## 功能

- 玩家管理 — 搜索、添加、查看玩家详情，支持别名、联系方式、成绩记录
- 赛事管理 — 记录比赛结果，队伍排名，参赛选手关联
- 本地存储 — 基于 IndexedDB（Dexie），数据不上传服务器
- 数据导入/导出 — JSON 格式，支持旧版数据迁移
- 明暗主题 — 自动适应系统主题

## 技术栈

Vue 3 + Vite + Vue Router + Dexie

## 开发

```bash
npm install
npm run dev
```

## 构建

```bash
npm run build
```
