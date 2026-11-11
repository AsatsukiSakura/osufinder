<template>
  <div class="layout">
    <header class="mobile-bar">
      <button type="button" class="icon-btn mobile-bar__btn" aria-label="打开菜单" @click="drawerOpen = true">
        <AppIcon name="menu" :size="20" />
      </button>
      <router-link class="mobile-brand" to="/players/search">
        <img class="logo-icon" src="/favicon.ico" alt="osu!" />
        <span>osu!Finder</span>
      </router-link>
      <button type="button" class="icon-btn mobile-bar__btn" aria-label="切换主题" @click="toggleTheme">
        <AppIcon :name="isDark ? 'sun' : 'moon'" :size="18" />
      </button>
    </header>

    <Transition name="backdrop">
      <div v-if="drawerOpen" class="drawer-backdrop" @click="drawerOpen = false"></div>
    </Transition>

    <aside class="sidebar" :class="{ 'sidebar--open': drawerOpen }">
      <div class="sidebar-header">
        <router-link class="logo-row" to="/players/search">
          <img class="logo-icon" src="/favicon.ico" alt="osu!" />
          <div class="logo-text">
            <h1 class="logo">osu!Finder</h1>
            <p class="tagline">玩家资料库</p>
          </div>
        </router-link>
        <button type="button" class="icon-btn sidebar-close" aria-label="关闭菜单" @click="drawerOpen = false">
          <AppIcon name="close" :size="18" />
        </button>
      </div>

      <nav class="nav">
        <div v-for="group in menuGroups" :key="group.title" class="nav-group">
          <span class="nav-group-title">{{ group.title }}</span>
          <router-link
            v-for="item in group.items"
            :key="item.name"
            :to="item.path"
            class="nav-item"
            active-class="nav-item--active"
          >
            <span class="nav-icon"><AppIcon :name="item.icon" :size="18" /></span>
            <span class="nav-label">{{ item.title }}</span>
          </router-link>
        </div>
      </nav>

      <div class="sidebar-footer">
        <button type="button" class="theme-toggle-btn" @click="toggleTheme" :title="isDark ? '切换到浅色' : '切换到深色'">
          <AppIcon :name="isDark ? 'sun' : 'moon'" :size="17" />
          <span>{{ isDark ? '浅色模式' : '深色模式' }}</span>
        </button>
      </div>
    </aside>

    <main class="content" ref="contentRef">
      <div class="content-inner">
        <RouterView v-slot="{ Component }">
          <Transition name="page" mode="out-in">
            <component :is="Component" />
          </Transition>
        </RouterView>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppIcon from '../components/AppIcon.vue'
import { useTheme } from '../composables/useTheme'

const route = useRoute()
const router = useRouter()
const { isDark, toggleTheme } = useTheme()

const drawerOpen = ref(false)
const contentRef = ref<HTMLElement | null>(null)

interface MenuItem {
  name: string | symbol | undefined
  path: string
  title: string
  icon: string
}

const menuGroups = computed(() => {
  const layoutRoute = router.options.routes.find((r) => r.path === '/')
  const children = (layoutRoute?.children || []).filter(
    (child) => child.component && child.meta?.title && child.meta?.icon
  )

  const groups: { title: string; items: MenuItem[] }[] = []
  for (const child of children) {
    const groupTitle = (child.meta?.group as string) || '导航'
    let group = groups.find((g) => g.title === groupTitle)
    if (!group) {
      group = { title: groupTitle, items: [] }
      groups.push(group)
    }
    group.items.push({
      name: child.name,
      path: '/' + child.path,
      title: child.meta?.title as string,
      icon: child.meta?.icon as string
    })
  }
  return groups
})

watch(
  () => route.fullPath,
  () => {
    drawerOpen.value = false
    if (contentRef.value) contentRef.value.scrollTop = 0
    window.scrollTo(0, 0)
  }
)
</script>

<style scoped>
.layout {
  display: grid;
  grid-template-columns: 248px 1fr;
  height: 100vh;
}

.mobile-bar {
  display: none;
}

.drawer-backdrop {
  display: none;
}

.sidebar {
  display: flex;
  flex-direction: column;
  gap: 22px;
  padding: 24px 16px 18px;
  height: 100vh;
  overflow-y: auto;
  background: var(--bg-glass);
  backdrop-filter: blur(18px);
  border-right: 1px solid var(--border-divider);
}

.sidebar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 6px;
}

.logo-row {
  display: flex;
  align-items: center;
  gap: 11px;
  text-decoration: none;
}

.logo-icon {
  width: 36px;
  height: 36px;
  flex-shrink: 0;
  border-radius: 10px;
  box-shadow: var(--shadow-primary);
}

.logo-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.logo {
  font-size: var(--font-size-xl);
  font-weight: 700;
  letter-spacing: -0.01em;
  color: var(--text-primary);
  line-height: 1.1;
}

.tagline {
  font-size: var(--font-size-tiny);
  color: var(--text-muted);
  letter-spacing: 0.04em;
}

.sidebar-close {
  display: none;
  color: var(--text-muted);
  padding: 4px;
}

.nav {
  display: flex;
  flex-direction: column;
  gap: 22px;
  flex: 1;
}

.nav-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.nav-group-title {
  font-size: var(--font-size-tiny);
  font-weight: 600;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--text-faint);
  padding: 0 12px 6px;
}

.nav-item {
  position: relative;
  display: flex;
  align-items: center;
  gap: 11px;
  padding: 10px 12px;
  border-radius: var(--radius-md);
  color: var(--text-muted);
  text-decoration: none;
  font-size: var(--font-size-base);
  font-weight: 500;
  transition: background 0.16s ease, color 0.16s ease, transform 0.16s ease;
}

.nav-item:hover {
  background: var(--bg-item);
  color: var(--text-primary);
  transform: translateX(2px);
}

.nav-item--active {
  background: var(--gradient-primary-soft);
  color: var(--text-primary);
  font-weight: 600;
}

.nav-item--active::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 3px;
  height: 18px;
  border-radius: 0 3px 3px 0;
  background: var(--gradient-primary);
}

.nav-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  color: currentColor;
}

.nav-item--active .nav-icon {
  color: var(--brand-pink);
}

.nav-label {
  line-height: 1;
}

.sidebar-footer {
  padding: 14px 6px 0;
  border-top: 1px solid var(--border-divider);
}

.theme-toggle-btn {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  background: var(--bg-item);
  border: 1px solid transparent;
  border-radius: var(--radius-md);
  color: var(--text-secondary);
  font-size: var(--font-size-sm);
  cursor: pointer;
  font-family: inherit;
  transition: background 0.15s ease, border-color 0.15s ease;
}

.theme-toggle-btn:hover {
  background: var(--bg-item-hover);
  border-color: var(--border-focus);
}

.content {
  overflow: auto;
  scroll-behavior: smooth;
}

.content-inner {
  max-width: 1200px;
  margin: 0 auto;
  padding: 32px 36px 56px;
}

/* 页面切换动画 */
.page-enter-active,
.page-leave-active {
  transition: opacity 0.18s ease, transform 0.18s ease;
}

.page-enter-from {
  opacity: 0;
  transform: translateY(8px);
}

.page-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}

@media (max-width: 900px) {
  .layout {
    grid-template-columns: 1fr;
    height: auto;
    min-height: 100vh;
  }

  .mobile-bar {
    position: sticky;
    top: 0;
    z-index: 40;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 10px 14px;
    background: var(--bg-glass);
    backdrop-filter: blur(16px);
    border-bottom: 1px solid var(--border-divider);
  }

  .mobile-bar__btn {
    display: grid;
    place-items: center;
    width: 38px;
    height: 38px;
    border-radius: var(--radius-md);
    background: var(--bg-item);
    color: var(--text-secondary);
  }

  .mobile-brand {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: var(--font-size-lg);
    font-weight: 700;
    color: var(--text-primary);
    text-decoration: none;
  }

  .mobile-brand .logo-icon {
    width: 28px;
    height: 28px;
    border-radius: 8px;
  }

  .drawer-backdrop {
    display: block;
    position: fixed;
    inset: 0;
    z-index: 45;
    background: var(--bg-overlay);
    backdrop-filter: blur(2px);
  }

  .backdrop-enter-active,
  .backdrop-leave-active {
    transition: opacity 0.2s ease;
  }

  .backdrop-enter-from,
  .backdrop-leave-to {
    opacity: 0;
  }

  .sidebar {
    position: fixed;
    top: 0;
    left: 0;
    z-index: 50;
    width: 268px;
    max-width: 84vw;
    height: 100vh;
    transform: translateX(-102%);
    transition: transform 0.24s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: var(--shadow-pop);
  }

  .sidebar--open {
    transform: translateX(0);
  }

  .sidebar-close {
    display: inline-flex;
  }

  .content {
    overflow: visible;
  }

  .content-inner {
    padding: 18px 16px 40px;
  }
}
</style>
