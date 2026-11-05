<script setup lang="ts">
import type { DevicePage } from '@/types/api'
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { deviceAddApi, deviceEditeApi, manufacturerListApi, productListApi } from '@/api'
import { useForm } from '@/composables/useForm'

/**
 * 产品类型下拉项。
 *
 * 后端 `ProductType.status` 是必填数字，但老接口可能不下发该字段，
 * 页面需要用 `status === undefined` 兜底，故此处声明为可选。
 */
interface ProductTypeOption {
  /** 产品类型 ID */
  id: number
  /** 产品类型名称 */
  name: string
  /** 1 启用 2 禁用 */
  status?: number
}

/** 设备表单数据（新增 / 编辑共用） */
interface DeviceForm {
  /** 设备 ID（编辑时回填） */
  id: number
  /** 产品 ID */
  productId: number
  /** 设备 Key */
  deviceKey: string
  /** 设备名称 */
  deviceName: string
  /** 产品类型 ID */
  productTypeId?: number
  /** 厂家 */
  manufacturer?: string
}

interface Props {
  /** 当前编辑的设备（为空表示新增） */
  datas?: DevicePage | null
  /** 产品类型下拉数据 */
  productTypeList?: ProductTypeOption[]
  /** 弹窗可见性（v-model） */
  modelValue?: boolean
}

const props = defineProps<Props>()

const emits = defineEmits<{
  /** 保存成功 */
  'update': []
  /** 弹窗关闭 */
  'update:modelValue': [value: boolean]
}>()

const { t } = useI18n()

const manufacturerListOpt = ref<string[]>([])
const productListOpt = ref<Array<{ id: number, model: string }>>([])
// ponytail: filter out disabled types (status!=1) so cascade doesn't break on empty types
const activeProductTypes = computed(() =>
  (props.productTypeList || []).filter(p => p.status === 1 || p.status === undefined),
)

const rules = ref({
  productTypeId: [{ required: true, message: t('validate.required_field', { field: t('product.product_type') }), trigger: 'change' }],
  manufacturer: [{ required: true, message: t('validate.required_field', { field: t('device.manufacturer') }), trigger: 'change' }],
  productId: [{ required: true, message: t('validate.required_field', { field: t('device.product_model') }), trigger: 'change' }],
  deviceKey: [{ required: true, message: t('validate.required_field', { field: t('device.device_key') }), trigger: 'blur' }],
})

const { form, onSubmit: handleSubmit, editRef, loading } = useForm<DeviceForm>({
  api: props.datas ? deviceEditeApi : deviceAddApi,
  callback: () => {
    emits('update')
    emits('update:modelValue', false)
  },
})

async function changeProductType() {
  if (form.value.productTypeId) {
    const { data } = await manufacturerListApi({
      productTypeId: form.value.productTypeId,
    })
    manufacturerListOpt.value = data
  }
  else {
    manufacturerListOpt.value = []
  }
}

function changeManufacturer() {
  if (!form.value.manufacturer) {
    productListOpt.value = []
    return
  }
  productListApi({
    productTypeId: form.value.productTypeId,
    manufacturer: form.value.manufacturer,
  })
    .then(({ data }) => {
      productListOpt.value = data
    })
}

function onSubmit() {
  handleSubmit()
}

function onCancel() {
  emits('update:modelValue', false)
}

watch(() => props.datas, (val) => {
  if (val) {
    form.value = { ...val }
    changeProductType()
      .then(() => changeManufacturer())
  }
}, { immediate: true })
</script>

<template>
  <el-dialog
    :model-value="modelValue"
    :title="datas?.id ? t('common.edit') : t('common.add')"
    width="600px"
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <el-form
      ref="editRef"
      :rules="rules"
      :model="form"
      label-width="100px"
    >
      <el-form-item
        :label="t('product.product_type')"
        prop="productTypeId"
      >
        <el-select
          v-model="form.productTypeId"
          :placeholder="t('common.placeholder_select', { field: t('product.product_type') })"
          style="width: 100%"
          filterable
          clearable
          @change="changeProductType"
        >
          <el-option
            v-for="item in activeProductTypes"
            :key="item.id"
            :label="item.name"
            :value="item.id"
          />
        </el-select>
      </el-form-item>
      <el-form-item
        :label="t('device.manufacturer')"
        prop="manufacturer"
      >
        <el-select
          v-model="form.manufacturer"
          :placeholder="t('common.placeholder_select', { field: t('device.manufacturer') })"
          style="width: 100%"
          filterable
          clearable
          @change="changeManufacturer"
        >
          <el-option
            v-for="item in manufacturerListOpt"
            :key="item"
            :label="item"
            :value="item"
          />
        </el-select>
      </el-form-item>
      <el-form-item
        :label="t('device.product_model')"
        prop="productId"
      >
        <el-select
          v-model="form.productId"
          :placeholder="t('common.placeholder_select', { field: t('device.product_model') })"
          style="width: 100%"
          filterable
          clearable
          @change="changeManufacturer"
        >
          <el-option
            v-for="item in productListOpt"
            :key="item.id"
            :label="item.model"
            :value="item.id"
          />
        </el-select>
      </el-form-item>
      <el-form-item
        :label="t('device.device_key')"
        prop="deviceKey"
      >
        <el-input
          v-model="form.deviceKey"
          clearable
          :placeholder="t('common.placeholder_input', { field: t('device.device_key') })"
        />
      </el-form-item>
      <el-form-item
        :label="t('device.device_name')"
        prop="deviceName"
      >
        <el-input
          v-model="form.deviceName"
          clearable
          :placeholder="t('common.placeholder_input', { field: t('device.device_name') })"
        />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="onCancel">
        {{ t('common.cancel') }}
      </el-button>
      <el-button type="primary" :loading="loading" @click="onSubmit">
        {{ t('common.confirm') }}
      </el-button>
    </template>
  </el-dialog>
</template>

<style lang="scss" scoped>

</style>
