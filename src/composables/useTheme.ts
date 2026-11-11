import { computed, ref } from 'vue'

export type ThemeMode = 'light' | 'dark' | 'system'

const STORAGE_KEY = 'app-theme'

// 全局单例：布局、设置页共享同一份主题状态
const mode = ref<ThemeMode>('system')
const systemDark = ref(false)
let mediaQuery: MediaQueryList | null = null
let initialized = false

export const resolvedTheme = computed<'light' | 'dark'>(() => {
  if (mode.value === 'system') return systemDark.value ? 'dark' : 'light'
  return mode.value
})

export const isDark = computed(() => resolvedTheme.value === 'dark')

function apply() {
  document.documentElement.setAttribute('data-theme', resolvedTheme.value)
  document.documentElement.style.colorScheme = resolvedTheme.value
}

function onSystemChange(e: MediaQueryListEvent) {
  systemDark.value = e.matches
  if (mode.value === 'system') apply()
}

/** 在应用挂载前调用，避免首屏主题闪烁 */
export function initTheme() {
  if (initialized) return
  initialized = true

  const saved = localStorage.getItem(STORAGE_KEY)
  if (saved === 'light' || saved === 'dark' || saved === 'system') {
    mode.value = saved
  }

  if (typeof window !== 'undefined' && window.matchMedia) {
    mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    systemDark.value = mediaQuery.matches
    mediaQuery.addEventListener('change', onSystemChange)
  }

  apply()
}

export function setTheme(next: ThemeMode) {
  mode.value = next
  localStorage.setItem(STORAGE_KEY, next)
  apply()
}

/** 在浅色 / 深色之间切换（不进入跟随系统） */
export function toggleTheme() {
  setTheme(isDark.value ? 'light' : 'dark')
}

export function useTheme() {
  return { mode, resolvedTheme, isDark, setTheme, toggleTheme, initTheme }
}
