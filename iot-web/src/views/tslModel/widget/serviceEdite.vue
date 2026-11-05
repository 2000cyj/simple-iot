<script setup lang="ts">
import type { EventTypeEnum, ModelProperty, ModelService, ServiceAddQuery, ServiceTypeEnum, ServiceUpdateQuery } from '@/types/api'
import { ElMessage } from 'element-plus'
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { serviceAddApi, serviceEditeApi } from '@/api'
import { useForm } from '@/composables/useForm'

/**
 * 服务表单。
 *
 * 后端新增 / 修改服务的入参不同（ServiceAddQuery / ServiceUpdateQuery），
 * 这里用一份宽松的表单类型承载，提交时再按分支收窄。
 */
interface ServiceForm {
  /** 主键（编辑态才有） */
  id?: number
  /** 服务名称 */
  name?: string
  /** 标识符 */
  identifier?: string
  /** 备注 */
  remark?: string
  /** 服务类型：1=服务 2=事件 */
  serviceType?: ServiceTypeEnum
  /** 事件类型：1=INFO 2=WARN 3=FAULT */
  eventType?: EventTypeEnum
  /** 是否必选 */
  required?: boolean
  /** 服务是否异步 */
  async?: boolean
  /** 入参属性 ID 列表 */
  inputParamIds?: number[]
  /** 出参属性 ID 列表 */
  outputParamIds?: number[]
  /** 产品类型 ID */
  productTypeId?: number
  /** 产品 ID */
  productId?: number
  /** 是否自定义 */
  custom?: boolean
}

interface Props {
  /** 编辑态回填的服务数据 */
  datas?: ModelService | null
  /** 产品类型 ID */
  typeId?: number
  /** 可选属性列表 */
  properties: ModelProperty[]
  /** 产品 ID */
  productId?: number
  /** 弹窗可见性 */
  modelValue?: boolean
}

const props = defineProps<Props>()
const emits = defineEmits<{
  'update': []
  'update:modelValue': [value: boolean]
}>()
const { t } = useI18n()
const serviceTypeOpt = [
  {
    label: t('tsl.service'),
    value: 1,
  },
  {
    label: t('tsl.event'),
    value: 2,
  },
]
const eventTypeOpt = [
  {
    label: 'INFO',
    value: 1,
  },
  {
    label: 'WARN',
    value: 2,
  },
  {
    label: 'FAULT',
    value: 3,
  },
]
const currentType = ref<ServiceTypeEnum>(2)

const rules = ref({
  name: [{ required: true, message: t('tsl.property_name_required_2'), trigger: 'blur' }],
  identifier: [{ required: true, message: t('tsl.identifier_required_2'), trigger: 'blur' }],
  serviceType: [{ required: true, message: t('tsl.service_type_required'), trigger: 'change' }],
  required: [{ required: true, message: t('tsl.required_flag_required'), trigger: 'change' }],
})

const { form, editRef, loading, onClose } = useForm<ServiceForm>({
  defForm: {
    productTypeId: props.typeId,
    productId: props.productId,
    custom: props.productId != null,
    outputParamIds: [],
    inputParamIds: [],
    serviceType: 1,
  },
  // 后端新增 / 修改服务的入参不同，这里按当前是否处于编辑态分派，
  // 运行时行为与原来的三元表达式完全一致。
  api: data => (props.datas ? serviceEditeApi(data as ServiceUpdateQuery) : serviceAddApi(data as ServiceAddQuery)),
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
    const func = props.datas ? serviceEditeApi : serviceAddApi
    await func(form.value as ServiceUpdateQuery)
    ElMessage.success(t('tsl.operation_succeeded_2'))
    emits('update')
    emits('update:modelValue', false)
  }
  catch {
    ElMessage.error(t('tsl.operation_failed_2'))
  }
  finally {
    loading.value = false
  }
}

function changeServiceType(value: ServiceTypeEnum) {
  currentType.value = value
}

if (props.datas) {
  form.value = { ...form.value, ...props.datas }
  currentType.value = props.datas.serviceType as ServiceTypeEnum
}
</script>

<template>
  <el-dialog
    :model-value="modelValue"
    :title="datas?.id ? t('tsl.edit_service') : t('tsl.add_service')"
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
        :label="t('tsl.service_name')"
        prop="name"
      >
        <el-input
          v-model="form.name"
          clearable
          :placeholder="t('tsl.enter_service_name')"
        />
      </el-form-item>
      <el-form-item
        :label="t('tsl.identifier')"
        prop="identifier"
      >
        <el-input
          v-model="form.identifier"
          clearable
          :placeholder="t('tsl.enter_identifier_2')"
        />
      </el-form-item>
      <el-form-item
        :label="t('tsl.service_type_2')"
        prop="serviceType"
      >
        <el-select
          v-model="form.serviceType"
          :placeholder="t('common.please_select')"
          style="width: 100%"
          @change="changeServiceType"
        >
          <el-option
            v-for="item in serviceTypeOpt"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item
        :label="t('tsl.required_3')"
        prop="required"
      >
        <el-radio-group v-model="form.required">
          <el-radio :value="true">
            {{ t('tsl.required') }}
          </el-radio>
          <el-radio :value="false">
            {{ t('tsl.optional') }}
          </el-radio>
        </el-radio-group>
      </el-form-item>
      <el-form-item
        :label="t('common.remark')"
        prop="remark"
      >
        <el-input
          v-model="form.remark"
          clearable
          :placeholder="t('tsl.enter_remarks_2')"
        />
      </el-form-item>
      <el-form-item
        v-if="currentType === 1"
        :label="t('tsl.service_timing')"
        prop="async"
      >
        <el-radio-group v-model="form.async">
          <el-radio :value="true">
            {{ t('tsl.async') }}
          </el-radio>
          <el-radio :value="false">
            {{ t('tsl.sync') }}
          </el-radio>
        </el-radio-group>
      </el-form-item>

      <el-form-item
        v-if="currentType === 1"
        :label="t('tsl.input_params_3')"
        prop="inputParamIds"
      >
        <el-select
          v-model="form.inputParamIds"
          :placeholder="t('tsl.property_selection')"
          style="width: 100%"
          clearable
          multiple
        >
          <el-option
            v-for="item in properties"
            :key="item.id"
            :label="`${item.name}:${item.identifier}`"
            :value="item.id"
          />
        </el-select>
      </el-form-item>
      <el-form-item
        :label="t('tsl.output_params_2')"
        prop="outputParamIds"
      >
        <el-select
          v-model="form.outputParamIds"
          :placeholder="t('tsl.parameter_selection')"
          style="width: 100%"
          clearable
          multiple
        >
          <el-option
            v-for="item in properties"
            :key="item.id"
            :label="`${item.name}:${item.identifier}`"
            :value="item.id"
          />
        </el-select>
      </el-form-item>
      <el-form-item
        v-if="currentType === 2"
        :label="t('tsl.event_type')"
        prop="eventType"
      >
        <el-select
          v-model="form.eventType"
          :placeholder="t('tsl.event_type_selection')"
          style="width: 100%"
          clearable
        >
          <el-option
            v-for="item in eventTypeOpt"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
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
