<script setup lang="ts">
import type { FormRules } from 'element-plus'
import type { ProductType, ProductTypeAddQuery } from '@/types/api'
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { productTypeAddApi, productTypeEditeApi } from '@/api'
import { useForm } from '@/composables/useForm'

/** 产品类型表单模型（与新增/修改请求体一致） */
type ProductTypeForm = ProductTypeAddQuery

interface Props {
  /** 当前编辑的产品类型，新增时为 null */
  datas?: Partial<ProductType> | null
  /** 父级产品类型 ID */
  parentId?: number
  /** 弹窗可见性 */
  modelValue?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  datas: null,
  modelValue: false,
})

const emit = defineEmits<{
  /** 保存成功，通知父级刷新列表 */
  'update': []
  /** 弹窗可见性变化 */
  'update:modelValue': [value: boolean]
}>()

const { t } = useI18n()

const rules = ref<FormRules<ProductTypeForm>>({
  name: [{ required: true, message: t('product_type.producttype_dialog'), trigger: 'blur' }],
})

const { form, onSubmit: handleSubmit, editRef, loading, onClose } = useForm<ProductTypeForm>({
  api: props.datas ? productTypeEditeApi : productTypeAddApi,
  callback: () => {
    emit('update')
    emit('update:modelValue', false)
  },
  closeCallback: () => {
    emit('update:modelValue', false)
  },
  defForm: {
    parentId: props.parentId,
  },
})

if (props?.datas) {
  form.value = { ...props.datas }
}
</script>

<template>
  <el-dialog
    :model-value="modelValue"
    :title="datas?.id ? t('common.edit') : t('common.add')"
    width="500px"
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
        :label="t('product_type.dialog_producttype_dialog')"
        prop="name"
      >
        <el-input
          v-model="form.name"
          clearable
          :placeholder="t('product_type.enter_category_name')"
        />
      </el-form-item>
      <el-form-item
        :label="t('common.remark')"
        prop="mark"
      >
        <el-input
          v-model="form.mark"
          clearable
          :placeholder="t('product_type.enter_remarks')"
        />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="onClose">
        {{ t('common.cancel') }}
      </el-button>
      <el-button
        type="primary"
        :loading="loading"
        @click="handleSubmit"
      >
        {{ datas?.id ? t('common.save') : t('common.add') }}
      </el-button>
    </template>
  </el-dialog>
</template>

<style lang="scss" scoped>
.check-item {
  ::v-deep(.el-form-item__content) {
    width: 100%;
  }
}

:deep(.jtlc) {
  .el-form-item__content {
    display: block;
  }
}
</style>
