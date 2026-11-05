import type { Ref } from 'vue'
// BaseResult / PageResult 为后端统一响应契约（见 TS-CONVENTIONS §3.3）。
// 这里只做类型引入，不产生运行时依赖。
import type { BaseResult, PageResult } from '@/types/common'
import { ElMessage, ElMessageBox } from 'element-plus'
import { reactive, ref } from 'vue'
import { normalizePage } from '@/utils/page'

/** 表格行数据的默认形状：业务字段任意 */
export type TableRowData = Record<string, unknown>

/** 查询参数：业务字段任意，但固定包含分页字段 */
export interface TableParams extends Record<string, unknown> {
  /** 当前页码，从 1 开始 */
  page: number
  /** 每页条数 */
  size: number
}

/** 对话框标题：正常传字符串，也可能被误传成事件对象 */
export type DialogTitle = string | { type?: unknown } | null | undefined

/** normalizePage 的归一化结果（与 @/utils/page 保持同一份定义） */
export type { NormalizedPage } from '@/utils/page'

/**
 * useTable 的入参契约。
 *
 * - `deleteApi` 删除接口，入参为行 id（部分历史接口允许直接传整行）。
 * - `fetchApi` 列表 / 分页接口，返回 BaseResult 包裹的分页载荷或列表。
 */
export interface UseTableOptions<T extends object = TableRowData> {
  deleteApi?: (id: number | string) => Promise<unknown>
  fetchApi?: (params: Record<string, unknown>) => Promise<BaseResult<PageResult<T>> | BaseResult<T[]>>
  defParams?: Record<string, unknown>
  pageSize?: number
  diaName?: string
}

/**
 * dwTable 的构造结构（内部嵌套 Ref）。
 *
 * 说明：Vue 的 ref/reactive 在读取时会自动解包嵌套 Ref，
 * 因此对外暴露的形态见 {@link DwTableValue}。
 */
export interface DwTable<T extends object = TableRowData> {
  data: Ref<T[]>
  total: Ref<number>
  loading: Ref<boolean>
  currentPage: number
  pageSize: number
}

/** dwTable 对外暴露的形态（嵌套 Ref 已被自动解包） */
export interface DwTableValue<T extends object = TableRowData> {
  data: T[]
  total: number
  loading: boolean
  currentPage: number
  pageSize: number
}

/**
 * useTable 的返回值契约（全项目列表页共用）。
 */
export interface UseTableReturn<T extends object = TableRowData> {
  /** 查询参数（响应式对象） */
  params: TableParams
  /** 编辑 / 新增弹窗是否可见 */
  dialogVisible: Ref<boolean>
  /** 当前编辑的行数据，新增时为 null */
  currentItem: Ref<T | null>
  /** 弹窗标题 */
  diaTitle: Ref<string>
  /** 表格数据 */
  tableData: Ref<T[]>
  /** 总记录数 */
  total: Ref<number>
  /** 加载状态 */
  loading: Ref<boolean>
  /** 表格配置对象（兼容原 useDwTable） */
  dwTable: Ref<DwTableValue<T>>
  /** 重新拉取当前页数据 */
  updatePage: () => Promise<void>
  /** 搜索：重置到第一页并刷新 */
  onSearch: () => void
  /** 重置：恢复 defParams 并刷新 */
  onReset: () => void
  /** 新增：打开弹窗 */
  onAdd: (title?: DialogTitle) => void
  /** 编辑：打开弹窗并回填行数据 */
  onEdit: (row: T, title?: DialogTitle) => void
  /** 删除：二次确认后调用 deleteApi 并刷新 */
  onDelete: (row: T) => Promise<void>
  /** 页码变化 */
  onPageChange: (page: number) => void
  /** 每页条数变化 */
  onSizeChange: (size: number) => void
  /** 关闭弹窗 */
  closeDialog: () => void
}

/**
 * 读取行数据上的 id。
 *
 * 行数据类型是泛型，无法在编译期确定是否存在 id 字段，
 * 故用 `'id' in row` 做类型守卫；不存在时返回 undefined。
 */
function readRowId(row: unknown): unknown {
  if (row && typeof row === 'object' && 'id' in row) {
    return row.id
  }
  return undefined
}

export function useTable<T extends object = TableRowData>(options: UseTableOptions<T> = {}): UseTableReturn<T> {
  const {
    deleteApi = null,
    fetchApi = null,
    defParams = {},
    pageSize = 20,
    diaName = '项',
  } = options

  // 查询参数 - 完全兼容原 useDwTable 的参数名
  const params = reactive<TableParams>({
    ...defParams,
    page: 1,
    size: pageSize,
  })

  // 表格数据
  const tableData = ref([]) as Ref<T[]>
  const total = ref(0)
  const loading = ref(false)

  // 对话框相关
  const dialogVisible = ref(false)
  const currentItem = ref(null) as Ref<T | null>
  const diaTitle = ref('')

  // 更新页面数据
  const updatePage = async (): Promise<void> => {
    if (!fetchApi) {
      console.warn('useTable: 请传入 fetchApi 函数')
      return
    }

    loading.value = true
    try {
      // 添加时间戳防止 GET 请求缓存
      const queryParams = { ...params, _t: Date.now() }
      const res = await fetchApi(queryParams)
      // 后端分页接口返回 BaseResult<PageResult>：{code, msg, success, data: {records, total, current, size}}
      // 后端列表接口返回 BaseResult<List>：{code, msg, success, data: [...]}
      // 两种形态的 data 结构不同，统一用 normalizePage 归一化后再赋值
      const { records, total: totalCount } = normalizePage<T>(res)
      tableData.value = records
      total.value = totalCount
    }
    catch (error) {
      console.error('获取数据失败:', error)
      ElMessage.error('获取数据失败')
    }
    finally {
      loading.value = false
    }
  }

  // 搜索
  const onSearch = () => {
    // 通过添加时间戳强制触发 params 变化，让外部组件（如 IotTable）能监听到
    params._t = Date.now()
    params.page = 1
    // 如果有 fetchApi 则调用
    if (fetchApi) {
      updatePage()
    }
  }

  // 重置搜索
  const onReset = () => {
    Object.assign(params, {
      ...defParams,
      page: 1,
      size: pageSize,
    })
    updatePage()
  }

  // 新增
  const onAdd = (title?: DialogTitle) => {
    // 如果第一个参数是事件对象，忽略它
    let resolvedTitle: string
    if (title && typeof title === 'object' && title.type) {
      resolvedTitle = ''
    }
    else {
      resolvedTitle = title as string
    }
    diaTitle.value = resolvedTitle || `新增${diaName}`
    currentItem.value = null
    dialogVisible.value = true
  }

  // 编辑
  const onEdit = (row: T, title?: DialogTitle) => {
    // 如果第二个参数是事件对象，忽略它
    let resolvedTitle: string
    if (title && typeof title === 'object' && title.type) {
      resolvedTitle = ''
    }
    else {
      resolvedTitle = title as string
    }
    diaTitle.value = resolvedTitle || `编辑${diaName}`
    currentItem.value = { ...row }
    dialogVisible.value = true
  }

  // 删除
  const onDelete = async (row: T): Promise<void> => {
    if (!deleteApi) {
      console.warn('useTable: 请传入 deleteApi 函数')
      return
    }

    try {
      await ElMessageBox.confirm(
        `确定要删除${diaName}吗?`,
        '提示',
        {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning',
        },
      )

      // 历史接口允许直接传整行对象，故 id 缺失时回退为整行
      const target = (readRowId(row) || row) as number | string
      await deleteApi(target)
      ElMessage.success('删除成功')
      updatePage()
    }
    catch (error) {
      if (error !== 'cancel') {
        console.error('删除失败:', error)
      }
    }
  }

  // 分页改变
  const onPageChange = (page: number) => {
    params.page = page
    updatePage()
  }

  // 每页条数改变
  const onSizeChange = (size: number) => {
    params.size = size
    params.page = 1
    updatePage()
  }

  // 关闭对话框
  const closeDialog = () => {
    dialogVisible.value = false
    currentItem.value = null
  }

  // dwTable - 返回表格配置对象(兼容原 useDwTable)
  const dwTable = ref({
    data: tableData,
    total,
    loading,
    currentPage: params.page,
    pageSize: params.size,
  }) as Ref<DwTableValue<T>>

  return {
    // 数据
    params,
    dialogVisible,
    currentItem,
    diaTitle,
    tableData,
    total,
    loading,
    dwTable,

    // 方法
    updatePage,
    onSearch,
    onReset,
    onAdd,
    onEdit,
    onDelete,
    onPageChange,
    onSizeChange,
    closeDialog,
  }
}
