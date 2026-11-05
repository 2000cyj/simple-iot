import type { ComputedRef, Ref } from 'vue'
import { computed, onMounted, ref, watch } from 'vue'

/** 用户可选择的主题模式：跟随系统 / 亮色 / 暗色 */
export type ThemeMode = 'light' | 'dark' | 'auto'
/** 实际生效的主题（auto 已解析为系统偏好） */
export type ResolvedTheme = 'light' | 'dark'

// 当前主题
const theme = ref<ThemeMode>('auto')

// 实际应用的主题（考虑 auto 时的系统偏好）
const resolvedTheme = ref<ResolvedTheme>('light')

// 获取系统主题偏好
function getSystemTheme(): ResolvedTheme {
  if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark'
  }
  return 'light'
}

// 更新实际主题
function updateResolvedTheme(): void {
  if (theme.value === 'auto') {
    resolvedTheme.value = getSystemTheme()
  }
  else {
    resolvedTheme.value = theme.value
  }
  // 应用到 DOM
  applyTheme(resolvedTheme.value)
}

// 应用主题到 DOM
function applyTheme(mode: ResolvedTheme): void {
  if (mode === 'dark') {
    document.documentElement.classList.add('dark')
    document.documentElement.setAttribute('data-theme', 'dark')
  }
  else {
    document.documentElement.classList.remove('dark')
    document.documentElement.setAttribute('data-theme', 'light')
  }
}

// 切换主题
function setTheme(newTheme: ThemeMode): void {
  theme.value = newTheme
  updateResolvedTheme()
  // 保存到 localStorage
  localStorage.setItem('theme', newTheme)
}

// 从 localStorage 加载主题
function loadTheme(): void {
  const saved = localStorage.getItem('theme')
  if (saved && (['light', 'dark', 'auto'] as string[]).includes(saved)) {
    theme.value = saved as ThemeMode
  }
  updateResolvedTheme()
}

// 监听系统主题变化
function watchSystemTheme(): () => void {
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
  mediaQuery.addEventListener('change', updateResolvedTheme)
  return () => mediaQuery.removeEventListener('change', updateResolvedTheme)
}

/**
 * useTheme 的返回值契约。
 *
 * theme 为用户选择（可能是 auto），resolvedTheme 为实际生效的主题。
 */
export interface UseThemeReturn {
  /** 用户选择的主题模式 */
  theme: Ref<ThemeMode>
  /** 实际生效的主题（auto 已解析） */
  resolvedTheme: Ref<ResolvedTheme>
  /** 切换主题并持久化到 localStorage */
  setTheme: (newTheme: ThemeMode) => void
  /** 当前是否为暗色主题 */
  isDark: ComputedRef<boolean>
  /** 当前是否为亮色主题 */
  isLight: ComputedRef<boolean>
}

// 初始化
export function useTheme(): UseThemeReturn {
  onMounted(() => {
    loadTheme()
    // 清理监听器
    return watchSystemTheme()
  })

  // 监听主题变化
  watch(theme, updateResolvedTheme)

  return {
    theme,
    resolvedTheme,
    setTheme,
    isDark: computed(() => resolvedTheme.value === 'dark'),
    isLight: computed(() => resolvedTheme.value === 'light'),
  }
}
