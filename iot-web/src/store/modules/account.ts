import { defineStore } from 'pinia'
import { ref } from 'vue'
import { getItem, removeItem, setItem } from '@/utils/storage'

export const TOKEN = 'VEA-TOKEN'

/**
 * 登录凭证。
 *
 * 实际来源于后端登录接口返回的 tokenInfo，
 * 字段名与后端保持一致（tokenName / tokenValue），其余字段透传。
 */
export interface Authorization {
  /** 请求头名称，如 Authorization */
  tokenName?: string
  /** 请求头的值 */
  tokenValue?: string
  [key: string]: unknown
}

/** 用户信息（后端返回，字段透传） */
export interface UserInfo {
  [key: string]: unknown
}

/** 菜单树节点 */
export interface MenuNode {
  id?: number | string
  name?: string
  children?: MenuNode[]
  [key: string]: unknown
}

/** account store 的状态 */
export interface AccountState {
  /** 登录凭证，未登录时为 null */
  authorization: Authorization | null
  /** 用户信息 */
  userinfo: UserInfo | null
  /** 菜单树列表 */
  menuData: MenuNode[]
}

export const useAccountStore = defineStore('account', () => {
  const authorization = ref<Authorization | null>(getItem(TOKEN) as Authorization | null)
  const userinfo = ref<UserInfo | null>(null)
  const menuData = ref<MenuNode[]>([])

  function setToken(data: Authorization): void {
    authorization.value = data
    setItem(TOKEN, data)
  }

  function clearToken(): void {
    authorization.value = {}
    userinfo.value = null
    removeItem(TOKEN)
  }

  return {
    authorization,
    userinfo,
    menuData,
    setToken,
    clearToken,
  }
})
