<script setup lang="ts">
/**
 * 规则链节点配置面板
 * 统一管理所有节点类型的配置界面
 */
import type { CascaderNode, CascaderProps, Resolve } from 'element-plus/es/components/cascader-panel'
import type {
  Device,
  MessageReceive,
  Product,
  ProductType,
  PushConfig,
  RuleNode,
  RuleSourceType,
  TslEvent,
  TslProperty,
} from '@/types/api'
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  deviceListApi,
  productListApi,
  ruleChainTemplateVariablesApi,
  type RuleTemplateVariable,
} from '@/api/index'
import VariableInserter from './VariableInserter.vue'

// ============================================================================
// 类型定义
//
// 注意：EditorNode / EditorNodeConfig 与 editor/index.vue 中的同名接口保持一致。
// SFC 之间无法互相导出类型（`<script setup>` 不允许 export），
// 故这里各留一份；如需共享应抽到 src/types 下（本次改造范围之外）。
// ============================================================================

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
 * 基于后端 `RuleNode`，坐标在前端始终维护（必填），并补上前端的 `color` 字段。
 * `type` 沿用后端的 `string`（不收窄成 `RuleNodeType`），以免前端自定义节点类型报错。
 */
interface EditorNode extends Omit<RuleNode, 'config' | 'x' | 'y'> {
  x: number
  y: number
  config: EditorNodeConfig
  color: string
}

/** 规则链（面板只用到级联选择的辅助字段） */
interface RuleChainForm {
  id?: number | null
  name?: string
  description?: string
  sourceType?: RuleSourceType
  sourceId?: number | null
  productTypeId?: number | null
  productId?: number | null
  isRoot?: boolean
  isEnabled?: boolean
}

/** 级联选择器的候选项 */
interface CascadeOption extends Record<string, unknown> {
  id: number
  name: string
  leaf: boolean
}

/**
 * 变量插入器的目标元素。
 *
 * 与 VariableInserter.vue 中的同名接口保持一致（SFC 之间无法互相导出类型）。
 */
interface VariableInsertTarget {
  input?: HTMLInputElement
  textarea?: HTMLTextAreaElement
  $el?: Element & { querySelector?: (selectors: string) => Element | null }
}

interface Props {
  /** 当前选中的节点 */
  selectedNode?: EditorNode | null
  /** 规则链 */
  ruleChain?: RuleChainForm
  /** 物模型属性列表 */
  tslProperties?: TslProperty[]
  /** 物模型事件列表 */
  tslEvents?: TslEvent[]
  /** 上游输入节点 */
  upstreamNode?: EditorNode | null
  /** 产品列表 */
  productOptions?: Product[]
  /** 产品类型列表 */
  productTypeOptions?: ProductType[]
  /** 消息接收配置列表 */
  messageReceiveOptions?: MessageReceive[]
  /** 推送配置列表 */
  pushConfigOptions?: PushConfig[]
  /** 设备列表 */
  deviceOptions?: Device[]
}

const props = withDefaults(defineProps<Props>(), {
  selectedNode: null,
  ruleChain: () => ({}),
  tslProperties: () => [],
  tslEvents: () => [],
  upstreamNode: null,
  productOptions: () => [],
  productTypeOptions: () => [],
  messageReceiveOptions: () => [],
  pushConfigOptions: () => [],
  deviceOptions: () => [],
})

const emit = defineEmits<{
  'update:node': [node: EditorNode]
}>()

const { t } = useI18n()

// 本地节点配置
const config = computed<EditorNodeConfig>(() => props.selectedNode?.config || {})
const propertyThresholdValue = computed<number | null | undefined>(() =>
  config.value.value as number | null | undefined,
)
const eventThresholdValue = computed<string | number | undefined>(() =>
  config.value.value as string | number | undefined,
)

// ==================== 模板变量 ====================
const templateVariables = ref<RuleTemplateVariable[]>([])
const loadingVariables = ref(false)

// 加载模板变量
async function loadTemplateVariables() {
  const productId = props.ruleChain.productId
  if (!productId) {
    templateVariables.value = []
    return
  }
  loadingVariables.value = true
  try {
    const { data } = await ruleChainTemplateVariablesApi(productId)
    templateVariables.value = data || []
  }
  catch (e) {
    console.error(t('ruleChain.failed_load_template_variables'), e)
    templateVariables.value = []
  }
  finally {
    loadingVariables.value = false
  }
}

// 监听产品ID变化
watch(() => props.ruleChain.productId, () => {
  loadTemplateVariables()
}, { immediate: true })

// 系统变量列表
const systemVariables = computed(() =>
  templateVariables.value.filter(v => v.category === 'SYSTEM'),
)

// 属性变量列表
const propertyVariables = computed(() =>
  templateVariables.value.filter(v => v.category === 'PROPERTY'),
)

// 输入框 ref 集合（用于光标位置插入）
const alarmMessageRef = ref<VariableInsertTarget | null>(null)
const outputTitleRef = ref<VariableInsertTarget | null>(null)
const outputContentRef = ref<VariableInsertTarget | null>(null)
const httpBodyRef = ref<VariableInsertTarget | null>(null)
const mqttPayloadRef = ref<VariableInsertTarget | null>(null)
const cmdParamsRef = ref<VariableInsertTarget | null>(null)
const filterScriptRef = ref<VariableInsertTarget | null>(null)

// ==================== 计算属性 ====================

// 可用属性列表（考虑上游节点过滤）
const availableProperties = computed<TslProperty[]>(() => {
  const upstream = props.upstreamNode
  const identifiers = upstream?.config?.identifiers
  if (upstream?.type === 'INPUT_PROPERTY' && identifiers && identifiers.length > 0) {
    return props.tslProperties.filter(
      prop => prop.identifier !== undefined && identifiers.includes(prop.identifier),
    )
  }
  return props.tslProperties
})

// 可用事件列表（考虑上游节点过滤）
const availableEvents = computed<TslEvent[]>(() => {
  const upstream = props.upstreamNode
  const identifiers = upstream?.config?.identifiers
  if (upstream?.type === 'INPUT_EVENT' && identifiers && identifiers.length > 0) {
    return props.tslEvents.filter(
      event => event.identifier !== undefined && identifiers.includes(event.identifier),
    )
  }
  return props.tslEvents
})

// 选中的属性
const selectedProperty = computed<TslProperty | null>(() => {
  if (!config.value.identifier)
    return null
  return availableProperties.value.find(
    prop => prop.identifier === config.value.identifier,
  ) ?? null
})

// 选中的事件
const selectedEvent = computed<TslEvent | null>(() => {
  if (!config.value.identifier)
    return null
  return availableEvents.value.find(
    event => event.identifier === config.value.identifier,
  ) ?? null
})

// 选中的事件参数
const selectedEventParam = computed<TslProperty | null>(() => {
  if (!config.value.paramIdentifier || !selectedEvent.value)
    return null
  return selectedEvent.value.outputParams?.find(
    param => param.identifier === config.value.paramIdentifier,
  ) ?? null
})

/**
 * 数据类型名称。
 *
 * 物模型里的 `dataType` 在旧结构中是对象（含 name / type），在新结构中是数字枚举；
 * 这里按前端展示需要取出对象形态的 name。
 */
function readDataTypeName(dataType: unknown): string | undefined {
  const typed = dataType as { name?: string } | undefined
  return typed?.name
}

// 选中属性的数据类型名称
const selectedPropertyDataTypeName = computed<string | undefined>(() =>
  readDataTypeName(selectedProperty.value?.dataType),
)

// 选中事件参数的数据类型名称
const selectedEventParamDataTypeName = computed<string | undefined>(() =>
  readDataTypeName(selectedEventParam.value?.dataType),
)

// 属性阈值是否有 min/max
const propertyMin = computed<number | null>(() => {
  const v = selectedProperty.value?.min as number | string | null | undefined
  return v === null || v === undefined || v === '' ? null : Number(v)
})
const propertyMax = computed<number | null>(() => {
  const v = selectedProperty.value?.max as number | string | null | undefined
  return v === null || v === undefined || v === '' ? null : Number(v)
})
const propertyStep = computed<number>(() => {
  const dataType = selectedProperty.value?.dataType as unknown as { type?: string } | undefined
  const typeName = dataType?.type
  return typeName === 'int' || typeName === 'INT' || typeName === 'long' ? 1 : 0.1
})

// ==================== 操作符选项 ====================

const propertyOperatorOptions = [
  { label: t('ruleChain.greater_than'), value: 'GT' },
  { label: t('ruleChain.greater_than_equal'), value: 'GE' },
  { label: t('ruleChain.equal'), value: 'EQ' },
  { label: t('ruleChain.less_than'), value: 'LT' },
  { label: t('ruleChain.less_than_equal'), value: 'LE' },
  { label: t('ruleChain.rule_chain_editor_nodeconfigpanel'), value: 'NE' },
]

const eventOperatorOptions = propertyOperatorOptions

// ==================== 工具函数 ====================

/** 合并节点配置后回传（selectedNode 为空时按空节点处理） */
function emitNode(config: EditorNodeConfig) {
  emit('update:node', {
    ...(props.selectedNode as EditorNode),
    config,
  })
}

function updateConfig(key: string, value: unknown) {
  emitNode({
    ...config.value,
    [key]: value,
  })
}

// 更新节点名称
function updateNodeName(name: string) {
  emit('update:node', {
    ...(props.selectedNode as EditorNode),
    name,
  })
}

// 当选择新事件时，清除参数相关配置
function onEventIdentifierChange(value: unknown) {
  const newConfig: EditorNodeConfig = { ...config.value, identifier: value as string }
  delete newConfig.paramIdentifier
  delete newConfig.operator
  delete newConfig.value
  emitNode(newConfig)
}

// 设备级联选择器配置（懒加载）
const deviceCascadeProps: CascaderProps = {
  lazy: true,
  value: 'id',
  label: 'name',
  async lazyLoad(node: CascaderNode, resolve: Resolve) {
    const { level, value } = node
    const id = value as number
    if (level === 0) {
      resolve((props.productTypeOptions || []).map(pt => ({
        id: pt.id,
        name: pt.name,
        leaf: false,
      })))
    }
    else if (level === 1) {
      try {
        const response = await productListApi({ productTypeId: id })
        const products = (response.data || []).map((p): CascadeOption => ({
          id: p.id,
          name: p.model || p.manufacturer || t('ruleChain.product_id', { id: p.id }),
          leaf: false,
        }))
        resolve(products)
      }
      catch (e) {
        console.error('Failed to load products:', e)
        resolve([])
      }
    }
    else if (level === 2) {
      try {
        const { data } = await deviceListApi({ productId: id })
        const devices = (data || []).map((d): CascadeOption => ({
          id: d.id,
          name: d.deviceName,
          leaf: true,
        }))
        resolve(devices)
      }
      catch {
        resolve([])
      }
    }
    else {
      resolve([])
    }
  },
}

function getDeviceCascadeValue() {
  const cfg = config.value
  if (cfg.targetDeviceId) {
    return [cfg.targetProductTypeId, cfg.targetProductId, cfg.targetDeviceId].filter(Boolean)
  }
  return []
}

function onDeviceCascadeChange(value: unknown) {
  const path = Array.isArray(value) ? (value as unknown[]) : []
  if (!value || path.length < 3) {
    const newConfig = { ...config.value }
    delete newConfig.targetProductTypeId
    delete newConfig.targetProductId
    delete newConfig.targetDeviceId
    emitNode(newConfig)
    return
  }
  emitNode({
    ...config.value,
    targetProductTypeId: path[0] as number,
    targetProductId: path[1] as number,
    targetDeviceId: path[2] as number,
  })
}
</script>

<template>
  <div v-if="selectedNode" class="node-config-panel">
    <!-- 节点名称 -->
    <el-form label-width="80px" size="small">
      <el-form-item :label="t('ruleChain.node_name')">
        <el-input
          :model-value="selectedNode.name"
          @update:model-value="updateNodeName($event)"
        />
      </el-form-item>

      <!-- ==================== 输入节点配置 ==================== -->

      <!-- 属性上报输入节点 -->
      <template v-if="selectedNode.type === 'INPUT_PROPERTY'">
        <el-form-item :label="t('ruleChain.listen_properties')">
          <el-select
            :model-value="config.identifiers"
            multiple
            filterable
            collapse-tags
            collapse-tags-tooltip
            :placeholder="t('ruleChain.leave_empty_listen_all_properties')"
            :disabled="!ruleChain.productId"
            @update:model-value="updateConfig('identifiers', $event)"
          >
            <el-option
              v-for="prop in tslProperties"
              :key="prop.identifier"
              :label="`${prop.name} (${prop.identifier})`"
              :value="prop.identifier!"
            />
          </el-select>
          <div v-if="!ruleChain.productId" class="form-tip warn">
            {{ t('ruleChain.select_product_left_first') }}
          </div>
          <div v-else class="form-tip">
            {{ t('ruleChain.selected_listen_all_property_reports') }}
          </div>
        </el-form-item>
      </template>

      <!-- 事件上报输入节点 -->
      <template v-if="selectedNode.type === 'INPUT_EVENT'">
        <el-form-item :label="t('ruleChain.listen_events')">
          <el-select
            :model-value="config.identifiers"
            multiple
            filterable
            collapse-tags
            collapse-tags-tooltip
            :placeholder="t('ruleChain.leave_empty_listen_all_events')"
            :disabled="!ruleChain.productId"
            @update:model-value="updateConfig('identifiers', $event)"
          >
            <el-option
              v-for="event in tslEvents"
              :key="event.identifier"
              :label="`${event.name} (${event.identifier})`"
              :value="event.identifier!"
            />
          </el-select>
          <div v-if="!ruleChain.productId" class="form-tip warn">
            {{ t('ruleChain.select_product_left_first') }}
          </div>
          <div v-else class="form-tip">
            {{ t('ruleChain.selected_listen_all_event_reports') }}
          </div>
        </el-form-item>
      </template>

      <!-- 设备上下线节点 -->
      <template v-if="selectedNode.type === 'INPUT_ONLINE'">
        <el-form-item :label="t('ruleChain.event_type')">
          <el-select
            :model-value="config.onlineStatus"
            :placeholder="t('ruleChain.select_online_offline_event')"
            @update:model-value="updateConfig('onlineStatus', $event)"
          >
            <el-option :label="t('ruleChain.device_online')" value="online" />
            <el-option :label="t('ruleChain.device_offline')" value="offline" />
            <el-option :label="t('ruleChain.all_online_offline')" value="all" />
          </el-select>
          <div class="form-tip">
            {{ t('ruleChain.listen_online_offline_events_rule_chain_products_devices') }}
          </div>
        </el-form-item>
      </template>

      <!-- 定时触发节点 -->
      <template v-if="selectedNode.type === 'INPUT_SCHEDULE'">
        <el-form-item label="Cron 表达式">
          <el-input
            :model-value="config.cron"
            placeholder="0 */5 * * * ?"
            @update:model-value="updateConfig('cron', $event)"
          />
          <div class="form-tip">
            Quartz cron 格式，例如：<code>0 */5 * * * ?</code> 每5分钟触发一次
          </div>
        </el-form-item>
      </template>

      <!-- ==================== 过滤节点配置 ==================== -->

      <!-- 属性条件过滤节点 -->
      <template v-if="selectedNode.type === 'FILTER_PROPERTY'">
        <el-form-item v-if="upstreamNode" :label="t('ruleChain.upstream_node')">
          <div class="upstream-info">
            <el-tag size="small" :type="upstreamNode.type === 'INPUT_PROPERTY' ? 'success' : 'info'">
              {{ upstreamNode.name }}
            </el-tag>
            <span v-if="upstreamNode.config?.identifiers?.length" class="upstream-detail">
              {{ t('ruleChain.filtered_count_properties', { count: upstreamNode.config.identifiers.length }) }}
            </span>
          </div>
        </el-form-item>

        <el-form-item :label="t('ruleChain.select_property')">
          <el-select
            :model-value="config.identifier"
            :placeholder="t('ruleChain.select_product_first')"
            filterable
            :disabled="!ruleChain.productId"
            @update:model-value="updateConfig('identifier', $event)"
          >
            <el-option
              v-for="prop in availableProperties"
              :key="prop.identifier"
              :label="`${prop.name} (${prop.identifier})`"
              :value="prop.identifier!"
            >
              <span>{{ prop.name }}</span>
              <span class="opt-meta">{{ prop.identifier }}</span>
            </el-option>
          </el-select>
          <div v-if="!ruleChain.productId" class="form-tip warn">
            {{ t('ruleChain.select_product_left_first') }}
          </div>
          <div v-else-if="upstreamNode?.config?.identifiers?.length" class="form-tip">
            {{ t('ruleChain.property_list_comes_from_upstream_node_name_filters', { name: upstreamNode.name }) }}
          </div>
        </el-form-item>

        <el-form-item :label="t('ruleChain.operator')">
          <el-select :model-value="config.operator" :placeholder="t('ruleChain.select_comparison_operator')" @update:model-value="updateConfig('operator', $event)">
            <el-option
              v-for="op in propertyOperatorOptions"
              :key="op.value"
              :label="op.label"
              :value="op.value"
            />
          </el-select>
        </el-form-item>

        <el-form-item :label="t('ruleChain.threshold')">
          <el-input-number
            :model-value="propertyThresholdValue"
            :min="propertyMin ?? undefined"
            :max="propertyMax ?? undefined"
            :step="propertyStep"
            :placeholder="t('ruleChain.selectedproperty_unit_selectedproperty_unit')"
            style="width: 100%"
            @update:model-value="updateConfig('value', $event)"
          />
          <div v-if="selectedProperty && (propertyMin !== null || propertyMax !== null)" class="form-tip">
            <span v-if="propertyMin !== null">{{ t('ruleChain.min_value', { value: propertyMin }) }}</span>
            <span v-if="propertyMin !== null && propertyMax !== null"> · </span>
            <span v-if="propertyMax !== null">{{ t('ruleChain.max_value', { value: propertyMax }) }}</span>
            <span v-if="selectedProperty.unit"> · {{ t('ruleChain.unit_value', { value: selectedProperty.unit }) }}</span>
          </div>
        </el-form-item>

        <!-- 属性详细信息 -->
        <el-form-item v-if="selectedProperty" :label="t('ruleChain.property_info')">
          <div class="property-info">
            <span class="info-chip">{{ selectedPropertyDataTypeName }}</span>
            <span v-if="selectedProperty.unit" class="info-chip">{{ t('ruleChain.unit_value', { value: selectedProperty.unit }) }}</span>
            <span v-if="selectedProperty.accessMode" class="info-chip">{{ selectedProperty.accessMode }}</span>
          </div>
        </el-form-item>
      </template>

      <!-- 事件类型过滤节点 -->
      <template v-if="selectedNode.type === 'FILTER_EVENT_TYPE'">
        <el-form-item v-if="upstreamNode" :label="t('ruleChain.upstream_node')">
          <div class="upstream-info">
            <el-tag size="small" type="success">
              {{ upstreamNode.name }}
            </el-tag>
            <span v-if="upstreamNode.config?.identifiers?.length" class="upstream-detail">
              {{ t('ruleChain.filtered_count_events', { count: upstreamNode.config.identifiers.length }) }}
            </span>
          </div>
        </el-form-item>

        <el-form-item :label="t('ruleChain.select_event')">
          <el-select
            :model-value="config.identifier"
            :placeholder="t('ruleChain.select_product_first')"
            filterable
            clearable
            :disabled="!ruleChain.productId"
            @update:model-value="onEventIdentifierChange"
          >
            <el-option
              v-for="event in availableEvents"
              :key="event.identifier"
              :label="`${event.name} (${event.identifier})`"
              :value="event.identifier!"
            />
          </el-select>
          <div v-if="!ruleChain.productId" class="form-tip warn">
            {{ t('ruleChain.select_product_left_first') }}
          </div>
          <div v-else-if="upstreamNode?.config?.identifiers?.length" class="form-tip">
            {{ t('ruleChain.event_list_comes_from_upstream_node_name_filters', { name: upstreamNode.name }) }}
          </div>
          <div v-else class="form-tip">
            {{ t('ruleChain.selected_all_events_pass') }}
          </div>
        </el-form-item>

        <template v-if="selectedEvent">
          <el-form-item :label="t('ruleChain.event_info')">
            <div class="property-info">
              <span class="info-chip">{{ selectedEvent.eventType }}</span>
              <span v-if="selectedEvent.remark" class="info-chip muted">{{ selectedEvent.remark }}</span>
            </div>
          </el-form-item>

          <el-form-item v-if="selectedEvent.outputParams?.length" :label="t('ruleChain.filter_parameter')">
            <el-select
              :model-value="config.paramIdentifier"
              :placeholder="t('ruleChain.select_parameter_filter')"
              filterable
              clearable
              @update:model-value="updateConfig('paramIdentifier', $event)"
            >
              <el-option
                v-for="param in selectedEvent.outputParams"
                :key="param.identifier"
                :label="`${param.name} (${param.identifier})`"
                :value="param.identifier!"
              />
            </el-select>
            <div class="form-tip">
              {{ t('ruleChain.selected_filter_event_type_only') }}
            </div>
          </el-form-item>

          <template v-if="config.paramIdentifier">
            <el-form-item :label="t('ruleChain.operator')">
              <el-select :model-value="config.operator" :placeholder="t('ruleChain.select_comparison_operator')" @update:model-value="updateConfig('operator', $event)">
                <el-option
                  v-for="op in eventOperatorOptions"
                  :key="op.value"
                  :label="op.label"
                  :value="op.value"
                />
              </el-select>
            </el-form-item>
            <el-form-item :label="t('ruleChain.threshold')">
              <el-input :model-value="eventThresholdValue" :placeholder="t('ruleChain.enter_threshold')" style="width: 100%" @update:model-value="updateConfig('value', $event)" />
            </el-form-item>
            <el-form-item v-if="selectedEventParam" :label="t('ruleChain.parameter_info')">
              <div class="property-info">
                <span class="info-chip">{{ selectedEventParamDataTypeName }}</span>
                <span v-if="selectedEventParam.unit" class="info-chip">{{ t('ruleChain.unit_value', { value: selectedEventParam.unit }) }}</span>
              </div>
            </el-form-item>
          </template>
        </template>
      </template>

      <!-- 脚本过滤节点 -->
      <template v-if="selectedNode.type === 'FILTER_SCRIPT'">
        <el-form-item :label="t('ruleChain.filter_script')">
          <el-input
            ref="filterScriptRef"
            :model-value="config.script"
            type="textarea"
            :rows="8"
            :placeholder="t('ruleChain.true_true_false_false_return_msg_temperature_30')"
            @update:model-value="updateConfig('script', $event)"
          />
          <div class="form-tip">
            {{ t('ruleChain.javascript_true') }} <span class="branch-tag branch-true">True</span> {{ t('ruleChain.false') }} <span class="branch-tag branch-false">False</span> {{ t('ruleChain.branch') }}
          </div>
          <VariableInserter
            :target-ref="filterScriptRef"
            :value="config.script"
            :system-variables="systemVariables"
            :property-variables="propertyVariables"
            :label="t('ruleChain.script_variables')"
            @update="updateConfig('script', $event)"
          />
        </el-form-item>
      </template>

      <!-- ==================== 告警节点配置 ==================== -->

      <!-- 创建告警节点 -->
      <template v-if="selectedNode.type === 'ALARM_CREATE'">
        <el-form-item :label="t('ruleChain.alarm_type')">
          <el-input :model-value="config.alarmType" placeholder="high_temperature" @update:model-value="updateConfig('alarmType', $event)" />
        </el-form-item>
        <el-form-item :label="t('alarm.alarm_name')">
          <el-input :model-value="config.alarmName" :placeholder="t('ruleChain.editor_nodeconfigpanel_devicename')" @update:model-value="updateConfig('alarmName', $event)" />
        </el-form-item>
        <el-form-item :label="t('ruleChain.editor_nodeconfigpanel_rule_chain_editor_nodeconfigpanel')">
          <el-select :model-value="config.severity" @update:model-value="updateConfig('severity', $event)">
            <el-option value="CRITICAL">
              <span class="severity-dot critical" />{{ t('ruleChain.critical') }}
            </el-option>
            <el-option value="MAJOR">
              <span class="severity-dot major" />{{ t('ruleChain.major') }}
            </el-option>
            <el-option value="MINOR">
              <span class="severity-dot minor" />{{ t('ruleChain.minor') }}
            </el-option>
            <el-option value="WARNING">
              <span class="severity-dot warning" />{{ t('ruleChain.warning') }}
            </el-option>
          </el-select>
        </el-form-item>
        <el-form-item :label="t('ruleChain.alarm_message')">
          <el-input
            ref="alarmMessageRef"
            :model-value="config.message"
            type="textarea"
            :rows="3"
            :placeholder="t('ruleChain.devicename_temperature')"
            @update:model-value="updateConfig('message', $event)"
          />
          <VariableInserter
            :target-ref="alarmMessageRef"
            :value="config.message"
            :system-variables="systemVariables"
            :property-variables="propertyVariables"
            @update="updateConfig('message', $event)"
          />
        </el-form-item>
      </template>

      <!-- 清除告警节点 -->
      <template v-if="selectedNode.type === 'ALARM_CLEAR'">
        <el-form-item :label="t('ruleChain.alarm_type')">
          <el-input :model-value="config.alarmType" placeholder="high_temperature" @update:model-value="updateConfig('alarmType', $event)" />
          <div class="form-tip">
            {{ t('ruleChain.leave_empty_clear_all_alarms_device') }}
          </div>
        </el-form-item>
        <el-form-item :label="t('ruleChain.clear_mode')">
          <el-radio-group :model-value="config.clearType" @update:model-value="updateConfig('clearType', $event)">
            <el-radio label="active">
              {{ t('ruleChain.clear_active_alarms_only') }}
            </el-radio>
            <el-radio label="all">
              {{ t('ruleChain.clear_all_related_alarms') }}
            </el-radio>
          </el-radio-group>
        </el-form-item>
      </template>

      <!-- ==================== 输出节点配置 ==================== -->

      <!-- 消息推送节点 -->
      <template v-if="selectedNode.type === 'OUTPUT_MESSAGE'">
        <el-form-item :label="t('ruleChain.message_config')">
          <el-select
            :model-value="config.messageReceiveId"
            :placeholder="t('ruleChain.select_message_config')"
            filterable
            clearable
            @update:model-value="updateConfig('messageReceiveId', $event)"
          >
            <el-option
              v-for="item in messageReceiveOptions"
              :key="item.id"
              :label="t('ruleChain.item_name_item_notifytype_1_item_notifytype_2')"
              :value="item.id"
            />
          </el-select>
          <div v-if="messageReceiveOptions.length === 0" class="form-tip warn">
            {{ t('ruleChain.no_message_config_add_one_message_receiving_first') }}
          </div>
        </el-form-item>

        <el-form-item :label="t('ruleChain.message_title')">
          <el-input
            ref="outputTitleRef"
            :model-value="config.title"
            :placeholder="t('ruleChain.devicename')"
            @update:model-value="updateConfig('title', $event)"
          />
          <VariableInserter
            :target-ref="outputTitleRef"
            :value="config.title"
            :system-variables="systemVariables"
            :property-variables="propertyVariables"
            @update="updateConfig('title', $event)"
          />
        </el-form-item>

        <el-form-item :label="t('ruleChain.message_content')">
          <el-input
            ref="outputContentRef"
            :model-value="config.content"
            type="textarea"
            :rows="4"
            :placeholder="t('ruleChain.devicename_eventtime_value')"
            @update:model-value="updateConfig('content', $event)"
          />
          <VariableInserter
            :target-ref="outputContentRef"
            :value="config.content"
            :system-variables="systemVariables"
            :property-variables="propertyVariables"
            @update="updateConfig('content', $event)"
          />
        </el-form-item>
      </template>

      <!-- HTTP推送节点 -->
      <template v-if="selectedNode.type === 'OUTPUT_HTTP'">
        <el-form-item :label="t('ruleChain.push_config')">
          <el-select
            :model-value="config.pushConfigId"
            :placeholder="t('ruleChain.editor_nodeconfigpanel_http')"
            filterable
            clearable
            @update:model-value="updateConfig('pushConfigId', $event)"
          >
            <el-option
              v-for="item in pushConfigOptions.filter(p => p.type === 'HTTP')"
              :key="item.id"
              :label="item.name"
              :value="item.id"
            >
              <div class="opt-row">
                <span>{{ item.name }}</span>
                <span class="opt-meta">{{ item.httpUrl }}</span>
              </div>
            </el-option>
          </el-select>
          <div v-if="pushConfigOptions.filter(p => p.type === 'HTTP').length === 0" class="form-tip warn">
            {{ t('ruleChain.http') }}
          </div>
          <div v-else class="form-tip">
            {{ t('ruleChain.select_preconfigured_http_push_parameters') }}
          </div>
        </el-form-item>

        <el-form-item :label="t('ruleChain.custom_request_body')">
          <el-input
            ref="httpBodyRef"
            :model-value="config.customBody"
            type="textarea"
            :rows="5"
            placeholder="{ &quot;device&quot;: &quot;${deviceName}&quot;, &quot;value&quot;: ${temperature} }"
            @update:model-value="updateConfig('customBody', $event)"
          />
          <div class="form-tip">
            {{ t('ruleChain.leave_empty_use_default_request_body') }}
          </div>
          <VariableInserter
            :target-ref="httpBodyRef"
            :value="config.customBody"
            :system-variables="systemVariables"
            :property-variables="propertyVariables"
            @update="updateConfig('customBody', $event)"
          />
        </el-form-item>
      </template>

      <!-- MQTT推送节点 -->
      <template v-if="selectedNode.type === 'OUTPUT_MQTT'">
        <el-form-item :label="t('ruleChain.push_config')">
          <el-select
            :model-value="config.pushConfigId"
            :placeholder="t('ruleChain.select_mqtt_push_config')"
            filterable
            clearable
            @update:model-value="updateConfig('pushConfigId', $event)"
          >
            <el-option
              v-for="item in pushConfigOptions.filter(p => p.type === 'MQTT')"
              :key="item.id"
              :label="item.name"
              :value="item.id"
            >
              <div class="opt-row">
                <span>{{ item.name }}</span>
                <span class="opt-meta">{{ item.mqttTopic }}</span>
              </div>
            </el-option>
          </el-select>
          <div v-if="pushConfigOptions.filter(p => p.type === 'MQTT').length === 0" class="form-tip warn">
            {{ t('ruleChain.mqtt') }}
          </div>
          <div v-else class="form-tip">
            {{ t('ruleChain.editor_nodeconfigpanel_mqtt') }}
          </div>
        </el-form-item>

        <el-form-item :label="t('ruleChain.payload')">
          <el-input
            ref="mqttPayloadRef"
            :model-value="config.customPayload"
            type="textarea"
            :rows="5"
            placeholder="{ &quot;device&quot;: &quot;${deviceName}&quot;, &quot;value&quot;: ${temperature} }"
            @update:model-value="updateConfig('customPayload', $event)"
          />
          <div class="form-tip">
            {{ t('ruleChain.editor_nodeconfigpanel_payload') }}
          </div>
          <VariableInserter
            :target-ref="mqttPayloadRef"
            :value="config.customPayload"
            :system-variables="systemVariables"
            :property-variables="propertyVariables"
            @update="updateConfig('customPayload', $event)"
          />
        </el-form-item>
      </template>

      <!-- 设备指令节点 -->
      <template v-if="selectedNode.type === 'OUTPUT_COMMAND'">
        <el-form-item :label="t('ruleChain.target_device')">
          <el-radio-group :model-value="config.targetMode || 'self'" @update:model-value="updateConfig('targetMode', $event)">
            <el-radio-button label="self">
              {{ t('ruleChain.current_device') }}
            </el-radio-button>
            <el-radio-button label="other">
              {{ t('ruleChain.other_device') }}
            </el-radio-button>
          </el-radio-group>
        </el-form-item>

        <template v-if="config.targetMode === 'other'">
          <el-form-item :label="t('ruleChain.select_device')">
            <el-cascader
              :model-value="getDeviceCascadeValue()"
              :props="deviceCascadeProps"
              :placeholder="t('ruleChain.select_product_type_product_device')"
              filterable
              clearable
              style="width: 100%"
              @update:model-value="onDeviceCascadeChange"
            />
            <div class="form-tip">
              {{ t('ruleChain.select_target_device_command') }}
            </div>
          </el-form-item>
        </template>

        <el-form-item :label="t('ruleChain.command_type')">
          <el-select :model-value="config.commandType" @update:model-value="updateConfig('commandType', $event)">
            <el-option :label="t('ruleChain.service_call')" value="service" />
          </el-select>
          <div class="form-tip">
            {{ t('ruleChain.set_properties_control_functions_by_invoking_device_services') }}
          </div>
        </el-form-item>

        <el-form-item :label="t('ruleChain.service_identifier')">
          <el-input
            :model-value="config.identifier"
            :placeholder="t('ruleChain.identifier_setvalue')"
            @update:model-value="updateConfig('identifier', $event)"
          />
          <div class="form-tip">
            {{ t('ruleChain.service_identifier_defined_tsl_model') }}
          </div>
        </el-form-item>

        <el-form-item :label="t('ruleChain.service_parameters')">
          <el-input
            ref="cmdParamsRef"
            :model-value="config.params"
            type="textarea"
            :rows="4"
            placeholder="{ &quot;value&quot;: 25 }"
            @update:model-value="updateConfig('params', $event)"
          />
          <div class="form-tip">
            {{ t('ruleChain.service_parameters_json_format') }}
          </div>
          <VariableInserter
            :target-ref="cmdParamsRef"
            :value="config.params"
            :system-variables="systemVariables"
            :property-variables="propertyVariables"
            @update="updateConfig('params', $event)"
          />
        </el-form-item>
      </template>
    </el-form>
  </div>
</template>

<style scoped>
.node-config-panel {
  padding: 12px;
}

.upstream-info {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.upstream-detail {
  color: var(--iot-color-text-muted);
  font-size: 12px;
}

.property-info {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.info-chip {
  font-size: 11px;
  padding: 2px 8px;
  background: rgba(99, 102, 241, 0.1);
  color: #4338ca;
  border-radius: 10px;
  line-height: 1.6;

  &.muted {
    background: rgba(0, 0, 0, 0.04);
    color: var(--iot-color-text-secondary);
  }
}

.form-tip {
  margin-top: 4px;
  font-size: 12px;
  color: var(--iot-color-text-muted);
  line-height: 1.5;

  &.warn {
    color: var(--el-color-warning);
  }
}

.opt-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}

.opt-meta {
  color: var(--iot-color-text-muted);
  font-size: 11px;
  font-family: var(--iot-font-mono, ui-monospace, 'SF Mono', Menlo, monospace);
}

/* True/False 分支标签 */
.branch-tag {
  display: inline-block;
  padding: 1px 6px;
  border-radius: 3px;
  font-size: 11px;
  font-weight: 600;
  margin: 0 2px;
}

.branch-true {
  background: rgba(16, 185, 129, 0.15);
  color: #047857;
}

.branch-false {
  background: rgba(239, 68, 68, 0.15);
  color: #b91c1c;
}

/* 严重程度小圆点 */
.severity-dot {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  margin-right: 6px;
  vertical-align: middle;
}

.severity-dot.critical {
  background: #dc2626;
  box-shadow: 0 0 6px rgba(220, 38, 38, 0.5);
}
.severity-dot.major {
  background: #ea580c;
}
.severity-dot.minor {
  background: #ca8a04;
}
.severity-dot.warning {
  background: #2563eb;
}

:global(.dark) {
  .info-chip {
    background: rgba(99, 102, 241, 0.2);
    color: #c7d2fe;
    &.muted {
      background: rgba(255, 255, 255, 0.06);
    }
  }
  .branch-true {
    background: rgba(16, 185, 129, 0.25);
    color: #6ee7b7;
  }
  .branch-false {
    background: rgba(239, 68, 68, 0.25);
    color: #fca5a5;
  }
}
</style>
