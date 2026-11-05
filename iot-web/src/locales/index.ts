import type { Language } from 'element-plus/es/locale'
import enElementPlus from 'element-plus/es/locale/lang/en'
// Element Plus 语言包
import zhCnElementPlus from 'element-plus/es/locale/lang/zh-cn'
import { createI18n } from 'vue-i18n'

import enUS from './en-US'
import zhCN from './zh-CN'

/** 项目支持的语言 */
export const LOCALES = ['zh-CN', 'en-US'] as const

/** 语言代码联合类型 */
export type Locale = (typeof LOCALES)[number]

/** 语言包消息结构 */
export type LocaleMessages = Record<string, unknown>

// 获取浏览器语言
function getBrowserLocale(): Locale {
  // navigator.userLanguage 是旧版浏览器的私有属性，标准类型定义中不存在
  const nav = navigator as Navigator & { userLanguage?: string }
  const navigatorLocale = (nav.language || nav.userLanguage) as string
  if (navigatorLocale.startsWith('zh')) {
    return 'zh-CN'
  }
  return 'en-US'
}

// 从 localStorage 获取语言设置，如果没有则使用浏览器语言
const savedLocale = (localStorage.getItem('locale') || getBrowserLocale()) as Locale

const i18n = createI18n({
  legacy: false, // 使用 Composition API 模式
  locale: savedLocale,
  fallbackLocale: 'zh-CN',
  messages: {
    'zh-CN': {
      ...zhCN,
      el: zhCnElementPlus.el,
    },
    'en-US': {
      ...enUS,
      el: enElementPlus.el,
    },
  },
})

export default i18n

// 导出 Element Plus 语言包配置
export const elementPlusLocales: Record<Locale, Language> = {
  'zh-CN': zhCnElementPlus,
  'en-US': enElementPlus,
}

// 切换语言的辅助函数
export function setLocale(locale: Locale): void {
  i18n.global.locale.value = locale
  localStorage.setItem('locale', locale)
  // 更新 HTML lang 属性
  document.querySelector('html')!.setAttribute('lang', locale)
}

// 获取当前语言
export function getLocale(): Locale {
  return i18n.global.locale.value
}
