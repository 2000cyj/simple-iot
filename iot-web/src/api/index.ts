import type { AxiosRequestConfig } from 'axios'
import type {
  Alarm,
  AlarmPage,
  AlarmPageQuery,
  ChangePasswordQuery,
  Device,
  DeviceAddQuery,
  DeviceDataQuery,
  DeviceEventData,
  DevicePage,
  DevicePageQuery,
  DeviceShadow,
  DeviceUpdateQuery,
  Icon,
  ImPushConfig,
  KeyValue,
  LoginQuery,
  MessageReceive,
  MessageReceiveAddQuery,
  MessageReceiveUpdateQuery,
  MessageRecivePageQuery,
  ModelProperty,
  ModelPropertyUpdateQuery,
  ModelService,
  Product,
  ProductAddQuery,
  ProductPage,
  ProductPageQuery,
  ProductPropertyAddQuery,
  ProductType,
  ProductTypeAddQuery,
  ProductUpdateQuery,
  Protocol,
  ProtocolDecodeTestRequest,
  ProtocolEncodeTestRequest,
  PushConfig,
  PushConfigAddQuery,
  PushConfigDetail,
  PushConfigPage,
  PushConfigPageQuery,
  PushConfigType,
  PushConfigUpdateQuery,
  PushTestRequest,
  RuleChain,
  RuleChainAddQuery,
  RuleChainDebugRequest,
  RuleChainDebugResult,
  RuleChainDetail,
  RuleChainPage,
  RuleChainPageQuery,
  RuleChainUpdateQuery,
  RuleChainValidationResult,
  ServiceAddQuery,
  ServiceUpdateQuery,
  StandardPropertyAddQuery,
  TelemetryAggQuery,
  TslModel,
} from '@/types/api'
import type { BaseResult, Option, OptionItem, PageResult } from '@/types/common'
import request from '@/utils/request'

/**
 * 登录接口返回的业务数据。
 *
 * 对应后端 `UserController.doLogin` 返回的 `Map<String, Object>`：
 * - `tokenInfo`：Sa-Token 的会话信息（前端存进 store 的凭证）
 * - `forceChangePwd`：是否需要强制修改密码
 */
export interface LoginResult {
  /** Sa-Token 会话信息 */
  tokenInfo: {
    /** 请求头名称，如 Authorization */
    tokenName?: string
    /** 请求头的值 */
    tokenValue?: string
    [key: string]: unknown
  }
  /** 是否需要强制修改密码 */
  forceChangePwd?: boolean
}

/**
 * 产品类型列表查询参数。
 *
 * 对应后端 `ProductTypeController.list` 的 `@RequestParam`。
 */
export interface ProductTypeQuery {
  /** 父级类型 ID，-1 表示根 */
  parentId?: number
  /** 是否带出子类型 */
  withChild?: boolean
  /** 类型名称（模糊匹配） */
  name?: string
}

/**
 * 物模型属性列表查询参数。
 *
 * 对应后端 `ModelPropertyController.list` 的 `@RequestParam`。
 */
export interface ModelPropertyQuery {
  /** 参数类型：1=属性 2=参数 */
  paramType?: number
  /** 产品类型 ID（后端必填） */
  productTypeId: number
  /** 产品 ID */
  productId?: number
  /** 关键字 */
  search?: string
  /** 是否返回全部 */
  all?: boolean
}

/**
 * 标准服务列表查询参数。
 *
 * 对应后端 `ModelServiceController.list`。
 */
export interface StandardServiceListQuery {
  /** 服务类型：1=服务 2=事件 */
  serviceType?: number
  /** 关键字 */
  search?: string
  /** 产品类型 ID（后端必填） */
  productTypeId: number
}

/**
 * 自定义服务列表查询参数。
 *
 * 对应后端 `ModelServiceController.customList`。
 */
export interface CustomServiceListQuery {
  /** 服务类型：1=服务 2=事件 */
  serviceType?: number
  /** 关键字 */
  search?: string
  /** 产品 ID（后端必填） */
  productId: number
}

/**
 * 协议列表查询参数。
 *
 * 对应后端 `ProtocolController.list` 的 `@RequestParam`。
 */
export interface ProtocolQuery {
  /** 协议名称 */
  name?: string
  /** 协议类型：1=JAVA 2=SYSTEM_DEFAULT 3=JAVASCRIPT */
  protoType?: number
  /** 状态：1=启用 2=禁用 */
  status?: number
  /** 协议 Key */
  protoKey?: string
  /** 脚本语言 */
  scriptLang?: string
}

/**
 * 图标列表查询参数。
 *
 * 对应后端 `IconController.list` 的 `@RequestParam`。
 */
export interface IconQuery {
  /** 图标名称（模糊匹配） */
  name?: string
}

/**
 * 设备列表查询参数。
 *
 * 对应后端 `DeviceController.list` 的 `@RequestParam`。
 */
export interface DeviceListQuery {
  /** 产品 ID */
  productId?: number
  /** 产品类型 ID */
  productTypeId?: number
  /** 设备 Key */
  deviceKey?: string
  /**
   * 历史遗留分页参数。
   *
   * 后端 `GET /device/list` 不分页（一次返回全部设备），这两个参数会被忽略。
   */
  page?: number
  /** 历史遗留分页参数，后端忽略 */
  size?: number
}

/**
 * 消息接收者列表查询参数。
 *
 * 对应后端 `MessageReceiveController.list` 的 `@RequestParam`。
 */
export interface MessageReceiveListQuery {
  /** 接收者名称 */
  name?: string
}

/**
 * 推送配置列表查询参数。
 *
 * 对应后端 `PushConfigController.list` 的 `@RequestParam`。
 */
export interface PushConfigListQuery {
  /** 配置类型 */
  type?: PushConfigType
}

/**
 * 协议新增 / 修改的请求体。
 *
 * 后端 `ProtocolController` 直接接收 entity `Protocol`，其中 id 由服务端生成；
 * `enabled` / `scriptType` / `systemDefault` / `javaType` 是后端派生的只读字段。
 */
export type ProtocolPayload = Omit<Protocol, 'id' | 'enabled' | 'scriptType' | 'systemDefault' | 'javaType'> & {
  id?: number
}

/**
 * IM 推送配置新增 / 修改的请求体。
 *
 * 后端 `ImPushConfigController` 直接接收 entity `ImPushConfig`，
 * 其中 id / createTime / updateTime 由服务端生成。
 */
export type ImPushConfigPayload = Omit<ImPushConfig, 'id' | 'createTime' | 'updateTime'> & {
  id?: number
}

/**
 * 推送测试结果。
 *
 * 对应后端 `com.github.dingdaoyi.service.push.PushDeliveryResult`。
 */
export interface PushDeliveryResult {
  /** 是否推送成功 */
  success: boolean
  /** HTTP 状态码 */
  statusCode?: number
  /** 结果描述 */
  message?: string
  /** 响应体 */
  responseBody?: string
}

/**
 * 规则链节点类型信息。
 *
 * 对应后端 `RuleChainController.NodeTypeInfo`。
 */
export interface RuleNodeTypeInfo {
  /** 节点类型枚举名 */
  type: string
  /** 显示名 */
  name: string
  /** 描述 */
  description: string
  /** 节点分类 */
  category: string
  /** 分类颜色 */
  color: string
}

/**
 * 规则链模板变量信息。
 *
 * 对应后端 `RuleChainController.TemplateVariableInfo`。
 */
export interface RuleTemplateVariable {
  /** 变量名，如 ${deviceName} */
  variable: string
  /** 显示名称 */
  name: string
  /** 描述 */
  description: string
  /** 分类：SYSTEM / PROPERTY */
  category: string
}

/**
 * 批量下发设备指令的请求体。
 *
 * 对应后端 `ServiceEndpoint.batchSend` 读取的 body 字段。
 */
export interface BatchDeviceServicePayload {
  /** 目标设备编号列表 */
  deviceKeys: string[]
  /** 指令参数 */
  params?: Record<string, unknown>
}

/**
 * 兼容既有调用形状的 axios 配置。
 *
 * 历史上部分删除接口把 `id` 挂在配置根上；axios 不识别该字段（不会进入请求），
 * 这里保留它只是为了不改变原有代码的请求构造方式。
 */
interface LegacyRequestConfig extends AxiosRequestConfig {
  id?: number
}

// 登录接口
export function Index(data: LoginQuery): Promise<BaseResult<LoginResult>> {
  return request.post<BaseResult<LoginResult>>('/user/login', data, {
    // 免 token 标记，见 utils/request.ts 注释（不能用 header 承载）
    __noToken: true,
  })
}

// 修改密码
export function changePasswordApi(data: ChangePasswordQuery): Promise<BaseResult<void>> {
  return request.post<BaseResult<void>>('/user/changePassword', data)
}

export function productTypeListApi(params?: ProductTypeQuery): Promise<BaseResult<ProductType[]>> {
  return request.get<BaseResult<ProductType[]>>('/product/type', { params })
}

/**
 * 修改产品,暂时不需要
 * @param data
 * @returns API 响应
 */
export function productTypeEditeApi(data: ProductTypeAddQuery): Promise<BaseResult<boolean>> {
  return request.put<BaseResult<boolean>>('/product/type', data)
}

export function productTypeAddApi(data: ProductTypeAddQuery): Promise<BaseResult<boolean>> {
  return request.post<BaseResult<boolean>>('/product/type', data)
}

export function productTypeDelApi(id: number): Promise<BaseResult<boolean>> {
  return request.delete<BaseResult<boolean>>(`/product/type/${id}`)
}

export function productTypeDetailApi(id: number): Promise<BaseResult<ProductType>> {
  return request.get<BaseResult<ProductType>>(`/product/type/${id}`)
}

/**
 * 属性列表
 * @param params
 * @returns API 响应
 */
export function propertyListApi(params: ModelPropertyQuery): Promise<BaseResult<ModelProperty[]>> {
  return request.get<BaseResult<ModelProperty[]>>('/model/property/product/type', { params })
}

/**
 * 属性列表
 * @param id
 * @returns API 响应
 */
export function propertyDeleteApi(id: number): Promise<BaseResult<boolean>> {
  return request.delete<BaseResult<boolean>>(`/model/property/${id}`)
}

/**
 * 保存标准属性
 * @param data
 * @returns API 响应
 */
export function standardPropertyAddApi(data: StandardPropertyAddQuery): Promise<BaseResult<boolean>> {
  return request.post<BaseResult<boolean>>('/model/property/product/type', data)
}

/**
 * 保存自定义属性
 * @param data
 * @returns API 响应
 */
export function customPropertyAddApi(data: ProductPropertyAddQuery): Promise<BaseResult<boolean>> {
  return request.post<BaseResult<boolean>>('/model/property/product', data)
}

/**
 * 修改标准属性
 * @param data
 * @returns API 响应
 */
export function standardPropertyEditApi(data: ModelPropertyUpdateQuery): Promise<BaseResult<boolean>> {
  return request.put<BaseResult<boolean>>('/model/property/product', data)
}

export function standardServiceListApi(params: StandardServiceListQuery): Promise<BaseResult<ModelService[]>> {
  return request.get<BaseResult<ModelService[]>>('/model/service/standard', { params })
}

export function customServiceListApi(params: CustomServiceListQuery): Promise<BaseResult<ModelService[]>> {
  return request.get<BaseResult<ModelService[]>>('/model/service/custom', { params })
}

export function serviceAddApi(data: ServiceAddQuery): Promise<BaseResult<boolean>> {
  return request.post<BaseResult<boolean>>('/model/service', data)
}

export function serviceDeleteApi(id: number): Promise<BaseResult<boolean>> {
  const config: LegacyRequestConfig = { id }
  return request.delete<BaseResult<boolean>>('/model/service', config)
}

export function serviceEditeApi(data: ServiceUpdateQuery): Promise<BaseResult<boolean>> {
  return request.put<BaseResult<boolean>>('/model/service', data)
}

/**
 * 产品分页
 * @param data
 * @returns API 响应
 */
export function productPageApi(data: ProductPageQuery): Promise<BaseResult<PageResult<ProductPage>>> {
  return request.post<BaseResult<PageResult<ProductPage>>>('/product/page', data)
}

/**
 * 产品列表
 * @param data 查询参数
 * @param data.productTypeId 产品类型ID
 * @returns API 响应
 */
export function manufacturerListApi({ productTypeId }: { productTypeId: number }): Promise<BaseResult<string[]>> {
  return request.get<BaseResult<string[]>>('/manufacturer', {
    params: {
      productTypeId,
    },
  })
}

/**
 * 产品列表
 * @param data 查询参数
 * @param data.productTypeId 产品类型ID
 * @param data.manufacturer 厂商
 * @returns API 响应
 */
export function productListApi({ productTypeId, manufacturer }: { productTypeId?: number, manufacturer?: string }): Promise<BaseResult<Product[]>> {
  return request.get<BaseResult<Product[]>>('/product', {
    params: {
      productTypeId,
      manufacturer,
    },
  })
}

/**
 * 产品添加
 * @param data
 * @returns API 响应
 */
export function productAddApi(data: ProductAddQuery): Promise<BaseResult<boolean>> {
  return request.post<BaseResult<boolean>>('/product', data)
}

/**
 * 产品编辑
 * @param data
 * @returns API 响应
 */
export function productEditeApi(data: ProductUpdateQuery): Promise<BaseResult<boolean>> {
  return request.put<BaseResult<boolean>>('/product', data)
}

/**
 * 产品删除
 * @param id
 * @returns API 响应
 */
export function productDeleteApi(id: number): Promise<BaseResult<boolean>> {
  const config: LegacyRequestConfig = { id }
  return request.delete<BaseResult<boolean>>(`/product/${id}`, config)
}

/**
 * 产品详情
 * @param id
 * @returns API 响应
 */
export function productDetailApi(id: number): Promise<BaseResult<Product>> {
  return request.get<BaseResult<Product>>(`/product/${id}`)
}

/**
 * 协议列表
 * @param params
 * @returns API 响应
 */
export function protocolListApi(params: ProtocolQuery): Promise<BaseResult<Protocol[]>> {
  return request.get<BaseResult<Protocol[]>>('/protocol', { params })
}

/**
 * 协议添加
 * @param data
 * @returns API 响应
 */
export function protocolAddApi(data: ProtocolPayload): Promise<BaseResult<boolean>> {
  return request.post<BaseResult<boolean>>('/protocol', data)
}

/**
 * 协议添加
 * @param data
 * @returns API 响应
 */
export function protocolEditApi(data: ProtocolPayload): Promise<BaseResult<boolean>> {
  return request.put<BaseResult<boolean>>('/protocol', data)
}

/**
 * 协议删除
 * @param id
 * @returns API 响应
 */
export function protocolDeleteApi(id: number): Promise<BaseResult<boolean>> {
  return request.delete<BaseResult<boolean>>(`/protocol/${id}`)
}

/**
 * 协议设置状态
 * @param id 协议ID
 * @param enable true=启用, false=禁用
 * @returns API 响应
 */
export function protocolSetStatusApi(id: number, enable: boolean): Promise<BaseResult<boolean>> {
  return request.put<BaseResult<boolean>>(`/protocol/${id}/status`, undefined, {
    params: { enable },
  })
}

/**
 * 测试脚本协议解码
 * @param data 协议草稿和测试报文
 * @returns API 响应
 */
export function protocolTestDecodeApi(data: ProtocolDecodeTestRequest): Promise<BaseResult<unknown>> {
  return request.post<BaseResult<unknown>>('/protocol/test/decode', data)
}

/**
 * 测试脚本协议编码
 * @param data 协议草稿和测试命令
 * @returns API 响应
 */
export function protocolTestEncodeApi(data: ProtocolEncodeTestRequest): Promise<BaseResult<unknown>> {
  return request.post<BaseResult<unknown>>('/protocol/test/encode', data)
}

/**
 * 图标列表
 * @param params
 * @returns API 响应
 */
export function iconListApi(params?: IconQuery): Promise<BaseResult<Icon[]>> {
  return request.get<BaseResult<Icon[]>>('/icon', { params })
}

/**
 * 图标添加
 * @param data
 * @returns API 响应
 */
export function iconAddApi(data: Omit<Icon, 'id'> & { id?: number }): Promise<BaseResult<boolean>> {
  return request.post<BaseResult<boolean>>('/icon', data)
}

/**
 * 图标修改
 * @param data
 * @returns API 响应
 */
export function iconEditeApi(data: Omit<Icon, 'id'> & { id?: number }): Promise<BaseResult<boolean>> {
  return request.put<BaseResult<boolean>>('/icon', data)
}

/**
 * 图标删除
 * @param id
 * @returns API 响应
 */
export function iconDeleteApi(id: number): Promise<BaseResult<boolean>> {
  return request.delete<BaseResult<boolean>>(`/icon/${id}`)
}

export function uploadMoreApi(data: FormData): Promise<BaseResult<string[]>> {
  return request.post<BaseResult<string[]>>('/file/upload', data)
}

export function loadTslData(productId: number): Promise<BaseResult<TslModel>> {
  return request.get<BaseResult<TslModel>>(`/product/tsl/${productId}`)
}

export function deviceDeleteApi(id: number): Promise<BaseResult<boolean>> {
  return request.delete<BaseResult<boolean>>(`/device/${id}`)
}

export function devicePageApi(data: DevicePageQuery): Promise<BaseResult<PageResult<DevicePage>>> {
  return request.post<BaseResult<PageResult<DevicePage>>>('/device/page', data)
}

export function deviceDetailApi(id: number): Promise<BaseResult<Device>> {
  return request.get<BaseResult<Device>>(`/device/${id}`)
}

/**
 * 设备编辑
 * @param data
 * @returns API 响应
 */
export function deviceEditeApi(data: DeviceUpdateQuery): Promise<BaseResult<boolean>> {
  return request.put<BaseResult<boolean>>('/device', data)
}

/**
 * 设备编辑
 * @param data
 * @returns API 响应
 */
export function deviceAddApi(data: DeviceAddQuery): Promise<BaseResult<boolean>> {
  return request.post<BaseResult<boolean>>('/device', data)
}

/**
 * 设备搜索
 * @param params
 * @returns API 响应
 */
export function deviceListApi(params?: DeviceListQuery): Promise<BaseResult<Device[]>> {
  return request.get<BaseResult<Device[]>>('/device/list', { params })
}

/**
 * 字典查询
 * @param group 分组名称
 */
export function dictListApi(group: string): Promise<BaseResult<Option[]>> {
  return request.get<BaseResult<Option[]>>('/dict/list', {
    params: {
      group,
    },
  })
}

/**
 * 设备日志最后数据
 * @param deviceKey 设备日志最后数据
 */
export function deviceDataLast(deviceKey: string): Promise<BaseResult<KeyValue<string, unknown>[]>> {
  return request.get<BaseResult<KeyValue<string, unknown>[]>>(`/device/data/property/last/${deviceKey}`)
}

/**
 * 设备指标
 * @param data 参数上
 */
export function deviceDataMetric(data: DeviceDataQuery): Promise<BaseResult<KeyValue<string, unknown>[]>> {
  return request.post<BaseResult<KeyValue<string, unknown>[]>>('/device/data/property/metric', data)
}

/**
 * 设备事件列表
 * @param data 参数上
 */
export function deviceEventLogsApi(data: DeviceDataQuery): Promise<BaseResult<PageResult<DeviceEventData>>> {
  return request.post<BaseResult<PageResult<DeviceEventData>>>('/device/data/event/logs', data)
}

/**
 * 设备属性聚合查询
 * @param data { deviceKey, identifier, beginTime, endTime, interval, function }
 */
export function deviceDataAggregateApi(data: TelemetryAggQuery): Promise<BaseResult<KeyValue<string, unknown>[]>> {
  return request.post<BaseResult<KeyValue<string, unknown>[]>>('/device/data/property/aggregate', data)
}

/**
 * 设备影子
 */
export function deviceShadowApi(deviceId: number): Promise<BaseResult<DeviceShadow>> {
  return request.get<BaseResult<DeviceShadow>>(`/device/shadow/${deviceId}`)
}

export function deviceShadowUpdateDesiredApi(deviceId: number, data: Record<string, unknown>): Promise<BaseResult<DeviceShadow>> {
  return request.post<BaseResult<DeviceShadow>>(`/device/shadow/${deviceId}/desired`, data)
}

export function deviceShadowClearDesiredApi(deviceId: number): Promise<BaseResult<void>> {
  return request.delete<BaseResult<void>>(`/device/shadow/${deviceId}/desired`)
}

/**
 * 添加消息接收者
 * @param data 参数上
 */
export function messageReceiveAddApi(data: MessageReceiveAddQuery): Promise<BaseResult<boolean>> {
  return request.post<BaseResult<boolean>>('/message/receive', data)
}

/**
 * 编辑消息接收者
 * @param data 参数上
 */
export function messageReceiveEditApi(data: MessageReceiveUpdateQuery): Promise<BaseResult<boolean>> {
  return request.put<BaseResult<boolean>>('/message/receive', data)
}

/**
 * 编辑消息接收者
 * @param id id
 */
export function messageReceiveDeleteApi(id: number): Promise<BaseResult<boolean>> {
  return request.delete<BaseResult<boolean>>(`/message/receive/${id}`)
}

/**
 * 编辑消息接收者
 * @param data data
 */
export function messageReceivePageApi(data: MessageRecivePageQuery): Promise<BaseResult<PageResult<MessageReceive>>> {
  return request.post<BaseResult<PageResult<MessageReceive>>>('/message/receive/page', data)
}

/**
 * 编辑消息接收者
 * @param params params
 */
export function messageReceiveListApi(params?: MessageReceiveListQuery): Promise<BaseResult<MessageReceive[]>> {
  return request.get<BaseResult<MessageReceive[]>>('/message/receive/list', { params })
}

// ==================== 推送配置 API ====================

/**
 * 推送配置分页列表
 */
export function pushConfigPageApi(data: PushConfigPageQuery): Promise<BaseResult<PageResult<PushConfigPage>>> {
  return request.post<BaseResult<PageResult<PushConfigPage>>>('/push-config/page', data)
}

/**
 * 推送配置详情
 */
export function pushConfigDetailApi(id: number): Promise<BaseResult<PushConfigDetail>> {
  return request.get<BaseResult<PushConfigDetail>>(`/push-config/${id}`)
}

/**
 * 新增推送配置
 */
export function pushConfigAddApi(data: PushConfigAddQuery): Promise<BaseResult<boolean>> {
  return request.post<BaseResult<boolean>>('/push-config', data)
}

/**
 * 修改推送配置
 */
export function pushConfigEditApi(data: PushConfigUpdateQuery): Promise<BaseResult<boolean>> {
  return request.put<BaseResult<boolean>>('/push-config', data)
}

/**
 * 删除推送配置
 */
export function pushConfigDeleteApi(id: number): Promise<BaseResult<boolean>> {
  return request.delete<BaseResult<boolean>>(`/push-config/${id}`)
}

/**
 * 获取启用的推送配置列表
 */
export function pushConfigListApi(params?: PushConfigListQuery): Promise<BaseResult<PushConfig[]>> {
  return request.get<BaseResult<PushConfig[]>>('/push-config/list', { params })
}

/**
 * 测试推送配置
 */
export function pushConfigTestApi(id: number, data: PushTestRequest): Promise<BaseResult<PushDeliveryResult>> {
  return request.post<BaseResult<PushDeliveryResult>>(`/push-config/${id}/test`, data)
}

/**
 * 调用设备服务
 * @param deviceKey 设备编号
 * @param identifier 服务标识符
 * @param params 服务参数
 */
export function callDeviceServiceApi(deviceKey: string, identifier: string, params: Record<string, unknown>): Promise<BaseResult<Record<string, unknown>>> {
  return request.post<BaseResult<Record<string, unknown>>>(`/service/${deviceKey}/${identifier}`, params)
}

// ==================== 规则链 API ====================

/**
 * 规则链分页列表
 */
export function ruleChainPageApi(data: RuleChainPageQuery): Promise<BaseResult<PageResult<RuleChainPage>>> {
  return request.post<BaseResult<PageResult<RuleChainPage>>>('/rule-chain/page', data)
}

/**
 * 规则链详情
 */
export function ruleChainDetailApi(id: number): Promise<BaseResult<RuleChainDetail>> {
  return request.get<BaseResult<RuleChainDetail>>(`/rule-chain/${id}`)
}

/**
 * 规则链添加
 */
export function ruleChainAddApi(data: RuleChainAddQuery): Promise<BaseResult<boolean>> {
  return request.post<BaseResult<boolean>>('/rule-chain', data)
}

/**
 * 规则链更新
 */
export function ruleChainUpdateApi(data: RuleChainUpdateQuery): Promise<BaseResult<boolean>> {
  return request.put<BaseResult<boolean>>('/rule-chain', data)
}

/**
 * 规则链删除
 */
export function ruleChainDeleteApi(id: number): Promise<BaseResult<boolean>> {
  return request.delete<BaseResult<boolean>>(`/rule-chain/${id}`)
}

/**
 * 规则链启用/禁用
 */
export function ruleChainToggleApi(id: number, enabled: boolean): Promise<BaseResult<boolean>> {
  return request.put<BaseResult<boolean>>(`/rule-chain/${id}/enable`, undefined, {
    params: { enabled },
  })
}

/**
 * 获取节点类型列表
 */
export function ruleChainNodeTypesApi(): Promise<BaseResult<Record<string, RuleNodeTypeInfo[]>>> {
  return request.get<BaseResult<Record<string, RuleNodeTypeInfo[]>>>('/rule-chain/node-types')
}

/**
 * 调试执行规则链草稿
 */
export function ruleChainDebugApi(data: RuleChainDebugRequest): Promise<BaseResult<RuleChainDebugResult>> {
  return request.post<BaseResult<RuleChainDebugResult>>('/rule-chain/debug', data)
}

/**
 * 校验规则链草稿
 */
export function ruleChainValidateApi(data: RuleChain): Promise<BaseResult<RuleChainValidationResult>> {
  return request.post<BaseResult<RuleChainValidationResult>>('/rule-chain/validate', data)
}

/**
 * 获取模板变量列表
 * @param productId 产品ID，用于获取物模型属性
 */
export function ruleChainTemplateVariablesApi(productId?: number): Promise<BaseResult<RuleTemplateVariable[]>> {
  return request.get<BaseResult<RuleTemplateVariable[]>>('/rule-chain/template-variables', {
    params: { productId },
  })
}

// ==================== 告警 API ====================

/**
 * 告警分页列表
 */
export function alarmPageApi(data: AlarmPageQuery): Promise<BaseResult<PageResult<AlarmPage>>> {
  return request.post<BaseResult<PageResult<AlarmPage>>>('/alarm/page', data)
}

/**
 * 告警详情
 */
export function alarmDetailApi(id: number): Promise<BaseResult<Alarm>> {
  return request.get<BaseResult<Alarm>>(`/alarm/${id}`)
}

/**
 * 确认告警
 */
export function alarmAcknowledgeApi(id: number): Promise<BaseResult<boolean>> {
  return request.put<BaseResult<boolean>>(`/alarm/${id}/acknowledge`)
}

/**
 * 清除告警
 */
export function alarmClearApi(id: number): Promise<BaseResult<boolean>> {
  return request.put<BaseResult<boolean>>(`/alarm/${id}/clear`)
}

/**
 * 告警统计
 *
 * 对应后端 `AlarmController.statistics` 返回的 `Map<String, Object>`：
 * - `activeCount`：活动告警数
 * - `severityOptions`：严重程度选项（含 color）
 * - `statusOptions`：状态选项
 */
export interface AlarmStatistics {
  /** 活动告警数 */
  activeCount: number
  /** 严重程度选项 */
  severityOptions: OptionItem<string>[]
  /** 状态选项 */
  statusOptions: OptionItem<string>[]
}

/**
 * 告警统计
 */
export function alarmStatisticsApi(): Promise<BaseResult<AlarmStatistics>> {
  return request.get<BaseResult<AlarmStatistics>>('/alarm/statistics')
}

// ==================== IM 推送配置 API ====================

export function imPushListApi(): Promise<BaseResult<ImPushConfig[]>> {
  return request.get<BaseResult<ImPushConfig[]>>('/im-push/list')
}

export function imPushAddApi(data: ImPushConfigPayload): Promise<BaseResult<boolean>> {
  return request.post<BaseResult<boolean>>('/im-push', data)
}

export function imPushUpdateApi(data: ImPushConfigPayload): Promise<BaseResult<boolean>> {
  return request.put<BaseResult<boolean>>('/im-push', data)
}

export function imPushDeleteApi(id: number): Promise<BaseResult<boolean>> {
  return request.delete<BaseResult<boolean>>(`/im-push/${id}`)
}

// ==================== 批量设备指令 API ====================

export function batchDeviceServiceApi(identifier: string, data: BatchDeviceServicePayload): Promise<BaseResult<Record<string, unknown>>> {
  return request.post<BaseResult<Record<string, unknown>>>(`/service/batch/${identifier}`, data)
}

// ==================== 设备子设备 API ====================

export function deviceChildrenApi(id: number): Promise<BaseResult<Device[]>> {
  return request.get<BaseResult<Device[]>>(`/device/${id}/children`)
}
