import type { Firmware, OtaTask } from '@/types/api'
import type { BaseResult } from '@/types/common'
import request from '@/utils/request'

/**
 * 固件列表查询参数。
 *
 * 对应后端 `OtaController.listFirmware` 的 `@RequestParam`。
 */
export interface FirmwareListQuery {
  /** 产品 ID */
  productId?: number
}

/**
 * 升级任务列表查询参数。
 *
 * 对应后端 `OtaController.listTasks` 的 `@RequestParam`。
 */
export interface OtaTaskListQuery {
  /** 固件 ID */
  firmwareId?: number
}

/**
 * 创建升级任务的请求参数。
 *
 * 对应后端 `OtaController.createTask` 的 `@RequestParam`
 * （注意：后端用 `@RequestParam` 接收，前端走 query string）。
 */
export interface OtaTaskCreateQuery {
  /** 固件 ID */
  firmwareId: number
  /** 设备分组 ID */
  groupId?: number
  /** 目标设备 ID 列表 */
  deviceIds?: number[]
}

/**
 * 设备上报升级结果的请求参数。
 *
 * 对应后端 `OtaController.reportUpgradeResult` 的 `@RequestParam`
 * （注意：后端用 `@RequestParam` 接收，前端走 query string）。
 */
export interface OtaTaskReportQuery {
  /** 设备编号 */
  deviceKey: string
  /** 上报结果：SUCCESS / FAIL */
  status: string
  /** 结果描述 */
  message?: string
}

export function firmwareListApi(params?: FirmwareListQuery): Promise<BaseResult<Firmware[]>> {
  return request.get<BaseResult<Firmware[]>>('/ota/firmware', { params })
}

export function firmwareUploadApi(formData: FormData): Promise<BaseResult<Firmware>> {
  return request.post<BaseResult<Firmware>>('/ota/firmware/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
}

export function firmwarePublishApi(id: number): Promise<BaseResult<boolean>> {
  return request.put<BaseResult<boolean>>(`/ota/firmware/${id}/publish`)
}

export function firmwareDeleteApi(id: number): Promise<BaseResult<boolean>> {
  return request.delete<BaseResult<boolean>>(`/ota/firmware/${id}`)
}

export function otaTaskListApi(params?: OtaTaskListQuery): Promise<BaseResult<OtaTask[]>> {
  return request.get<BaseResult<OtaTask[]>>('/ota/task', { params })
}

export function otaTaskGetApi(id: number): Promise<BaseResult<OtaTask>> {
  return request.get<BaseResult<OtaTask>>(`/ota/task/${id}`)
}

export function otaTaskCreateApi(params: OtaTaskCreateQuery): Promise<BaseResult<OtaTask>> {
  return request.post<BaseResult<OtaTask>>('/ota/task', undefined, { params })
}

export function otaTaskReportApi(id: number, params: OtaTaskReportQuery): Promise<BaseResult<boolean>> {
  return request.post<BaseResult<boolean>>(`/ota/task/${id}/report`, undefined, { params })
}
