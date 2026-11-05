import type { WebhookIngress } from '@/types/api'
import type { BaseResult } from '@/types/common'
import request from '@/utils/request'

/**
 * Webhook 接入列表查询参数。
 *
 * 对应后端 `WebhookIngressController.list` 的 `@RequestParam`。
 */
export interface WebhookListQuery {
  /** 关联设备 ID */
  deviceId?: number
}

/**
 * Webhook 接入新增 / 修改的请求体。
 *
 * 后端 `WebhookIngressController` 直接接收 entity `WebhookIngress`，
 * 其中 token / secret 由服务端生成，时间戳由服务端维护。
 */
export type WebhookIngressPayload = Omit<WebhookIngress, 'token' | 'secret' | 'createTime' | 'updateTime'> & {
  id?: number
  token?: string
  secret?: string
}

export function webhookListApi(params?: WebhookListQuery): Promise<BaseResult<WebhookIngress[]>> {
  return request.get<BaseResult<WebhookIngress[]>>('/webhook/config', { params })
}

export function webhookCreateApi(data: WebhookIngressPayload): Promise<BaseResult<WebhookIngress>> {
  return request.post<BaseResult<WebhookIngress>>('/webhook/config', data)
}

export function webhookUpdateApi(data: WebhookIngressPayload): Promise<BaseResult<boolean>> {
  return request.put<BaseResult<boolean>>('/webhook/config', data)
}

export function webhookDeleteApi(id: number): Promise<BaseResult<boolean>> {
  return request.delete<BaseResult<boolean>>(`/webhook/config/${id}`)
}

export function webhookRegenerateSecretApi(id: number): Promise<BaseResult<string>> {
  return request.post<BaseResult<string>>(`/webhook/config/${id}/regenerate-secret`)
}
