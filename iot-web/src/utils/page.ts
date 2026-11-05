import type { BaseResult, PageResult } from './request'

export type { BaseResult, PageResult }

/**
 * 分页响应归一化。
 *
 * 后端分页接口统一返回 BaseResult 包裹的分页载荷：
 *   { code, msg, success, data: { records, total, current, size } }
 * 而非分页的列表接口返回 BaseResult<List>：
 *   { code, msg, success, data: [...] }
 *
 * 因此 res.data 可能是数组，也可能是带 records 的对象，
 * 这里统一归一化成 { records, total } 供表格直接使用。
 *
 * 同时兼容改造前的老分页形状（PageResult 直接作为响应体，total 在顶层）：
 *   { code, msg, data: [...], total, current, size }
 */

/** 归一化后的分页结果 */
export interface NormalizedPage<T = unknown> {
  /** 当前页记录列表 */
  records: T[]
  /** 总记录数 */
  total: number
}

/** 可能出现的分页 / 列表响应形态 */
export type PageResponse<T = unknown> =
  | BaseResult<PageResult<T>>
  | BaseResult<T[]>
  | PageResult<T>
  | { data?: unknown, total?: number }

/** 分页载荷在运行时可能出现的多种形态（records / list / rows / 再包一层 data） */
interface PagePayloadLike {
  records?: unknown
  list?: unknown
  rows?: unknown
  data?: unknown
  total?: unknown
}

/**
 * 解析总记录数。
 *
 * @param total 候选总数字段
 * @param fallback 兜底值（通常为记录数）
 * @returns 归一化后的总记录数
 */
function resolveTotal(total: unknown, fallback: number): number {
  const num = Number(total)
  if (!Number.isFinite(num) || num < 0) {
    return fallback
  }
  // total 与实际记录数矛盾时以记录数为准，避免表格有数据却显示 0 条
  if (num === 0 && fallback > 0) {
    return fallback
  }
  return num
}

/**
 * 归一化分页 / 列表接口的响应体。
 *
 * @param res 接口响应体（axios 拦截器返回的 response.data）
 * @returns 归一化后的数据列表与总记录数
 */
export function normalizePage<T = unknown>(res: PageResponse<T>): NormalizedPage<T>
export function normalizePage<T = unknown>(res: unknown): NormalizedPage<T>
export function normalizePage<T = unknown>(res: unknown): NormalizedPage<T> {
  const payload = (res as { data?: unknown } | null | undefined)?.data

  // 列表接口：data 就是数组
  if (Array.isArray(payload)) {
    const records = payload as T[]
    // 兼容老分页形状：total 仍在响应顶层；普通列表接口没有 total，用记录数兜底
    return { records, total: resolveTotal((res as { total?: unknown } | null | undefined)?.total, records.length) }
  }

  if (payload && typeof payload === 'object') {
    // 分页接口：data 是分页载荷，兼容 records / list / rows / 再包一层 data 等多种形态
    const page = payload as PagePayloadLike
    const list = [page.records, page.list, page.rows, page.data].find(item => Array.isArray(item))
    if (list) {
      const records = list as T[]
      // total 缺失时用记录数兜底，兼容非分页列表被包成对象的场景
      return { records, total: resolveTotal(page.total, records.length) }
    }
  }

  return { records: [], total: 0 }
}
