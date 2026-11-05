import type { ModbusConfig } from '@/types/api'
import type { BaseResult } from '@/types/common'
import request from '@/utils/request'

/**
 * Modbus 配置列表查询参数。
 *
 * 对应后端 `ModbusController.list` 的 `@RequestParam`。
 */
export interface ModbusListQuery {
  /** 设备 ID */
  deviceId?: number
}

/**
 * Modbus 配置新增 / 修改的请求体。
 *
 * 后端 `ModbusController` 直接接收 entity `ModbusConfig`，
 * 其中 id 由服务端生成，时间戳由服务端维护。
 */
export type ModbusConfigPayload = Omit<ModbusConfig, 'id' | 'createTime' | 'updateTime'> & {
  id?: number
}

export function modbusListApi(params?: ModbusListQuery): Promise<BaseResult<ModbusConfig[]>> {
  return request.get<BaseResult<ModbusConfig[]>>('/modbus', { params })
}

export function modbusGetApi(id: number): Promise<BaseResult<ModbusConfig>> {
  return request.get<BaseResult<ModbusConfig>>(`/modbus/${id}`)
}

export function modbusAddApi(data: ModbusConfigPayload): Promise<BaseResult<boolean>> {
  return request.post<BaseResult<boolean>>('/modbus', data)
}

export function modbusUpdateApi(data: ModbusConfigPayload): Promise<BaseResult<boolean>> {
  return request.put<BaseResult<boolean>>('/modbus', data)
}

export function modbusDeleteApi(id: number): Promise<BaseResult<boolean>> {
  return request.delete<BaseResult<boolean>>(`/modbus/${id}`)
}

export function modbusTestApi(id: number): Promise<BaseResult<boolean>> {
  return request.post<BaseResult<boolean>>(`/modbus/${id}/test`)
}
