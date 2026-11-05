import type { AlarmPage, AlarmPageQuery, Dashboard, Device, DeviceDataQuery, KeyValue } from '@/types/api'
import type { BaseResult, PageResult } from '@/types/common'
import request from '@/utils/request'

/**
 * 首页统计概览。
 *
 * 对应后端 `DashboardController.statistics` 返回的 `Map<String, Object>`。
 */
export interface DashboardStatistics {
  /** 设备总数 */
  total: number
  /** 在线设备数 */
  online: number
  /** 离线设备数 */
  offline: number
  /** 今日新增设备数 */
  todayAdd: number
  /** 活动告警数 */
  activeAlarms: number
  /** 今日告警数 */
  todayAlarms: number
  /** CPU 使用率（百分比） */
  cpuUsage: number
  /** 内存使用率（百分比） */
  memoryUsage: number
  /** 磁盘使用率（百分比） */
  diskUsage: number
}

/**
 * 设备列表查询参数。
 *
 * 对应后端 `DeviceController.list` 的 `@RequestParam`。
 */
export interface DashboardDeviceListQuery {
  /** 产品 ID */
  productId?: number
  /** 产品类型 ID */
  productTypeId?: number
  /** 设备 Key */
  deviceKey?: string
}

// 首页统计 (原有 API)
export function getDashboardStatistics(): Promise<BaseResult<DashboardStatistics>> {
  return request.get<BaseResult<DashboardStatistics>>('/dashboard/statistics')
}

// 自定义仪表盘 CRUD
export function dashboardList(): Promise<BaseResult<Dashboard[]>> {
  return request.get<BaseResult<Dashboard[]>>('/dashboard/list')
}

export function dashboardGet(id: number): Promise<BaseResult<Dashboard>> {
  return request.get<BaseResult<Dashboard>>(`/dashboard/${id}`)
}

export function dashboardSave(data: Dashboard): Promise<BaseResult<boolean>> {
  return request.post<BaseResult<boolean>>('/dashboard', data)
}

export function dashboardUpdate(data: Dashboard): Promise<BaseResult<boolean>> {
  return request.put<BaseResult<boolean>>('/dashboard', data)
}

export function dashboardDelete(id: number): Promise<BaseResult<boolean>> {
  return request.delete<BaseResult<boolean>>(`/dashboard/${id}`)
}

// 复用现有遥测数据 API
export function fetchLatestData(deviceKey: string): Promise<BaseResult<KeyValue<string, unknown>[]>> {
  return request.get<BaseResult<KeyValue<string, unknown>[]>>(`/device/data/property/last/${deviceKey}`)
}

export function fetchMetric(data: DeviceDataQuery): Promise<BaseResult<KeyValue<string, unknown>[]>> {
  return request.post<BaseResult<KeyValue<string, unknown>[]>>('/device/data/property/metric', data)
}

// 设备列表 (仪表板网格用)
export function fetchDeviceList(params?: DashboardDeviceListQuery): Promise<BaseResult<Device[]>> {
  return request.get<BaseResult<Device[]>>('/device/list', { params })
}

// 告警分页 (仪表板告警列表用)
export function fetchAlarmPage(data: AlarmPageQuery): Promise<BaseResult<PageResult<AlarmPage>>> {
  return request.post<BaseResult<PageResult<AlarmPage>>>('/alarm/page', data)
}
