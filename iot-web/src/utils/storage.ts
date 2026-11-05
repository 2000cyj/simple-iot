/**
 * localStorage 封装。
 *
 * 读取时优先按 JSON 解析，解析失败则返回原始字符串；
 * 写入时对象 / 数组会被序列化成 JSON 字符串。
 */

/**
 * 读取 localStorage 中的值。
 *
 * @param name 键
 * @returns JSON 解析结果；解析失败时返回原始字符串；键不存在时返回 null
 */
export function getItem<T = unknown>(name: string): T | string | null {
  const data = window.localStorage.getItem(name)
  try {
    return JSON.parse(data as string) as T
  }
  catch {
    return data
  }
}

/**
 * 写入 localStorage。
 *
 * @param name 键
 * @param value 值（对象 / 数组会被 JSON 序列化）
 */
export function setItem(name: string, value: unknown): void {
  if (typeof value === 'object') {
    value = JSON.stringify(value)
  }

  window.localStorage.setItem(name, value as string)
}

/**
 * 删除 localStorage 中的键。
 *
 * @param name 键
 */
export function removeItem(name: string): void {
  window.localStorage.removeItem(name)
}
