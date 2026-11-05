import type { BaseResult } from '@/types/common'
import request from '@/utils/request'

/**
 * 字典枚举项。
 *
 * 对应后端 `EnumUtils.enumToMapList` 的输出：枚举每个字段被平铺成
 * `Map<String, Object>`，因此除了 `name` / `ordinal` 之外，
 * `@EnumValue` 字段映射为 `code`、`@JsonValue` 字段映射为 `value`，
 * 其余枚举字段（如 `desc`）按字段名原样返回。
 */
export interface DictEnumItem {
  /** 枚举常量名（如 ALIBABA） */
  name: string
  /** 枚举在声明中的序号 */
  ordinal: number
  /** `@EnumValue` 字段的值（部分枚举没有） */
  code?: string | number
  /** `@JsonValue` 字段的值（部分枚举没有） */
  value?: string | number
  /** 其余枚举字段（如 desc / template），按字段名原样返回 */
  [key: string]: unknown
}

// 字典接口
export function getSmsSupplier(): Promise<BaseResult<DictEnumItem[]>> {
  return request.get<BaseResult<DictEnumItem[]>>('/dict/sms-supplier')
}

export function getSmsTemplateType(): Promise<BaseResult<DictEnumItem[]>> {
  return request.get<BaseResult<DictEnumItem[]>>('/dict/sms-template-type')
}

export function getNotifyType(): Promise<BaseResult<DictEnumItem[]>> {
  return request.get<BaseResult<DictEnumItem[]>>('/dict/notify-type')
}

export function getStatus(): Promise<BaseResult<DictEnumItem[]>> {
  return request.get<BaseResult<DictEnumItem[]>>('/dict/status')
}

export function getServiceType(): Promise<BaseResult<DictEnumItem[]>> {
  return request.get<BaseResult<DictEnumItem[]>>('/dict/service-type')
}

export function getDataType(): Promise<BaseResult<DictEnumItem[]>> {
  return request.get<BaseResult<DictEnumItem[]>>('/dict/data-type')
}

export function getParamType(): Promise<BaseResult<DictEnumItem[]>> {
  return request.get<BaseResult<DictEnumItem[]>>('/dict/param-type')
}

export function getEventType(): Promise<BaseResult<DictEnumItem[]>> {
  return request.get<BaseResult<DictEnumItem[]>>('/dict/event-type')
}

export function getDriverTypeEnum(): Promise<BaseResult<DictEnumItem[]>> {
  return request.get<BaseResult<DictEnumItem[]>>('/dict/driver-type')
}

export function getConnectionTypeEnum(): Promise<BaseResult<DictEnumItem[]>> {
  return request.get<BaseResult<DictEnumItem[]>>('/dict/connection-type')
}
