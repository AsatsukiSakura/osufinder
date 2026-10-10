<template>
  <div class="layout">
    <aside class="sidebar">
      <div class="sidebar-header">
        <div class="logo-row">
          <img class="logo-icon" src="/favicon.ico" alt="osu!" />
          <h1 class="logo">osu!Finder</h1>
        </div>

      </div>

      <nav class="nav">
        <router-link
          v-for="route in menuRoutes"
          :key="route.name"
          :to="route.path"
          class="nav-item"
          active-class="nav-item--active"
        >
          <span class="nav-icon">{{ route.meta?.icon }}</span>
          <span class="nav-label">{{ route.meta?.title }}</span>
        </router-link>
      </nav>

      <div class="sidebar-footer">
        <button class="theme-toggle-btn" @click="toggleTheme" :title="isDark ? '浅色模式' : '深色模式'">
          <span>{{ isDark ? '☀️' : '🌙' }}</span>
          <span>{{ isDark ? '浅色' : '深色' }}</span>
        </button>
      </div>
    </aside>

    <main class="content">
      <div class="content-inner">
        <RouterView />
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const isDark = ref(false)

const menuRoutes = computed(() => {
  const layoutRoute = router.options.routes.find((r) => r.path === '/')
  return (layoutRoute?.children || [])
    .filter((child) => child.component && child.meta && child.meta.title && child.meta.icon)
    .map((child) => ({
      ...child,
      path: '/' + child.path
    }))
})

function applyTheme(theme: string) {
  document.documentElement.setAttribute('data-theme', theme)
  isDark.value = theme === 'dark'
  localStorage.setItem('app-theme', theme)
}

function initTheme() {
  const saved = localStorage.getItem('app-theme')
  if (saved) {
    applyTheme(saved)
  } else {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    applyTheme(prefersDark ? 'dark' : 'light')
  }
}

function toggleTheme() {
  applyTheme(isDark.value ? 'light' : 'dark')
}

onMounted(() => {
  initTheme()
})
</script>