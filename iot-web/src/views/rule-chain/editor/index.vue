<script setup lang="ts">
import type {
  Device,
  ExecutionTrace,
  MessageReceive,
  Product,
  ProductType,
  PushConfig,
  RuleChain,
  RuleChainAddQuery,
  RuleChainDebugRequest,
  RuleChainDebugResult,
  RuleChainDetail,
  RuleChainIssue,
  RuleChainUpdateQuery,
  RuleChainValidationResult,
  RuleConnection,
  RuleMessageType,
  RuleNode,
  RuleSourceType,
  TslEvent,
  TslModel,
  TslProperty,
} from '@/types/api'
import { Close } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import {
  deviceListApi,
  loadTslData,
  messageReceiveListApi,
  productListApi,
  productTypeListApi,
  pushConfigListApi,
  ruleChainAddApi,
  ruleChainDebugApi,
  ruleChainDetailApi,
  ruleChainNodeTypesApi,
  ruleChainUpdateApi,
  ruleChainValidateApi,
  type RuleNodeTypeInfo,
} from '@/api/index'
import NodeConfigPanel from './NodeConfigPanel.vue'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()

// ============================================================================
// 类型定义
// ============================================================================

/**
 * 节点分类。
 *
 * 后端 `RuleNodeCategory` 只有 INPUT / FILTER / ALARM / OUTPUT / FLOW，
 * 前端对无法识别的节点类型额外返回 UNKNOWN。
 */
type NodeCategory = 'INPUT' | 'FILTER' | 'ALARM' | 'OUTPUT' | 'FLOW' | 'UNKNOWN'

/** 拖拽类型：新建 / 移动节点 / 连线 / 平移画布 */
type DragType = 'new' | 'move' | 'connection' | 'pan'

/**
 * 节点配置（前端宽松形状）。
 *
 * 后端 `NodeConfig` 是 15 个子类的联合类型（靠 `nodeType` 判别），
 * 但前端允许自定义节点类型 / 额外字段，且同一个面板会读写所有子类的字段，
 * 因此这里按「前端实际读写的字段」建模，并保留索引签名兜住未知字段。
 */
interface EditorNodeConfig {
  /** 节点类型判别字段（Jackson 多态） */
  nodeType?: string
  /** 监听的属性 / 事件标识符列表 */
  identifiers?: string[]
  /** 属性标识符 / 事件标识符 / 指令标识符 */
  identifier?: string
  /** 比较运算符 */
  operator?: string
  /** 比较值 */
  value?: unknown
  /** 事件参数标识符 */
  paramIdentifier?: string
  /** 上线状态：online / offline / all */
  onlineStatus?: string
  /** cron 表达式 */
  cron?: string
  /** 脚本内容 */
  script?: string
  /** 脚本语言 */
  language?: string
  /** 告警类型 */
  alarmType?: string
  /** 告警名称 */
  alarmName?: string
  /** 告警严重程度 */
  severity?: string
  /** 告警消息 */
  message?: string
  /** 清除方式：active / all */
  clearType?: string
  /** 消息接收者 ID */
  messageReceiveId?: number
  /** 消息标题 */
  title?: string
  /** 消息内容 */
  content?: string
  /** 引用的推送配置 ID */
  pushConfigId?: number
  /** 自定义请求体 */
  customBody?: string
  /** 自定义载荷 */
  customPayload?: string
  /** 目标模式：self / other */
  targetMode?: string
  /** 目标设备 ID */
  targetDeviceId?: number
  /** 目标产品 ID（级联选择辅助字段） */
  targetProductId?: number
  /** 目标产品类型 ID（级联选择辅助字段） */
  targetProductTypeId?: number
  /** 指令类型 */
  commandType?: string
  /** 指令参数（JSON 字符串） */
  params?: string
  /** 兜住后端未声明的自定义字段 */
  [key: string]: unknown
}

/**
 * 编辑器中的规则链节点。
 *
 * 基于后端 `RuleNode`，但把坐标改成必填（前端始终维护），
 * 并补上前端的 `color` 字段。
 *
 * 注意：`type` 沿用后端的 `string`（不收窄成 `RuleNodeType`），
 * 以免前端自定义节点类型报错。
 */
interface EditorNode extends Omit<RuleNode, 'config' | 'x' | 'y'> {
  /** X 坐标 */
  x: number
  /** Y 坐标 */
  y: number
  /** 节点配置 */
  config: EditorNodeConfig
  /** 节点颜色 */
  color: string
}

/** 编辑器中的连接（后端 `RuleConnection` + 兼容旧字段名） */
interface EditorConnection extends RuleConnection {
  /** 兼容旧字段名 */
  connectionType?: string
}

/** 编辑器中的规则链 */
interface EditorRuleChain {
  id: number | null
  name: string
  description: string
  sourceType: RuleSourceType
  sourceId: number | null
  /** 级联选择辅助字段（不保存到后端） */
  productTypeId: number | null
  /** 级联选择辅助字段（不保存到后端） */
  productId: number | null
  isRoot: boolean
  isEnabled: boolean
  configuration: {
    nodes: EditorNode[]
    connections: EditorConnection[]
  }
}

/** 提交给后端的草稿节点（config 允许为 null） */
interface RuleChainDraftNode extends Omit<EditorNode, 'config'> {
  config: EditorNodeConfig | null
}

/**
 * 提交给后端的规则链草稿。
 *
 * 前端草稿比后端 Query 宽松（id 可能为 null、config 允许额外字段），
 * 故在调用 API 的边界做一次显式转换（见下方 buildRuleChainDraft 的调用点）。
 */
interface RuleChainDraft extends Omit<RuleChainAddQuery, 'configuration' | 'sourceId'> {
  id: number | null
  sourceType: RuleSourceType
  sourceId: number | null
  productTypeId: number | null
  productId: number | null
  isRoot: boolean
  isEnabled: boolean
  configuration: {
    nodes: RuleChainDraftNode[]
    connections: EditorConnection[]
  }
}

/** 归一化后的规则链详情 */
interface NormalizedRuleChainDetail extends Omit<RuleChainDetail, 'configuration'> {
  configuration: EditorRuleChain['configuration']
}

/** 画布变换（缩放 + 平移） */
interface CanvasTransform {
  scale: number
  translateX: number
  translateY: number
}

/** 拖拽状态 */
interface DragState {
  isDragging: boolean
  dragNode: EditorNode | null
  dragType: DragType | null
  startX: number
  startY: number
  offsetX: number
  offsetY: number
}

/** 连线拖拽状态 */
interface ConnectionDragState {
  isDragging: boolean
  sourceNode: EditorNode | null
  sourcePort: string | null
  connectionType?: string | null
  tempLine?: unknown
}

/** 临时连线（拖拽中） */
interface TempConnection {
  sourceX: number
  sourceY: number
  targetX: number
  targetY: number
}

/** 节点创建菜单 */
interface NodeCreateMenuState {
  visible: boolean
  x: number
  y: number
  /** 画布坐标（创建节点时使用） */
  canvasX?: number
  /** 画布坐标（创建节点时使用） */
  canvasY?: number
  sourceNode: EditorNode | null
  connectionType: string
  availableTypes: RuleNodeTypeInfo[]
}

/** 连接线（画布上渲染的一条连线） */
interface ConnectionLine {
  id: string
  source: { x: number, y: number }
  target: { x: number, y: number }
  sourceNode: string
  targetNode: string
  connectionType: string
}

/** 调试表单 */
interface DebugForm {
  deviceKey: string
  deviceId: number | null
  deviceName: string
  messageType: RuleMessageType
  /** 属性数据（JSON 字符串） */
  propertiesJson: string
  eventIdentifier: string
  /** 事件参数（JSON 字符串） */
  eventParamsJson: string
  /** 附加数据（JSON 字符串） */
  enrichedDataJson: string
}

/** 调试轨迹 + 序号 */
type DebugTrace = ExecutionTrace & { index: number }

// ============================================================================
// 状态
// ============================================================================

// 规则链数据
const ruleChain = ref<EditorRuleChain>({
  id: null,
  name: '',
  description: '',
  sourceType: 'PRODUCT',
  sourceId: null,
  // 卷加级联选择辅助字段（不保存到后端)
  productTypeId: null,
  productId: null,
  isRoot: false,
  isEnabled: true,
  configuration: {
    nodes: [],
    connections: [],
  },
})

// 节点类型
const nodeTypes = ref<RuleNodeTypeInfo[]>([])

// 级联选择数据
const productTypeOptions = ref<ProductType[]>([])
const productOptions = ref<Product[]>([])
const deviceOptions = ref<Device[]>([])

// 消息接收配置选项（用于消息推送节点）
const messageReceiveOptions = ref<MessageReceive[]>([])

// 推送配置选项（用于HTTP/MQTT节点）
const pushConfigOptions = ref<PushConfig[]>([])

// 物模型{{ t('ruleChain.property') }}列表（用于{{ t('ruleChain.property') }}过滤节点）
const tslProperties = ref<TslProperty[]>([])

// 物模型{{ t('ruleChain.event') }}列表（用于{{ t('ruleChain.event') }}输入节点）
const tslEvents = ref<TslEvent[]>([])

// 选中的节点
const selectedNode = ref<EditorNode | null>(null)

// 保存加载状态
const saving = ref(false)

// 规则链调试状态
const debugDialogVisible = ref(false)
const debugRunning = ref(false)
const debugResult = ref<RuleChainDebugResult | null>(null)
const debugForm = ref<DebugForm>({
  deviceKey: 'demo-device-001',
  deviceId: null,
  deviceName: t('ruleChain.demo_device'),
  messageType: 'PROPERTY',
  propertiesJson: '{\n  "temperature": 36.5,\n  "humidity": 62\n}',
  eventIdentifier: '',
  eventParamsJson: '{}',
  enrichedDataJson: '{}',
})

// 画布引用
const canvasRef = ref<HTMLElement | null>(null)
const svgRef = ref<SVGSVGElement | null>(null)

// 画布变换状态（缩放和平移）
const canvasTransform = ref<CanvasTransform>({
  scale: 1,
  translateX: 0,
  translateY: 0,
})

// 拖拽状态
const dragState = ref<DragState>({
  isDragging: false,
  dragNode: null,
  dragType: null, // 'new' | 'move' | 'connection' | 'pan'
  startX: 0,
  startY: 0,
  offsetX: 0,
  offsetY: 0,
})

// 连线拖拽状态
const connectionDrag = ref<ConnectionDragState>({
  isDragging: false,
  sourceNode: null,
  sourcePort: null,
  tempLine: null,
})
// 临时连线（拖拽中)
const tempConnection = ref<TempConnection | null>(null)

// 节点创建菜单
const nodeCreateMenu = ref<NodeCreateMenuState>({
  visible: false,
  x: 0,
  y: 0,
  sourceNode: null,
  connectionType: '',
  availableTypes: [],
})

// 路由参数（规则链 ID，'new' 表示新建）
const routeId = computed<string>(() => {
  const raw = route.params.id
  return Array.isArray(raw) ? (raw[0] ?? '') : (raw ?? '')
})

// 是否是编辑模式
const isEdit = computed(() => !!routeId.value && routeId.value !== 'new')

// 获取选中节点的上游输入节点（用于过滤节点获取可选{{ t('ruleChain.property') }}）
const upstreamInputNode = computed<EditorNode | null>(() => {
  if (!selectedNode.value)
    return null

  // 查找连接到当前节点的上游节点
  const incomingConnections = ruleChain.value.configuration.connections.filter(
    c => c.target === selectedNode.value!.id,
  )

  if (incomingConnections.length === 0)
    return null

  // 获取第一个上游节点
  const sourceNodeId = incomingConnections[0].source
  return ruleChain.value.configuration.nodes.find(n => n.id === sourceNodeId) ?? null
})

// 判断是否是输入节点
function isInputNode(type: string) {
  const inputTypes = ['INPUT_PROPERTY', 'INPUT_EVENT', 'INPUT_ONLINE', 'INPUT_SCHEDULE']
  return inputTypes.includes(type)
}

// 判断是否是过滤节点
function isFilterNode(type: string) {
  const filterTypes = ['FILTER_PROPERTY', 'FILTER_EVENT_TYPE', 'FILTER_SCRIPT']
  return filterTypes.includes(type)
}

// 获取节点分类
function getNodeCategory(type: string): NodeCategory {
  if (type.startsWith('INPUT_'))
    return 'INPUT'
  if (type.startsWith('FILTER_'))
    return 'FILTER'
  if (type.startsWith('ALARM_'))
    return 'ALARM'
  if (type.startsWith('OUTPUT_'))
    return 'OUTPUT'
  return 'UNKNOWN'
}

// 验证连接是否有效
function isValidConnection(sourceType: string, targetType: string, _connectionType: string) {
  const sourceCategory = getNodeCategory(sourceType)
  const targetCategory = getNodeCategory(targetType)

  // INPUT 节点只能作为源，不能作为目标
  if (targetCategory === 'INPUT') {
    return false
  }

  // OUTPUT 节点是终端节点，不能有后续连接
  if (sourceCategory === 'OUTPUT') {
    return false
  }

  // 输入节点的特殊连接规则
  if (sourceCategory === 'INPUT') {
    // INPUT_PROPERTY ({{ t('ruleChain.property') }}上报) → 不能连接 FILTER_EVENT_TYPE
    if (sourceType === 'INPUT_PROPERTY' && targetType === 'FILTER_EVENT_TYPE') {
      return false
    }
    // INPUT_EVENT ({{ t('ruleChain.event') }}上报) → 不能连接 FILTER_PROPERTY
    if (sourceType === 'INPUT_EVENT' && targetType === 'FILTER_PROPERTY') {
      return false
    }
    // INPUT_ONLINE (设备上{{ t('ruleChain.offline') }}) → 不能连接任何 FILTER 节点
    if (sourceType === 'INPUT_ONLINE' && targetCategory === 'FILTER') {
      return false
    }
  }

  // FILTER 节点之后只能连接 OUTPUT 或 ALARM
  if (sourceCategory === 'FILTER') {
    if (targetCategory !== 'OUTPUT' && targetCategory !== 'ALARM') {
      return false
    }
  }

  // ALARM 节点之后只能连接 OUTPUT（自定义推送）
  if (sourceCategory === 'ALARM') {
    if (targetCategory !== 'OUTPUT') {
      return false
    }
  }

  return true
}

// 获取连接错误消息
function getConnectionErrorMessage(sourceType: string, targetType: string) {
  const sourceCategory = getNodeCategory(sourceType)
  const targetCategory = getNodeCategory(targetType)

  if (targetCategory === 'INPUT') {
    return t('ruleChain.input_nodes_cannot_be_connection_targets')
  }

  // OUTPUT 节点是终端
  if (sourceCategory === 'OUTPUT') {
    return t('ruleChain.output_nodes_terminal_nodes_cannot_continue_connecting')
  }

  // 输入节点连接限制的错误提示
  if (sourceCategory === 'INPUT') {
    if (sourceType === 'INPUT_PROPERTY' && targetType === 'FILTER_EVENT_TYPE') {
      return t('ruleChain.property_reports_cannot_connect_event_type_filters_use')
    }
    if (sourceType === 'INPUT_EVENT' && targetType === 'FILTER_PROPERTY') {
      return t('ruleChain.event_reports_cannot_connect_property_condition_filters_use')
    }
    if (sourceType === 'INPUT_ONLINE' && targetCategory === 'FILTER') {
      return t('ruleChain.device_online_offline_events_cannot_use_filter_nodes')
    }
  }

  // FILTER 节点连接限制
  if (sourceCategory === 'FILTER') {
    if (targetCategory !== 'OUTPUT' && targetCategory !== 'ALARM') {
      return t('ruleChain.filter_nodes_can_only_connect_output_alarm_nodes')
    }
  }

  // ALARM 节点连接限制
  if (sourceCategory === 'ALARM') {
    if (targetCategory !== 'OUTPUT') {
      return t('ruleChain.alarm_nodes_can_only_connect_output_nodes_custom')
    }
  }

  return t('ruleChain.this_connection_not_allowed')
}

// 节点搜索关键词
const nodeSearchKeyword = ref('')

// 节点分类（支持搜索过滤）
const nodeCategories = computed<Record<string, RuleNodeTypeInfo[]>>(() => {
  const categories: Record<string, RuleNodeTypeInfo[]> = {}
  const keyword = nodeSearchKeyword.value.toLowerCase().trim()

  nodeTypes.value.forEach((type) => {
    // 搜索过滤：匹配名称或描述
    if (keyword && !type.name.toLowerCase().includes(keyword) && !type.description.toLowerCase().includes(keyword)) {
      return
    }

    if (!categories[type.category]) {
      categories[type.category] = []
    }
    categories[type.category].push(type)
  })

  // 移除空分类
  Object.keys(categories).forEach((cat) => {
    if (categories[cat].length === 0) {
      delete categories[cat]
    }
  })

  return categories
})

// 获取连接类型（兼容 type 和 connectionType 字段名）
function getConnectionType(conn: { type?: string, connectionType?: string }): string {
  return conn.type || conn.connectionType || 'Success'
}

/**
 * 兼容后端有时把载荷再包一层 `{ data: ... }` 的情况。
 */
function normalizeApiData<T>(payload: unknown): T {
  const wrapper = payload as { data?: T } | null | undefined
  return (wrapper?.data ?? payload ?? {}) as T
}

/**
 * 从多种分页 / 列表响应形态里取出数组。
 */
function normalizeList<T = unknown>(payload: unknown): T[] {
  const wrapper = (payload ?? {}) as Record<string, unknown>
  const nested = wrapper.data as Record<string, unknown> | undefined
  const value
    = wrapper.records
      ?? wrapper.list
      ?? wrapper.rows
      ?? nested?.records
      ?? nested?.list
      ?? nested?.rows
      ?? nested
      ?? payload
  return (Array.isArray(value) ? value : []) as T[]
}

function getNodeTypeMeta(type: string | undefined): Partial<RuleNodeTypeInfo> {
  return nodeTypes.value.find(item => item.type === type) ?? {}
}

function normalizeRuleChainDetail(detail: RuleChainDetail): NormalizedRuleChainDetail {
  const configuration = detail.configuration || {}
  const nodes = normalizeList<RuleNode & { color?: string }>(configuration.nodes).map((node): EditorNode => {
    const meta = getNodeTypeMeta(node.type || node.config?.nodeType)
    const nodeType = node.type || node.config?.nodeType || meta.type || ''
    return {
      ...node,
      type: nodeType,
      name: node.name || meta.name || nodeType,
      color: node.color || meta.color || '#6366f1',
      config: (node.config || {}) as unknown as EditorNodeConfig,
      x: Number.isFinite(Number(node.x)) ? Number(node.x) : 0,
      y: Number.isFinite(Number(node.y)) ? Number(node.y) : 0,
    }
  })

  return {
    ...detail,
    configuration: {
      ...configuration,
      nodes,
      connections: normalizeList<RuleConnection>(configuration.connections).map(conn => ({
        ...conn,
        type: getConnectionType(conn),
      })),
    },
  }
}

// 计算连接线
const connectionLines = computed<ConnectionLine[]>(() => {
  return ruleChain.value.configuration.connections.map((conn): ConnectionLine | null => {
    const sourceNode = ruleChain.value.configuration.nodes.find(n => n.id === conn.source)
    const targetNode = ruleChain.value.configuration.nodes.find(n => n.id === conn.target)

    if (!sourceNode || !targetNode)
      return null

    // 获取连接类型（兼容后端的 type 字段）
    const connType = getConnectionType(conn)

    // 计算源端口位置（根据连接类型和节点类型）
    const sourceX = sourceNode.x + 180 // Node width
    let sourceY = sourceNode.y + 40 // Default center height

    // 过滤节点根据 type 调整 Y 位置（与CSS中的端口位置一致）
    if (isFilterNode(sourceNode.type)) {
      if (connType === 'True') {
        sourceY = sourceNode.y + 24 // True port position (CSS: top: 24px)
      }
      else if (connType === 'False') {
        sourceY = sourceNode.y + 52 // False port position (CSS: top: 52px)
      }
    }

    const targetX = targetNode.x
    const targetY = targetNode.y + 40

    return {
      id: `${conn.source}-${conn.target}-${connType}`,
      source: { x: sourceX, y: sourceY },
      target: { x: targetX, y: targetY },
      sourceNode: conn.source,
      targetNode: conn.target,
      connectionType: connType,
    }
  }).filter((line): line is ConnectionLine => line !== null)
})

const debugTraceMap = computed<Record<string, DebugTrace>>(() => {
  const map: Record<string, DebugTrace> = {}
  ;(debugResult.value?.traces || []).forEach((trace, index) => {
    map[trace.nodeId as string] = { ...trace, index: index + 1 }
  })
  return map
})

const debugExecutedConnectionSet = computed(() => {
  const set = new Set<string>()
  ;(debugResult.value?.executedConnections || []).forEach((conn) => {
    set.add(`${conn.source}->${conn.target}:${getConnectionType(conn)}`)
  })
  return set
})

const validationIssues = computed(() => [
  ...(debugResult.value?.validation?.errors || []),
  ...(debugResult.value?.validation?.warnings || []),
])

function isDebugConnectionExecuted(line: ConnectionLine) {
  return debugExecutedConnectionSet.value.has(`${line.sourceNode}->${line.targetNode}:${line.connectionType}`)
}

function getValidationIssueType(issue: RuleChainIssue) {
  return (debugResult.value?.validation?.errors || []).includes(issue) ? 'error' : 'warning'
}

// 加载节点类型
async function loadNodeTypes() {
  try {
    const { data } = await ruleChainNodeTypesApi()
    const entries = Object.entries(data || {})
    const result: RuleNodeTypeInfo[] = []
    for (const [, types] of entries) {
      result.push(...types)
    }
    nodeTypes.value = result
  }
  catch (e) {
    console.error(t('ruleChain.failed_load_node_types'), e)
  }
}

// 加载产品类型列表
async function loadProductTypes() {
  try {
    const { data } = await productTypeListApi()
    productTypeOptions.value = data || []
  }
  catch (e) {
    console.error(t('ruleChain.failed_load_product_types'), e)
  }
}

// 加载消息接收配置
async function loadMessageReceiveOptions() {
  try {
    const { data } = await messageReceiveListApi()
    messageReceiveOptions.value = data || []
  }
  catch (e) {
    console.error(t('ruleChain.failed_load_message_configs'), e)
  }
}

// 加载推送配置
async function loadPushConfigOptions() {
  try {
    const { data } = await pushConfigListApi()
    pushConfigOptions.value = data || []
  }
  catch (e) {
    console.error(t('ruleChain.failed_load_push_configs'), e)
  }
}

// 加载产品列表(根据产品类型)
async function loadProducts() {
  if (!ruleChain.value.productTypeId) {
    productOptions.value = []
    return
  }
  try {
    const { data } = await productListApi({ productTypeId: ruleChain.value.productTypeId })
    productOptions.value = normalizeList<Product>(data)
  }
  catch (e) {
    console.error(t('ruleChain.failed_load_products'), e)
  }
}

// 加载设备列表(根据产品)
async function loadDevices() {
  if (!ruleChain.value.productId) {
    deviceOptions.value = []
    return
  }
  try {
    const { data } = await deviceListApi({ productId: ruleChain.value.productId })
    deviceOptions.value = normalizeList<Device>(data)
  }
  catch (e) {
    console.error(t('ruleChain.failed_load_devices'), e)
  }
}

// 产品类型变更
function onProductTypeChange() {
  ruleChain.value.productId = null
  ruleChain.value.sourceId = null
  productOptions.value = []
  deviceOptions.value = []
  loadProducts()
}

// 产品变更
async function onProductChange() {
  ruleChain.value.sourceId = null
  deviceOptions.value = []
  // 如果数据源类型是产品,则sourceId就是productId
  if (ruleChain.value.sourceType === 'PRODUCT') {
    ruleChain.value.sourceId = ruleChain.value.productId
  }
  loadDevices()
  // 加载物模型{{ t('ruleChain.property') }}
  await loadTslProperties()
}

// 加载物模型{{ t('ruleChain.property') }}和{{ t('ruleChain.event') }}
async function loadTslProperties() {
  if (!ruleChain.value.productId) {
    tslProperties.value = []
    tslEvents.value = []
    return
  }
  try {
    const { data } = await loadTslData(ruleChain.value.productId)
    // 后端有可能把物模型再包一层 { data: {...} }
    const wrapper = data as unknown as { data?: TslModel }
    const tslModel = wrapper.data || data
    tslProperties.value = tslModel.properties || []
    tslEvents.value = tslModel.events || []
  }
  catch (e) {
    console.error(t('ruleChain.failed_load_tsl_model'), e)
    tslProperties.value = []
    tslEvents.value = []
  }
}

// 数据源类型变更
function onSourceTypeChange() {
  ruleChain.value.sourceId = null
  if (ruleChain.value.sourceType === 'PRODUCT') {
    ruleChain.value.sourceId = ruleChain.value.productId
  }
}

// 加载规则链详情
async function loadDetail() {
  if (!routeId.value || routeId.value === 'new')
    return
  try {
    const { data } = await ruleChainDetailApi(Number(routeId.value))
    const detail = normalizeRuleChainDetail(normalizeApiData<RuleChainDetail>(data))
    Object.assign(ruleChain.value, detail)

    // 根据sourceType和sourceId反推级联选择字段(编辑模式回显)
    if (detail.sourceType === 'PRODUCT' && detail.sourceId) {
      // sourceId 就是 productId，需要找到对应的 productTypeId
      ruleChain.value.productId = detail.sourceId
      // 遍历所有产品类型，找到包含该产品的类型
      for (const pt of productTypeOptions.value) {
        const { data: productResponse } = await productListApi({ productTypeId: pt.id })
        const products = normalizeList<Product>(productResponse)
        const product = products.find(p => p.id === detail.sourceId)
        if (product) {
          ruleChain.value.productTypeId = pt.id
          productOptions.value = products
          break
        }
      }
    }
    else if (detail.sourceType === 'DEVICE' && detail.sourceId) {
      // sourceId 是设备ID，需要找到对应的 productId 和 productTypeId
      // 遍历所有产品类型和产品，找到包含该设备的产品
      for (const pt of productTypeOptions.value) {
        const { data: productResponse } = await productListApi({ productTypeId: pt.id })
        const products = normalizeList<Product>(productResponse)
        for (const p of products) {
          const { data: deviceResponse } = await deviceListApi({ productId: p.id })
          const devices = normalizeList<Device>(deviceResponse)
          const device = devices.find(d => d.id === detail.sourceId)
          if (device) {
            ruleChain.value.productTypeId = pt.id
            ruleChain.value.productId = p.id
            productOptions.value = products
            deviceOptions.value = devices
            break
          }
        }
        if (ruleChain.value.productId)
          break
      }
    }
    // 加载物模型{{ t('ruleChain.property') }}
    if (ruleChain.value.productId) {
      await loadTslProperties()
    }
  }
  catch (e) {
    console.error(t('ruleChain.failed_load_rule_chain'), e)
  }
}

// 生成唯一ID
function generateId() {
  return `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

// 开始从节点库拖拽
function startDragFromPanel(type: RuleNodeTypeInfo, event: DragEvent) {
  event.dataTransfer!.setData('nodeType', JSON.stringify(type))
  event.dataTransfer!.effectAllowed = 'copy'
}

// 画布拖拽进入
function onCanvasDragOver(event: DragEvent) {
  event.preventDefault()
  event.dataTransfer!.dropEffect = 'copy'
}

// 画布放置
function onCanvasDrop(event: DragEvent) {
  event.preventDefault()
  const nodeTypeData = event.dataTransfer!.getData('nodeType')
  if (!nodeTypeData)
    return
  const type = JSON.parse(nodeTypeData) as RuleNodeTypeInfo
  const rect = canvasRef.value!.getBoundingClientRect()
  const x = event.clientX - rect.left - 90 // Center horizontally
  const y = event.clientY - rect.top - 30
  addNode(type, x, y)
}

// 点击添加节点
function onNodeClick(type: RuleNodeTypeInfo, _event: Event) {
  const x = 100 + Math.random() * 200
  const y = 100 + Math.random() * 200
  addNode(type, x, y)
}

// 添加节点
function addNode(type: RuleNodeTypeInfo, x: number, y: number) {
  const node: EditorNode = {
    id: generateId(),
    type: type.type,
    name: type.name,
    x: Math.max(0, x),
    y: Math.max(0, y),
    config: {},
    color: type.color || '#6366f1',
  }
  ruleChain.value.configuration.nodes.push(node)
  selectedNode.value = node
}

// 开始拖拽节点
function startDragNode(node: EditorNode, event: MouseEvent) {
  event.stopPropagation()
  dragState.value = {
    isDragging: true,
    dragNode: node,
    dragType: 'move',
    startX: event.clientX,
    startY: event.clientY,
    offsetX: node.x,
    offsetY: node.y,
  }
  document.addEventListener('mousemove', onDragNode)
  document.addEventListener('mouseup', stopDragNode)
}
// 拖拽节点中
function onDragNode(event: MouseEvent) {
  if (!dragState.value.isDragging)
    return
  const dx = event.clientX - dragState.value.startX
  const dy = event.clientY - dragState.value.startY
  dragState.value.dragNode!.x = Math.max(0, dragState.value.offsetX + dx)
  dragState.value.dragNode!.y = Math.max(0, dragState.value.offsetY + dy)
}
// 停止拖拽节点
function stopDragNode() {
  dragState.value.isDragging = false
  document.removeEventListener('mousemove', onDragNode)
  document.removeEventListener('mouseup', stopDragNode)
}
// 开始连接线拖拽
function startConnection(node: EditorNode, portType: string, event: MouseEvent) {
  event.stopPropagation()
  event.preventDefault()
  // portType: 'input', 'True', 'False', 'Success'
  connectionDrag.value = {
    isDragging: true,
    sourceNode: node,
    sourcePort: portType,
    connectionType: portType === 'input' ? 'input' : portType, // True/False/Success
  }
  document.addEventListener('mousemove', onConnectionDrag)
  document.addEventListener('mouseup', stopConnection)
}
// 连接线拖拽中
function onConnectionDrag(event: MouseEvent) {
  if (!connectionDrag.value.isDragging)
    return
  const rect = canvasRef.value!.getBoundingClientRect()
  const node = connectionDrag.value.sourceNode!

  // 计算源端口位置（与CSS中的端口位置一致）
  let sourceY = node.y + 40 // Default center
  if (connectionDrag.value.connectionType === 'True') {
    sourceY = node.y + 24 // True 端口位置 (CSS: top: 24px)
  }
  else if (connectionDrag.value.connectionType === 'False') {
    sourceY = node.y + 52 // False 端口位置 (CSS: top: 52px)
  }

  tempConnection.value = {
    sourceX: node.x + 180,
    sourceY,
    targetX: event.clientX - rect.left,
    targetY: event.clientY - rect.top,
  }
}
// 停止连接线拖拽
function stopConnection(event: MouseEvent) {
  if (connectionDrag.value.isDragging) {
    // 检查是否放在某{{ t('ruleChain.nodes') }}的输入端口上
    const rect = canvasRef.value!.getBoundingClientRect()
    const dropX = event.clientX - rect.left
    const dropY = event.clientY - rect.top
    // 查找目标节点
    const targetNode = ruleChain.value.configuration.nodes.find((node) => {
      return (
        dropX >= node.x
        && dropX <= node.x + 180
        && dropY >= node.y
        && dropY <= node.y + 80
        && node.id !== connectionDrag.value.sourceNode!.id
        && !isInputNode(node.type) // Input nodes cannot be targets
      )
    })

    // 确定连接类型
    let connectionType = connectionDrag.value.connectionType ?? 'Success'
    if (connectionType === 'input') {
      connectionType = 'Success' // Default to Success when dragging from an input port
    }

    if (targetNode) {
      // 验证连接是否有效
      const sourceType = connectionDrag.value.sourceNode!.type
      const targetType = targetNode.type
      if (!isValidConnection(sourceType, targetType, connectionType)) {
        ElMessage.warning(getConnectionErrorMessage(sourceType, targetType))
        connectionDrag.value.isDragging = false
        tempConnection.value = null
        document.removeEventListener('mousemove', onConnectionDrag)
        document.removeEventListener('mouseup', stopConnection)
        return
      }

      // 检查是否已存在相同连接（使用 type 字段）
      const exists = ruleChain.value.configuration.connections.some(
        c =>
          c.source === connectionDrag.value.sourceNode!.id
          && c.target === targetNode.id
          && getConnectionType(c) === connectionType,
      )
      if (!exists) {
        ruleChain.value.configuration.connections.push({
          source: connectionDrag.value.sourceNode!.id,
          target: targetNode.id,
          type: connectionType, // Keep the type field aligned with the backend
        })
      }
    }
    else {
      // 没有连接到节点，显示节点创建菜单
      showNodeCreateMenu(event.clientX, event.clientY, dropX, dropY, connectionType)
    }
  }
  connectionDrag.value.isDragging = false
  tempConnection.value = null
  document.removeEventListener('mousemove', onConnectionDrag)
  document.removeEventListener('mouseup', stopConnection)
}

// 显示节点创建菜单
function showNodeCreateMenu(clientX: number, clientY: number, canvasX: number, canvasY: number, connectionType: string) {
  const sourceNode = connectionDrag.value.sourceNode!
  // 根据源节点类型过滤可连接的节点类型
  // INPUT 节点只能连到 FILTER/ALARM/OUTPUT
  // FILTER/ALARM/OUTPUT 可以互相连接
  const availableTypes = nodeTypes.value.filter((type) => {
    const targetCategory = getNodeCategory(type.type)
    // 排除 INPUT 类型（不能作为目标）
    if (targetCategory === 'INPUT')
      return false
    // 验证连接有效性
    return isValidConnection(sourceNode.type, type.type, connectionType)
  })

  if (availableTypes.length === 0) {
    ElMessage.warning(t('ruleChain.no_connectable_node_types'))
    return
  }

  nodeCreateMenu.value = {
    visible: true,
    x: clientX,
    y: clientY,
    canvasX,
    canvasY,
    sourceNode,
    connectionType,
    availableTypes,
  }
}

// 从菜单创建节点并连接
function createNodeAndConnect(type: RuleNodeTypeInfo) {
  // 在菜单位置创建节点
  const node: EditorNode = {
    id: generateId(),
    type: type.type,
    name: type.name,
    x: Math.max(0, nodeCreateMenu.value.canvasX! - 90), // Center horizontally
    y: Math.max(0, nodeCreateMenu.value.canvasY! - 40),
    config: {},
    color: type.color || '#6366f1',
  }
  ruleChain.value.configuration.nodes.push(node)

  // 创建连接
  ruleChain.value.configuration.connections.push({
    source: nodeCreateMenu.value.sourceNode!.id,
    target: node.id,
    type: nodeCreateMenu.value.connectionType,
  })

  // 选中新节点
  selectedNode.value = node

  // 关闭菜单
  closeNodeCreateMenu()
}

// 关闭节点创建菜单
function closeNodeCreateMenu() {
  nodeCreateMenu.value.visible = false
}
// 删除节点
function deleteNode(nodeId: string) {
  ruleChain.value.configuration.nodes = ruleChain.value.configuration.nodes.filter(
    n => n.id !== nodeId,
  )
  ruleChain.value.configuration.connections = ruleChain.value.configuration.connections.filter(
    c => c.source !== nodeId && c.target !== nodeId,
  )
  if (selectedNode.value?.id === nodeId) {
    selectedNode.value = null
  }
}

// 更新{{ t('ruleChain.node_config') }}（同步更新 selectedNode 和 nodes 数组）
function updateNode(updatedNode: EditorNode) {
  selectedNode.value = updatedNode
  const index = ruleChain.value.configuration.nodes.findIndex(n => n.id === updatedNode.id)
  if (index !== -1) {
    ruleChain.value.configuration.nodes[index] = updatedNode
  }
}

// 删除连接
function deleteConnection(sourceId: string, targetId: string, connectionType?: string) {
  // 标准化 connectionType，将 undefined/null 视为 'Success'
  const normalizedType = connectionType || 'Success'
  ruleChain.value.configuration.connections = ruleChain.value.configuration.connections.filter(
    (c) => {
      const cType = getConnectionType(c)
      return !(c.source === sourceId && c.target === targetId && cType === normalizedType)
    },
  )
}
// 生成贝塞尔曲线路径
function generateBezierPath(x1: number, y1: number, x2: number, y2: number) {
  const cpOffset = Math.min(Math.abs(x2 - x1) * 0.5, 100)
  return `M ${x1} ${y1} C ${x1 + cpOffset} ${y1}, ${x2 - cpOffset} ${y2}, ${x2} ${y2}`
}

function buildRuleChainDraft(): RuleChainDraft {
  const configuration = {
    nodes: ruleChain.value.configuration.nodes.map(node => ({
      ...node,
      config: node.config ? { ...node.config, nodeType: node.type } : null,
    })),
    connections: ruleChain.value.configuration.connections,
  }

  return {
    ...ruleChain.value,
    configuration,
    sourceId: ruleChain.value.sourceType === 'PRODUCT'
      ? ruleChain.value.productId
      : ruleChain.value.sourceId,
  }
}

function parseJsonField(value: string, fieldName: string): Record<string, unknown> {
  if (!value || !value.trim())
    return {}
  try {
    return JSON.parse(value) as Record<string, unknown>
  }
  catch (e) {
    throw new Error(t('ruleChain.field_not_valid_json_message', {
      field: fieldName,
      message: e instanceof Error ? e.message : String(e),
    }))
  }
}

function formatJson(value: unknown) {
  return JSON.stringify(value ?? {}, null, 2)
}

function getTraceStatusType(status?: string) {
  if (status === 'SUCCESS')
    return 'success'
  if (status === 'FAILED' || status === 'ERROR')
    return 'danger'
  return 'warning'
}

function openDebugDialog() {
  debugDialogVisible.value = true
}

async function handleDebugRun() {
  if (ruleChain.value.configuration.nodes.length === 0) {
    ElMessage.warning(t('ruleChain.add_rule_node_first'))
    return
  }

  debugRunning.value = true
  try {
    const payload = {
      ruleChain: buildRuleChainDraft(),
      deviceKey: debugForm.value.deviceKey,
      deviceId: debugForm.value.deviceId,
      deviceName: debugForm.value.deviceName,
      messageType: debugForm.value.messageType,
      properties: parseJsonField(debugForm.value.propertiesJson, t('ruleChain.property_data')),
      eventIdentifier: debugForm.value.eventIdentifier || null,
      eventParams: parseJsonField(debugForm.value.eventParamsJson, t('ruleChain.event_parameters')),
      enrichedData: parseJsonField(debugForm.value.enrichedDataJson, t('ruleChain.extra_variables')),
    }
    // 前端草稿比后端 Query 宽松（id 可能为 null、config 允许额外字段），在边界做一次显式转换
    const { data } = await ruleChainDebugApi(payload as unknown as RuleChainDebugRequest)
    debugResult.value = normalizeApiData<RuleChainDebugResult>(data)
    ElMessage.success(t('ruleChain.debug_run_completed_execution_path_highlighted_canvas'))
  }
  catch (e) {
    ElMessage.error(e instanceof Error && e.message ? e.message : t('ruleChain.debug_run_failed'))
    console.error(t('ruleChain.debug_run_failed'), e)
  }
  finally {
    debugRunning.value = false
  }
}

async function validateRuleChainDraft(): Promise<RuleChainValidationResult> {
  const { data } = await ruleChainValidateApi(buildRuleChainDraft() as unknown as RuleChain)
  return normalizeApiData<RuleChainValidationResult>(data)
}

async function handleValidateDraft() {
  debugRunning.value = true
  try {
    const validation = await validateRuleChainDraft()
    debugResult.value = {
      success: validation.valid,
      executedNodeCount: 0,
      durationMs: 0,
      traces: [],
      executedConnections: [],
      validation,
    }
    if (validation.valid) {
      ElMessage.success(t('ruleChain.rule_chain_editor_page'))
    }
    else {
      ElMessage.warning(t('ruleChain.rule_chain_validation_found_count_errors', { count: validation.errors?.length || 0 }))
    }
  }
  catch (e) {
    ElMessage.error(e instanceof Error && e.message ? e.message : t('ruleChain.rule_chain_validation_failed'))
    console.error(t('ruleChain.rule_chain_validation_failed'), e)
  }
  finally {
    debugRunning.value = false
  }
}

// 保存
async function handleSave() {
  saving.value = true
  try {
    const submitData = buildRuleChainDraft()
    if (isEdit.value) {
      await ruleChainUpdateApi(submitData as unknown as RuleChainUpdateQuery)
    }
    else {
      await ruleChainAddApi(submitData as unknown as RuleChainAddQuery)
    }
    router.push('/rule-chain')
  }
  catch (e) {
    console.error(t('ruleChain.save_failed'), e)
  }
  finally {
    saving.value = false
  }
}
// 返回
function handleBack() {
  router.push('/rule-chain')
}

// 快捷键处理
function handleKeydown(e: KeyboardEvent) {
  const target = e.target as HTMLElement | null
  // 输入框内不触发快捷键
  if (target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA') {
    // 但允许 Ctrl+S 在输入框内保存
    if (e.key === 's' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault()
      handleSave()
    }
    return
  }

  // Delete/Backspace: 删除选中节点
  if ((e.key === 'Delete' || e.key === 'Backspace') && selectedNode.value) {
    e.preventDefault()
    deleteNode(selectedNode.value.id)
  }

  // Escape: 取消选中
  if (e.key === 'Escape') {
    selectedNode.value = null
    closeNodeCreateMenu()
  }

  // Ctrl+S / Cmd+S: 保存
  if (e.key === 's' && (e.ctrlKey || e.metaKey)) {
    e.preventDefault()
    handleSave()
  }
}

// 画布缩放控制
function handleZoom(delta: number) {
  const newScale = Math.max(0.1, Math.min(3, canvasTransform.value.scale + delta))
  canvasTransform.value.scale = newScale
}

function handleZoomIn() {
  handleZoom(0.1)
}

function handleZoomOut() {
  handleZoom(-0.1)
}

function handleResetView() {
  canvasTransform.value = {
    scale: 1,
    translateX: 0,
    translateY: 0,
  }
}

// 画布滚轮缩放
function handleCanvasWheel(e: WheelEvent) {
  if (e.ctrlKey || e.metaKey) {
    e.preventDefault()
    const delta = e.deltaY > 0 ? -0.05 : 0.05
    handleZoom(delta)
  }
}

// 画布空白区域拖拽平移
function handleCanvasMouseDown(e: MouseEvent) {
  // 只有在空白区域（canvas-panel 本身）点击才触发平移
  const target = e.target as HTMLElement | null
  if (target?.classList.contains('canvas-panel')) {
    dragState.value = {
      isDragging: true,
      dragType: 'pan',
      startX: e.clientX - canvasTransform.value.translateX,
      startY: e.clientY - canvasTransform.value.translateY,
      dragNode: null,
      offsetX: 0,
      offsetY: 0,
    }
  }
}

function handleCanvasMouseMove(e: MouseEvent) {
  if (dragState.value.isDragging && dragState.value.dragType === 'pan') {
    canvasTransform.value.translateX = e.clientX - dragState.value.startX
    canvasTransform.value.translateY = e.clientY - dragState.value.startY
  }
}

function handleCanvasMouseUp() {
  if (dragState.value.dragType === 'pan') {
    dragState.value.isDragging = false
    dragState.value.dragType = null
  }
}

onMounted(async () => {
  await loadNodeTypes()
  await loadProductTypes()
  await loadMessageReceiveOptions()
  await loadPushConfigOptions()
  if (routeId.value && routeId.value !== 'new') {
    await loadDetail()
  }

  // 绑定快捷键
  window.addEventListener('keydown', handleKeydown)
})

onBeforeUnmount(() => {
  // 解绑快捷键
  window.removeEventListener('keydown', handleKeydown)
})
</script>

<template>
  <div class="rule-chain-editor">
    <!-- 顶部工具栏 -->
    <div class="editor-header glass-card">
      <div class="header-left">
        <el-button @click="handleBack">
          <span>{{ t('ruleChain.back') }}</span>
        </el-button>
        <span class="title">{{ isEdit ? t('ruleChain.edit_rule_engine') : t('ruleChain.create_rule_engine') }}</span>
      </div>
      <div class="header-right">
        <el-button :loading="debugRunning" @click="openDebugDialog">
          {{ t('ruleChain.debug_run') }}
        </el-button>
        <el-button type="primary" :loading="saving" @click="handleSave">
          {{ t('common.save') }}
          <span class="shortcut-hint">Ctrl+S</span>
        </el-button>
      </div>
    </div>

    <div class="editor-main">
      <!-- 左侧节点面板 -->
      <div class="node-panel glass-card">
        <div class="panel-title">
          {{ t('ruleChain.editor_rule_chain_editor_page') }}
        </div>

        <!-- 巻加产品类型和产品的辅助字段 -->
        <el-form label-width="70px" size="small">
          <el-form-item :label="t('common.name')">
            <el-input v-model="ruleChain.name" :placeholder="t('ruleChain.rule_name_2')" />
          </el-form-item>
          <el-form-item :label="t('ruleChain.data_source')">
            <el-select v-model="ruleChain.sourceType" @change="onSourceTypeChange">
              <el-option :label="t('ruleChain.product')" value="PRODUCT" />
              <el-option :label="t('ruleChain.specific_device')" value="DEVICE" />
            </el-select>
          </el-form-item>
          <el-form-item :label="t('menu.productType')">
            <el-select
              v-model="ruleChain.productTypeId"
              :placeholder="t('ruleChain.select_product_type')"
              filterable
              clearable
              @change="onProductTypeChange"
            >
              <el-option
                v-for="item in productTypeOptions"
                :key="item.id"
                :label="item.name"
                :value="item.id"
              />
            </el-select>
          </el-form-item>
          <el-form-item :label="t('ruleChain.product')">
            <el-select
              v-model="ruleChain.productId"
              :placeholder="t('ruleChain.select_product_type_first')"
              filterable
              clearable
              :disabled="!ruleChain.productTypeId"
              @change="onProductChange"
            >
              <el-option
                v-for="item in productOptions"
                :key="item.id"
                :label="`${item.model} (${item.manufacturer})`"
                :value="item.id"
              />
            </el-select>
          </el-form-item>
          <el-form-item v-if="ruleChain.sourceType === 'DEVICE'" :label="t('ruleChain.device')">
            <el-select
              v-model="ruleChain.sourceId"
              :placeholder="t('ruleChain.select_product_first_2')"
              filterable
              clearable
              :disabled="!ruleChain.productId"
            >
              <el-option
                v-for="item in deviceOptions"
                :key="item.id"
                :label="`${item.deviceName} (${item.deviceKey})`"
                :value="item.id"
              />
            </el-select>
          </el-form-item>
        </el-form>

        <!-- 节点库搜索 -->
        <div class="node-search">
          <el-input
            v-model="nodeSearchKeyword"
            :placeholder="t('ruleChain.search_node_types')"
            clearable
            prefix-icon="Search"
          />
        </div>

        <!-- 节点分类 -->
        <div v-for="(types, category) in nodeCategories" :key="category" class="node-category">
          <div class="category-title">
            {{ category }}
          </div>
          <div class="node-list">
            <div
              v-for="type in types"
              :key="type.type"
              class="node-item"
              :style="{ borderLeftColor: type.color || '#6366f1' }"
              draggable="true"
              @dragstart="startDragFromPanel(type, $event)"
              @click="onNodeClick(type, $event)"
            >
              <span class="node-name">{{ type.name }}</span>
              <span class="node-desc">{{ type.description }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 中间画布 -->
      <div
        ref="canvasRef"
        class="canvas-panel glass-card"
        @dragover="onCanvasDragOver"
        @drop="onCanvasDrop"
        @wheel="handleCanvasWheel"
        @mousedown="handleCanvasMouseDown"
        @mousemove="handleCanvasMouseMove"
        @mouseup="handleCanvasMouseUp"
        @mouseleave="handleCanvasMouseUp"
      >
        <!-- 可缩放平移的内容层 -->
        <div
          class="canvas-content"
          :style="{
            transform: `translate(${canvasTransform.translateX}px, ${canvasTransform.translateY}px) scale(${canvasTransform.scale})`,
            transformOrigin: '0 0',
          }"
        >
          <!-- SVG连接线层 -->
          <svg ref="svgRef" class="connections-svg">
            <!-- 已有连接线 -->
            <g v-for="line in connectionLines" :key="line.id" class="connection-group">
              <!-- 透明宽点击区域 -->
              <path
                :d="generateBezierPath(line.source.x, line.source.y, line.target.x, line.target.y)"
                class="connection-hitbox"
                @click.stop="deleteConnection(line.sourceNode, line.targetNode, line.connectionType)"
              />
              <!-- 可见连接线 -->
              <path
                :d="generateBezierPath(line.source.x, line.source.y, line.target.x, line.target.y)"
                class="connection-line"
                :class="[
                  `connection-${(line.connectionType || 'Success').toLowerCase()}`,
                  { 'debug-executed': isDebugConnectionExecuted(line) },
                ]"
              />
              <!-- 连接类型标签（色盲友好） -->
              <rect
                :x="(line.source.x + line.target.x) / 2 - 14"
                :y="(line.source.y + line.target.y) / 2 - 10"
                width="28"
                height="20"
                rx="4"
                class="connection-label-bg"
                :class="`connection-${(line.connectionType || 'Success').toLowerCase()}`"
              />
              <text
                :x="(line.source.x + line.target.x) / 2"
                :y="(line.source.y + line.target.y) / 2"
                class="connection-label-text"
              >{{ line.connectionType === 'True' ? 'T' : line.connectionType === 'False' ? 'F' : '→' }}</text>
              <!-- 箭头 -->
              <polygon
                :points="`${line.target.x - 8},${line.target.y - 5} ${line.target.x},${line.target.y} ${line.target.x - 8},${line.target.y + 5}`"
                class="connection-arrow"
                :class="[
                  `connection-${(line.connectionType || 'Success').toLowerCase()}`,
                  { 'debug-executed': isDebugConnectionExecuted(line) },
                ]"
              />
              <!-- 删除提示（hover时显示） -->
              <circle
                :cx="(line.source.x + line.target.x) / 2"
                :cy="(line.source.y + line.target.y) / 2"
                r="14"
                class="delete-hint"
                @click.stop="deleteConnection(line.sourceNode, line.targetNode, line.connectionType)"
              />
              <text
                :x="(line.source.x + line.target.x) / 2"
                :y="(line.source.y + line.target.y) / 2"
                class="delete-text"
                @click.stop="deleteConnection(line.sourceNode, line.targetNode, line.connectionType)"
              >×</text>
            </g>
            <!-- 临时连接线(拖拽中) -->
            <path
              v-if="tempConnection"
              :d="generateBezierPath(
                tempConnection.sourceX,
                tempConnection.sourceY,
                tempConnection.targetX,
                tempConnection.targetY,
              )"
              class="connection-line temp"
              :class="`connection-${(connectionDrag.connectionType || 'Success').toLowerCase()}`"
            />
          </svg>

          <div v-if="ruleChain.configuration.nodes.length === 0" class="empty-tip">
            {{ t('ruleChain.drag_nodes_from_left_canvas_click_node_add_it') }}
          </div>

          <!-- 节点 -->
          <div
            v-for="node in ruleChain.configuration.nodes"
            :key="node.id"
            class="canvas-node"
            :class="[
              `category-${getNodeCategory(node.type).toLowerCase()}`,
              {
                'selected': selectedNode?.id === node.id,
                'is-input': isInputNode(node.type),
                'is-filter': isFilterNode(node.type),
                'debug-success': debugTraceMap[node.id]?.status === 'SUCCESS',
                'debug-failed': ['FAILED', 'ERROR'].includes(debugTraceMap[node.id]?.status ?? ''),
              },
            ]"
            :style="{ 'left': `${node.x}px`, 'top': `${node.y}px`, '--node-color': node.color }"
            @click="selectedNode = selectedNode?.id === node.id ? null : node"
            @mousedown="startDragNode(node, $event)"
          >
            <!-- 输入端口 (INPUT类型节点不显示) -->
            <div v-if="!isInputNode(node.type)" class="node-port input" @mousedown="startConnection(node, 'input', $event)">
              <span class="port-dot" />
            </div>

            <div class="node-header">
              <span class="node-name-text">{{ node.name }}</span>
              <el-button link type="danger" size="small" class="delete-btn" @click.stop="deleteNode(node.id)">
                <el-icon :size="14">
                  <Close />
                </el-icon>
              </el-button>
            </div>
            <div class="node-body">
              <div class="node-type">
                {{ node.type }}
              </div>
              <div v-if="debugTraceMap[node.id]" class="node-debug-badge">
                #{{ debugTraceMap[node.id].index }} · {{ debugTraceMap[node.id].status }} · {{ debugTraceMap[node.id].connectionType }}
              </div>
            </div>

            <!-- 输出端口 - 过滤节点有两个：True/False -->
            <template v-if="isFilterNode(node.type)">
              <div class="node-port output true" @mousedown="startConnection(node, 'True', $event)">
                <span class="port-label">T</span>
                <span class="port-dot" />
              </div>
              <div class="node-port output false" @mousedown="startConnection(node, 'False', $event)">
                <span class="port-label">F</span>
                <span class="port-dot" />
              </div>
            </template>
            <!-- 普通输出端口（OUTPUT节点是终端，不显示输出端口） -->
            <div v-else-if="getNodeCategory(node.type) !== 'OUTPUT'" class="node-port output" @mousedown="startConnection(node, 'Success', $event)">
              <span class="port-dot" />
            </div>
          </div>
        </div><!-- /.canvas-content -->

        <!-- 缩放控制按钮 -->
        <div class="zoom-controls">
          <el-button-group>
            <el-button size="small" @click="handleZoomIn">
              <span style="font-size: 16px; font-weight: bold;">+</span>
            </el-button>
            <el-button size="small" @click="handleResetView">
              {{ Math.round(canvasTransform.scale * 100) }}%
            </el-button>
            <el-button size="small" @click="handleZoomOut">
              <span style="font-size: 16px; font-weight: bold;">−</span>
            </el-button>
          </el-button-group>
        </div>
      </div>

      <!-- 右侧配置面板 -->
      <div v-if="selectedNode" class="config-panel glass-card">
        <div class="panel-title">
          {{ t('ruleChain.node_config') }}
        </div>
        <div class="config-content">
          <NodeConfigPanel
            :selected-node="selectedNode"
            :rule-chain="ruleChain"
            :tsl-properties="tslProperties"
            :tsl-events="tslEvents"
            :upstream-node="upstreamInputNode"
            :product-options="productOptions"
            :product-type-options="productTypeOptions"
            :message-receive-options="messageReceiveOptions"
            :push-config-options="pushConfigOptions"
            @update:node="updateNode"
          />
        </div>
      </div>
    </div>

    <el-dialog v-model="debugDialogVisible" :title="t('ruleChain.rule_chain_debug_run')" width="980px" destroy-on-close>
      <div class="debug-dialog-content">
        <el-form class="debug-form" label-width="90px" size="small">
          <el-form-item :label="t('ruleChain.message_type')">
            <el-radio-group v-model="debugForm.messageType">
              <el-radio-button label="PROPERTY">
                {{ t('ruleChain.property') }}
              </el-radio-button>
              <el-radio-button label="EVENT">
                {{ t('ruleChain.event') }}
              </el-radio-button>
              <el-radio-button label="ONLINE">
                {{ t('ruleChain.online') }}
              </el-radio-button>
              <el-radio-button label="OFFLINE">
                {{ t('ruleChain.offline') }}
              </el-radio-button>
            </el-radio-group>
          </el-form-item>
          <el-form-item :label="t('ruleChain.device_key')">
            <el-input v-model="debugForm.deviceKey" placeholder="deviceKey" />
          </el-form-item>
          <el-form-item :label="t('ruleChain.device_name')">
            <el-input v-model="debugForm.deviceName" :placeholder="t('ruleChain.device_name')" />
          </el-form-item>
          <el-form-item :label="t('ruleChain.json')">
            <el-input v-model="debugForm.propertiesJson" type="textarea" :rows="5" placeholder="{ &quot;temperature&quot;: 36.5 }" />
          </el-form-item>
          <el-form-item :label="t('ruleChain.event_identifier')">
            <el-input v-model="debugForm.eventIdentifier" :placeholder="t('ruleChain.event_identifier_high_temperature')" />
          </el-form-item>
          <el-form-item :label="t('ruleChain.event_parameters')">
            <el-input v-model="debugForm.eventParamsJson" type="textarea" :rows="3" placeholder="{ &quot;level&quot;: &quot;HIGH&quot; }" />
          </el-form-item>
          <el-form-item :label="t('ruleChain.extra_variables')">
            <el-input v-model="debugForm.enrichedDataJson" type="textarea" :rows="3" placeholder="{ &quot;tenant&quot;: &quot;demo&quot; }" />
          </el-form-item>
        </el-form>

        <div class="debug-result-panel">
          <div class="debug-result-header">
            <div>
              <strong>{{ t('ruleChain.execution_trace') }}</strong>
              <span v-if="debugResult" class="debug-summary">
                {{ debugResult.success ? t('ruleChain.success') : t('ruleChain.failed') }} · {{ debugResult.executedNodeCount || 0 }} {{ t('ruleChain.nodes') }} · {{ debugResult.durationMs || 0 }}ms
              </span>
            </div>
            <div class="debug-actions">
              <el-button :loading="debugRunning" @click="handleValidateDraft">
                {{ t('ruleChain.validate_structure') }}
              </el-button>
              <el-button type="primary" :loading="debugRunning" @click="handleDebugRun">
                {{ t('ruleChain.run_debug') }}
              </el-button>
            </div>
          </div>

          <div v-if="validationIssues.length" class="validation-issues">
            <el-alert
              v-for="issue in validationIssues"
              :key="`${issue.code}-${issue.nodeId || issue.connectionId || issue.message}`"
              :type="getValidationIssueType(issue)"
              :closable="false"
              show-icon
            >
              <template #title>
                {{ issue.message }}
                <span class="issue-meta">
                  {{ issue.nodeId || '' }} {{ issue.connectionId || '' }}
                </span>
              </template>
            </el-alert>
          </div>

          <el-empty v-if="!debugResult" :description="t('ruleChain.show_node_execution_trace_after_running')" />
          <el-timeline v-else class="debug-timeline">
            <el-timeline-item
              v-for="trace in debugResult.traces || []"
              :key="`${trace.nodeId}-${trace.timestamp}`"
              :type="getTraceStatusType(trace.status)"
              :timestamp="trace.timestamp"
            >
              <div class="trace-card">
                <div class="trace-title">
                  <span>{{ trace.nodeName || trace.nodeId }}</span>
                  <el-tag size="small" :type="getTraceStatusType(trace.status)">
                    {{ trace.status }} / {{ trace.connectionType }} / {{ trace.durationMs || 0 }}ms
                  </el-tag>
                </div>
                <div class="trace-detail">
                  {{ trace.detail || trace.error || t('ruleChain.no_details') }}
                </div>
                <el-collapse>
                  <el-collapse-item :title="t('ruleChain.input_snapshot')" name="input">
                    <pre>{{ formatJson(trace.input) }}</pre>
                  </el-collapse-item>
                  <el-collapse-item :title="t('ruleChain.output_snapshot')" name="output">
                    <pre>{{ formatJson(trace.output) }}</pre>
                  </el-collapse-item>
                </el-collapse>
              </div>
            </el-timeline-item>
          </el-timeline>
        </div>
      </div>
    </el-dialog>

    <!-- 节点创建菜单 -->
    <Teleport to="body">
      <div
        v-if="nodeCreateMenu.visible"
        class="node-create-menu glass-card"
        :style="{ left: `${nodeCreateMenu.x}px`, top: `${nodeCreateMenu.y}px` }"
      >
        <div class="menu-header">
          <span>{{ t('ruleChain.choose_node_create') }}</span>
          <el-button link size="small" @click="closeNodeCreateMenu">
            <el-icon><Close /></el-icon>
          </el-button>
        </div>
        <div class="menu-content">
          <div
            v-for="type in nodeCreateMenu.availableTypes"
            :key="type.type"
            class="menu-item"
            :style="{ borderLeftColor: type.color || '#6366f1' }"
            @click="createNodeAndConnect(type)"
          >
            <span class="item-name">{{ type.name }}</span>
            <span class="item-desc">{{ type.description }}</span>
          </div>
        </div>
      </div>
      <!-- 点击遮罩关闭菜单 -->
      <div
        v-if="nodeCreateMenu.visible"
        class="menu-overlay"
        @click="closeNodeCreateMenu"
      />
    </Teleport>
  </div>
</template>

<style scoped lang="scss">
.rule-chain-editor {
  display: flex;
  flex-direction: column;
  height: 100vh;
  padding: var(--space-md);
  gap: var(--space-md);
}

.editor-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-md) var(--space-lg);

  .header-left,
  .header-right {
    display: flex;
    align-items: center;
    gap: var(--space-md);
  }

  .shortcut-hint {
    margin-left: var(--space-xs);
    font-size: 11px;
    opacity: 0.6;
    font-weight: normal;
  }

  .header-left {
    .title {
      font-size: 18px;
      font-weight: 600;
    }
  }
}
.editor-main {
  flex: 1;
  display: flex;
  gap: var(--space-md);
  min-height: 0;
}
.node-panel {
  width: 280px;
  padding: var(--space-md);
  overflow-y: auto;

  .panel-title {
    font-size: 16px;
    font-weight: 600;
    margin-bottom: var(--space-md);
    padding-bottom: var(--space-sm);
    border-bottom: 1px solid var(--iot-color-border);
  }

  .category-title {
    font-size: 14px;
    font-weight: 500;
    color: var(--iot-color-text-secondary);
    margin-bottom: var(--space-sm);
  }

  /* 节点搜索框 */
  .node-search {
    margin-bottom: var(--space-md);

    :deep(.el-input__wrapper) {
      box-shadow: 0 0 0 1px var(--iot-border-color) inset;
      transition: box-shadow 0.2s;

      &:hover {
        box-shadow: 0 0 0 1px var(--iot-color-primary-light) inset;
      }
    }

    :deep(.el-input__wrapper.is-focus) {
      box-shadow: 0 0 0 1px var(--iot-color-primary) inset;
    }
  }

  .node-category {
    margin-bottom: var(--space-md);
  }
  .node-list {
    display: flex;
    flex-direction: column;
    gap: var(--space-xs);
  }
  .node-item {
    padding: var(--space-sm);
    background: rgba(255, 255, 255, 0.5);
    border-radius: var(--radius-sm);
    border-left: 3px solid var(--iot-color-primary);
    cursor: grab;
    transition: all 0.2s ease-out;

    &:hover {
      background: rgba(255, 255, 255, 0.8);
      transform: translateX(2px);
      box-shadow: 0 2px 8px rgba(99, 102, 241, 0.15);
    }
    &:active {
      cursor: grabbing;
    }
    .node-name {
      display: block;
      font-size: 13px;
      font-weight: 500;
    }
    .node-desc {
      display: block;
      font-size: 11px;
      color: var(--iot-color-text-muted);
      margin-top: 2px;
    }
  }
}
.canvas-panel {
  flex: 1;
  position: relative;
  overflow: hidden;
  background-image: linear-gradient(rgba(0, 0, 0, 0.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(0, 0, 0, 0.03) 1px, transparent 1px);
  background-size: 20px 20px;
  cursor: grab;

  &:active {
    cursor: grabbing;
  }

  .canvas-content {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;

    > * {
      pointer-events: auto;
    }
  }

  .zoom-controls {
    position: absolute;
    bottom: var(--space-lg);
    right: var(--space-lg);
    z-index: 10;

    .el-button-group {
      box-shadow: var(--iot-shadow-md);
    }

    .el-button {
      min-width: 40px;
      font-weight: 500;
    }
  }
  .empty-tip {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    color: var(--iot-color-text-muted);
    font-size: 14px;
    pointer-events: none;
  }
  .connections-svg {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;

    // 连接线组 - hover 效果
    .connection-group {
      pointer-events: auto;
      cursor: pointer;

      &:hover .connection-line {
        stroke-width: 3;
      }
      &:hover .delete-hint,
      &:hover .delete-text {
        opacity: 1;
      }
    }

    // 透明点击区域（更宽）
    .connection-hitbox {
      fill: transparent;
      stroke: transparent;
      stroke-width: 24px;
      pointer-events: all;
      cursor: pointer;
    }

    .connection-line {
      fill: none;
      stroke: var(--iot-color-primary);
      stroke-width: 2;
      pointer-events: none;
      transition:
        stroke-width 0.15s ease-out,
        opacity 0.2s ease-out;

      // 不同连接类型的颜色
      &.connection-true {
        stroke: #10b981; // 绿色 - True
      }
      &.connection-false {
        stroke: #ef4444; // 红色 - False
      }
      &.connection-success {
        stroke: var(--iot-color-primary); // 主色 - Success
      }

      &.temp {
        stroke-dasharray: 5, 5;
        opacity: 0.7;
        pointer-events: none;
      }

      // 调试运行后的"叠加层"效果：原线条降低不透明度，让动画明显
      &.debug-executed {
        stroke-width: 3.5;
        opacity: 0.95;
        stroke-dasharray: 10, 5;
        filter: drop-shadow(0 0 8px currentColor);
        animation: executedFlow 1s linear infinite;
      }
    }

    // 连接类型标签底色和文字
    .connection-label-bg {
      fill: white;
      stroke-width: 1.5;
      pointer-events: none;

      &.connection-true {
        stroke: #10b981;
      }
      &.connection-false {
        stroke: #ef4444;
      }
      &.connection-success {
        stroke: var(--iot-color-primary);
      }
    }
    .connection-label-text {
      font-size: 11px;
      font-weight: 700;
      text-anchor: middle;
      dominant-baseline: central;
      fill: var(--iot-color-text-secondary);
      pointer-events: none;
      user-select: none;
    }
    // 悬停时隐藏标签让出位置给删除按钮
    .connection-group:hover .connection-label-bg,
    .connection-group:hover .connection-label-text {
      opacity: 0;
      transition: opacity 0.15s;
    }

    // hover 时连接线变粗
    .connection-group:hover .connection-line {
      stroke-width: 3;
      filter: drop-shadow(0 0 3px currentColor);
    }

    .connection-arrow {
      fill: var(--iot-color-primary);
      pointer-events: none;

      &.connection-true {
        fill: #10b981;
      }
      &.connection-false {
        fill: #ef4444;
      }
      &.connection-success {
        fill: var(--iot-color-primary);
      }

      &.debug-executed {
        filter: drop-shadow(0 0 6px rgba(16, 185, 129, 0.75));
      }
    }
    // 删除提示（hover 时显示）
    .delete-hint {
      fill: rgba(239, 68, 68, 0.95);
      stroke: white;
      stroke-width: 2;
      opacity: 0;
      transition: opacity 0.2s;
      pointer-events: none; // 默认不拦截{{ t('ruleChain.event') }}，让 hitbox 接收点击
      cursor: pointer;
    }
    .delete-text {
      fill: white;
      font-size: 16px;
      font-weight: bold;
      text-anchor: middle;
      dominant-baseline: central;
      opacity: 0;
      transition: opacity 0.2s;
      pointer-events: none; // 默认不拦截{{ t('ruleChain.event') }}，让 hitbox 接收点击
      cursor: pointer;
      user-select: none;
    }
    // hover 整个组时显示删除提示并启用点击
    .connection-group:hover .delete-hint,
    .connection-group:hover .delete-text {
      opacity: 1;
      pointer-events: auto; // hover 时才启用点击
    }
  }
  .canvas-node {
    position: absolute;
    width: 180px;
    background: white;
    border-radius: var(--radius-md);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    border: 2px solid var(--iot-color-border);
    cursor: move;
    transition:
      box-shadow 0.2s ease-out,
      border-color 0.2s ease-out;
    &:hover {
      box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
    }
    &.debug-success {
      border-color: #10b981;
      box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.18);
    }
    &.debug-failed {
      border-color: #ef4444;
      box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.2);
    }
    // === 按 Category 分组的节点配色 ===
    // INPUT - 翠绿色（数据源）
    &.category-input {
      --node-header-bg: linear-gradient(135deg, #10b981, #059669);
      border-color: rgba(16, 185, 129, 0.35);
    }
    // FILTER - 琥珀色（判断/分流）
    &.category-filter {
      --node-header-bg: linear-gradient(135deg, #f59e0b, #d97706);
      border-color: rgba(245, 158, 11, 0.35);
    }
    // ALARM - 红色（告警）
    &.category-alarm {
      --node-header-bg: linear-gradient(135deg, #ef4444, #dc2626);
      border-color: rgba(239, 68, 68, 0.35);
    }
    // OUTPUT - 紫色（输出/动作）
    &.category-output {
      --node-header-bg: linear-gradient(135deg, #8b5cf6, #6366f1);
      border-color: rgba(139, 92, 246, 0.35);
    }
    // 老的 is-input 兜底（保持向后兼容，但被 category-input 覆盖）
    &.is-input {
      // 不再硬覆盖 border-color, 让 category-input 优先
    }
    &.selected {
      // 选中时 border 高亮覆盖 category 颜色
      border-color: var(--iot-color-primary);
      box-shadow:
        0 6px 20px rgba(0, 0, 0, 0.15),
        0 0 0 3px rgba(99, 102, 241, 0.25);
    }
    .node-port {
      position: absolute;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: crosshair;
      z-index: 10;
      &.input {
        left: -8px;
        top: 50%;
        transform: translateY(-50%);
        width: 16px;
        height: 16px;
      }
      &.output {
        right: -8px;
        top: 50%;
        transform: translateY(-50%);
        width: 16px;
        height: 16px;
      }
      .port-label {
        position: absolute;
        right: 18px;
        font-size: 11px;
        font-weight: 700;
        color: var(--iot-color-text-muted);
      }
      .port-dot {
        width: 12px;
        height: 12px;
        border-radius: 50%;
        background: white;
        border: 2px solid var(--iot-color-primary);
        transition: all 0.15s ease-out;
      }
      &:hover .port-dot {
        transform: scale(1.3);
        background: var(--iot-color-primary);
      }
      // 过滤节点的双输出端口 - 放在后面以覆盖默认样式
      &.output.true {
        top: var(--filter-true-port-y, 24px);
        .port-dot {
          border-color: #10b981;
          background: #10b981;
          box-shadow: 0 0 4px rgba(16, 185, 129, 0.4);
        }
        .port-label {
          color: #10b981 !important;
          font-weight: 700;
        }
        &:hover .port-dot {
          transform: scale(1.3);
          background: #10b981;
          box-shadow: 0 0 10px rgba(16, 185, 129, 0.6);
        }
      }
      &.output.false {
        top: var(--filter-false-port-y, 52px);
        .port-dot {
          border-color: #ef4444;
          background: #ef4444;
          box-shadow: 0 0 4px rgba(239, 68, 68, 0.4);
        }
        .port-label {
          color: #ef4444 !important;
          font-weight: 700;
        }
        &:hover .port-dot {
          transform: scale(1.3);
          background: #ef4444;
          box-shadow: 0 0 10px rgba(239, 68, 68, 0.6);
        }
      }
    }
    .node-header {
      display: flex;
      align-items: center;
      padding: var(--space-sm) var(--space-md);
      background: var(
        --node-header-bg,
        linear-gradient(135deg, var(--node-color, var(--iot-color-primary)), var(--iot-color-accent))
      );
      color: white;
      border-radius: calc(var(--radius-md) - 2px) calc(var(--radius-md) - 2px) 0 0;
      font-size: 13px;
      font-weight: 600;
      gap: var(--space-sm);
      letter-spacing: 0.2px;

      .delete-btn {
        opacity: 0;
        color: white;
        padding: 2px;
        transition: opacity 0.15s ease-out;
        margin-left: auto;
        &:hover {
          opacity: 1;
          color: #fecaca;
        }
      }
      .node-name-text {
        flex: 1;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
    }
    &:hover .node-header .delete-btn,
    &.selected .node-header .delete-btn {
      opacity: 0.85;
    }
    .node-body {
      padding: var(--space-sm) var(--space-md);
      .node-type {
        font-size: 11px;
        color: var(--iot-color-text-muted);
      }
      .node-debug-badge {
        margin-top: 4px;
        font-size: 10px;
        font-weight: 600;
        color: #047857;
        background: rgba(16, 185, 129, 0.1);
        border-radius: var(--radius-sm);
        padding: 2px 6px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
    }
  }
}
.config-panel {
  width: 300px;
  padding: var(--space-md);
  overflow-y: auto;
  .panel-title {
    font-size: 16px;
    font-weight: 600;
    margin-bottom: var(--space-md);
    padding-bottom: var(--space-sm);
    border-bottom: 1px solid var(--iot-color-border);
  }
  .config-content {
    :deep(.el-form-item) {
      margin-bottom: var(--space-md);
    }
  }
  // 表单提示样式
  .form-tip {
    font-size: 12px;
    color: var(--iot-color-text-muted);
    margin-top: 4px;
  }
  // {{ t('ruleChain.property') }}信息样式
  .property-info {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-sm);
    font-size: 12px;
    color: var(--iot-color-text-secondary);
    span {
      padding: 2px 8px;
      background: rgba(99, 102, 241, 0.1);
      border-radius: var(--radius-sm);
    }
  }
}

.debug-dialog-content {
  display: grid;
  grid-template-columns: 380px 1fr;
  gap: var(--space-lg);
  min-height: 520px;

  .debug-form {
    padding-right: var(--space-md);
    border-right: 1px solid var(--iot-color-border);
  }

  .debug-result-panel {
    min-width: 0;
  }

  .debug-result-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--space-md);
  }

  .debug-actions {
    display: flex;
    gap: var(--space-sm);
  }

  .validation-issues {
    display: flex;
    flex-direction: column;
    gap: var(--space-xs);
    margin-bottom: var(--space-md);

    .issue-meta {
      margin-left: var(--space-sm);
      color: var(--iot-color-text-muted);
      font-size: 12px;
      font-weight: 400;
    }
  }

  .debug-summary {
    margin-left: var(--space-sm);
    color: var(--iot-color-text-muted);
    font-size: 12px;
  }

  .debug-timeline {
    max-height: 500px;
    overflow-y: auto;
    padding-right: var(--space-sm);
  }

  .trace-card {
    padding: var(--space-sm) var(--space-md);
    border: 1px solid var(--iot-color-border);
    border-radius: var(--radius-md);
    background: rgba(255, 255, 255, 0.7);
  }

  .trace-title {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: var(--space-sm);
    margin-bottom: 6px;
    font-weight: 600;
  }

  .trace-detail {
    margin-bottom: var(--space-sm);
    color: var(--iot-color-text-secondary);
    font-size: 12px;
  }

  pre {
    margin: 0;
    padding: var(--space-sm);
    max-height: 180px;
    overflow: auto;
    border-radius: var(--radius-sm);
    background: #0f172a;
    color: #d1fae5;
    font-size: 12px;
    line-height: 1.5;
  }
}

// 暗色模式适配
:global(.dark) {
  .canvas-panel {
    background-image: linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px);
  }
  .canvas-node {
    background: rgba(30, 41, 59, 0.95);
    border-color: rgba(255, 255, 255, 0.1);

    .node-port .port-dot {
      background: #1e293b;
    }
    // 暗色下的 category 边框稍微提亮
    &.category-input {
      border-color: rgba(52, 211, 153, 0.5);
    }
    &.category-filter {
      border-color: rgba(251, 191, 36, 0.5);
    }
    &.category-alarm {
      border-color: rgba(248, 113, 113, 0.5);
    }
    &.category-output {
      border-color: rgba(167, 139, 250, 0.5);
    }
  }
  .node-item {
    background: rgba(30, 41, 59, 0.5);
    &:hover {
      background: rgba(30, 41, 59, 0.8);
    }
  }
  // 连接标签暗色
  .connection-label-bg {
    fill: #1e293b;
  }
  .connection-label-text {
    fill: #e2e8f0;
  }
  // debug trace 卡片暗色
  .trace-card {
    background: rgba(30, 41, 59, 0.7);
    border-color: rgba(255, 255, 255, 0.1);
  }
}

// 节点创建菜单（全局样式，因为使用 Teleport）
.node-create-menu {
  position: fixed;
  z-index: 9999;
  min-width: 200px;
  max-width: 280px;
  max-height: 400px;
  overflow-y: auto;
  padding: 0;
  border-radius: var(--radius-lg);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  animation: menuFadeIn 0.15s ease-out;

  .menu-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: var(--space-sm) var(--space-md);
    border-bottom: 1px solid var(--iot-color-border);
    font-size: 13px;
    font-weight: 500;
    color: var(--iot-color-text-secondary);
  }

  .menu-content {
    padding: var(--space-sm);
  }

  .menu-item {
    padding: var(--space-sm) var(--space-md);
    border-radius: var(--radius-sm);
    border-left: 3px solid var(--iot-color-primary);
    cursor: pointer;
    transition: all 0.15s ease-out;
    margin-bottom: var(--space-xs);

    &:hover {
      background: var(--iot-glass-bg-hover);
      transform: translateX(2px);
    }

    &:last-child {
      margin-bottom: 0;
    }

    .item-name {
      display: block;
      font-size: 13px;
      font-weight: 500;
      color: var(--iot-color-text-primary);
    }

    .item-desc {
      display: block;
      font-size: 11px;
      color: var(--iot-color-text-muted);
      margin-top: 2px;
    }
  }
}

.menu-overlay {
  position: fixed;
  inset: 0;
  z-index: 9998;
  background: transparent;
}

@keyframes menuFadeIn {
  from {
    opacity: 0;
    transform: translateY(-8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes executedFlow {
  from {
    stroke-dashoffset: 0;
  }
  to {
    stroke-dashoffset: -24;
  }
}
</style>
