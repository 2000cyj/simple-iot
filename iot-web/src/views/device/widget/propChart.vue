<script setup lang="ts">
import type { TslProperty } from '@/types/api'
import { nextTick, ref } from 'vue'
import VCharts from 'vue-echarts'
import { useI18n } from 'vue-i18n'
import { deviceDataAggregateApi } from '@/api/index'
import { DateUtils } from '@/utils/date_utils'
import 'echarts/lib/chart/line'
import 'echarts/lib/component/polar'

interface Props {
  /** 设备编号 */
  deviceKey?: string
  /** 物模型属性定义 */
  tslPropOpt: TslProperty
}

/** 图表坐标轴配置 */
interface ChartAxis {
  type: 'category' | 'value'
  /** 轴名称 */
  name?: string
  /** 轴名称样式 */
  nameTextStyle?: { color: string }
  /** 轴位置 */
  position?: string
  /** 刻度设置 */
  axisTick?: { alignWithLabel: boolean }
  /** 轴线设置 */
  axisLine?: { show?: boolean, lineStyle?: { color?: string } }
  /** 轴标签设置 */
  axisLabel?: { color?: string }
  /** 分割线设置 */
  splitLine?: { show?: boolean, lineStyle?: { type?: string, color?: string } }
  /** 类目轴数据 */
  data?: string[]
}

/** 折线系列配置 */
interface ChartSeries {
  /** 系列名称 */
  name: string
  /** 系列类型 */
  type: 'line'
  /** 是否平滑 */
  smooth: boolean
  /** 是否显示拐点 */
  showSymbol: boolean
  /** 线条样式 */
  lineStyle: { normal: { width: number, color: string } }
  /** 数据点 */
  data: number[]
}

/**
 * 图表配置。
 *
 * 这里用局部 interface 描述 option 形状，而不是直接用 echarts 的 `EChartsOption`：
 * 页面用的是 echarts 4 时代的 `lineStyle.normal` 写法，
 * 与 echarts 6 的 `LineSeriesOption` 类型对不上。
 */
interface ChartOption {
  tooltip: { trigger: 'axis' }
  grid: { top: string, bottom: string, left: string, right: string }
  xAxis: ChartAxis[]
  yAxis: ChartAxis[]
  series: ChartSeries[]
}

const props = defineProps<Props>()
const { t } = useI18n()
const params = ref({
  identifier: props.tslPropOpt.identifier!,
  deviceKey: props.deviceKey!,
  beginTime: DateUtils.formatDate(DateUtils.getStartOfDay()),
  endTime: DateUtils.formatDate(DateUtils.getEndOfDay()),
  interval: '1h',
  function: 'avg',
})
const dateRange = ref([DateUtils.getStartOfDay(), DateUtils.getEndOfDay()])
const intervalOptions = [
  { label: '1分钟', value: '1m' },
  { label: '5分钟', value: '5m' },
  { label: '10分钟', value: '10m' },
  { label: '30分钟', value: '30m' },
  { label: '1小时', value: '1h' },
  { label: '6小时', value: '6h' },
  { label: '1天', value: '1d' },
]
const fnOptions = [
  { label: '平均', value: 'avg' },
  { label: '最小', value: 'min' },
  { label: '最大', value: 'max' },
  { label: '求和', value: 'sum' },
  { label: '计数', value: 'count' },
]
const options = ref<ChartOption>({
  tooltip: { trigger: 'axis' },
  grid: { top: '25%', bottom: '15%', left: '8%', right: '8%' },
  xAxis: [{
    type: 'category',
    name: t('device.date'),
    axisTick: { alignWithLabel: true },
    axisLine: { lineStyle: { color: 'rgb(186,231,255)' } },
    axisLabel: { color: '#76889F' },
    data: [],
  }],
  yAxis: [{
    type: 'value',
    name: t('device.metric'),
    nameTextStyle: { color: '#76889F' },
    position: 'left',
    axisLine: { show: true, lineStyle: { color: 'rgb(186,231,255)' } },
    splitLine: { show: true, lineStyle: { type: 'dashed', color: 'rgba(255, 255, 255, 0.2)' } },
    axisLabel: { color: '#76889F' },
  }],
  series: [{
    name: t('device.trend'),
    type: 'line',
    smooth: true,
    showSymbol: false,
    lineStyle: { normal: { width: 2, color: '#FE9022' } },
    data: [],
  }],
})

/**
 * 把聚合接口返回的原始值转成图表可用的数值。
 *
 * 保持原有 `value || 0` 的语义（空值 / 0 之外的假值统一落到 0）。
 */
function toSeriesValue(value: unknown): number {
  return (value as number) || 0
}

function loadChartDate() {
  deviceDataAggregateApi(params.value)
    .then(({ data }) => {
      options.value.xAxis[0].data = data.map(item => item.key)
      options.value.series[0].data = data.map(item => toSeriesValue(item.value))
    })
}
function handleDateChange(val: Date[] | null) {
  if (val && val.length === 2) {
    params.value.beginTime = DateUtils.formatDate(val[0])
    params.value.endTime = DateUtils.formatDate(val[1])
  }
}
const renderChart = ref(false)
nextTick(() => {
  renderChart.value = true
})
loadChartDate()
</script>

<template>
  <el-dialog
    :title="t('device.param_list')"
    width="1200px"
  >
    <div class="flex flex-col gap-20px">
      <div class="flex flex-row items-center flex-wrap gap-12px">
        <div class="flex-1 color-#292A2C ml-40px">
          {{ tslPropOpt.name }}
        </div>
        <el-select v-model="params.interval" style="width: 100px" @change="loadChartDate">
          <el-option
            v-for="opt in intervalOptions"
            :key="opt.value"
            :label="opt.label"
            :value="opt.value"
          />
        </el-select>
        <el-select v-model="params.function" style="width: 80px" @change="loadChartDate">
          <el-option
            v-for="opt in fnOptions"
            :key="opt.value"
            :label="opt.label"
            :value="opt.value"
          />
        </el-select>
        <el-date-picker
          v-model="dateRange"
          type="datetimerange"
          :range-separator="t('common.to')"
          :start-placeholder="t('device.start_time')"
          :end-placeholder="t('device.end_time')"
          class="mr-12px"
          @change="handleDateChange"
        />
        <el-button type="info" @click="loadChartDate">
          {{ t('common.search') }}
        </el-button>
      </div>
      <div class="w-full h-400px">
        <VCharts v-if="renderChart" :option="options" />
      </div>
    </div>
  </el-dialog>
</template>

<style lang="scss" scoped>

</style>
