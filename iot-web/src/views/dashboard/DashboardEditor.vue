<script setup lang="ts">
import type { DefineComponent } from 'vue'
import type { AlarmSeverity, Dashboard, Device, ModelProperty, Product, ProductType } from '@/types/api'
import type { BaseResult } from '@/types/common'
import {
  ArrowLeft,
  Check,
  Delete,
  Setting,
} from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
/**
 * DashboardEditor - 拖拽式仪表盘编辑器
 * 使用 vue-grid-layout 实现拖拽缩放, 右侧面板配置 widget 属性
 */
import { computed, onMounted, ref, watch } from 'vue'
import { GridItem, GridLayout, type GridLayoutProps } from 'vue-grid-layout'
import { useRoute, useRouter } from 'vue-router'
import { dashboardDelete, dashboardGet, dashboardSave, dashboardUpdate } from '@/api/dashboard'
import { deviceListApi, productListApi, productTypeListApi } from '@/api/index'
import request from '@/utils/request'
import WidgetRenderer from './WidgetRenderer.vue'

/* eslint-disable vue/no-export-in-script-setup -- vue-grid-layout 具名导出的类型补丁（模块增强） */
/**
 * `vue-grid-layout` 的本地类型补丁（src/types/shims.d.ts）只声明了默认导出，
 * 而上游 3.0.0-beta1 的产物同时提供 GridLayout / GridItem 两个具名导出。
 * 这里补上具名导出的声明，运行时导入路径与代码完全不变。
 */
declare module 'vue-grid-layout' {
  export const GridLayout: DefineComponent<GridLayoutProps>
  export const GridItem: DefineComponent<{
    x?: number
    y?: number
    w?: number
    h?: number
    i?: string
  }>
}
/* eslint-enable vue/no-export-in-script-setup */

/** 支持的组件类型 */
type WidgetType =
  | 'line-chart'
  | 'gauge'
  | 'value-card'
  | 'data-table'
  | 'bar-chart'
  | 'device-grid'
  | 'alarm-list'

/** 组件配置 */
interface WidgetConfig {
  /** 组件类型 */
  type?: WidgetType
  /** 组件标题（配置面板里可覆盖） */
  title?: string
  /** 关联产品 ID */
  productId?: number | null
  /** 设备 Key */
  deviceKey?: string
  /** 属性标识符 */
  identifier?: string
  /** 时间范围（小时） */
  timeRange?: number
  /** 单位 */
  unit?: string
  /** 仪表盘最小值 */
  min?: number
  /** 仪表盘最大值 */
  max?: number
  /** 告警级别过滤 */
  severity?: AlarmSeverity
}

/** 仪表盘组件（同时也是 vue-grid-layout 的布局项） */
interface DashboardWidget {
  /** vue-grid-layout 的布局项 ID */
  i: string
  x: number
  y: number
  w: number
  h: number
  /** 组件标题 */
  title?: string
  /** 组件类型（与 config.type 二选一，config 优先） */
  type?: WidgetType
  /** 组件配置（编辑器创建的组件必带 config） */
  config: WidgetConfig
}

/** 编辑器中的仪表盘草稿：后端实体的可编辑部分（createTime / updateTime 会随实体回填） */
interface DashboardDraft {
  id: number | null
  name: string
  description?: string
  isDefault?: boolean
  createTime?: string
  updateTime?: string
  layout: DashboardWidget[]
}

const route = useRoute()
const router = useRouter()
const loading = ref(false)
const saving = ref(false)
const dashboard = ref<DashboardDraft>({ id: null, name: '', description: '', layout: [] })
const selectedWidgetIdx = ref<number | null>(null)

// ponytail: 12列网格, 行高按容器自适应
const colNum = 12
const rowHeight = 60

const widgetTypes: Array<{ type: WidgetType, label: string, icon: string }> = [
  { type: 'line-chart', label: '折线图', icon: '📈' },
  { type: 'gauge', label: '仪表盘', icon: '⏱' },
  { type: 'value-card', label: '数值卡', icon: '🔢' },
  { type: 'data-table', label: '数据表', icon: '📋' },
  { type: 'bar-chart', label: '柱状图', icon: '📊' },
  { type: 'device-grid', label: '设备状态网格', icon: '🔲' },
  { type: 'alarm-list', label: '告警列表', icon: '🚨' },
]

/** 需要配置「时间范围」的组件类型 */
const TIME_RANGE_WIDGET_TYPES: WidgetType[] = ['line-chart', 'bar-chart', 'data-table']

const selectedWidget = computed<DashboardWidget | null>(() => {
  if (selectedWidgetIdx.value === null)
    return null
  return dashboard.value.layout[selectedWidgetIdx.value] || null
})

// 级联选择数据
const productTypes = ref<ProductType[]>([])
const products = ref<Product[]>([])
const devices = ref<Device[]>([])
const properties = ref<ModelProperty[]>([])
const filterProductTypeId = ref<number | null>(null)

const filteredProducts = computed(() => {
  if (!filterProductTypeId.value)
    return products.value
  return products.value.filter(p => p.productTypeId === filterProductTypeId.value)
})

async function loadProductTypes() {
  const res = await productTypeListApi({})
  productTypes.value = res.data || []
}

async function loadProducts() {
  const res = await productListApi({})
  products.value = res.data || []
}

async function loadDevices(productsId: number) {
  if (!productsId) {
    devices.value = []
    return
  }
  const res = await deviceListApi({ productId: productsId })
  devices.value = res.data || []
}

async function loadProperties(productId: number) {
  if (!productId) {
    properties.value = []
    return
  }
  const product = products.value.find(p => p.id === productId)
  if (!product)
    return
  const res = await request<BaseResult<ModelProperty[]>>({
    url: '/model/property/product/type',
    method: 'get',
    params: { productTypeId: product.productTypeId, productId, all: true },
  })
  properties.value = res.data || []
}

function onProductChange(productId: number | null) {
  const widget = selectedWidget.value
  if (!widget)
    return
  widget.config.productId = productId
  widget.config.deviceKey = ''
  widget.config.identifier = ''
  loadDevices(productId as number)
  loadProperties(productId as number)
}

function onDeviceChange(deviceKey: string) {
  const widget = selectedWidget.value
  if (!widget)
    return
  widget.config.deviceKey = deviceKey
}

function onPropertyChange(identifier: string) {
  const widget = selectedWidget.value
  if (!widget)
    return
  widget.config.identifier = identifier
}

watch(selectedWidgetIdx, async (idx) => {
  if (idx === null)
    return
  const cfg = dashboard.value.layout[idx]?.config
  if (!cfg)
    return
  if (cfg.productId) {
    await Promise.all([loadDevices(cfg.productId), loadProperties(cfg.productId)])
  }
})

function addWidget(type: WidgetType) {
  const idx = dashboard.value.layout.length
  dashboard.value.layout.push({
    i: `w-${Date.now()}`,
    x: (idx * 2) % colNum,
    y: Infinity, // 放到底部
    w: type === 'value-card' ? 3 : (type === 'device-grid' || type === 'alarm-list' ? 6 : 6),
    h: type === 'value-card' ? 2 : (type === 'device-grid' || type === 'alarm-list' ? 5 : 4),
    title: widgetTypes.find(w => w.type === type)?.label || type,
    config: {
      type,
      productId: null,
      deviceKey: '',
      identifier: '',
      timeRange: 1,
      unit: '',
      min: 0,
      max: 100,
    },
  })
  selectedWidgetIdx.value = idx
}

function removeWidget(idx: number) {
  dashboard.value.layout.splice(idx, 1)
  if (selectedWidgetIdx.value === idx)
    selectedWidgetIdx.value = null
  else if (selectedWidgetIdx.value !== null && selectedWidgetIdx.value > idx)
    selectedWidgetIdx.value--
}

function onLayoutUpdated(newLayout: DashboardWidget[]) {
  // vue-grid-layout 的 layout-updated 事件回传的就是 layout 数组本身（原地修改 x/y/w/h），
  // 组件自定义字段（title / config）都还在同一个对象上
  dashboard.value.layout = newLayout
}

async function loadDashboard() {
  const rawId = route.params.id
  if (!rawId)
    return
  // 路由参数是字符串，接口路径拼接时同样会被隐式转成字符串，这里保持原有传参方式
  const id = rawId as unknown as number
  loading.value = true
  try {
    const res = await dashboardGet(id)
    if (res?.data) {
      const data = res.data
      dashboard.value = {
        ...data,
        id: data.id,
        name: data.name,
        description: data.description,
        layout: (data.layout ?? []) as unknown as DashboardWidget[],
      }
      if (!dashboard.value.layout)
        dashboard.value.layout = []
    }
  }
  finally {
    loading.value = false
  }
}

async function onSave() {
  if (!dashboard.value.name?.trim()) {
    ElMessage.warning('请输入仪表盘名称')
    return
  }
  saving.value = true
  try {
    const fn = dashboard.value.id ? dashboardUpdate : dashboardSave
    await fn(dashboard.value as unknown as Dashboard)
    // ponytail: save API returns Boolean; for new dashboards, re-fetch list to get the id
    if (!dashboard.value.id) {
      ElMessage.success('保存成功')
      // reload list to find the new dashboard by name
      const listRes = await import('@/api/dashboard').then(m => m.dashboardList())
      const found = (listRes?.data || []).find(d => d.name === dashboard.value.name)
      if (found) {
        dashboard.value.id = found.id
      }
    }
    else {
      ElMessage.success('保存成功')
    }
  }
  catch {
    ElMessage.error('保存失败')
  }
  finally {
    saving.value = false
  }
}

async function onDelete() {
  if (!dashboard.value.id)
    return
  await ElMessageBox.confirm('确认删除该仪表盘?', '提示', { type: 'warning' })
  await dashboardDelete(dashboard.value.id)
  ElMessage.success('已删除')
  router.push('/dashboard')
}

onMounted(() => {
  loadDashboard()
  loadProducts()
  loadProductTypes()
})
</script>

<template>
  <div v-loading="loading" class="dashboard-editor">
    <!-- 顶部工具栏 -->
    <div class="editor-toolbar glass-card">
      <div class="toolbar-left">
        <el-button :icon="ArrowLeft" text @click="$router.push('/dashboard')" />
        <el-input
          v-model="dashboard.name"
          placeholder="仪表盘名称"
          style="width: 200px"
          size="small"
        />
      </div>
      <div class="toolbar-right">
        <el-button link type="danger" :icon="Delete" size="small" :disabled="!dashboard.id" @click="onDelete">
          删除
        </el-button>
        <el-button link type="primary" :icon="Check" size="small" :loading="saving" @click="onSave">
          保存
        </el-button>
      </div>
    </div>

    <div class="editor-body">
      <!-- 左侧: 组件库 -->
      <div class="widget-palette glass-card">
        <div class="palette-title">
          组件库
        </div>
        <div
          v-for="wt in widgetTypes"
          :key="wt.type"
          class="palette-item"
          @click="addWidget(wt.type)"
        >
          <span class="palette-icon">{{ wt.icon }}</span>
          <span>{{ wt.label }}</span>
        </div>
      </div>

      <!-- 中间: 画布 -->
      <div class="canvas-area glass-card">
        <GridLayout
          :layout="dashboard.layout"
          :col-num="colNum"
          :row-height="rowHeight"
          :is-draggable="true"
          :is-resizable="true"
          :vertical-compact="true"
          :margin="[8, 8]"
          @layout-updated="onLayoutUpdated"
        >
          <GridItem
            v-for="(item, idx) in dashboard.layout"
            :key="item.i"
            :x="item.x"
            :y="item.y"
            :w="item.w"
            :h="item.h"
            :i="item.i"
            @click="selectedWidgetIdx = idx"
          >
            <div
              class="widget-card"
              :class="{ selected: selectedWidgetIdx === idx }"
            >
              <div class="widget-header">
                <span class="widget-title">{{ item.title }}</span>
                <el-button
                  :icon="Delete"
                  text
                  size="small"
                  class="widget-delete"
                  @click.stop="removeWidget(idx)"
                />
              </div>
              <div class="widget-body">
                <WidgetRenderer :widget="item" />
              </div>
            </div>
          </GridItem>
        </GridLayout>
        <div v-if="dashboard.layout.length === 0" class="empty-canvas">
          <el-empty description="从左侧拖入组件开始构建仪表盘" />
        </div>
      </div>

      <!-- 右侧: 属性面板 -->
      <div class="config-panel glass-card">
        <div class="panel-title">
          <el-icon><Setting /></el-icon>
          组件配置
        </div>
        <template v-if="selectedWidget">
          <el-form label-width="80px" size="small">
            <el-form-item label="标题">
              <el-input v-model="selectedWidget.title" />
            </el-form-item>
            <el-form-item label="产品类型">
              <el-select
                v-model="filterProductTypeId"
                placeholder="全部类型"
                clearable
                filterable
                style="width: 100%"
              >
                <el-option
                  v-for="t in productTypes"
                  :key="t.id"
                  :label="t.name"
                  :value="t.id"
                />
              </el-select>
            </el-form-item>
            <el-form-item label="产品">
              <el-select
                :model-value="selectedWidget.config.productId"
                placeholder="选择产品"
                filterable
                style="width: 100%"
                @change="onProductChange"
              >
                <el-option
                  v-for="p in filteredProducts"
                  :key="p.id"
                  :label="p.model"
                  :value="p.id"
                />
              </el-select>
            </el-form-item>
            <el-form-item label="设备">
              <el-select
                :model-value="selectedWidget.config.deviceKey"
                placeholder="选择设备"
                filterable
                style="width: 100%"
                :disabled="!selectedWidget.config.productId"
                @change="onDeviceChange"
              >
                <el-option
                  v-for="d in devices"
                  :key="d.deviceKey"
                  :label="`${d.deviceName} (${d.deviceKey})`"
                  :value="d.deviceKey"
                />
              </el-select>
            </el-form-item>
            <el-form-item label="属性">
              <el-select
                :model-value="selectedWidget.config.identifier"
                placeholder="选择属性"
                filterable
                style="width: 100%"
                :disabled="!selectedWidget.config.productId"
                @change="onPropertyChange"
              >
                <el-option
                  v-for="p in properties"
                  :key="p.identifier"
                  :label="`${p.name} (${p.identifier})`"
                  :value="p.identifier"
                />
              </el-select>
            </el-form-item>
            <el-form-item v-if="selectedWidget.config.type && TIME_RANGE_WIDGET_TYPES.includes(selectedWidget.config.type)" label="时间范围">
              <el-select v-model="selectedWidget.config.timeRange" style="width: 100%">
                <el-option :value="1" label="最近1小时" />
                <el-option :value="6" label="最近6小时" />
                <el-option :value="24" label="最近24小时" />
                <el-option :value="168" label="最近7天" />
              </el-select>
            </el-form-item>
            <el-form-item v-if="selectedWidget.config.type === 'value-card'" label="单位">
              <el-input v-model="selectedWidget.config.unit" placeholder="°C, %, V..." />
            </el-form-item>
            <el-form-item v-if="selectedWidget.config.type === 'gauge'" label="最小值">
              <el-input-number v-model="selectedWidget.config.min" :controls="false" style="width: 100%" />
            </el-form-item>
            <el-form-item v-if="selectedWidget.config.type === 'gauge'" label="最大值">
              <el-input-number v-model="selectedWidget.config.max" :controls="false" style="width: 100%" />
            </el-form-item>
            <el-form-item v-if="selectedWidget.config.type === 'device-grid'" label="产品">
              <el-select v-model="selectedWidget.config.productId" filterable clearable placeholder="全部产品" style="width: 100%">
                <el-option v-for="p in products" :key="p.id" :label="`${p.manufacturer} ${p.model}`" :value="p.id" />
              </el-select>
            </el-form-item>
            <el-form-item v-if="selectedWidget.config.type === 'alarm-list'" label="告警级别">
              <el-select v-model="selectedWidget.config.severity" clearable placeholder="全部级别" style="width: 100%">
                <el-option value="CRITICAL" label="严重" />
                <el-option value="MAJOR" label="重要" />
                <el-option value="MINOR" label="次要" />
                <el-option value="WARNING" label="警告" />
              </el-select>
            </el-form-item>
          </el-form>
        </template>
        <div v-else class="panel-empty">
          <el-empty description="选择一个组件进行配置" :image-size="60" />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.dashboard-editor {
  display: flex;
  flex-direction: column;
  height: 100%;
  gap: var(--space-sm);
  padding: var(--space-sm);
}

.editor-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-sm) var(--space-md);

  .toolbar-left,
  .toolbar-right {
    display: flex;
    align-items: center;
    gap: var(--space-sm);
  }
}

.editor-body {
  display: flex;
  gap: var(--space-sm);
  flex: 1;
  min-height: 0;
}

.widget-palette {
  width: 150px;
  flex-shrink: 0;
  padding: var(--space-md);

  .palette-title {
    font-size: 11px;
    color: var(--iot-color-text-muted);
    margin-bottom: var(--space-md);
    font-weight: 600;
    letter-spacing: 0.5px;
  }

  .palette-item {
    display: flex;
    align-items: center;
    gap: var(--space-sm);
    padding: var(--space-sm) var(--space-md);
    border-radius: var(--radius-sm);
    cursor: pointer;
    transition: all var(--transition-fast);
    font-size: 13px;
    margin-bottom: 4px;
    color: var(--iot-color-text-secondary);

    &:hover {
      background: var(--iot-glass-bg-hover);
      color: var(--iot-color-primary);
    }

    .palette-icon {
      font-size: 16px;
    }
  }
}

.canvas-area {
  flex: 1;
  min-width: 0;
  overflow: auto;
  position: relative;
  padding: var(--space-sm);
}

.empty-canvas {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.config-panel {
  width: 280px;
  flex-shrink: 0;
  padding: var(--space-md);
  overflow-y: auto;

  .panel-title {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 11px;
    color: var(--iot-color-text-muted);
    margin-bottom: var(--space-md);
    font-weight: 600;
    letter-spacing: 0.5px;
  }

  .panel-empty {
    display: flex;
    justify-content: center;
    padding-top: 40px;
  }
}

.widget-card {
  height: 100%;
  border: 1px solid var(--iot-color-border-light);
  border-radius: var(--radius-sm);
  background: var(--iot-color-bg-card);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  cursor: move;
  transition: border-color var(--transition-fast);

  &.selected {
    border-color: var(--iot-color-primary);
    box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.15);
  }

  .widget-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 6px 10px;
    font-size: 12px;
    font-weight: 600;
    border-bottom: 1px solid var(--iot-color-border-light);
    flex-shrink: 0;
    color: var(--iot-color-text-secondary);

    .widget-delete {
      opacity: 0;
      transition: opacity var(--transition-fast);
    }
  }

  &:hover .widget-delete {
    opacity: 1;
  }

  .widget-body {
    flex: 1;
    min-height: 0;
    padding: 4px;
  }
}
</style>
