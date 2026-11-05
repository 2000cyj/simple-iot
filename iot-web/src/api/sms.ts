import type { DictEnumItem } from './dict'
import type {
  SmsConfig,
  SmsConfigAddQuery,
  SmsConfigUpdateQuery,
  SmsSendQuery,
  SmsSendWithTemplateQuery,
  SmsTemplate,
  SmsTemplateAddQuery,
} from '@/types/api'
import type { BaseResult } from '@/types/common'
import request from '@/utils/request'

/**
 * 短信配置列表查询参数。
 *
 * 对应后端 `SmsController.listConfig` 的 `@RequestParam`。
 */
export interface SmsConfigListQuery {
  /** 配置名称 */
  name?: string
}

/**
 * 短信模板修改的请求体。
 *
 * 后端 `SmsController.updateTemplate` 直接接收 entity `SmsTemplate`，
 * 其中 createTime / updateTime 由服务端维护，前端不必回传。
 */
export type SmsTemplateUpdatePayload = Omit<SmsTemplate, 'createTime' | 'updateTime'> & {
  createTime?: string
  updateTime?: string
}

// 短信配置相关
export function getSmsConfigList(params?: SmsConfigListQuery): Promise<BaseResult<SmsConfig[]>> {
  return request.get<BaseResult<SmsConfig[]>>('/sms/config', { params })
}

export function addSmsConfig(data: SmsConfigAddQuery): Promise<BaseResult<boolean>> {
  return request.post<BaseResult<boolean>>('/sms/config', data)
}

export function updateSmsConfig(data: SmsConfigUpdateQuery): Promise<BaseResult<boolean>> {
  return request.put<BaseResult<boolean>>('/sms/config', data)
}

export function deleteSmsConfig(id: number): Promise<BaseResult<boolean>> {
  return request.delete<BaseResult<boolean>>(`/sms/config/${id}`)
}

export function setDefaultConfig(id: number): Promise<BaseResult<boolean>> {
  return request.put<BaseResult<boolean>>(`/sms/config/${id}/default`)
}

export function updateConfigStatus(id: number, status: number): Promise<BaseResult<boolean>> {
  return request.put<BaseResult<boolean>>(`/sms/config/${id}/status`, undefined, {
    params: { status },
  })
}

// 短信发送相关
export function sendSms(data: SmsSendQuery): Promise<BaseResult<boolean>> {
  return request.post<BaseResult<boolean>>('/sms/send', data)
}

export function sendSmsWithTemplate(data: SmsSendWithTemplateQuery): Promise<BaseResult<boolean>> {
  return request.post<BaseResult<boolean>>('/sms/send/template', data)
}

// 短信模板相关
export function getSmsTemplateList(configId: number): Promise<BaseResult<SmsTemplate[]>> {
  return request.get<BaseResult<SmsTemplate[]>>('/sms/template', {
    params: { configId },
  })
}

export function addSmsTemplate(data: SmsTemplateAddQuery): Promise<BaseResult<boolean>> {
  return request.post<BaseResult<boolean>>('/sms/template', data)
}

export function updateSmsTemplate(data: SmsTemplateUpdatePayload): Promise<BaseResult<boolean>> {
  return request.put<BaseResult<boolean>>('/sms/template', data)
}

export function deleteSmsTemplate(id: number): Promise<BaseResult<boolean>> {
  return request.delete<BaseResult<boolean>>(`/sms/template/${id}`)
}

// 枚举相关
// 注意：后端 SmsController 未提供 /sms/suppliers 与 /sms/template/types 路由，
// 这两个接口与 /dict/sms-supplier、/dict/sms-template-type 重复，详见交付报告。
export function getSuppliers(): Promise<BaseResult<DictEnumItem[]>> {
  return request.get<BaseResult<DictEnumItem[]>>('/sms/suppliers')
}

export function getTemplateTypes(): Promise<BaseResult<DictEnumItem[]>> {
  return request.get<BaseResult<DictEnumItem[]>>('/sms/template/types')
}
