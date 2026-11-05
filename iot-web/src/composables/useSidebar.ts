import type { Ref } from 'vue'
import { ref } from 'vue'

// 侧边栏折叠状态（桌面端）
const isCollapsed = ref(false)
// 移动端抽屉开关
const isMobileOpen = ref(false)

/**
 * useSidebar 的返回值契约。
 *
 * 折叠状态与移动端抽屉状态为模块级单例（多个组件共享同一份状态），
 * 因此返回的是 Ref 而不是普通值。
 */
export interface UseSidebarReturn {
  /** 桌面端侧边栏是否折叠 */
  isCollapsed: Ref<boolean>
  /** 移动端抽屉是否打开 */
  isMobileOpen: Ref<boolean>
  /** 切换折叠状态 */
  toggle: () => void
  /** 折叠侧边栏 */
  collapse: () => void
  /** 展开侧边栏 */
  expand: () => void
  /** 打开移动端抽屉 */
  openMobile: () => void
  /** 关闭移动端抽屉 */
  closeMobile: () => void
  /** 切换移动端抽屉 */
  toggleMobile: () => void
}

export function useSidebar(): UseSidebarReturn {
  function toggle() {
    isCollapsed.value = !isCollapsed.value
  }

  function collapse() {
    isCollapsed.value = true
  }

  function expand() {
    isCollapsed.value = false
  }

  function openMobile() {
    isMobileOpen.value = true
  }

  function closeMobile() {
    isMobileOpen.value = false
  }

  function toggleMobile() {
    isMobileOpen.value = !isMobileOpen.value
  }

  return {
    isCollapsed,
    isMobileOpen,
    toggle,
    collapse,
    expand,
    openMobile,
    closeMobile,
    toggleMobile,
  }
}
