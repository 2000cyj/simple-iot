import { defineStore } from 'pinia'
import { getItem, removeItem, setItem } from '@/utils/storage' // getItem和setItem是封装的操作localStorage的方法

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

export const useAccountStore = defineStore('account', {
  state: (): AccountState => ({
    authorization: getItem(TOKEN) as Authorization | null,
    userinfo: null,
    menuData: [], // 树列表
  }),
  getters: {},
  actions: {
    setToken(data: Authorization) {
      this.authorization = data
      // 保存到localStorage
      setItem(TOKEN, data)
    },
    clearToken() {
      this.authorization = {}
      this.userinfo = null
      removeItem(TOKEN)
    },
  },
})
