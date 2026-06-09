import { createRouter, createWebHashHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    component: () => import('../layouts/DefaultLayout.vue'),
    redirect: '/players/search',
    children: [
      {
        path: 'players',
        redirect: '/players/search'
      },
      {
        path: 'players/search',
        name: 'players-search',
        component: () => import('../views/PlayerSearchView.vue'),
        meta: { title: '搜索玩家', icon: '🔍' }
      },
      {
        path: 'players/add',
        name: 'players-add',
        component: () => import('../views/PlayerAddView.vue'),
        meta: { title: '添加玩家', icon: '➕' }
      },
      {
        path: 'players/:osuUid',
        name: 'players-detail',
        component: () => import('../views/PlayerDetailView.vue'),
        meta: { title: '玩家详情' }
      },
      {
        path: 'settings',
        name: 'settings',
        component: () => import('../views/SettingsView.vue'),
        meta: { title: '设置', icon: '⚙️' }
      },
      {
        path: 'tournaments',
        redirect: '/tournaments/search'
      },
      {
        path: 'tournaments/search',
        name: 'tournaments-search',
        component: () => import('../views/TournamentSearchView.vue'),
        meta: { title: '赛事记录', icon: '🏆' }
      },
      {
        path: 'tournaments/:id',
        name: 'tournaments-detail',
        component: () => import('../views/TournamentDetailView.vue'),
        meta: { title: '赛事详情' }
      },
      {
        path: 'tutorial',
        name: 'tutorial',
        component: () => import('../views/TutorialView.vue'),
        meta: { title: '使用教程', icon: '📖' }
      },
    ]
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

export default router