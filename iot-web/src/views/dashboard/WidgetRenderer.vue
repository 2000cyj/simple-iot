<script setup lang="ts">
import type { AlarmPage, AlarmSeverity, Device } from '@/types/api'
import dayjs from 'dayjs'
import { BarChart, type BarSeriesOption, GaugeChart, type GaugeSeriesOption, LineChart, type LineSeriesOption } from 'echarts/charts'
import {
  DataZoomComponent,
  type DataZoomComponentOption,
  GridComponent,
  type GridComponentOption,
  LegendComponent,
  type LegendComponentOption,
  TitleComponent,
  type TitleComponentOption,
  TooltipComponent,
  type TooltipComponentOption,
} from 'echarts/components'
import { type ComposeOption, use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
/**
 * WidgetRenderer - 单个仪表盘组件渲染器
 * 支持 4 种类型: line-chart, gauge, value-card, data-table
 * 数据源: 复用现有 /device/data/property/metric + /device/data/property/last
 */
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import VChart from 'vue-echarts'
import { fetchAlarmPage, fetchDeviceList, fetchLatestData, fetchMetric } from '@/api/dashboard'
import IotTable from '@/components/IotTable.vue'
import { useAccountStore } from '@/store/modules/account'
import { normalizePage } from '@/utils/page'

/**
 * 仪表盘组件（widget）的类型契约。
 *
 * 后端 `Dashboard.layout` 的元素是「布局项 + 组件配置」的混合结构，
 * 而后端实体只声明为 `Array<Record<string, unknown>>`（见 @/types/api），
 * 这里在前端补一份精确结构。DashboardEditor / DashboardList 各自持有一份等价定义。
 */

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

/** 遥测曲线上的一个采样点 */
interface MetricDataPoint {
  /** 采样时间 */
  time?: string
  /** 采样值 */
  value: number | string
}

/** websocket 推送报文 */
interface WsMessage {
  /** 频道：telemetry / alarm */
  channel?: string
  /** 遥测数据 */
  data?: {
    deviceKey?: string
    value?: unknown
  }
}

/** 表格列的自定义渲染上下文 */
interface ColumnRenderContext<TRow> {
  row: TRow
  column?: Record<string, unknown>
  $index?: number
}

/**
 * 告警列表行：后端 AlarmPageVo 的时间字段是 createdTime，
 * 但历史代码读的是 createTime（后端并不返回该字段，恒为 undefined）。
 * 为保持运行时行为不变，这里在类型上同时保留两者。
 */
type AlarmListRow = AlarmPage & { createTime?: string }

/** 本组件用到的 echarts 配置（只注册了折线 / 柱状 / 仪表盘与少量组件） */
type WidgetChartOption = ComposeOption<
  LineSeriesOption | GaugeSeriesOption | BarSeriesOption
  | GridComponentOption | TooltipComponentOption | LegendComponentOption
  | TitleComponentOption | DataZoomComponentOption
>

const props = defineProps<{
  widget: DashboardWidget
}>()

// ponytail: single WS connection shared by all widgets on the page.
// In-memory ref, no reconnect logic. If WS fails, 30s polling still runs.
let ws: WebSocket | null = null
function getWs(): WebSocket | null {
  if (ws)
    return ws
  const token = useAccountStore().authorization?.tokenValue
  if (!token)
    return null
  const proto = location.protocol === 'https:' ? 'wss' : 'ws'
  ws = new WebSocket(`${proto}://${location.host}/iot/ws/iot?token=${token}`)
  return ws
}
function onWsMessage(cb: (msg: WsMessage) => void): () => void {
  const conn = getWs()
  if (!conn)
    return () => {}
  const wsListener = (ev: MessageEvent): void => {
    try {
      const msg = JSON.parse(ev.data) as WsMessage
      cb(msg)
    }
    catch {}
  }
  conn.addEventListener('message', wsListener)
  return () => conn.removeEventListener('message', wsListener)
}

use([
  CanvasRenderer,
  LineChart,
  GaugeChart,
  BarChart,
  GridComponent,
  TooltipComponent,
  LegendComponent,
  TitleComponent,
  DataZoomComponent,
])

const loading = ref(false)
const chartData = ref<MetricDataPoint[]>([])
const latestValue = ref<number | string | null>(null)
const latestTime = ref<string | null>(null)
const gridDevices = ref<Device[]>([])
const alarmList = ref<AlarmListRow[]>([])
let timer: ReturnType<typeof setInterval> | null = null
let offWs: (() => void) | null = null

const widgetType = computed<WidgetType | undefined>(() => props.widget?.config?.type || props.widget?.type)
const widgetConfig = computed<WidgetConfig>(() => props.widget?.config || {})
const title = computed<string>(() => props.widget?.title || widgetConfig.value?.title || '')

async function loadData() {
  const cfg = widgetConfig.value
  const type = widgetType.value
  loading.value = true
  try {
    if (type === 'value-card') {
      const res = await fetchLatestData(cfg.deviceKey as string)
      const items = res?.data || []
      const found = items.find(i => i.key === cfg.identifier)
      if (found) {
        latestValue.value = found.value as number | string
        latestTime.value = dayjs().format('HH:mm:ss')
      }
    }
    else if (type === 'device-grid') {
      // 后端 GET /device/list 不分页，page / size 为历史遗留参数
      const listParams = {
        productId: cfg.productId ?? undefined,
        page: 1,
        size: 200,
      }
      const res = await fetchDeviceList(listParams)
      gridDevices.value = normalizePage(res).records
    }
    else if (type === 'alarm-list') {
      const res = await fetchAlarmPage({ page: 1, size: 10, severity: cfg.severity })
      alarmList.value = normalizePage(res).records
    }
    else {
      const now = dayjs()
      const res = await fetchMetric({
        deviceKey: cfg.deviceKey as string,
        identifier: cfg.identifier as string,
        beginTime: now.subtract(cfg.timeRange || 1, 'hour').format('YYYY-MM-DD HH:mm:ss'),
        endTime: now.format('YYYY-MM-DD HH:mm:ss'),
      })
      // 后端 /device/data/property/metric 返回 [{ time, value }]，
      // 但 @/api/dashboard 的类型只声明成 KeyValue<string, unknown>[]，此处按实际结构收敛
      chartData.value = (res?.data || []) as unknown as MetricDataPoint[]
    }
  }
  catch {
    // 静默,仪表盘组件不应弹 toast
  }
  finally {
    loading.value = false
  }
}

const chartOption = computed<WidgetChartOption>(() => {
  const cfg = widgetConfig.value
  const type = widgetType.value

  if (type === 'line-chart') {
    return {
      title: { text: title.value, left: 'center', textStyle: { fontSize: 13 } },
      tooltip: { trigger: 'axis' },
      grid: { left: 50, right: 20, top: 40, bottom: 30 },
      xAxis: {
        type: 'category',
        data: chartData.value.map(d => dayjs(d.time).format('HH:mm')),
        axisLabel: { fontSize: 10 },
      },
      yAxis: { type: 'value', scale: true, axisLabel: { fontSize: 10 } },
      series: [{
        name: cfg.identifier || 'value',
        type: 'line',
        smooth: true,
        showSymbol: false,
        data: chartData.value.map(d => d.value),
        lineStyle: { width: 2 },
        areaStyle: { opacity: 0.1 },
      }],
    }
  }

  if (type === 'gauge') {
    const val = latestValue.value ?? 0
    return {
      series: [{
        type: 'gauge',
        min: cfg.min ?? 0,
        max: cfg.max ?? 100,
        progress: { show: true, width: 12 },
        axisLine: { lineStyle: { width: 12 } },
        detail: { valueAnimation: true, formatter: '{value}', fontSize: 24, offsetCenter: [0, '70%'] },
        title: { offsetCenter: [0, '90%'], fontSize: 12 },
        data: [{ value: val as number, name: cfg.identifier || title.value }],
      }],
    }
  }

  if (type === 'bar-chart') {
    return {
      title: { text: title.value, left: 'center', textStyle: { fontSize: 13 } },
      tooltip: { trigger: 'axis' },
      grid: { left: 50, right: 20, top: 40, bottom: 30 },
      xAxis: {
        type: 'category',
        data: chartData.value.map(d => dayjs(d.time).format('HH:mm')),
        axisLabel: { fontSize: 10 },
      },
      yAxis: { type: 'value', scale: true, axisLabel: { fontSize: 10 } },
      series: [{
        name: cfg.identifier || 'value',
        type: 'bar',
        data: chartData.value.map(d => d.value),
        itemStyle: { borderRadius: [3, 3, 0, 0] },
      }],
    }
  }

  return {}
})

onMounted(() => {
  loadData()
  // ponytail: WS for instant updates, 30s poll as fallback
  timer = setInterval(loadData, 30000)
  offWs = onWsMessage((msg) => {
    if (msg.channel === 'telemetry' && widgetType.value === 'value-card') {
      const d = msg.data
      if (d && (!widgetConfig.value.deviceKey || d.deviceKey === widgetConfig.value.deviceKey)) {
        latestValue.value = d.value as number | string
        latestTime.value = dayjs().format('HH:mm:ss')
      }
    }
    else if (msg.channel === 'alarm' && widgetType.value === 'alarm-list') {
      loadData() // refresh alarm list
    }
    else if (msg.channel === 'telemetry' && widgetType.value === 'device-grid') {
      loadData() // refresh grid
    }
  })
})

onUnmounted(() => {
  if (timer)
    clearInterval(timer)
  if (offWs)
    offWs()
})

watch(() => props.widget, loadData, { deep: true })

const dataTableColumns = computed(() => [
  {
    prop: 'time',
    label: '时间',
    width: 120,
    render: ({ row }: ColumnRenderContext<MetricDataPoint>) => row.time ? dayjs(row.time).format('HH:mm:ss') : '',
  },
  { prop: 'value', label: '值' },
])

const alarmColumns = computed(() => [
  { prop: 'alarmType', label: '类型', width: 100 },
  { prop: 'severity', label: '级别', width: 80, slot: 'severity' },
  { prop: 'deviceName', label: '设备', showOverflowTooltip: true },
  {
    prop: 'createTime',
    label: '时间',
    width: 140,
    render: ({ row }: ColumnRenderContext<AlarmListRow>) => row.createTime ? dayjs(row.createTime).format('MM-DD HH:mm') : '',
  },
])
</script>

<template>
  <div v-loading="loading" class="widget-renderer">
    <!-- 数值卡 -->
    <div v-if="widgetType === 'value-card'" class="value-card">
      <div class="vc-label">
        {{ title }}
      </div>
      <div class="vc-value">
        {{ latestValue ?? '--' }}
        <span v-if="widgetConfig.unit" class="vc-unit">{{ widgetConfig.unit }}</span>
      </div>
      <div class="vc-time">
        {{ latestTime }}
      </div>
    </div>

    <!-- 仪表盘 -->
    <VChart
      v-else-if="widgetType === 'gauge'"
      :option="chartOption"
      autoresize
      style="height: 100%"
    />

    <!-- 折线图/柱状图 -->
    <VChart
      v-else-if="widgetType === 'line-chart' || widgetType === 'bar-chart'"
      :option="chartOption"
      autoresize
      style="height: 100%"
    />

    <!-- 数据表格 -->
    <div v-else-if="widgetType === 'data-table'" class="data-table-widget">
      <div class="dtw-title">
        {{ title }}
      </div>
      <IotTable :columns="dataTableColumns" :data="chartData" :is-page="false" density="compact" />
    </div>

    <!-- 未知类型 -->
    <div v-else-if="widgetType === 'device-grid'" class="device-grid-widget">
      <div class="dgw-title">
        {{ title }}
      </div>
      <div class="dgw-grid">
        <div v-for="d in gridDevices" :key="d.id" class="dgw-cell" :class="{ online: d.online, offline: !d.online }">
          <span class="dgw-dot" />
          <span class="dgw-name">{{ d.deviceName }}</span>
        </div>
      </div>
      <div v-if="gridDevices.length === 0" class="dgw-empty">
        暂无设备
      </div>
    </div>

    <div v-else-if="widgetType === 'alarm-list'" class="alarm-list-widget">
      <div class="alw-title">
        {{ title }}
      </div>
      <IotTable :columns="alarmColumns" :data="alarmList" :is-page="false" density="compact">
        <template #severity="{ row }">
          <el-tag :type="row.severity === 'CRITICAL' ? 'danger' : row.severity === 'MAJOR' ? 'warning' : 'info'" size="small">
            {{ row.severity }}
          </el-tag>
        </template>
      </IotTable>
      <div v-if="alarmList.length === 0" class="alw-empty">
        暂无告警
      </div>
    </div>

    <div v-else class="widget-unknown">
      <el-empty :description="`未知组件: ${widgetType}`" :image-size="40" />
    </div>
  </div>
</template>

<style scoped lang="scss">
.widget-renderer {
  height: 100%;
  overflow: hidden;
}

.value-card {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 100%;
  padding: 8px;

  .vc-label {
    font-size: 13px;
    color: var(--iot-color-text-secondary);
    margin-bottom: 8px;
  }

  .vc-value {
    font-size: 32px;
    font-weight: 700;
    color: var(--iot-color-primary);
    line-height: 1;

    .vc-unit {
      font-size: 14px;
      font-weight: 400;
      margin-left: 4px;
      color: var(--iot-color-text-muted);
    }
  }

  .vc-time {
    font-size: 11px;
    color: var(--iot-color-text-muted);
    margin-top: 8px;
  }
}

.data-table-widget {
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 4px;

  .dtw-title {
    font-size: 13px;
    font-weight: 600;
    margin-bottom: 4px;
    color: var(--iot-color-text-primary);
  }
}

.widget-unknown {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
}

.device-grid-widget {
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 4px;
  overflow: hidden;

  .dgw-title {
    font-size: 13px;
    font-weight: 600;
    margin-bottom: 4px;
  }
  .dgw-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    overflow-y: auto;
  }
  .dgw-cell {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 2px 6px;
    border-radius: 4px;
    font-size: 11px;
    background: #f0f0f0;
  }
  .dgw-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
  }
  .dgw-cell.online .dgw-dot {
    background: #22c55e;
  }
  .dgw-cell.offline .dgw-dot {
    background: #ef4444;
  }
  .dgw-empty {
    text-align: center;
    color: #999;
    padding: 20px;
    font-size: 12px;
  }
}

.alarm-list-widget {
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 4px;
  overflow: hidden;

  .alw-title {
    font-size: 13px;
    font-weight: 600;
    margin-bottom: 4px;
  }
  .alw-empty {
    text-align: center;
    color: #999;
    padding: 20px;
    font-size: 12px;
  }
}
</style>
