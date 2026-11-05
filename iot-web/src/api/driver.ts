import type { Driver } from '@/types/api'
import type { BaseResult } from '@/types/common'
import request from '@/utils/request'

/**
 * 驱动新增 / 修改的请求体。
 *
 * 后端 `DriverController` 直接接收 entity `Driver`，
 * 其中 driverId 由服务端生成。
 */
export type DriverPayload = Omit<Driver, 'driverId'> & { driverId?: number }

export function getDriverList(): Promise<BaseResult<Driver[]>> {
  return request.get<BaseResult<Driver[]>>('/driver')
}

export function addDriver(data: DriverPayload): Promise<BaseResult<boolean>> {
  return request.post<BaseResult<boolean>>('/driver', data)
}

export function updateDriver(data: DriverPayload): Promise<BaseResult<boolean>> {
  return request.put<BaseResult<boolean>>('/driver', data)
}

export function deleteDriver(driverId: number): Promise<BaseResult<boolean>> {
  return request.delete<BaseResult<boolean>>(`/driver/${driverId}`)
}
