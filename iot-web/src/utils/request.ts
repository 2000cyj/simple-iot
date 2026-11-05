import type { AxiosInstance, AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig } from 'axios'
import axios from 'axios'
import { ElMessage } from 'element-plus'
import { useAccountStore } from '@/store'

/**
 * 项目自定义的 axios 配置字段。
 *
 * 通过模块声明合并扩展 axios 自带类型，业务侧无需类型断言即可使用。
 */
declare module 'axios' {
  interface AxiosRequestConfig {
    /** 免 token 标记：登录等接口置 true，跳过 Authorization 注入 */
    __noToken?: boolean
    /** 后端特殊响应码放行标记 */
    backOtherCode?: boolean
  }
}

/** 后端统一响应包装（BaseResult） */
export interface BaseResult<T = unknown> {
  code: number
  msg: string
  success: boolean
  data: T
}

/** 后端分页载荷（PageResult） */
export interface PageResult<T = unknown> {
  records: T[]
  total: number
  current: number
  size: number
}

/** Blob 下载接口的返回体（由响应拦截器拆包产生） */
export interface BlobDownloadResult {
  blob: Blob
  fileName: string
}

/** store 中保存的鉴权信息 */
export interface Authorization {
  /** 携带 token 的请求头名称，如 Authorization */
  tokenName: string
  /** 请求头值 */
  tokenValue: string
}

/**
 * 类型化的请求实例。
 *
 * 响应拦截器会把 `response.data` 拆包后返回（而不是返回 AxiosResponse），
 * 因此这里的泛型直接落在“响应体”上：
 *
 * ```ts
 * const res = await request.get<BaseResult<ProductVo>>('/product')
 * // res.code / res.data 均可直接访问
 * ```
 */
export interface RequestInstance {
  <T = unknown>(config: AxiosRequestConfig): Promise<T>
  request: <T = unknown>(config: AxiosRequestConfig) => Promise<T>
  get: <T = unknown>(url: string, config?: AxiosRequestConfig) => Promise<T>
  delete: <T = unknown>(url: string, config?: AxiosRequestConfig) => Promise<T>
  head: <T = unknown>(url: string, config?: AxiosRequestConfig) => Promise<T>
  options: <T = unknown>(url: string, config?: AxiosRequestConfig) => Promise<T>
  post: <T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig) => Promise<T>
  put: <T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig) => Promise<T>
  patch: <T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig) => Promise<T>
}

/** 错误对象的最小结构（axios 错误在无 response 时只有 message） */
interface RequestErrorLike {
  message?: string
  response?: {
    status?: number
    data?: { msg?: string }
  }
}

/**
 * 判断响应体是否为后端统一包装对象。
 *
 * 非对象（字符串 / 数字 / null）时返回 false，与原实现中 `res.code` 取到
 * undefined 的语义保持一致。
 */
function isEnvelope(value: unknown): value is Partial<BaseResult<unknown>> {
  return typeof value === 'object' && value !== null
}

/**
 * axios 自带的拦截器类型要求 onFulfilled 返回 AxiosResponse，
 * 而本项目的响应拦截器返回的是拆包后的响应体，类型上无法表达，
 * 故在此放宽回调签名（仅类型层面放宽，运行时行为完全不变）。
 */
interface RequestInterceptorManager {
  use: (
    onFulfilled?: ((config: InternalAxiosRequestConfig) => unknown) | null,
    onRejected?: ((error: unknown) => unknown) | null,
  ) => number
  eject: (id: number) => void
  clear: () => void
}

interface ResponseInterceptorManager {
  use: (
    onFulfilled?: ((response: AxiosResponse<unknown>) => unknown) | null,
    onRejected?: ((error: unknown) => unknown) | null,
  ) => number
  eject: (id: number) => void
  clear: () => void
}

const service: AxiosInstance = axios.create({
  baseURL: '/iot',
  timeout: 100000,
  withCredentials: true,
})

const interceptors = service.interceptors as unknown as {
  request: RequestInterceptorManager
  response: ResponseInterceptorManager
}

// 拦截请求
interceptors.request.use(
  (config) => {
    // 免登录标记放在 config 自定义字段上，不能用 header：
    // AxiosHeaders 会把 header 值归一化成字符串，数字 1 会变成 "1"，
    // 导致 `!== 1` 恒为真、免 token 请求也会走注入分支，且该标记会作为真实 header 发给后端
    if (!config.__noToken) {
      const store = useAccountStore()
      if (!store.authorization) {
        // TODO 没有登录
        return config
      }
      const { tokenName, tokenValue } = (store.authorization ?? {}) as Partial<Authorization>
      if (tokenValue) {
        // AxiosHeaders 内部以普通属性存放 header，索引赋值与改造前完全一致，
        // 故不使用 set()（set 会做名称归一化与值字符串化，属于运行时行为变更）。
        config.headers[tokenName as string] = tokenValue
      }
    }
    return config
  },
  (error) => {
    // console.log(error);
    return Promise.reject(error)
  },
)

// 拦截响应
interceptors.response.use(
  // 响应成功进入第1个函数，该函数的参数是响应对象
  (response) => {
    const res = response.data
    if (res instanceof Blob && response.config.responseType === 'blob') {
      let filename = (response.headers['content-disposition'] as string).split(';')[1] as string
      filename = filename.split('filename=')[1] as string
      return {
        blob: res,
        fileName: decodeURIComponent(filename),
      }
    }
    const envelope = isEnvelope(res) ? res : undefined
    if (envelope?.code === 1 || envelope?.code === 200 || response.config.backOtherCode)
      return res
    ElMessage.error(envelope?.msg || '请求出错')
    return Promise.reject(res)
  },
  // 响应失败进入第2个函数，该函数的参数是错误对象
  async (error) => {
    const user = useAccountStore()
    const err = (error ?? {}) as RequestErrorLike
    // 网络错误（超时、连接断开等）时 error.response 为 undefined
    if (!err.response) {
      ElMessage.error(err.message || '网络请求失败，请检查网络连接')
      return Promise.reject(error)
    }
    const { data, status } = err.response
    if (status === 401) {
      user.clearToken()
      // 使用路由跳转，保持当前页面作为重定向参数
      const currentPath = window.location.hash.replace('#', '')
      window.location.href = `#/login?redirect=${encodeURIComponent(currentPath)}`
      return
    }
    ElMessage.error(data?.msg || err.message || '请求出错')
    return Promise.reject(data)
  },
)

/**
 * 类型化的请求实例（默认导出）。
 *
 * 运行时仍然是同一个 axios 实例，只是把“响应体已被拆包”这一事实反映到类型上。
 */
const request = service as unknown as RequestInstance

export { request }
export default request
