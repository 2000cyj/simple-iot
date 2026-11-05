<script setup lang="ts">
import type {
  DataTypeEnum,
  KeyValue,
  ModelProperty,
  ModelPropertyUpdateQuery,
  ProductPropertyAddQuery,
  PropertyAccessMode,
  StandardPropertyAddQuery,
} from '@/types/api'
import type { Option } from '@/types/common'
import { ElMessage } from 'element-plus'
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { customPropertyAddApi, dictListApi, standardPropertyAddApi, standardPropertyEditApi } from '@/api'
import IconInput from '@/components/IconInput.vue'
import { useForm } from '@/composables/useForm'

/**
 * 属性表单。
 *
 * 物模型属性是动态 JSON 结构，这里只声明表单里真正可编辑的字段；
 * 后端返回的属性对象（ModelProperty）字段更宽，合并进来时按本类型收窄。
 */
interface PropertyForm {
  /** 主键（编辑态才有） */
  id?: number
  /** 属性名称 */
  name?: string
  /** 标识符 */
  identifier?: string
  /** 数据类型 */
  dataType?: DataTypeEnum
  /** 访问权限：r 只读 / rw 读写 */
  accessMode?: PropertyAccessMode
  /** 步长 */
  step?: number
  /** 最大值 */
  max?: number
  /** 最小值 */
  min?: number
  /** 计量单位 */
  unit?: string
  /** 计量单位名称 */
  unitName?: string
  /** 字符串长度 */
  length?: number
  /** 布尔类型 false 对应的值 */
  bool0?: string
  /** 布尔类型 true 对应的值 */
  bool1?: string
  /** 备注 */
  remark?: string
  /** 图标 ID */
  iconId?: number
  /** 产品类型 ID */
  productTypeId?: number
  /** 产品 ID */
  productId?: number
  /** 枚举值对照表 */
  enums: KeyValue<number, string>[]
}

/**
 * 提交形态：后端三个保存接口（标准新增 / 自定义新增 / 修改）的入参交集。
 *
 * 三个分支提交的是同一份表单数据，用交集描述可以保证任何一条分支都通过类型检查。
 */
type PropertyPayload = ModelPropertyUpdateQuery & ProductPropertyAddQuery & StandardPropertyAddQuery

/** 数据类型分组：数值 / 枚举 / 文本 / 布尔 */
type DataTypeCategory = 'number' | 'enum' | 'text' | 'bool'

/** 数据类型下拉项 */
interface DataTypeOption {
  label: string
  value: DataTypeEnum
  type: DataTypeCategory
}

interface Props {
  /** 编辑态回填的属性数据 */
  datas?: ModelProperty | null
  /** 产品类型 ID */
  typeId?: number
  /** 产品 ID */
  productId?: number
  /** 弹窗可见性 */
  modelValue?: boolean
  /** 弹窗标题 */
  title?: string
}

const props = defineProps<Props>()
const emits = defineEmits<{
  'update': []
  'update:modelValue': [value: boolean]
}>()
const { t } = useI18n()
const rules = ref({
  name: [{ required: true, message: t('tsl.property_name_required'), trigger: 'blur' }],
  identifier: [{ required: true, message: t('tsl.identifier_required'), trigger: 'blur' }],
  accessMode: [{ required: true, message: t('tsl.read_write_type_required'), trigger: 'change' }],
  dataType: [{ required: true, message: t('tsl.data_type_required'), trigger: 'change' }],
})
const form = ref<PropertyForm>({
  productTypeId: props.typeId,
  productId: props.productId,
  enums: [{
    key: 1,
    value: '',
  }],
  step: 1,
})
const unitListOpt = ref<Option[]>([])
const { editRef, loading, onClose } = useForm({
  callback: () => {
    emits('update')
  },
  closeCallback: () => {
    emits('update:modelValue', false)
  },
})

async function onSubmit() {
  if (!editRef.value)
    return

  const valid = await editRef.value.validate().catch(() => false)
  if (!valid)
    return

  if (loading.value)
    return

  loading.value = true
  try {
    const func = props.datas
      ? standardPropertyEditApi
      : props.productId
        ? customPropertyAddApi
        : standardPropertyAddApi
    await func(form.value as PropertyPayload)
    ElMessage.success(t('tsl.operation_succeeded'))
    emits('update')
    emits('update:modelValue', false)
  }
  catch {
    ElMessage.error(t('tsl.operation_failed'))
  }
  finally {
    loading.value = false
  }
}

const dataTypeOpt: DataTypeOption[] = [
  {
    label: t('tsl.int'),
    value: 1,
    type: 'number',
  },
  {
    label: t('tsl.float'),
    value: 2,
    type: 'number',
  },
  {
    label: t('tsl.double'),
    value: 3,
    type: 'number',
  },
  {
    label: t('tsl.enum'),
    value: 4,
    type: 'enum',
  },
  {
    label: t('tsl.string'),
    value: 5,
    type: 'text',
  },
  {
    label: t('tsl.boolean'),
    value: 6,
    type: 'bool',
  },
]
const currentType = ref<DataTypeCategory | number>(1)

function changeDataType(value: DataTypeEnum) {
  currentType.value = dataTypeOpt.find(item => item.value === value)!.type
}

function addEnumValue() {
  const enums = form.value.enums
  if (!enums) {
    form.value.enums = [{
      key: 1,
      value: '',
    }]
  }

  const key = enums.length === 0 ? 1 : enums[enums.length - 1].key + 1
  form.value.enums.push({ key, value: '' })
}

function removeEnumValue(index: number) {
  form.value.enums.splice(index, 1)
}

if (props?.datas) {
  // 后端返回的属性对象比表单更宽（取值说明、数据类型名称等可能缺失），
  // 合并后仍按表单类型使用。
  form.value = { ...form.value, ...props.datas } as PropertyForm
  currentType.value = dataTypeOpt.find(item => item.value === props.datas?.dataType)?.type || 1
}

dictListApi('analog_quantity')
  .then(({ data }) => {
    unitListOpt.value = data
  })

function changeUnit(value: string | number) {
  form.value.unitName = unitListOpt.value.find(item => item.value === value)?.label || ''
}
</script>

<template>
  <el-dialog
    :model-value="modelValue"
    :title="datas?.id ? t('tsl.edit_property') : t('tsl.add_property')"
    width="600px"
    @update:model-value="$emit('update:modelValue', $event)"
    @close="onClose"
  >
    <el-form
      ref="editRef"
      :rules="rules"
      :model="form"
      :label-width="100"
    >
      <el-form-item
        :label="t('tsl.property_name')"
        prop="name"
      >
        <el-input
          v-model="form.name"
          clearable
          :placeholder="t('tsl.enter_property_name')"
        />
      </el-form-item>
      <el-form-item
        :label="t('tsl.identifier')"
        prop="identifier"
      >
        <el-input
          v-model="form.identifier"
          clearable
          :placeholder="t('tsl.enter_identifier')"
        />
      </el-form-item>
      <el-form-item
        :label="t('tsl.data_type')"
        prop="dataType"
      >
        <el-select
          v-model="form.dataType"
          :placeholder="t('common.please_select')"
          style="width: 100%"
          @change="changeDataType"
        >
          <el-option
            v-for="item in dataTypeOpt"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item
        :label="t('tsl.access_mode_3')"
        prop="accessMode"
      >
        <el-radio-group v-model="form.accessMode">
          <el-radio value="r">
            {{ t('tsl.read_only') }}
          </el-radio>
          <el-radio value="rw">
            {{ t('tsl.read_write') }}
          </el-radio>
        </el-radio-group>
      </el-form-item>
      <el-form-item
        v-if="currentType === 'number'"
        :label="t('tsl.step_2')"
        prop="step"
      >
        <el-input-number
          v-model="form.step"
          :min="1"
          style="width: 100%"
          :placeholder="t('tsl.enter_step_value')"
        />
      </el-form-item>
      <el-form-item
        v-if="currentType === 'number'"
        :label="t('tsl.max')"
        prop="max"
      >
        <el-input-number
          v-model="form.max"
          :step="form.step"
          style="width: 100%"
          :placeholder="t('tsl.enter_maximum_value')"
        />
      </el-form-item>
      <el-form-item
        v-if="currentType === 'number'"
        :label="t('tsl.min')"
        prop="min"
      >
        <el-input-number
          v-model="form.min"
          :step="form.step"
          style="width: 100%"
          :placeholder="t('tsl.enter_minimum_value')"
        />
      </el-form-item>
      <el-form-item
        v-if="currentType === 'number'"
        :label="t('tsl.unit')"
        prop="unit"
      >
        <el-select
          v-model="form.unit"
          :placeholder="t('common.please_select')"
          style="width: 100%"
          @change="changeUnit"
        >
          <el-option
            v-for="item in unitListOpt"
            :key="item.value"
            :label="`${item.label}:${item.value}`"
            :value="item.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item v-if="currentType === 'enum'" :label="t('tsl.enum_2')" prop="enums">
        <div class="enum-inputs">
          <div
            v-for="(item, index) in form.enums"
            :key="index"
            class="enum-row"
          >
            <el-input-number
              v-model="item.key"
              :placeholder="t('tsl.key_name')"
              style="width: 40%"
            />
            <el-input
              v-model="item.value"
              :placeholder="t('tsl.value')"
              style="width: 40%"
            />
            <el-button
              :disabled="index === 0"
              class="enum-delete-btn"
              @click="removeEnumValue(index)"
            >
              {{ t('common.delete') }}
            </el-button>
          </div>
          <el-button class="enum-add-btn" @click="addEnumValue">
            {{ t('tsl.add_enum_value') }}
          </el-button>
        </div>
      </el-form-item>
      <el-form-item
        v-if="currentType === 'text'"
        :label="t('tsl.string_length')"
        prop="length"
      >
        <el-input-number
          v-model="form.length"
          :min="1"
          style="width: 100%"
          :placeholder="t('tsl.enter_string_length')"
        />
      </el-form-item>
      <el-form-item
        v-if="currentType === 'bool'"
        :label="t('tsl.propertyedite_false')"
        prop="bool0"
      >
        <el-input
          v-model="form.bool0"
          clearable
          :placeholder="t('tsl.false')"
        />
      </el-form-item>
      <el-form-item
        v-if="currentType === 'bool'"
        :label="t('tsl.propertyedite_true')"
        prop="bool1"
      >
        <el-input
          v-model="form.bool1"
          clearable
          :placeholder="t('tsl.true')"
        />
      </el-form-item>
      <el-form-item
        :label="t('common.remark')"
        prop="remark"
      >
        <el-input
          v-model="form.remark"
          clearable
          :placeholder="t('tsl.enter_remarks')"
        />
      </el-form-item>
      <el-form-item :label="t('tsl.icon')" prop="iconId">
        <IconInput v-model:value="form.iconId" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button class="glass-btn glass-btn-secondary" @click="onClose">
        {{ t('common.cancel') }}
      </el-button>
      <el-button type="primary" :loading="loading" class="glass-btn glass-btn-primary" @click="onSubmit">
        {{ datas?.id ? t('common.save') : t('common.add') }}
      </el-button>
    </template>
  </el-dialog>
</template>

<style lang="scss" scoped>
// 枚举值输入区域样式
.enum-inputs {
  display: flex;
  flex-direction: column;
  width: 100%;
  gap: var(--space-sm);

  .enum-row {
    display: flex;
    align-items: center;
    gap: var(--space-sm);
  }
}

// 添加枚举值按钮 - 玻璃态主题
.enum-add-btn {
  width: 100%;
  padding: var(--space-sm) var(--space-md);
  border: 1px solid var(--iot-glass-border);
  border-radius: var(--radius-md);
  background: var(--iot-glass-bg);
  color: var(--iot-color-primary);
  font-size: 14px;
  transition: all var(--transition-fast);

  &:hover {
    background: var(--iot-glass-bg-hover);
    border-color: var(--iot-color-primary);
    transform: translateY(-1px);
  }

  &:active {
    transform: translateY(0);
  }
}

// 删除按钮样式
.enum-delete-btn {
  min-width: 60px;
  padding: var(--space-xs) var(--space-sm);
  border-radius: var(--radius-sm);
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.2);
  color: #ef4444;
  transition: all var(--transition-fast);

  &:hover:not(:disabled) {
    background: rgba(239, 68, 68, 0.2);
    border-color: #ef4444;
  }

  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
}
</style>
