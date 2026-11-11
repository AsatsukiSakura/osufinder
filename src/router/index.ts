import { createRouter, createWebHashHistory, type RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
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
        meta: { title: '搜索玩家', icon: 'search', group: '资料库' }
      },
      {
        path: 'players/add',
        name: 'players-add',
        component: () => import('../views/PlayerAddView.vue'),
        meta: { title: '添加玩家', icon: 'user-plus', group: '资料库' }
      },
      {
        path: 'players/:osuUid',
        name: 'players-detail',
        component: () => import('../views/PlayerDetailView.vue'),
        meta: { title: '玩家详情' }
      },
      {
        path: 'tournaments',
        redirect: '/tournaments/search'
      },
      {
        path: 'tournaments/search',
        name: 'tournaments-search',
        component: () => import('../views/TournamentSearchView.vue'),
        meta: { title: '赛事记录', icon: 'trophy', group: '资料库' }
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
        meta: { title: '使用教程', icon: 'book', group: '资料库' }
      },
      {
        path: 'settings',
        name: 'settings',
        component: () => import('../views/SettingsView.vue'),
        meta: { title: '设置', icon: 'settings', group: '系统' }
      },
      {
        path: ':pathMatch(.*)*',
        name: 'not-found',
        component: () => import('../views/NotFoundView.vue'),
        meta: { title: '页面不存在' }
      }
    ]
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes,
  scrollBehavior() {
    return { top: 0 }
  }
})

router.afterEach((to) => {
  const title = to.meta?.title
  document.title = title ? `${title} · osu!Finder` : 'osu!Finder'
})

export default router
