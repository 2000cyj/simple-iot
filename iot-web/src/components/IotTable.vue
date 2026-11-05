<script setup lang="ts" generic="TRow extends object = object">
import type { VNode } from 'vue'
import { computed, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { normalizePage } from '@/utils/page'

type Callable = (...args: never[]) => unknown

interface TableColumn {
  prop?: string
  label?: string
  width?: number | string
  minWidth?: number | string
  fixed?: string | boolean
  align?: string
  headerAlign?: string
  type?: string
  slot?: string
  formatter?: Callable
  render?: Callable
}

interface Props {
  data?: TRow[]
  columns?: TableColumn[]
  column?: TableColumn[]
  api?: Callable | null
  params?: Record<string, unknown>
  isPage?: boolean
  rowKey?: string
  total?: number
  currentPage?: number
  pageSize?: number
  loading?: boolean
  autoFit?: boolean
  density?: 'compact' | 'comfortable'
}

const props = withDefaults(defineProps<Props>(), {
  data: () => [],
  columns: () => [],
  column: () => [],
  api: null,
  params: () => ({}),
  isPage: true,
  rowKey: '',
  total: 0,
  currentPage: 1,
  pageSize: 20,
  loading: false,
  autoFit: true,
  density: 'comfortable',
})

const emit = defineEmits<{
  pageChange: [page: number]
  sizeChange: [size: number]
  selectionChange: [selection: TRow[]]
}>()
const { t } = useI18n()

const innerPage = ref<number>(props.currentPage)
const innerSize = ref<number>(props.pageSize)
const innerData = ref<TRow[]>(props.data)
const innerLoading = ref(false)
const dwTable = ref<unknown>()

// 兼容：优先使用 columns，否则使用 column
const finalColumns = computed<TableColumn[]>(() => {
  const cols = props.columns.length > 0 ? props.columns : props.column
  return cols.map((col) => {
    const column = { ...col }

    // 处理 formatter 函数 - 转换为 render 函数
    if (column.formatter && typeof column.formatter === 'function') {
      const formatterFn = column.formatter
      column.render = ({ row }) => Reflect.apply(formatterFn, undefined, [row, column, column.prop ? Reflect.get(row, column.prop) : undefined]) as unknown
    }

    // 处理 slot: 'expand' - 转换为 type: 'expand'
    if (column.slot === 'expand') {
      column.type = 'expand'
      column.prop = `expand_${Date.now()}_${Math.random()}`
    }

    return column
  }).filter(col => col.type !== 'expand')
})

// 获取 expand 列配置
const expandColumn = computed<TableColumn | undefined>(() => {
  const cols = props.columns.length > 0 ? props.columns : props.column
  return cols.find(col => col.slot === 'expand')
})

// 是否使用旧风格（API 模式）
const isApiMode = computed(() => !!props.api)

// 实际使用的数据
const tableData = computed(() => isApiMode.value ? innerData.value : props.data)

// 实际使用的加载状态
const tableLoading = computed(() => isApiMode.value ? innerLoading.value : props.loading)

function getCellValue(row: object, prop?: string): unknown {
  return prop ? Reflect.get(row, prop) : undefined
}

function renderCell(column: TableColumn, row: object): unknown {
  return column.render
    ? Reflect.apply(column.render, undefined, [{ row, column }]) as unknown
    : undefined
}

function pageChange(page: number): void {
  innerPage.value = page
  emit('pageChange', page)
  if (isApiMode.value) {
    fetchData()
  }
}

function sizeChange(size: number): void {
  innerSize.value = size
  emit('sizeChange', size)
  if (isApiMode.value) {
    fetchData()
  }
}

function selectionChange(selection: TRow[]): void {
  emit('selectionChange', selection)
}

// 判断是否为 VNode
function isVNode(value: unknown): value is VNode {
  return !!value && typeof value === 'object' && ('__v_isVNode' in value || '$el' in value || 'type' in value)
}

// 旧风格：通过 API 获取数据
async function fetchData(): Promise<void> {
  if (!props.api)
    return

  innerLoading.value = true
  try {
    const res: unknown = await Reflect.apply(props.api, undefined, [{
      ...props.params,
      page: innerPage.value,
      size: innerSize.value,
    }])
    innerData.value = normalizePage<TRow>(res).records
  }
  catch (e) {
    console.error('IotTable fetchData error:', e)
    innerData.value = []
  }
  finally {
    innerLoading.value = false
  }
}

// 监听 params 变化重新获取数据
watch(() => props.params, () => {
  if (isApiMode.value) {
    fetchData()
  }
}, { deep: true })

// 初始化
onMounted(() => {
  if (isApiMode.value) {
    fetchData()
  }
})

// 暴露方法给外部
defineExpose({
  dwTable,
  fetchData,
  refresh: fetchData,
})
</script>

<template>
  <div class="iot-table-wrapper">
    <el-table
      ref="dwTable"
      v-loading="tableLoading"
      :data="tableData"
      :row-key="rowKey"
      :table-layout="autoFit ? 'auto' : 'fixed'"
      :size="density === 'compact' ? 'small' : 'default'"
      stripe
      style="width: 100%"
      @selection-change="selectionChange"
    >
      <!-- Expand 列 -->
      <el-table-column
        v-if="expandColumn"
        type="expand"
        :width="expandColumn.width"
      >
        <template #default="{ row, $index }">
          <slot
            name="expand"
            :row="row"
            :column="expandColumn"
            :index="$index"
          />
        </template>
      </el-table-column>

      <!-- Selection 列 -->
      <el-table-column
        v-if="finalColumns.some(col => col.type === 'selection')"
        type="selection"
        width="55"
      />
      <el-table-column
        v-for="col in finalColumns"
        :key="col.prop"
        :prop="col.prop"
        :label="col.label"
        :width="col.width"
        :min-width="col.minWidth || (autoFit && !col.width ? 120 : undefined)"
        :fixed="col.fixed"
        :align="col.align || 'left'"
        :header-align="col.headerAlign || col.align || 'left'"
      >
        <template #default="{ row, $index }">
          <slot
            v-if="col.slot"
            :name="col.slot"
            :row="row"
            :column="col"
            :index="$index"
          />
          <!-- VNode 渲染 -->
          <component
            :is="renderCell(col, row)"
            v-else-if="col.render && isVNode(renderCell(col, row))"
          />
          <!-- 字符串/普通值渲染 -->
          <span v-else-if="col.render">{{ renderCell(col, row) ?? getCellValue(row, col.prop) ?? '-' }}</span>
          <span v-else>{{ getCellValue(row, col.prop) ?? '-' }}</span>
        </template>
      </el-table-column>
      <slot name="operations" />
    </el-table>

    <div v-if="isPage && total > 0" class="iot-table-pagination">
      <el-pagination
        :current-page="innerPage"
        :page-size="innerSize"
        :page-sizes="[10, 20, 50, 100]"
        :total="total"
        layout="total, sizes, prev, pager, next, jumper"
        background
        @current-change="pageChange"
        @size-change="sizeChange"
      />
    </div>

    <!-- 空状态提示 -->
    <el-empty
      v-if="!tableLoading && tableData.length === 0"
      class="iot-table-empty"
      :image-size="72"
      :description="t('common.no_data')"
    />
  </div>
</template>

<style lang="scss" scoped>
.iot-table-wrapper {
  background: var(--iot-glass-bg-dark);
  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);
  border: 1px solid var(--iot-glass-border);
  border-radius: var(--radius-md);
  padding: var(--space-lg);
  box-shadow: var(--shadow-md);
  transition: all var(--transition-base);
  position: relative;
}

:deep(.el-table) {
  font-size: 14px;
  background: transparent;

  &::before {
    background: transparent;
  }

  .el-table__inner-wrapper {
    border-radius: var(--radius-sm);
    overflow: hidden;
  }

  .el-table__header-wrapper {
    th {
      background: rgba(99, 102, 241, 0.08);
      color: var(--iot-color-text-primary);
      font-weight: 600;
      font-family: 'Fira Code', monospace;
      border-bottom: 1px solid rgba(99, 102, 241, 0.15);
      padding: var(--space-md) var(--space-sm);

      .cell {
        padding: 0 var(--space-sm);
      }
    }
  }

  .el-table__body-wrapper {
    .el-table__row {
      transition: all var(--transition-fast);

      &:hover {
        background: rgba(99, 102, 241, 0.06);
      }

      td {
        border-bottom: 1px solid rgba(99, 102, 241, 0.08);
        padding: var(--space-md) var(--space-sm);

        .cell {
          padding: 0 var(--space-sm);
        }
      }
    }

    .el-table__empty-block {
      background: transparent;
    }

    .el-table__empty-text {
      color: var(--iot-color-text-muted);
    }
  }
}

:deep(.el-table--small) {
  .el-table__header-wrapper th {
    padding: 6px 8px;

    .cell {
      padding: 0 8px;
    }
  }

  .el-table__body-wrapper .el-table__row td {
    padding: 6px 8px;

    .cell {
      padding: 0 8px;
    }
  }
}

:deep(.el-loading-mask) {
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(8px);
  border-radius: var(--radius-md);
}

.iot-table-pagination {
  display: flex;
  justify-content: flex-end;
  margin-top: var(--space-xl);
  padding-top: var(--space-lg);
  border-top: 1px solid rgba(99, 102, 241, 0.15);
}

:deep(.el-pagination) {
  .el-pagination__total {
    color: var(--iot-color-text-secondary);
    font-weight: 500;
  }

  .btn-prev,
  .btn-next,
  .el-pager li {
    background: var(--iot-glass-bg);
    border: 1px solid var(--iot-glass-border);
    border-radius: var(--radius-sm);
    margin: 0 4px;
    font-weight: 500;
    transition: all var(--transition-fast);

    &:hover {
      background: rgba(99, 102, 241, 0.1);
      border-color: var(--iot-color-primary);
    }

    &.active {
      background: linear-gradient(135deg, var(--iot-color-primary) 0%, var(--iot-color-primary-dark) 100%);
      border-color: var(--iot-color-primary);
      color: white;
      box-shadow: 0 2px 8px rgba(99, 102, 241, 0.4);
    }
  }

  .el-select {
    .el-input {
      .el-input__wrapper {
        background: var(--iot-glass-bg);
        border: 1px solid var(--iot-glass-border);
        border-radius: var(--radius-sm);
        box-shadow: none;
        transition: all var(--transition-fast);

        &:hover {
          border-color: rgba(99, 102, 241, 0.3);
        }

        &.is-focus {
          border-color: var(--iot-color-primary);
          box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.1);
        }
      }
    }
  }
}

// 空状态
.iot-table-empty {
  padding: var(--space-2xl) var(--space-xl);
}
</style>
