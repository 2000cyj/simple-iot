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

/**
 * 解析总记录数。
 *
 * @param {*} total 候选总数字段
 * @param {number} fallback 兜底值（通常为记录数）
 * @returns {number} 归一化后的总记录数
 */
function resolveTotal(total, fallback) {
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
 * @param {*} res 接口响应体（axios 拦截器返回的 response.data）
 * @returns {{ records: Array, total: number }} 归一化后的数据列表与总记录数
 */
export function normalizePage(res) {
  const payload = res?.data

  // 列表接口：data 就是数组
  if (Array.isArray(payload)) {
    // 兼容老分页形状：total 仍在响应顶层；普通列表接口没有 total，用记录数兜底
    return { records: payload, total: resolveTotal(res?.total, payload.length) }
  }

  if (payload && typeof payload === 'object') {
    // 分页接口：data 是分页载荷，兼容 records / list / rows / 再包一层 data 等多种形态
    const list = [payload.records, payload.list, payload.rows, payload.data].find(item => Array.isArray(item))
    if (list) {
      // total 缺失时用记录数兜底，兼容非分页列表被包成对象的场景
      return { records: list, total: resolveTotal(payload.total, list.length) }
    }
  }

  return { records: [], total: 0 }
}
