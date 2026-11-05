import { colord } from 'colord'
import { kebabCase } from 'lodash'
import { defineStore } from 'pinia'
import { nextTick } from 'vue'
import { getItem, setItem } from '@/utils/storage' // getItem和setItem是封装的操作localStorage的方法

const themeKey = 'theme'
const key = 'primary'

/**
 * 主题配置。
 *
 * elColorPrimary 为主色，dwSliderActiveBg 为侧边栏激活态背景色；
 * changeTheme 生成的明暗梯度变量（elColorPrimaryLight1~9 / Dark1~9）
 * 只写入 CSS 变量，持久化时仍以本接口的字段为准，故用索引签名兜底。
 */
export interface ThemeConfig {
  elColorPrimary: string
  dwSliderActiveBg: string
  [key: string]: string | undefined
}

function readBrandPrimary(): string {
  if (typeof window === 'undefined' || !document?.documentElement)
    return '#6366f1'
  const value = getComputedStyle(document.documentElement)
    .getPropertyValue('--iot-color-primary')
    .trim()
  return value || '#6366f1'
}

const defaultConfig: ThemeConfig = {
  elColorPrimary: readBrandPrimary(),
  dwSliderActiveBg: '#465D83',
}

/** 添加css vars至html */
function addThemeCssVarsToHtml(themeVars: Record<string, string>): void {
  const keys = Object.keys(themeVars)
  const style: string[] = []
  keys.forEach((cssKey) => {
    style.push(`--${kebabCase(cssKey)}: ${themeVars[cssKey]}`)
  })
  const styleStr = style.join(';')
  document.documentElement.style.cssText += styleStr
}

export const useThemeStore = defineStore('theme', {
  state: (): { isDark: boolean, themeJson: ThemeConfig } => ({
    isDark: getItem('vueuse-color-scheme') === true || false,
    themeJson: (getItem(themeKey) || defaultConfig) as ThemeConfig,
  }),
  getters: {},
  actions: {
    /* 设置主题模式 */
    setDarkModel(model: boolean) {
      nextTick(() => {
        this.isDark = model
        if (this.isDark) {
          document.documentElement.classList.add('dark')
        }
        else {
          document.documentElement.classList.remove('dark')
        }
        setItem('vueuse-color-scheme', this.isDark)
      })
    },
    /* 切换主题模式 */
    toogleDarkModel() {
      if (this.isDark) {
        this.setDarkModel(false)
      }
      else {
        this.setDarkModel(true)
      }
    },
    /* 设置系统主题 */
    changeTheme(colorVal: string) {
      const el = document.documentElement
      el.style.setProperty(`--el-color-${key}`, colorVal)

      const resData: Record<string, string> = {
        elColorPrimary: colorVal,
      }

      for (let i = 1; i <= 9; i++) {
        el.style.setProperty(`--el-color-${key}-light-${i}`, colord(colorVal).lighten(i / 10).toHex())
        el.style.setProperty(`--el-color-${key}-dark-${i}`, colord(colorVal).darken(i / 10).toHex())

        resData[`elColorPrimaryLight${i}`] = colord(colorVal).lighten(i / 10).toHex()
        resData[`elColorPrimaryDark${i}`] = colord(colorVal).darken(i / 10).toHex()
      }
      addThemeCssVarsToHtml(resData)
      this.themeJson.elColorPrimary = colorVal

      setItem(themeKey, this.themeJson)
    },
    /* 设置侧边栏主题 */
    changeSliderTheme(val: string) {
      document.documentElement.style.cssText += `--dw-slider-active-bg:${val}`
      this.themeJson.dwSliderActiveBg = val
      setItem(themeKey, this.themeJson)
    },
  },
})
