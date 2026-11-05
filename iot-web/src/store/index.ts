import type { Pinia } from 'pinia'
import type { App } from 'vue'
import { createPinia } from 'pinia'

/**
 * 安装 pinia 并返回 pinia 实例。
 *
 * 注意：src/utils/request.ts 会反向依赖本模块导出的 useAccountStore，
 * 该依赖环是有意保留的，不要为消除循环依赖而重构。
 */
export function setupStore(app: App): Pinia {
  const store = createPinia()
  app.use(store)
  return store
}

export * from './modules/account'
export * from './modules/theme'
