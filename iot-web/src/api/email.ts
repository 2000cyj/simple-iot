import type {
  EmailConfig,
  EmailConfigAddQuery,
  EmailConfigPageQuery,
  EmailConfigUpdateQuery,
} from '@/types/api'
import type { BaseResult, PageResult } from '@/types/common'
import request from '@/utils/request'

/**
 * 发送测试邮件的请求体。
 *
 * 对应后端 `NotificationController.TestEmailRequest`。
 */
export interface TestEmailRequest {
  /** 收件人邮箱 */
  to: string
  /** 邮箱配置 ID */
  configId?: number
}

// 获取邮箱配置列表
export function getEmailConfigList(params: EmailConfigPageQuery): Promise<BaseResult<PageResult<EmailConfig>>> {
  return request.post<BaseResult<PageResult<EmailConfig>>>('/email-config/page', params)
}

// 获取默认邮箱配置
export function getDefaultEmailConfig(): Promise<BaseResult<EmailConfig>> {
  return request.get<BaseResult<EmailConfig>>('/email-config/default')
}

// 添加邮箱配置
export function addEmailConfig(data: EmailConfigAddQuery): Promise<BaseResult<boolean>> {
  return request.post<BaseResult<boolean>>('/email-config', data)
}

// 更新邮箱配置
export function updateEmailConfig(data: EmailConfigUpdateQuery): Promise<BaseResult<boolean>> {
  return request.put<BaseResult<boolean>>('/email-config', data)
}

// 删除邮箱配置
export function deleteEmailConfig(id: number): Promise<BaseResult<boolean>> {
  return request.delete<BaseResult<boolean>>(`/email-config/${id}`)
}

// 设置默认配置
export function setDefaultEmailConfig(id: number): Promise<BaseResult<boolean>> {
  return request.put<BaseResult<boolean>>(`/email-config/default/${id}`)
}

// 更新状态
export function updateEmailConfigStatus(id: number, status: number): Promise<BaseResult<boolean>> {
  return request.put<BaseResult<boolean>>(`/email-config/status/${id}`, undefined, {
    params: { status },
  })
}

// 发送测试邮件
export function sendTestEmail(data: TestEmailRequest): Promise<BaseResult<boolean>> {
  return request.post<BaseResult<boolean>>('/notification/email/test', data)
}
