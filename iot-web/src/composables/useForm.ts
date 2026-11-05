import type { FormInstance } from 'element-plus'
import type { Ref } from 'vue'
import { ElMessage } from 'element-plus'
import { ref } from 'vue'

/**
 * 表单处理 composable
 * 用于编辑对话框的表单逻辑
 * 确认和取消按钮已在对话框模板中定义
 */

/** 表单数据的默认形状：任意业务字段 */
export type FormData = Record<string, unknown>

/**
 * useForm 的入参。
 *
 * - `api` 提交接口，方法风格声明使其实参类型保持双变，
 *   便于直接传入后端 DTO 明确的接口函数。
 * - `defForm` 表单初始值（也用于重置）。
 */
export interface UseFormOptions<T extends object = FormData> {
  /** 提交接口；缺省时调用会抛错并走错误提示分支（保持原有行为） */
  api?: (form: T) => Promise<unknown>
  /** 提交成功提示文案 */
  successMsg?: string
  /** 提交失败提示文案（错误对象无 message 时使用） */
  errorMsg?: string
  /** 提交成功后的回调 */
  callback?: () => void
  /** 弹窗关闭时的回调 */
  closeCallback?: () => void
  /** 表单初始值 */
  defForm?: Partial<T>
}

/**
 * useForm 的返回值契约。
 */
export interface UseFormReturn<T extends object = FormData> {
  /** 表单数据（浅拷贝自 defForm） */
  form: Ref<Partial<T>>
  /** 提交表单；成功返回 true，失败返回 false */
  onSubmit: () => Promise<boolean | void>
  /** el-form 组件引用 */
  editRef: Ref<FormInstance | null>
  /** 提交加载状态 */
  loading: Ref<boolean>
  /** 关闭对话框（触发 closeCallback） */
  onClose: () => void
  /** 用新数据覆盖表单 */
  setForm: (data: Partial<T>) => void
  /** 重置表单为 defForm 并清除校验 */
  resetForm: () => void
}

/**
 * 从任意异常对象中提取 message，兼容字符串 / 普通对象 / Error 实例。
 * 与原实现 `err?.message || errorMsg` 的取值范围保持一致。
 */
function extractErrorMessage(err: unknown): string | undefined {
  if (err && typeof err === 'object' && 'message' in err) {
    const message = (err as { message?: unknown }).message
    return typeof message === 'string' ? message : undefined
  }
  return undefined
}

export function useForm<T extends object = FormData>(options: UseFormOptions<T> = {}): UseFormReturn<T> {
  const {
    api,
    successMsg = '操作成功',
    errorMsg = '操作失败',
    callback,
    closeCallback,
    defForm = {},
  } = options

  // 表单数据
  const form = ref({ ...defForm }) as Ref<Partial<T>>

  // 加载状态
  const loading = ref(false)

  // 表单引用
  const editRef = ref<FormInstance | null>(null)

  // 提交表单
  const onSubmit = async (): Promise<boolean | void> => {
    if (!editRef.value) {
      return
    }

    // 验证表单
    const valid = await editRef.value.validate().catch(() => false)
    if (!valid) {
      return
    }

    loading.value = true
    try {
      await api!(form.value as T)
      ElMessage.success(successMsg)
      if (callback) {
        callback()
      }
      return true
    }
    catch (err) {
      ElMessage.error(extractErrorMessage(err) || errorMsg)
      return false
    }
    finally {
      loading.value = false
    }
  }

  // 关闭对话框
  const onClose = () => {
    if (closeCallback) {
      closeCallback()
    }
  }

  // 设置表单数据
  const setForm = (data: Partial<T>) => {
    form.value = { ...defForm, ...data }
  }

  // 重置表单
  const resetForm = () => {
    form.value = { ...defForm }
    editRef.value?.clearValidate()
  }

  return {
    form,
    onSubmit,
    editRef,
    loading,
    onClose,
    setForm,
    resetForm,
  }
}
