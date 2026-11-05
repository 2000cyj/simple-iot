import type { Device, DeviceGroup, DeviceTag } from '@/types/api'
import type { BaseResult } from '@/types/common'
import request from '@/utils/request'

/**
 * 设备分组新增 / 修改的请求体。
 *
 * 后端 `DeviceGroupController` 直接接收 entity `DeviceGroup`，
 * 其中 id 由服务端生成，时间戳由服务端维护。
 */
export type DeviceGroupPayload = Omit<DeviceGroup, 'createTime' | 'updateTime'> & { id?: number }

/**
 * 设备标签新增 / 修改的请求体。
 *
 * 后端 `DeviceTagController` 直接接收 entity `DeviceTag`，
 * 其中 id 由服务端生成，时间戳由服务端维护。
 */
export type DeviceTagPayload = Omit<DeviceTag, 'createTime' | 'updateTime'> & { id?: number }

// === Device Group API ===

export function deviceGroupTreeApi(): Promise<BaseResult<DeviceGroup[]>> {
  return request.get<BaseResult<DeviceGroup[]>>('/device-group/tree')
}

export function deviceGroupAddApi(data: DeviceGroupPayload): Promise<BaseResult<boolean>> {
  return request.post<BaseResult<boolean>>('/device-group', data)
}

export function deviceGroupEditApi(data: DeviceGroupPayload): Promise<BaseResult<boolean>> {
  return request.put<BaseResult<boolean>>('/device-group', data)
}

export function deviceGroupDelApi(id: number): Promise<BaseResult<boolean>> {
  return request.delete<BaseResult<boolean>>(`/device-group/${id}`)
}

export function deviceGroupAssignApi(groupId: number, deviceIds: number[]): Promise<BaseResult<boolean>> {
  return request.post<BaseResult<boolean>>(`/device-group/${groupId}/devices`, deviceIds)
}

export function deviceGroupRemoveApi(groupId: number, deviceIds: number[]): Promise<BaseResult<boolean>> {
  return request.delete<BaseResult<boolean>>(`/device-group/${groupId}/devices`, { data: deviceIds })
}

export function deviceGroupDevicesApi(groupId: number): Promise<BaseResult<Device[]>> {
  return request.get<BaseResult<Device[]>>(`/device-group/${groupId}/devices`)
}

// === Device Tag API ===

export function deviceTagAllApi(): Promise<BaseResult<DeviceTag[]>> {
  return request.get<BaseResult<DeviceTag[]>>('/device-tag/all')
}

export function deviceTagAddApi(data: DeviceTagPayload): Promise<BaseResult<boolean>> {
  return request.post<BaseResult<boolean>>('/device-tag', data)
}

export function deviceTagEditApi(data: DeviceTagPayload): Promise<BaseResult<boolean>> {
  return request.put<BaseResult<boolean>>('/device-tag', data)
}

export function deviceTagDelApi(id: number): Promise<BaseResult<boolean>> {
  return request.delete<BaseResult<boolean>>(`/device-tag/${id}`)
}

export function deviceTagAssignApi(tagId: number, deviceIds: number[]): Promise<BaseResult<boolean>> {
  return request.post<BaseResult<boolean>>(`/device-tag/${tagId}/devices`, deviceIds)
}

export function deviceTagRemoveApi(tagId: number, deviceIds: number[]): Promise<BaseResult<boolean>> {
  return request.delete<BaseResult<boolean>>(`/device-tag/${tagId}/devices`, { data: deviceIds })
}

export function deviceTagDevicesApi(tagId: number): Promise<BaseResult<Device[]>> {
  return request.get<BaseResult<Device[]>>(`/device-tag/${tagId}/devices`)
}

export function deviceTagsByDeviceApi(deviceId: number): Promise<BaseResult<DeviceTag[]>> {
  return request.get<BaseResult<DeviceTag[]>>(`/device-tag/device/${deviceId}`)
}
