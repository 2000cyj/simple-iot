/**
 * 后端数据模型类型（地基层）。
 *
 * 逐个对应后端 Java 类，字段名与后端 JSON 序列化后的 camelCase **完全一致**，
 * 不做任何改名 / 归并。继承关系（extends BaseEntity 等）已把父类字段平铺进来，
 * 并在每个 interface 的注释里注明来源类。
 *
 * 类型映射规则：
 * - `Integer / Long / int / long / Short / Double / Float` → `number`
 * - `String` → `string`
 * - `Boolean / boolean` → `boolean`
 * - `Date / LocalDateTime` → `string`（后端 @JsonFormat，形如 `2026-07-23 10:00:00`）
 * - `List<X>` → `X[]`
 * - `Map<String, Object>` → `Record<string, unknown>`
 * - Java 枚举 → 字面量联合（见下方「枚举」章节）
 *
 * 枚举的取值规则（关键，容易踩坑）：
 * 后端枚举同时标了 `@EnumValue`（MyBatis-Plus 落库）与 `@JsonValue`（Jackson 出参），
 * **Jackson 认 `@JsonValue`**：
 * - `@JsonValue` 是 String 的 → JSON 里是字符串（多数情况下等于枚举常量名）
 * - `@JsonValue` 是 int 的 → JSON 里是数字（前端现有代码也是按数字比较的，
 *   例如 `row.protoType !== 3`、`row.serviceType === 1`）
 * - 没有 `@JsonValue` 的 → JSON 里是枚举常量名
 *
 * 空值约定：后端 ObjectMapper 全局 `JsonInclude.NON_NULL`（MicaConfig.objectMapper()），
 * Java 侧为 null 的字段不会出现在 JSON 中，所以可为空字段一律带 `?`。
 */

import type { PageQuery } from './common'

// ============================================================================
// 枚举（字面量联合）
// ============================================================================

/** 后端 `com.github.dingdaoyi.entity.enu.AlarmSeverity`（@JsonValue = 名称） */
export type AlarmSeverity = 'CRITICAL' | 'MAJOR' | 'MINOR' | 'WARNING'

/** 后端 `com.github.dingdaoyi.entity.enu.AlarmStatus`（@JsonValue = 名称） */
export type AlarmStatus = 'ACTIVE' | 'CLEARED' | 'ACKNOWLEDGED'

/** 后端 `com.github.dingdaoyi.entity.enu.CommandStatus`（@JsonValue = int） */
export type CommandStatus = 0 | 1 | 2 | 3

/** 后端 `com.github.dingdaoyi.entity.enu.ProtoType`（@JsonValue = int code：1=JAVA 2=SYSTEM_DEFAULT 3=JAVASCRIPT） */
export type ProtoType = 1 | 2 | 3

/** 后端 `com.github.dingdaoyi.entity.enu.PushConfigType`（@JsonValue = "HTTP" / "MQTT"） */
export type PushConfigType = 'HTTP' | 'MQTT'

/** 后端 `com.github.dingdaoyi.entity.enu.RuleInputType`（@JsonValue = int） */
export type RuleInputType = 1 | 2 | 3

/** 后端 `com.github.dingdaoyi.entity.enu.RuleNodeType`（@JsonValue = 名称） */
export type RuleNodeType =
  | 'INPUT_PROPERTY'
  | 'INPUT_EVENT'
  | 'INPUT_ONLINE'
  | 'INPUT_SCHEDULE'
  | 'FILTER_PROPERTY'
  | 'FILTER_EVENT_TYPE'
  | 'FILTER_SCRIPT'
  | 'FILTER_DEVICE_GROUP'
  | 'ALARM_CREATE'
  | 'ALARM_CLEAR'
  | 'OUTPUT_MESSAGE'
  | 'OUTPUT_HTTP'
  | 'OUTPUT_MQTT'
  | 'OUTPUT_COMMAND'
  | 'SUB_FLOW'

/** 后端 `com.github.dingdaoyi.entity.enu.RuleNodeType.NodeCategory`（无 @JsonValue，取名称） */
export type RuleNodeCategory = 'INPUT' | 'FILTER' | 'ALARM' | 'OUTPUT' | 'FLOW'

/** 后端 `com.github.dingdaoyi.entity.enu.RuleSourceType`（@JsonValue = 名称） */
export type RuleSourceType = 'PRODUCT' | 'DEVICE_GROUP' | 'DEVICE'

/** 后端 `com.github.dingdaoyi.entity.enu.RuleTargetType`（@JsonValue = int） */
export type RuleTargetType = 1 | 2 | 3

/** 后端 `com.github.dingdaoyi.entity.enu.ServiceTypeEnum`（@JsonValue = int：1=SERVICE 2=EVENT） */
export type ServiceTypeEnum = 1 | 2

/** 后端 `com.github.dingdaoyi.entity.enu.StatusEnum`（@JsonValue = int：1=ENABLED 0=DISABLED） */
export type StatusEnum = 0 | 1

/** 后端 `com.github.dingdaoyi.model.enu.ConnectionTypeEnum`（@JsonValue = 名称） */
export type ConnectionTypeEnum = 'DEFAULT' | 'CUSTOM'

/** 后端 `com.github.dingdaoyi.model.enu.NotifyType`（@JsonValue = int：1=EMAIL 2=SMS 3=DINGTALK 4=WECOM 5=FEISHU） */
export type NotifyType = 1 | 2 | 3 | 4 | 5

/** 后端 `com.github.dingdaoyi.model.enu.SmsSupplier`（@JsonValue = 小写 code） */
export type SmsSupplier = 'alibaba' | 'tencent' | 'huawei'

/** 后端 `com.github.dingdaoyi.model.enu.SmsTemplateType`（@JsonValue = code） */
export type SmsTemplateType = 'alarm_notify' | 'verify_code'

/** 后端 `com.github.dingdaoyi.core.driver.DriverTypeEnum`（@JsonValue = 名称） */
export type DriverTypeEnum = 'MQTT' | 'TCP' | 'UDP' | 'HTTP' | 'OPCUA' | 'CUSTOM'

/** 后端 `com.github.dingdaoyi.proto.model.DataTypeEnum`（@JsonValue = int：1=INT 2=FLOAT 3=DOUBLE 4=ENUM 5=TEXT 6=BOOL 7=DATE 8=STRUCT） */
export type DataTypeEnum = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8

/** 后端 `com.github.dingdaoyi.proto.model.ParamType`（@JsonValue = int：1=PROPERTY 2=PARAM） */
export type ParamType = 1 | 2

/** 后端 `com.github.dingdaoyi.proto.model.tsl.EventTypeEnum`（@JsonValue = int：1=INFO 2=WARN 3=FAULT） */
export type EventTypeEnum = 1 | 2 | 3

/** 后端 `com.github.dingdaoyi.proto.model.tsl.PropertyAccessMode`（@JsonValue = "r" / "rw"） */
export type PropertyAccessMode = 'r' | 'rw'

/** 后端 `com.github.dingdaoyi.rule.RuleContext.MessageType`（无 @JsonValue，取名称） */
export type RuleMessageType = 'PROPERTY' | 'EVENT' | 'SERVICE_RES' | 'ONLINE' | 'OFFLINE'

/** 后端 `com.github.dingdaoyi.proto.model.ProtoMessageType`（无 @JsonValue，取名称） */
export type ProtoMessageType = 'EVENT' | 'PROPERTY' | 'SERVICE_RES'

// ============================================================================
// 通用结构
// ============================================================================

/**
 * 通用键值对。
 *
 * 对应后端 `com.github.dingdaoyi.proto.model.KeyValue<K, V>`
 * 与 `com.github.dingdaoyi.entity.PushConfig.KeyValue`（同形状）。
 */
export interface KeyValue<K = string | number, V = string | number> {
  key: K
  value: V
}

// ============================================================================
// 物模型（TSL）
// ============================================================================

/**
 * 物模型属性。
 * 对应后端 `com.github.dingdaoyi.proto.model.tsl.TslProperty`。
 */
export interface TslProperty {
  id?: number
  /** 数据类型 */
  dataType?: DataTypeEnum
  /** 备注 */
  remark?: string
  /** 标识符 */
  identifier?: string
  /** 属性名称 */
  name?: string
  /** 访问权限：r 只读 / rw 读写 */
  accessMode?: PropertyAccessMode
  /** 布尔类型时 false 对应的值 */
  bool0?: string
  /** 布尔类型时 true 对应的值 */
  bool1?: string
  /** 字符串类型时的长度 */
  length?: number
  /** 计量单位 */
  unit?: string
  /** 计量单位名称 */
  unitName?: string
  /** 最大值 */
  max?: number
  /** 最小值 */
  min?: number
  /** 步长 */
  step?: number
  /** 枚举值对照表 */
  enums?: KeyValue<number, string>[]
  /** 子属性（struct 类型） */
  children?: TslProperty[]
  /** 图标 */
  icon?: string
  /** 参数类型：1 属性 / 2 参数 */
  paramType?: ParamType
  /** 是否为「属性」而非「参数」（派生自后端 `isProperty()`） */
  property?: boolean
}

/**
 * 物模型服务。
 * 对应后端 `com.github.dingdaoyi.proto.model.tsl.TslService`。
 */
export interface TslService {
  id?: number
  /** 服务是否为异步 */
  async?: boolean
  /** 标识符 */
  identifier?: string
  /** 名称 */
  name?: string
  /** 备注 */
  remark?: string
  /** 是否必选 */
  required?: boolean
  /** 入参 */
  inputParams?: TslProperty[]
  /** 出参 */
  outputParams?: TslProperty[]
}

/**
 * 物模型事件。
 * 对应后端 `com.github.dingdaoyi.proto.model.tsl.TslEvent`。
 */
export interface TslEvent {
  id?: number
  /** 事件类型：1=INFO 2=WARN 3=FAULT */
  eventType?: EventTypeEnum
  /** 标识符 */
  identifier?: string
  /** 名称 */
  name?: string
  /** 备注 */
  remark?: string
  /** 是否必选 */
  required?: boolean
  /** 出参 */
  outputParams?: TslProperty[]
}

/**
 * 物模型。
 * 对应后端 `com.github.dingdaoyi.proto.model.tsl.TslModel`。
 */
export interface TslModel {
  productKey?: string
  events?: TslEvent[]
  services?: TslService[]
  properties?: TslProperty[]
}

/**
 * 设备上报数据项。
 * 对应后端 `com.github.dingdaoyi.proto.model.DeviceData`。
 */
export interface DeviceData {
  identifier?: string
  /** 数据类型 */
  dataType?: DataTypeEnum
  /** 属性值（任意类型） */
  value?: unknown
}

/**
 * 设备上报事件数据。
 * 对应后端 `com.github.dingdaoyi.model.query.DeviceEventDataVo`
 * （继承 `com.github.dingdaoyi.proto.model.DeviceEventData`）。
 */
export interface DeviceEventData {
  identifier?: string
  /** 事件类型 */
  eventType?: EventTypeEnum
  /** 事件参数 */
  params?: DeviceData[]
  /** 行数据（事件内容） */
  rowValue?: string
  /** 事件时间 */
  time?: string
}

// ============================================================================
// 实体（entity）
// ============================================================================

/**
 * 告警。
 * 对应后端 `com.github.dingdaoyi.entity.Alarm`（继承 `core.base.BaseEntity`）。
 */
export interface Alarm {
  id: number
  /** 告警类型 */
  alarmType: string
  /** 告警名称 */
  alarmName?: string
  /** 严重程度 */
  severity?: AlarmSeverity
  /** 状态 */
  status?: AlarmStatus
  /** 告警消息 */
  message?: string
  /** 设备 ID */
  deviceId?: number
  /** 设备 Key */
  deviceKey?: string
  /** 设备名称 */
  deviceName?: string
  /** 触发规则链 ID */
  ruleChainId?: number
  /** 告警详情 */
  details?: Record<string, unknown>
  /** 告警开始时间 */
  startTs?: string
  /** 告警结束时间 */
  endTs?: string
  /** 告警清除时间 */
  clearTs?: string
  /** 清除人 */
  clearBy?: string
  /** 创建时间（BaseEntity） */
  createTime: string
  /** 更新时间（BaseEntity） */
  updateTime: string
}

/**
 * 告警评论。
 * 对应后端 `com.github.dingdaoyi.entity.AlarmComment`。
 */
export interface AlarmComment {
  id: number
  /** 告警 ID */
  alarmId: number
  /** 评论内容 */
  comment: string
  /** 操作类型：COMMENT / ACKNOWLEDGE / CLEAR / ESCALATE */
  action?: string
  /** 操作人 */
  author?: string
  /** 创建时间 */
  createTime?: string
}

/**
 * 审计日志。
 * 对应后端 `com.github.dingdaoyi.entity.AuditLog`（继承 `core.base.BaseEntity`）。
 */
export interface AuditLog {
  id: number
  /** 用户名 */
  username?: string
  /** 操作：CREATE / UPDATE / DELETE / LOGIN 等 */
  action: string
  /** 资源类型：DEVICE / ALARM / RULE_CHAIN 等 */
  resource?: string
  /** 资源 ID */
  resourceId?: string
  /** 操作详情 */
  detail?: string
  /** 客户端 IP */
  ip?: string
  /** 创建时间（BaseEntity） */
  createTime: string
  /** 更新时间（BaseEntity） */
  updateTime: string
}

/**
 * 自定义仪表盘。
 * 对应后端 `com.github.dingdaoyi.entity.Dashboard`（继承 `core.base.BaseEntity`）。
 */
export interface Dashboard {
  id: number
  /** 仪表盘名称 */
  name: string
  /** 描述 */
  description?: string
  /** 布局配置：widget 数组 */
  layout?: Array<Record<string, unknown>>
  /** 是否默认仪表盘 */
  isDefault?: boolean
  /** 创建时间（BaseEntity） */
  createTime: string
  /** 更新时间（BaseEntity） */
  updateTime: string
}

/**
 * 设备。
 *
 * 对应后端 `com.github.dingdaoyi.entity.Device`（继承 `core.base.BaseEntity`）；
 * `com.github.dingdaoyi.model.vo.DeviceVo` 在其基础上追加了
 * product / productType / tslModel 三个字段（已平铺进来）。
 */
export interface Device {
  id: number
  /** 产品 ID */
  productId: number
  /** 设备名称 */
  deviceName: string
  /** 设备 Key */
  deviceKey: string
  /** 设备密钥 */
  deviceSecret: string
  /** 在线状态 */
  online?: boolean
  /** 激活状态 */
  activeStatus?: boolean
  /** 第三方设备 ID */
  thirdDeviceId?: string
  /** 父设备 ID（网关） */
  parentId?: number
  /** 创建时间（BaseEntity） */
  createTime?: string
  /** 更新时间（BaseEntity） */
  updateTime?: string
  /** 产品（仅 DeviceVo 提供） */
  product?: Product
  /** 产品类型（仅 DeviceVo 提供） */
  productType?: ProductType
  /** 物模型（仅 DeviceVo 提供） */
  tslModel?: TslModel
}

/**
 * 设备分组。
 * 对应后端 `com.github.dingdaoyi.entity.DeviceGroup`（继承 `core.base.BaseEntity`）。
 */
export interface DeviceGroup {
  id: number
  /** 父分组 ID，-1 = 根 */
  parentId: number
  /** 分组名称 */
  name: string
  /** 描述 */
  description?: string
  /** 创建时间（BaseEntity） */
  createTime: string
  /** 更新时间（BaseEntity） */
  updateTime: string
}

/**
 * 设备分组关联。
 * 对应后端 `com.github.dingdaoyi.entity.DeviceGroupRelation`。
 */
export interface DeviceGroupRelation {
  id: number
  deviceId: number
  groupId: number
  createTime?: string
}

/**
 * 设备影子。
 * 对应后端 `com.github.dingdaoyi.entity.DeviceShadow`（继承 `core.base.BaseEntity`）。
 */
export interface DeviceShadow {
  id: number
  /** 设备 ID */
  deviceId: number
  /** 期望状态 JSON */
  desiredState?: string
  /** 上报状态 JSON */
  reportedState?: string
  /** 版本号 */
  version?: number
  /** 创建时间（BaseEntity） */
  createTime: string
  /** 更新时间（BaseEntity） */
  updateTime: string
}

/**
 * 设备标签。
 * 对应后端 `com.github.dingdaoyi.entity.DeviceTag`（继承 `core.base.BaseEntity`）。
 */
export interface DeviceTag {
  id: number
  /** 标签名称 */
  name: string
  /** 标签颜色 */
  color?: string
  /** 创建时间（BaseEntity） */
  createTime: string
  /** 更新时间（BaseEntity） */
  updateTime: string
}

/**
 * 设备标签关联。
 * 对应后端 `com.github.dingdaoyi.entity.DeviceTagRelation`。
 */
export interface DeviceTagRelation {
  id: number
  deviceId: number
  tagId: number
  createTime?: string
}

/**
 * 字典。
 * 对应后端 `com.github.dingdaoyi.entity.Dict`（继承 `core.base.BaseEntity`）。
 * 与 `common.ts` 的 `DictItem` 同源（DictDataVO 继承自本类）。
 */
export interface Dict {
  /** 主键 */
  id: number
  /** 字典分组 */
  dictGroup?: string
  /** 字典键（数据库列 dict_label） */
  label: string
  /** 字典值（数据库列 dict_value） */
  value: string
  /** 备注信息 */
  remark?: string
  /** 排序字段 */
  sort?: number
  /** 创建时间（BaseEntity） */
  createTime?: string
  /** 更新时间（BaseEntity） */
  updateTime?: string
}

/**
 * 驱动管理。
 * 对应后端 `com.github.dingdaoyi.entity.Driver`。
 */
export interface Driver {
  /** 驱动 ID */
  driverId: number
  /** 驱动名称 */
  name: string
  /** 驱动类型 */
  type: DriverTypeEnum
  /** 驱动描述 */
  description?: string
  /** 连接类型 */
  connectionType: ConnectionTypeEnum
  /** 驱动 JAR 路径 */
  jarPath?: string
  /** 是否为默认驱动 */
  isDefault?: boolean
  /** 状态：1 启用 0 禁用 */
  status?: number
  /** 驱动监听端口 */
  port?: number
}

/**
 * 邮箱配置。
 * 对应后端 `com.github.dingdaoyi.entity.EmailConfig`（继承 `core.base.BaseEntity`）；
 * `com.github.dingdaoyi.model.vo.EmailConfigVo` 是它的脱敏版本（不含 password）。
 */
export interface EmailConfig {
  /** 主键 ID */
  id: number
  /** 配置名称 */
  name: string
  /** SMTP 服务器地址 */
  host: string
  /** SMTP 端口 */
  port: number
  /** 发件人邮箱 */
  username: string
  /** 邮箱密码 / 授权码（EmailConfigVo 不返回该字段） */
  password?: string
  /** 协议 smtp */
  protocol?: string
  /** 编码 */
  encoding?: string
  /** 是否启用 SSL */
  sslEnabled?: boolean
  /** 是否默认配置 */
  isDefault?: boolean
  /** 状态：1 启用 2 禁用 */
  status?: number
  /** 是否启用（派生自后端 `isEnabled()`，Jackson 序列化为 enabled） */
  enabled?: boolean
  /** 创建时间（BaseEntity） */
  createTime: string
  /** 更新时间（BaseEntity） */
  updateTime: string
}

/**
 * 固件包。
 * 对应后端 `com.github.dingdaoyi.entity.Firmware`（继承 `core.base.BaseEntity`）。
 */
export interface Firmware {
  id: number
  /** 产品 ID */
  productId: number
  /** 固件名称 */
  name: string
  /** 版本号 */
  version: string
  /** 文件路径 */
  filePath: string
  /** 文件大小（字节） */
  fileSize?: number
  /** 校验和 */
  checksum?: string
  /** 描述 */
  description?: string
  /** 状态：DRAFT / PUBLISHED / ARCHIVED */
  status?: string
  /** 创建人 */
  createdBy?: string
  /** 创建时间（BaseEntity） */
  createTime: string
  /** 更新时间（BaseEntity） */
  updateTime: string
}

/**
 * 图标。
 * 对应后端 `com.github.dingdaoyi.entity.Icon`。
 */
export interface Icon {
  id: number
  /** 名称备注 */
  name: string
  /** 地址 */
  path: string
}

/**
 * IM 推送配置。
 * 对应后端 `com.github.dingdaoyi.entity.ImPushConfig`（继承 `core.base.BaseEntity`）。
 *
 * 注意：`platform` 的 Java 类型是 `NotifyType`（@JsonValue = int），
 * 但数据库列 `tb_im_push_config.platform` 是 VARCHAR（注释写 DINGTALK / WECOM / FEISHU），
 * 前端 `views/im-push/index.vue` 也是按字符串 'DINGTALK' 提交的 —— 前后端契约不一致，
 * 详见交付报告。
 */
export interface ImPushConfig {
  id: number
  /** 配置名称 */
  name: string
  /** 平台 */
  platform?: NotifyType
  /** Webhook URL */
  webhookUrl?: string
  /** 签名密钥（钉钉） */
  secret?: string
  /** 是否启用 */
  isEnabled?: boolean
  /** 描述 */
  description?: string
  /** 创建时间（BaseEntity） */
  createTime: string
  /** 更新时间（BaseEntity） */
  updateTime: string
}

/**
 * 消息接收者。
 * 对应后端 `com.github.dingdaoyi.entity.MessageReceive`。
 */
export interface MessageReceive {
  id: number
  /** 接收者名称 */
  name?: string
  /** 接收对象 */
  receiver?: string
  /** 通知类型 */
  notifyType?: NotifyType
  /** 备注 */
  remark?: string
}

/**
 * Modbus 设备配置。
 * 对应后端 `com.github.dingdaoyi.entity.ModbusConfig`（继承 `core.base.BaseEntity`）。
 */
export interface ModbusConfig {
  id: number
  /** 设备 ID */
  deviceId: number
  /** 从站地址 */
  host: string
  /** 端口 */
  port: number
  /** 单元 ID */
  unitId?: number
  /** 采集间隔（毫秒） */
  intervalMs?: number
  /** 寄存器映射 JSON */
  registerMap?: string
  /** 是否启用 */
  enabled?: boolean
  /** 创建时间（BaseEntity） */
  createTime: string
  /** 更新时间（BaseEntity） */
  updateTime: string
}

/**
 * 物模型属性。
 * 对应后端 `com.github.dingdaoyi.entity.ModelProperty`；
 * `com.github.dingdaoyi.model.vo.ModelPropertyVo` 在其基础上追加了
 * definitions / dataTypeName 两个派生字段（已平铺进来）。
 */
export interface ModelProperty {
  id: number
  /** 数据类型 */
  dataType?: DataTypeEnum
  /** 备注 */
  remark?: string
  /** 标识符 */
  identifier: string
  /** 属性名称 */
  name?: string
  /** 访问权限：r 只读 / rw 读写 */
  accessMode?: PropertyAccessMode
  /** 产品类型 ID */
  productTypeId?: number
  /** 图标 ID */
  iconId?: number
  /** 是否为自定义属性 */
  custom?: boolean
  /** 布尔类型时 false 对应的值 */
  bool0?: string
  /** 布尔类型时 true 对应的值 */
  bool1?: string
  /** 字符串类型时的长度 */
  length?: number
  /** 参数类型：1 属性 / 2 参数 */
  paramType?: ParamType
  /** 计量单位 */
  unit?: string
  /** 计量单位名称 */
  unitName?: string
  /** 最大值 */
  max?: number
  /** 最小值 */
  min?: number
  /** 步长 */
  step?: number
  /** 枚举值对照表 */
  enums?: KeyValue<number, string>[]
  /** 产品 ID */
  productId?: number
  /** 父级 ID（struct 类型时有值，默认 -1） */
  parentId?: number
  /** 计量单位字符串（派生自后端 `getUnitStr()`，unit 为空时返回 ""） */
  unitStr?: string
  /** 取值说明（ModelPropertyVo 派生字段） */
  definitions?: string
  /** 数据类型名称（ModelPropertyVo 派生字段） */
  dataTypeName?: string
}

/**
 * 物模型服务。
 * 对应后端 `com.github.dingdaoyi.entity.ModelService`；
 * `com.github.dingdaoyi.model.vo.ModelServiceVO` 在其基础上追加了
 * outputParamIds / inputParamIds（已平铺进来）。
 */
export interface ModelService {
  id: number
  /** 服务是否为异步 */
  async?: boolean
  /** 事件类型：1=INFO 2=WARN 3=FAULT */
  eventType?: EventTypeEnum
  /** 服务类型：1=SERVICE 2=EVENT */
  serviceType?: ServiceTypeEnum
  /** 标识符 */
  identifier: string
  /** 名称 */
  name?: string
  /** 备注 */
  remark?: string
  /** 产品类型 ID */
  productTypeId?: number
  /** 图标 ID */
  iconId?: number
  /** 是否为自定义 */
  custom?: boolean
  /** 是否必选 */
  required?: boolean
  /** 产品 ID */
  productId?: number
  /** 出参属性 ID 列表（ModelServiceVO 提供） */
  outputParamIds?: number[]
  /** 入参属性 ID 列表（ModelServiceVO 提供） */
  inputParamIds?: number[]
}

/**
 * OPC UA 设备配置。
 * 对应后端 `com.github.dingdaoyi.entity.OpcUaConfig`（继承 `core.base.BaseEntity`）。
 */
export interface OpcUaConfig {
  id: number
  /** 设备 ID */
  deviceId: number
  /** OPC UA 端点 URL */
  endpointUrl?: string
  /** 安全模式：NONE / SIGN / SIGN_ENCRYPT */
  securityMode?: string
  /** 用户名 */
  username?: string
  /** 密码 */
  password?: string
  /** 轮询间隔（毫秒） */
  intervalMs?: number
  /** 节点映射 JSON */
  nodeMap?: string
  /** 是否启用 */
  enabled?: boolean
  /** 创建时间（BaseEntity） */
  createTime: string
  /** 更新时间（BaseEntity） */
  updateTime: string
}

/**
 * OTA 升级任务。
 * 对应后端 `com.github.dingdaoyi.entity.OtaTask`（继承 `core.base.BaseEntity`）。
 */
export interface OtaTask {
  id: number
  /** 固件 ID */
  firmwareId: number
  /** 设备分组 ID（可选） */
  groupId?: number
  /** 目标设备 ID 列表 */
  deviceIds?: number[]
  /** 状态：PENDING / RUNNING / COMPLETED / FAILED */
  status?: string
  /** 总数 */
  total?: number
  /** 成功数 */
  success?: number
  /** 失败数 */
  fail?: number
  /** 各设备升级进度（deviceId -> 进度描述） */
  progress?: Record<string, string>
  /** 创建时间（BaseEntity） */
  createTime: string
  /** 更新时间（BaseEntity） */
  updateTime: string
}

/**
 * 产品。
 * 对应后端 `com.github.dingdaoyi.entity.Product`；
 * `com.github.dingdaoyi.model.vo.ProductVo` 在其基础上追加了 productType（已平铺进来）。
 */
export interface Product {
  id: number
  /** 产品型号 */
  model: string
  /** 厂家 */
  manufacturer?: string
  /** 描述 */
  remark?: string
  /** 协议 ID */
  protocolId?: number
  /** 产品类型 ID */
  productTypeId?: number
  /** 产品接入 Key */
  productKey?: string
  /** 产品图标 */
  icon?: string
  /** 产品类型（仅 ProductVo 提供） */
  productType?: ProductType
}

/**
 * 产品类型。
 * 对应后端 `com.github.dingdaoyi.entity.ProductType`；
 * `com.github.dingdaoyi.model.vo.ProductTypeVo` 在其基础上追加了 children（已平铺进来）。
 */
export interface ProductType {
  id: number
  /** 产品类型名称 */
  name: string
  /** 父级类型 ID，-1 = 根 */
  parentId: number
  /** 1 启用 2 禁用 */
  status: number
  /** 图标路径 */
  iconUrl?: string
  /** 描述 */
  mark?: string
  /** 类型 code（多级网关设备协议使用） */
  partTypeCode?: string
  /** 子级产品类型（仅 ProductTypeVo 提供） */
  children?: ProductType[]
}

/**
 * 协议。
 * 对应后端 `com.github.dingdaoyi.entity.Protocol`。
 */
export interface Protocol {
  id: number
  /** 协议名称 */
  name: string
  /** 协议类型：1=JAVA 2=SYSTEM_DEFAULT 3=JAVASCRIPT */
  protoType: ProtoType
  /** 协议包地址 */
  url?: string
  /** 协议描述 */
  mark?: string
  /** 协议 Key */
  protoKey?: string
  /** 协议入口（处理器类名） */
  handlerClass?: string
  /** 脚本内容 */
  scriptContent?: string
  /** 脚本语言类型 */
  scriptLang?: string
  /** 状态：1 启用 2 禁用 */
  status?: number
  /** 是否启用（派生自后端 `isEnabled()`） */
  enabled?: boolean
  /** 是否脚本类型协议（派生自后端 `isScriptType()`） */
  scriptType?: boolean
  /** 是否系统默认协议（派生自后端 `isSystemDefault()`） */
  systemDefault?: boolean
  /** 是否 Java 类型协议（派生自后端 `isJavaType()`） */
  javaType?: boolean
}

/**
 * 推送配置。
 * 对应后端 `com.github.dingdaoyi.entity.PushConfig`（继承 `core.base.BaseEntity`）。
 */
export interface PushConfig {
  id: number
  /** 配置名称 */
  name: string
  /** 配置类型：HTTP / MQTT */
  type: PushConfigType
  /** 描述 */
  description?: string
  /** 是否启用 */
  isEnabled?: boolean
  /** HTTP 请求 URL */
  httpUrl?: string
  /** HTTP 请求方法：GET / POST / PUT */
  httpMethod?: string
  /** HTTP 请求头 */
  httpHeaders?: KeyValue<string, string>[]
  /** 超时时间（毫秒） */
  httpTimeout?: number
  /** 是否启用 HTTP HMAC 签名 */
  httpSignEnabled?: boolean
  /** HTTP HMAC 签名密钥 */
  httpSignSecret?: string
  /** MQTT Broker 地址 */
  mqttBroker?: string
  /** MQTT 用户名 */
  mqttUsername?: string
  /** MQTT 密码 */
  mqttPassword?: string
  /** MQTT 客户端 ID */
  mqttClientId?: string
  /** MQTT 目标 Topic */
  mqttTopic?: string
  /** MQTT QoS 等级：0 / 1 / 2 */
  mqttQos?: number
  /** MQTT 保留消息 */
  mqttRetain?: boolean
  /** MQTT 心跳间隔（秒） */
  mqttKeepAlive?: number
  /** MQTT 清除会话 */
  mqttCleanSession?: boolean
  /** MQTT 扩展配置 */
  mqttOptions?: KeyValue<string, string>[]
  /** 创建时间（BaseEntity） */
  createTime: string
  /** 更新时间（BaseEntity） */
  updateTime: string
}

/**
 * 推送日志。
 * 对应后端 `com.github.dingdaoyi.entity.PushLog`（继承 `core.base.BaseEntity`）。
 */
export interface PushLog {
  id: number
  pushConfigId: number
  pushConfigName?: string
  eventType?: string
  success: boolean
  statusCode?: number
  message?: string
  responseBody?: string
  deviceKey?: string
  durationMs?: number
  /** 创建时间（BaseEntity） */
  createTime: string
  /** 更新时间（BaseEntity） */
  updateTime: string
}

/**
 * 规则链。
 * 对应后端 `com.github.dingdaoyi.entity.RuleChain`（继承 `core.base.BaseEntity`）。
 */
export interface RuleChain {
  id: number
  /** 规则链名称 */
  name: string
  /** 描述 */
  description?: string
  /** 是否为根规则链 */
  isRoot?: boolean
  /** 是否启用 */
  isEnabled?: boolean
  /** 数据源类型 */
  sourceType?: RuleSourceType
  /** 数据源 ID */
  sourceId?: number
  /** 节点和连接配置 */
  configuration?: RuleChainConfiguration
  /** 创建时间（BaseEntity） */
  createTime: string
  /** 更新时间（BaseEntity） */
  updateTime: string
}

/**
 * 规则链执行日志。
 * 对应后端 `com.github.dingdaoyi.entity.RuleExecutionLog`。
 */
export interface RuleExecutionLog {
  id: number
  /** 规则链 ID */
  ruleChainId: number
  /** 设备 Key */
  deviceKey?: string
  /** 设备 ID */
  deviceId?: number
  /** 设备名称 */
  deviceName?: string
  /** 消息类型 */
  messageType?: string
  /** 事件时间 */
  eventTime?: string
  /** 是否成功 */
  success?: boolean
  /** 耗时（毫秒） */
  durationMs?: number
  /** 轨迹数 */
  traceCount?: number
  /** 执行轨迹 */
  traces?: Array<Record<string, unknown>>
  /** 输入快照 */
  inputSnapshot?: Record<string, unknown>
  /** 创建时间 */
  createTime?: string
}

/**
 * 服务关联属性。
 * 对应后端 `com.github.dingdaoyi.entity.ServiceProperty`。
 */
export interface ServiceProperty {
  /** 服务 ID */
  serviceId: number
  /** 属性 ID */
  propertyId: number
  /** 1 出参数 / 2 入参 */
  paramType: number
}

/**
 * 短信配置。
 * 对应后端 `com.github.dingdaoyi.entity.SmsConfig`（继承 `core.base.BaseEntity`）。
 */
export interface SmsConfig {
  /** 主键 ID */
  id: number
  /** 配置名称 */
  name: string
  /** 短信供应商 */
  supplier: SmsSupplier
  /** 访问密钥 */
  accessKey: string
  /** 密钥 */
  secretKey: string
  /** 短信签名 */
  signName?: string
  /** 模板 ID */
  templateId?: string
  /** 接入点 */
  endpoint?: string
  /** 区域 */
  region?: string
  /** 其他配置 JSON */
  configJson?: Record<string, string>
  /** 是否默认配置 */
  isDefault?: boolean
  /** 状态：1 启用 2 禁用 */
  status?: number
  /** 是否启用（派生自后端 `isEnabled()`） */
  enabled?: boolean
  /** 创建时间（BaseEntity） */
  createTime: string
  /** 更新时间（BaseEntity） */
  updateTime: string
}

/**
 * 短信模板。
 * 对应后端 `com.github.dingdaoyi.entity.SmsTemplate`（继承 `core.base.BaseEntity`）。
 */
export interface SmsTemplate {
  /** 主键 ID */
  id: number
  /** 配置 ID */
  configId: number
  /** 模板类型 */
  templateType: SmsTemplateType
  /** 模板 ID */
  templateId: string
  /** 模板名称 */
  templateName: string
  /** 模板内容 */
  templateContent?: string
  /** 状态：1 启用 2 禁用 */
  status?: number
  /** 创建时间（BaseEntity） */
  createTime: string
  /** 更新时间（BaseEntity） */
  updateTime: string
}

/**
 * 用户。
 * 对应后端 `com.github.dingdaoyi.entity.User`。
 *
 * 注意：实体含 password 字段，若后端登录接口直接返回该实体，密码会外泄。
 * 详见交付报告。
 */
export interface User {
  id: number
  /** 登录名 */
  username: string
  /** 密码（后端实体字段，存在外泄风险） */
  password?: string
  /** 是否启用 */
  enabled?: boolean
  /** 账号是否未过期 */
  accountNonExpired?: boolean
  /** 账号是否未锁定 */
  accountNonLocked?: boolean
  /** 凭证是否未过期 */
  credentialsNonExpired?: boolean
  /** 是否需要强制修改密码 */
  forceChangePwd?: boolean
  /** 是否已锁定（派生自后端 `isLocked()`：accountNonLocked 为 false 时为 true） */
  locked?: boolean
}

/**
 * Webhook 数据接入配置。
 * 对应后端 `com.github.dingdaoyi.entity.WebhookIngress`（继承 `core.base.BaseEntity`）。
 */
export interface WebhookIngress {
  id: number
  /** 配置名称 */
  name: string
  /** 接入 Token（URL 路径用） */
  token: string
  /** HMAC 签名密钥 */
  secret?: string
  /** 关联设备 ID */
  deviceId?: number
  /** 是否启用 */
  enabled?: boolean
  /** 描述 */
  description?: string
  /** 创建时间（BaseEntity） */
  createTime: string
  /** 更新时间（BaseEntity） */
  updateTime: string
}

// ============================================================================
// 设备指令 / 规则链配置（嵌套结构）
// ============================================================================

/**
 * 设备指令。
 * 对应后端 `com.github.dingdaoyi.entity.DeviceCommand`（继承 `core.base.BaseEntity`）。
 */
export interface DeviceCommand {
  id: number
  /** 标识符 */
  identifier?: string
  /** 产品 Key */
  productKey?: string
  /** 协议 Key */
  protoKey?: string
  /** 设备编号 */
  deviceKey?: string
  /** 请求参数 */
  inputParams?: Record<string, unknown>
  /** 指令结果 */
  resultData?: Record<string, unknown>
  /** 指令状态 */
  status?: CommandStatus
  /** 创建时间（BaseEntity） */
  createTime: string
  /** 更新时间（BaseEntity） */
  updateTime: string
}

/**
 * 规则链配置（节点 + 连接）。
 * 对应后端 `com.github.dingdaoyi.entity.RuleChain.RuleChainConfiguration`。
 */
export interface RuleChainConfiguration {
  /** 节点列表 */
  nodes?: RuleNode[]
  /** 连接列表 */
  connections?: RuleConnection[]
}

/**
 * 规则链节点。
 * 对应后端 `com.github.dingdaoyi.entity.RuleChain.RuleNode`。
 */
export interface RuleNode {
  /** 节点 ID */
  id: string
  /** 节点类型（对应 RuleNodeType） */
  type: string
  /** 节点名称 */
  name?: string
  /** X 坐标 */
  x?: number
  /** Y 坐标 */
  y?: number
  /** 节点配置 */
  config?: NodeConfig
}

/**
 * 规则链节点连接。
 * 对应后端 `com.github.dingdaoyi.entity.RuleChain.RuleConnection`。
 */
export interface RuleConnection {
  /** 源节点 ID */
  source: string
  /** 目标节点 ID */
  target: string
  /** 连接类型：Success / Failure / True / False */
  type?: string
}

/**
 * 节点配置基类。
 *
 * 对应后端 `com.github.dingdaoyi.rule.config.NodeConfig`（抽象类）。
 * Jackson 通过 `@JsonTypeInfo(property = "nodeType")` 做多态反序列化，
 * 所以每个子类都带一个 `nodeType` 判别字段。
 */
export type NodeConfig =
  | InputPropertyConfig
  | InputEventConfig
  | InputOnlineConfig
  | InputScheduleConfig
  | FilterPropertyConfig
  | FilterEventTypeConfig
  | FilterScriptConfig
  | DeviceGroupFilterConfig
  | AlarmCreateConfig
  | AlarmClearConfig
  | OutputMessageConfig
  | OutputHttpConfig
  | OutputMqttConfig
  | OutputCommandConfig
  | SubFlowConfig

/** 对应后端 `com.github.dingdaoyi.rule.config.InputPropertyConfig` */
export interface InputPropertyConfig {
  nodeType: 'INPUT_PROPERTY'
  /** 监听的属性标识符列表 */
  identifiers?: string[]
}

/** 对应后端 `com.github.dingdaoyi.rule.config.InputEventConfig` */
export interface InputEventConfig {
  nodeType: 'INPUT_EVENT'
  /** 监听的事件标识符列表 */
  identifiers?: string[]
}

/** 对应后端 `com.github.dingdaoyi.rule.config.InputOnlineConfig` */
export interface InputOnlineConfig {
  nodeType: 'INPUT_ONLINE'
  /** online / offline / all */
  onlineStatus?: string
}

/** 对应后端 `com.github.dingdaoyi.rule.config.InputScheduleConfig` */
export interface InputScheduleConfig {
  nodeType: 'INPUT_SCHEDULE'
  /** cron 表达式 */
  cron?: string
  /** 限定设备 Key */
  deviceKey?: string
  /** 时区 */
  timezone?: string
}

/** 对应后端 `com.github.dingdaoyi.rule.config.FilterPropertyConfig` */
export interface FilterPropertyConfig {
  nodeType: 'FILTER_PROPERTY'
  /** 属性标识符 */
  identifier?: string
  /** 比较运算符 */
  operator?: string
  /** 比较值 */
  value?: unknown
}

/** 对应后端 `com.github.dingdaoyi.rule.config.FilterEventTypeConfig` */
export interface FilterEventTypeConfig {
  nodeType: 'FILTER_EVENT_TYPE'
  /** 事件标识符 */
  identifier?: string
  /** 事件参数标识符 */
  paramIdentifier?: string
  /** 比较运算符 */
  operator?: string
  /** 比较值 */
  value?: string
}

/** 对应后端 `com.github.dingdaoyi.rule.config.FilterScriptConfig` */
export interface FilterScriptConfig {
  nodeType: 'FILTER_SCRIPT'
  /** 脚本语言，默认 javascript */
  language?: string
  /** 脚本内容 */
  script?: string
}

/** 对应后端 `com.github.dingdaoyi.rule.config.DeviceGroupFilterConfig` */
export interface DeviceGroupFilterConfig {
  nodeType: 'FILTER_DEVICE_GROUP'
  /** 设备分组 ID */
  groupId?: number
}

/** 对应后端 `com.github.dingdaoyi.rule.config.AlarmCreateConfig` */
export interface AlarmCreateConfig {
  nodeType: 'ALARM_CREATE'
  /** 告警类型 */
  alarmType?: string
  /** 告警名称 */
  alarmName?: string
  /** 严重程度，默认 WARNING */
  severity?: string
  /** 告警消息 */
  message?: string
}

/** 对应后端 `com.github.dingdaoyi.rule.config.AlarmClearConfig` */
export interface AlarmClearConfig {
  nodeType: 'ALARM_CLEAR'
  /** 告警类型 */
  alarmType?: string
}

/** 对应后端 `com.github.dingdaoyi.rule.config.OutputMessageConfig` */
export interface OutputMessageConfig {
  nodeType: 'OUTPUT_MESSAGE'
  /** 消息接收者 ID */
  messageReceiveId?: number
  /** 标题 */
  title?: string
  /** 内容 */
  content?: string
}

/** 对应后端 `com.github.dingdaoyi.rule.config.OutputHttpConfig` */
export interface OutputHttpConfig {
  nodeType: 'OUTPUT_HTTP'
  /** 引用的推送配置 ID */
  pushConfigId?: number
  /** 自定义请求体 */
  customBody?: string
}

/** 对应后端 `com.github.dingdaoyi.rule.config.OutputMqttConfig` */
export interface OutputMqttConfig {
  nodeType: 'OUTPUT_MQTT'
  /** 引用的推送配置 ID */
  pushConfigId?: number
  /** 自定义载荷 */
  customPayload?: string
}

/** 对应后端 `com.github.dingdaoyi.rule.config.OutputCommandConfig` */
export interface OutputCommandConfig {
  nodeType: 'OUTPUT_COMMAND'
  /** 目标模式：self / group / all */
  targetMode?: string
  /** 目标设备 ID */
  targetDeviceId?: number
  /** 指令类型：service */
  commandType?: string
  /** 指令标识符 */
  identifier?: string
  /** 指令参数 */
  params?: Record<string, unknown>
}

/** 对应后端 `com.github.dingdaoyi.rule.config.SubFlowConfig` */
export interface SubFlowConfig {
  nodeType: 'SUB_FLOW'
  /** 目标规则链 ID */
  targetRuleChainId?: number
  /** 是否合并执行轨迹 */
  mergeTraces?: boolean
}

// ============================================================================
// 分页 / 详情 VO
// ============================================================================

/**
 * 告警分页项。
 * 对应后端 `com.github.dingdaoyi.model.vo.AlarmPageVo`。
 */
export interface AlarmPage {
  id: number
  /** 告警类型 */
  alarmType: string
  /** 告警名称 */
  alarmName?: string
  /** 严重程度 */
  severity?: AlarmSeverity
  /** 状态 */
  status?: AlarmStatus
  /** 告警消息 */
  message?: string
  /** 设备 ID */
  deviceId?: number
  /** 设备 Key */
  deviceKey?: string
  /** 设备名称 */
  deviceName?: string
  /** 告警详情 */
  details?: Record<string, unknown>
  /** 告警开始时间 */
  startTs?: string
  /** 告警结束时间 */
  endTs?: string
  /** 告警清除时间 */
  clearTs?: string
  /** 创建时间（注意：字段名是 createdTime，不是 createTime） */
  createdTime?: string
}

/**
 * 设备分页项。
 * 对应后端 `com.github.dingdaoyi.model.vo.DevicePageVo`（继承 `entity/Device.java`，已平铺）。
 */
export interface DevicePage {
  id: number
  /** 产品 ID */
  productId: number
  /** 设备名称 */
  deviceName: string
  /** 设备 Key */
  deviceKey: string
  /** 设备密钥 */
  deviceSecret: string
  /** 在线状态 */
  online?: boolean
  /** 激活状态 */
  activeStatus?: boolean
  /** 第三方设备 ID */
  thirdDeviceId?: string
  /** 父设备 ID（网关） */
  parentId?: number
  /** 创建时间（BaseEntity） */
  createTime?: string
  /** 更新时间（BaseEntity） */
  updateTime?: string
  /** 产品类型名称 */
  productTypeName?: string
  /** 产品类型 ID */
  productTypeId?: number
  /** 产品型号 */
  productModel?: string
  /** 厂家 */
  manufacturer?: string
}

/**
 * 设备 DTO。
 * 对应后端 `com.github.dingdaoyi.model.DTO.DeviceDTO`（继承 `entity/Device.java`，已平铺）。
 *
 * 命名说明：`DeviceDTO` 按约定要去掉 DTO 后缀，但 `Device` 已被
 * `entity/Device.java` 占用，故保留 DTO 后缀以保持可追溯。
 */
export interface DeviceDTO {
  id: number
  /** 产品 ID */
  productId: number
  /** 设备名称 */
  deviceName: string
  /** 设备 Key */
  deviceKey: string
  /** 设备密钥 */
  deviceSecret: string
  /** 在线状态 */
  online?: boolean
  /** 激活状态 */
  activeStatus?: boolean
  /** 第三方设备 ID */
  thirdDeviceId?: string
  /** 父设备 ID（网关） */
  parentId?: number
  /** 创建时间（BaseEntity） */
  createTime?: string
  /** 更新时间（BaseEntity） */
  updateTime?: string
  /** 协议 Key */
  protoKey?: string
  /** 产品 Key */
  productKey?: string
}

/**
 * 产品分页项。
 * 对应后端 `com.github.dingdaoyi.model.vo.ProductPageVo`（继承 `entity/Product.java`，已平铺）。
 */
export interface ProductPage {
  id: number
  /** 产品型号 */
  model: string
  /** 厂家 */
  manufacturer?: string
  /** 描述 */
  remark?: string
  /** 协议 ID */
  protocolId?: number
  /** 产品类型 ID */
  productTypeId?: number
  /** 产品接入 Key */
  productKey?: string
  /** 产品图标 */
  icon?: string
  /** 产品类型名称 */
  productTypeName?: string
}

/**
 * 推送配置分页项。
 * 对应后端 `com.github.dingdaoyi.model.vo.PushConfigPageVo`。
 */
export interface PushConfigPage {
  id: number
  /** 配置名称 */
  name: string
  /** 配置类型 */
  type: PushConfigType
  /** 描述 */
  description?: string
  /** 是否启用 */
  isEnabled?: boolean
  /** HTTP 请求 URL */
  httpUrl?: string
  /** HTTP 请求方法 */
  httpMethod?: string
  /** 超时时间（毫秒） */
  httpTimeout?: number
  /** MQTT Broker 地址 */
  mqttBroker?: string
  /** MQTT 目标 Topic */
  mqttTopic?: string
  /** MQTT QoS 等级 */
  mqttQos?: number
  /** MQTT 保留消息 */
  mqttRetain?: boolean
  /** 创建时间 */
  createTime?: string
  /** 更新时间 */
  updateTime?: string
}

/**
 * 推送配置详情。
 * 对应后端 `com.github.dingdaoyi.model.vo.PushConfigDetailVo`。
 */
export interface PushConfigDetail {
  id: number
  /** 配置名称 */
  name: string
  /** 配置类型 */
  type: PushConfigType
  /** 描述 */
  description?: string
  /** 是否启用 */
  isEnabled?: boolean
  /** HTTP 请求 URL */
  httpUrl?: string
  /** HTTP 请求方法 */
  httpMethod?: string
  /** HTTP 请求头 */
  httpHeaders?: KeyValue<string, string>[]
  /** 超时时间（毫秒） */
  httpTimeout?: number
  /** 是否启用 HTTP HMAC 签名 */
  httpSignEnabled?: boolean
  /** HTTP HMAC 签名密钥 */
  httpSignSecret?: string
  /** MQTT Broker 地址 */
  mqttBroker?: string
  /** MQTT 用户名 */
  mqttUsername?: string
  /** MQTT 密码 */
  mqttPassword?: string
  /** MQTT 客户端 ID */
  mqttClientId?: string
  /** MQTT 目标 Topic */
  mqttTopic?: string
  /** MQTT QoS 等级 */
  mqttQos?: number
  /** MQTT 保留消息 */
  mqttRetain?: boolean
  /** MQTT 心跳间隔（秒） */
  mqttKeepAlive?: number
  /** MQTT 清除会话 */
  mqttCleanSession?: boolean
  /** MQTT 扩展配置 */
  mqttOptions?: KeyValue<string, string>[]
}

/**
 * 规则链分页项。
 * 对应后端 `com.github.dingdaoyi.model.vo.RuleChainPageVo`。
 */
export interface RuleChainPage {
  id: number
  /** 规则链名称 */
  name: string
  /** 描述 */
  description?: string
  /** 是否为根规则链 */
  isRoot?: boolean
  /** 是否启用 */
  isEnabled?: boolean
  /** 数据源类型（VO 里是 String，不是枚举） */
  sourceType?: string
  /** 数据源 ID */
  sourceId?: number
  /** 数据源名称 */
  sourceName?: string
  /** 节点数量 */
  nodeCount?: number
  /** 创建时间 */
  createTime?: string
  /** 更新时间 */
  updateTime?: string
}

/**
 * 规则链详情。
 * 对应后端 `com.github.dingdaoyi.model.vo.RuleChainDetailVo`。
 */
export interface RuleChainDetail {
  id: number
  /** 规则链名称 */
  name: string
  /** 描述 */
  description?: string
  /** 是否为根规则链 */
  isRoot?: boolean
  /** 是否启用 */
  isEnabled?: boolean
  /** 数据源类型（VO 里是 String，不是枚举） */
  sourceType?: string
  /** 数据源 ID */
  sourceId?: number
  /** 数据源名称 */
  sourceName?: string
  /** 节点和连接配置 */
  configuration?: RuleChainConfiguration
  /** 创建时间 */
  createTime?: string
  /** 更新时间 */
  updateTime?: string
}

/**
 * 规则链调试结果。
 * 对应后端 `com.github.dingdaoyi.model.vo.RuleChainDebugResultVo`。
 */
export interface RuleChainDebugResult {
  /** 规则链 ID，草稿调试时可能为空 */
  ruleChainId?: number
  /** 规则链名称 */
  ruleChainName?: string
  /** 是否整体执行成功（任一节点失败则为 false） */
  success: boolean
  /** 总耗时（毫秒） */
  durationMs: number
  /** 执行节点数量 */
  executedNodeCount: number
  /** 执行轨迹 */
  traces?: ExecutionTrace[]
  /** 调试执行经过的连接路径 */
  executedConnections?: Array<Record<string, string>>
  /** 规则链结构校验结果 */
  validation?: RuleChainValidationResult
}

/**
 * 规则链草稿校验结果。
 * 对应后端 `com.github.dingdaoyi.model.vo.RuleChainValidationResultVo`。
 */
export interface RuleChainValidationResult {
  /** 是否校验通过 */
  valid: boolean
  /** 错误列表（存在错误时不建议保存 / 运行） */
  errors?: RuleChainIssue[]
  /** 告警列表（可保存但需要用户确认） */
  warnings?: RuleChainIssue[]
  /** 从输入节点可达的节点 ID 列表 */
  reachableNodeIds?: string[]
}

/**
 * 规则链校验问题。
 * 对应后端 `com.github.dingdaoyi.model.vo.RuleChainValidationResultVo.Issue`。
 */
export interface RuleChainIssue {
  /** 问题编码 */
  code: string
  /** 关联节点 ID */
  nodeId?: string
  /** 关联连接 ID */
  connectionId?: string
  /** 问题描述 */
  message: string
}

/**
 * 规则链执行轨迹。
 * 对应后端 `com.github.dingdaoyi.rule.RuleContext.ExecutionTrace`。
 */
export interface ExecutionTrace {
  nodeId?: string
  nodeName?: string
  nodeType?: string
  connectionType?: string
  /** 执行状态，如 SUCCESS */
  status?: string
  /** 执行详情 */
  detail?: string
  /** 错误信息 */
  error?: string
  /** 耗时（毫秒） */
  durationMs?: number
  /** 输入快照 */
  input?: Record<string, unknown>
  /** 输出快照 */
  output?: Record<string, unknown>
  /** 时间戳 */
  timestamp?: string
}

/**
 * 文件元数据。
 * 对应后端 `com.github.dingdaoyi.model.vo.FileMetadata`。
 *
 * 注意：`inputStream` 是服务端 `InputStream`，不会出现在 JSON 里，
 * 因此用 `unknown` 兜底。
 */
export interface FileMetadata {
  filename?: string
  contentType?: string
  contentLength?: number
  /** 服务端流对象，不会被 JSON 序列化 */
  inputStream?: unknown
  exists?: boolean
}

// ============================================================================
// 查询参数（Query）
// ============================================================================

/**
 * 告警分页查询。
 * 对应后端 `com.github.dingdaoyi.model.query.AlarmPageQuery`（继承 `model/PageQuery.java`，已平铺）。
 */
export interface AlarmPageQuery extends PageQuery {
  /** 设备 Key */
  deviceKey?: string
  /** 告警类型 */
  alarmType?: string
  /** 严重程度 */
  severity?: AlarmSeverity
  /** 状态 */
  status?: AlarmStatus
}

/**
 * 设备分页查询。
 * 对应后端 `com.github.dingdaoyi.model.query.DevicePageQuery`（继承 `model/PageQuery.java`，已平铺）。
 */
export interface DevicePageQuery extends PageQuery {
  deviceKey?: string
  productTypeId?: number
  productId?: number
  manufacturer?: string
  /** 父设备 ID，默认 -1 */
  parentId?: number
}

/**
 * 产品分页查询。
 * 对应后端 `com.github.dingdaoyi.model.query.ProductPageQuery`（继承 `model/PageQuery.java`，已平铺）。
 */
export interface ProductPageQuery extends PageQuery {
  /** 产品型号 */
  model?: string
  productTypeId?: number
  manufacturer?: string
}

/**
 * 推送配置分页查询。
 * 对应后端 `com.github.dingdaoyi.model.query.PushConfigPageQuery`（继承 `model/PageQuery.java`，已平铺）。
 */
export interface PushConfigPageQuery extends PageQuery {
  /** 配置名称 */
  name?: string
  /** 配置类型 */
  type?: PushConfigType
  /** 是否启用 */
  isEnabled?: boolean
}

/**
 * 邮箱配置分页查询。
 * 对应后端 `com.github.dingdaoyi.model.query.EmailConfigPageQuery`（继承 `model/PageQuery.java`，已平铺）。
 */
export interface EmailConfigPageQuery extends PageQuery {
  /** 配置名称 */
  name?: string
  /** 状态 */
  status?: number
}

/**
 * 消息接收者分页查询。
 * 对应后端 `com.github.dingdaoyi.model.query.MessageRecivePageQuery`（继承 `model/PageQuery.java`，已平铺）。
 */
export interface MessageRecivePageQuery extends PageQuery {
  /** 接收对象 */
  receiver?: string
  /** 通知类型 */
  notifyType?: NotifyType
}

/**
 * 规则链分页查询。
 * 对应后端 `com.github.dingdaoyi.model.query.RuleChainPageQuery`（继承 `model/PageQuery.java`，已平铺）。
 */
export interface RuleChainPageQuery extends PageQuery {
  /** 规则链名称 */
  name?: string
  /** 数据源类型 */
  sourceType?: RuleSourceType
  /** 是否启用 */
  isEnabled?: boolean
}

/**
 * 规则分页查询（目前只有分页基类字段）。
 * 对应后端 `com.github.dingdaoyi.model.query.RulePageQuery`（继承 `model/PageQuery.java`，已平铺）。
 */
export interface RulePageQuery {
  /** 当前页数。后端默认 0 */
  page: number
  /** 每页数量。后端默认 20 */
  size: number
  /** 基础名称 */
  name?: string
  /** 排序字段 */
  sortFields?: string[]
  /** 排序方式 */
  sortDirection?: 'ASC' | 'DESC'
}

/**
 * 时间范围查询基类。
 * 对应后端 `com.github.dingdaoyi.model.query.TimeQuery`。
 */
export interface TimeQuery {
  /** 开始时间 */
  beginTime?: string
  /** 结束时间 */
  endTime?: string
}

/**
 * 设备数据查询。
 * 对应后端 `com.github.dingdaoyi.model.query.DeviceDataQuery`（继承 `model/query/TimeQuery.java`，已平铺）。
 */
export interface DeviceDataQuery extends TimeQuery {
  /** 设备 Key */
  deviceKey?: string
  /** 属性标识符 */
  identifier?: string
  /** 当前页数，默认 1 */
  page?: number
  /** 每页数量，默认 20 */
  size?: number
}

/**
 * 遥测聚合查询。
 * 对应后端 `com.github.dingdaoyi.model.query.TelemetryAggQuery`（继承 `model/query/TimeQuery.java`，已平铺）。
 */
export interface TelemetryAggQuery extends TimeQuery {
  /** 设备编号 */
  deviceKey: string
  /** 属性标识符 */
  identifier: string
  /** 聚合间隔 */
  interval: string
  /** 聚合函数，默认 avg */
  function?: string
}

/**
 * 登录请求。
 * 对应后端 `com.github.dingdaoyi.model.query.LoginQuery`。
 */
export interface LoginQuery {
  /** 账号 */
  username: string
  /** 密码 */
  password: string
}

/**
 * 修改密码请求。
 * 对应后端 `com.github.dingdaoyi.model.query.ChangePasswordQuery`。
 */
export interface ChangePasswordQuery {
  /** 原密码 */
  oldPassword: string
  /** 新密码 */
  newPassword: string
}

/**
 * 新增设备请求。
 * 对应后端 `com.github.dingdaoyi.model.query.DeviceAddQuery`。
 */
export interface DeviceAddQuery {
  /** 产品 ID */
  productId: number
  /** 设备名称 */
  deviceName: string
  /** 设备号 */
  deviceKey: string
}

/**
 * 修改设备请求。
 * 对应后端 `com.github.dingdaoyi.model.query.DeviceUpdateQuery`。
 */
export interface DeviceUpdateQuery {
  /** 设备 ID */
  id: number
  /** 设备名称 */
  deviceName: string
}

/**
 * 新增产品请求。
 * 对应后端 `com.github.dingdaoyi.model.query.ProductAddQuery`。
 */
export interface ProductAddQuery {
  /** 产品型号 */
  model: string
  /** 厂家 */
  manufacturer: string
  /** 描述 */
  remark?: string
  /** 协议 ID */
  protocolId?: number
  /** 产品类型 ID */
  productTypeId: number
  /** 产品图标 */
  icon?: string
}

/**
 * 修改产品请求。
 * 对应后端 `com.github.dingdaoyi.model.query.ProductUpdateQuery`。
 */
export interface ProductUpdateQuery {
  /** 产品 ID */
  id?: number
  /** 产品型号 */
  model?: string
  /** 厂家 */
  manufacturer?: string
  /** 描述 */
  remark?: string
  /** 产品图标 */
  icon?: string
}

/**
 * 新增产品类型请求。
 * 对应后端 `com.github.dingdaoyi.model.query.ProductTypeAddQuery`。
 */
export interface ProductTypeAddQuery {
  /** 产品类型名称 */
  name: string
  /** 父级类型 ID */
  parentId?: number
  /** 图标路径 */
  iconUrl?: string
  /** 描述 */
  mark?: string
  /** 类型 code */
  partTypeCode?: string
}

/**
 * 新增规则链请求。
 * 对应后端 `com.github.dingdaoyi.model.query.RuleChainAddQuery`。
 */
export interface RuleChainAddQuery {
  /** 规则链名称 */
  name: string
  /** 描述 */
  description?: string
  /** 是否为根规则链 */
  isRoot?: boolean
  /** 是否启用 */
  isEnabled?: boolean
  /** 数据源类型 */
  sourceType?: RuleSourceType
  /** 数据源 ID */
  sourceId?: number
  /** 节点和连接配置 */
  configuration?: RuleChainConfiguration
}

/**
 * 修改规则链请求。
 * 对应后端 `com.github.dingdaoyi.model.query.RuleChainUpdateQuery`。
 */
export interface RuleChainUpdateQuery {
  /** 规则链 ID */
  id: number
  /** 规则链名称 */
  name?: string
  /** 描述 */
  description?: string
  /** 是否为根规则链 */
  isRoot?: boolean
  /** 是否启用 */
  isEnabled?: boolean
  /** 数据源类型 */
  sourceType?: RuleSourceType
  /** 数据源 ID */
  sourceId?: number
  /** 节点和连接配置 */
  configuration?: RuleChainConfiguration
}

/**
 * 新增推送配置请求。
 * 对应后端 `com.github.dingdaoyi.model.query.PushConfigAddQuery`。
 */
export interface PushConfigAddQuery {
  /** 配置名称 */
  name: string
  /** 配置类型 */
  type: PushConfigType
  /** 描述 */
  description?: string
  /** 是否启用 */
  isEnabled?: boolean
  httpUrl?: string
  httpMethod?: string
  httpHeaders?: KeyValue<string, string>[]
  httpTimeout?: number
  httpSignEnabled?: boolean
  httpSignSecret?: string
  mqttBroker?: string
  mqttUsername?: string
  mqttPassword?: string
  mqttClientId?: string
  mqttTopic?: string
  mqttQos?: number
  mqttRetain?: boolean
  mqttKeepAlive?: number
  mqttCleanSession?: boolean
  mqttOptions?: KeyValue<string, string>[]
}

/**
 * 修改推送配置请求。
 * 对应后端 `com.github.dingdaoyi.model.query.PushConfigUpdateQuery`。
 */
export interface PushConfigUpdateQuery extends PushConfigAddQuery {
  /** 配置 ID */
  id: number
}

/**
 * 新增邮箱配置请求。
 * 对应后端 `com.github.dingdaoyi.model.query.EmailConfigAddQuery`。
 */
export interface EmailConfigAddQuery {
  /** 配置名称 */
  name: string
  /** SMTP 服务器地址 */
  host: string
  /** SMTP 端口 */
  port: number
  /** 发件人邮箱 */
  username: string
  /** 邮箱密码 / 授权码 */
  password: string
  /** 协议 smtp */
  protocol?: string
  /** 编码 */
  encoding?: string
  /** 是否启用 SSL */
  sslEnabled?: boolean
  /** 状态 */
  status?: number
}

/**
 * 修改邮箱配置请求。
 * 对应后端 `com.github.dingdaoyi.model.query.EmailConfigUpdateQuery`。
 *
 * 命名说明：Java 侧 `EmailConfigUpdateQuery` 与 `EmailConfigAddQuery` 是两个独立类
 * （并非继承关系），此处保持字段平铺，不做 extends，以免把必填 password 变成可选。
 */
export interface EmailConfigUpdateQuery {
  /** 配置 ID */
  id: number
  /** 配置名称 */
  name: string
  /** SMTP 服务器地址 */
  host: string
  /** SMTP 端口 */
  port: number
  /** 发件人邮箱 */
  username: string
  /** 邮箱密码 / 授权码（修改时可为空，表示不改动密码） */
  password?: string
  /** 协议 smtp */
  protocol?: string
  /** 编码 */
  encoding?: string
  /** 是否启用 SSL */
  sslEnabled?: boolean
}

/**
 * 新增消息接收者请求。
 * 对应后端 `com.github.dingdaoyi.model.query.MessageReceiveAddQuery`。
 */
export interface MessageReceiveAddQuery {
  /** 接收者名称 */
  name?: string
  /** 接收对象 */
  receiver?: string
  /** 通知类型 */
  notifyType: NotifyType
  /** 备注 */
  remark?: string
}

/**
 * 修改消息接收者请求。
 * 对应后端 `com.github.dingdaoyi.model.query.MessageReceiveUpdateQuery`。
 */
export interface MessageReceiveUpdateQuery extends MessageReceiveAddQuery {
  /** 修改 ID */
  id: number
}

/**
 * 修改物模型属性请求。
 * 对应后端 `com.github.dingdaoyi.model.query.ModelPropertyUpdateQuery`。
 */
export interface ModelPropertyUpdateQuery {
  id?: number
  dataType?: DataTypeEnum
  remark?: string
  accessMode?: PropertyAccessMode
  iconId?: number
  bool0?: string
  bool1?: string
  length?: number
  paramType?: ParamType
  unit?: string
  unitName?: string
  max?: number
  min?: number
  step?: number
  enums?: KeyValue<number, string>[]
  children?: StandardPropertyAddQuery[]
}

/**
 * 新增产品自定义属性请求。
 * 对应后端 `com.github.dingdaoyi.model.query.ProductPropertyAddQuery`。
 */
export interface ProductPropertyAddQuery {
  /** 数据类型 */
  dataType: DataTypeEnum
  remark?: string
  identifier?: string
  name?: string
  accessMode?: PropertyAccessMode
  productTypeId?: number
  iconId?: number
  bool0?: string
  bool1?: string
  length?: number
  paramType?: ParamType
  unit?: string
  unitName?: string
  max?: number
  min?: number
  step?: number
  enums?: KeyValue<number, string>[]
  /** 功能状态 */
  funcStatus?: number
  /** 产品 ID */
  productId: number
  /** 子属性 */
  children?: ProductPropertyAddQuery[]
}

/**
 * 新增标准属性请求。
 * 对应后端 `com.github.dingdaoyi.model.query.StandardPropertyAddQuery`。
 */
export interface StandardPropertyAddQuery {
  /** 数据类型 */
  dataType: DataTypeEnum
  remark?: string
  identifier: string
  name?: string
  accessMode?: PropertyAccessMode
  /** 产品类型 ID */
  productTypeId: number
  iconId?: number
  bool0?: string
  bool1?: string
  length?: number
  paramType?: ParamType
  unit?: string
  unitName?: string
  max?: number
  min?: number
  step?: number
  enums?: KeyValue<number, string>[]
  /** 功能状态 */
  funcStatus?: number
  /** 子属性 */
  children?: StandardPropertyAddQuery[]
}

/**
 * 新增服务请求。
 * 对应后端 `com.github.dingdaoyi.model.query.ServiceAddQuery`。
 */
export interface ServiceAddQuery {
  /** 服务是否为异步 */
  async?: boolean
  /** 事件类型 */
  eventType?: EventTypeEnum
  /** 服务类型 */
  serviceType: ServiceTypeEnum
  /** 标识符 */
  identifier: string
  /** 入参属性 ID 列表 */
  inputParamIds?: number[]
  /** 名称 */
  name: string
  /** 备注 */
  remark?: string
  /** 出参属性 ID 列表 */
  outputParamIds?: number[]
  /** 产品类型 ID */
  productTypeId?: number
  /** 图标 ID */
  iconId?: number
  /** 是否必选 */
  required?: boolean
  /** 产品 ID */
  productId?: number
  /** 是否自定义 */
  custom?: boolean
}

/**
 * 修改服务请求。
 * 对应后端 `com.github.dingdaoyi.model.query.ServiceUpdateQuery`（继承 `ServiceAddQuery.java`，已平铺）。
 */
export interface ServiceUpdateQuery extends ServiceAddQuery {
  /** 修改 ID */
  id: number
}

/**
 * 新增短信配置请求。
 * 对应后端 `com.github.dingdaoyi.model.query.SmsConfigAddQuery`。
 */
export interface SmsConfigAddQuery {
  /** 配置名称 */
  name: string
  /** 短信供应商 */
  supplier: SmsSupplier
  /** 访问密钥 */
  accessKey: string
  /** 密钥 */
  secretKey: string
  /** 短信签名 */
  signName?: string
  /** 模板 ID */
  templateId?: string
  /** 接入点 */
  endpoint?: string
  /** 区域 */
  region?: string
  /** 其他配置 JSON */
  configJson?: Record<string, string>
}

/**
 * 修改短信配置请求。
 * 对应后端 `com.github.dingdaoyi.model.query.SmsConfigUpdateQuery`（继承 `SmsConfigAddQuery.java`，已平铺）。
 */
export interface SmsConfigUpdateQuery extends SmsConfigAddQuery {
  /** 配置 ID */
  id: number
}

/**
 * 发送短信请求。
 * 对应后端 `com.github.dingdaoyi.model.query.SmsSendQuery`。
 */
export interface SmsSendQuery {
  /** 手机号 */
  phone: string
  /** 短信内容 */
  message: string
}

/**
 * 按模板发送短信请求。
 * 对应后端 `com.github.dingdaoyi.model.query.SmsSendWithTemplateQuery`。
 */
export interface SmsSendWithTemplateQuery {
  /** 手机号 */
  phone: string
  /** 模板类型 */
  templateType: SmsTemplateType
  /** 模板参数 */
  templateParams?: Record<string, unknown>
  /** 短信配置 ID */
  configId?: number
}

/**
 * 新增短信模板请求。
 * 对应后端 `com.github.dingdaoyi.model.query.SmsTemplateAddQuery`。
 */
export interface SmsTemplateAddQuery {
  /** 配置 ID */
  configId: number
  /** 模板类型 */
  templateType: SmsTemplateType
  /** 模板 ID */
  templateId: string
  /** 模板名称 */
  templateName: string
  /** 模板内容 */
  templateContent?: string
}

// ============================================================================
// controller/iot/dto 请求体
// ============================================================================

/**
 * 协议解码测试请求。
 * 对应后端 `com.github.dingdaoyi.controller.iot.dto.ProtocolDecodeTestRequest`。
 */
export interface ProtocolDecodeTestRequest {
  /** 协议定义 */
  protocol?: Protocol
  deviceKey?: string
  productKey?: string
  /** 消息类型 */
  messageType?: ProtoMessageType
  /** 原始数据 */
  data?: string
}

/**
 * 协议编码测试请求。
 * 对应后端 `com.github.dingdaoyi.controller.iot.dto.ProtocolEncodeTestRequest`。
 */
export interface ProtocolEncodeTestRequest {
  /** 协议定义 */
  protocol?: Protocol
  deviceKey?: string
  productKey?: string
  /** 指令标识符 */
  identifier?: string
  /** 指令参数 */
  params?: Record<string, unknown>
}

/**
 * 推送测试请求。
 * 对应后端 `com.github.dingdaoyi.controller.iot.dto.PushTestRequest`。
 */
export interface PushTestRequest {
  /** 事件类型 */
  eventType?: string
  /** 推送载荷 */
  payload?: unknown
}

/**
 * 规则链调试请求。
 * 对应后端 `com.github.dingdaoyi.controller.iot.dto.RuleChainDebugRequest`。
 */
export interface RuleChainDebugRequest {
  /** 待调试的规则链 */
  ruleChain?: RuleChain
  deviceKey?: string
  deviceId?: number
  deviceName?: string
  /** 消息类型 */
  messageType: RuleMessageType
  /** 属性数据 */
  properties?: Record<string, unknown>
  /** 事件标识符 */
  eventIdentifier?: string
  /** 事件参数 */
  eventParams?: Record<string, unknown>
  /** 附加数据 */
  enrichedData?: Record<string, unknown>
}
