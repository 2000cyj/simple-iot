<script setup lang="ts">
import type { VNode } from 'vue'
import type { TableParams } from '@/composables/useTable'
import type { ModelProperty, ModelService } from '@/types/api'
import { Delete, Edit, RefreshRight } from '@element-plus/icons-vue'
import { ElButton, ElMessage, ElMessageBox } from 'element-plus'
import { h, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  customServiceListApi,
  propertyListApi,
  serviceDeleteApi,
  standardServiceListApi,
} from '@/api/index'
import IotTable from '@/components/IotTable.vue'
import { useTable } from '@/composables/useTable'
import ParamShow from '@/views/tslModel/widget/paramShow.vue' // Import icon display
import ServiceEdite from '@/views/tslModel/widget/serviceEdite.vue'

interface Props {
  /** 产品类型 ID */
  typeId: number
  /** 产品 ID（标准物模型下为空） */
  productId?: number
  /** 是否展示编辑操作（模板里存在静态写法 show-edite="true"，故也接受字符串） */
  showEdite?: boolean | string
}

/** 服务表格列配置 */
interface ServiceColumn {
  prop?: string
  label?: string
  width?: number
  slot?: string
  formatter?: (row: ModelService) => string
  render?: (scope: { row: ModelService }) => VNode
}

/** 查询参数：useTable 的通用参数 + 服务搜索关键字 */
interface ServiceParams extends TableParams {
  search?: string
}

/** IotTable 组件实例（这里只需要 refresh 方法） */
interface TableInstance {
  refresh: () => Promise<void>
}

const props = defineProps<Props>()
const { t } = useI18n()
const propertiesDct = ref<ModelProperty[]>([])
const dialogVisibleParams = ref(false)
const showDetailRow = ref<ModelService>()
const iotTableRef = ref<TableInstance>()

function handleShowParams(row: ModelService) {
  showDetailRow.value = row
  dialogVisibleParams.value = true
}

// 刷新表格数据
function refreshTable() {
  iotTableRef.value?.refresh()
}

// 自定义删除方法
async function handleDelete(row: unknown) {
  const service = row as ModelService
  try {
    await ElMessageBox.confirm(t('tsl.you_sure_you_want_delete_this_service'), t('common.tip'), {
      confirmButtonText: t('common.confirm'),
      cancelButtonText: t('common.cancel'),
      type: 'warning',
    })
    await serviceDeleteApi(service.id)
    ElMessage.success(t('tsl.delete_success'))
    refreshTable()
  }
  catch (error) {
    if (error !== 'cancel') {
      console.error(t('tsl.service'), error)
    }
  }
}

const column: ServiceColumn[] = [
  {
    prop: 'id',
    label: t('tsl.service_id'),
  },
  {
    prop: 'name',
    label: t('tsl.service_name'),
  },
  {
    prop: 'identifier',
    label: t('tsl.service_identifier_2'),
  },

  {
    prop: 'serviceType',
    label: t('tsl.service_type'),
    formatter: (row: ModelService) => row.serviceType === 1 ? t('device.service') : t('tsl.event'),
  },
  {
    label: t('tsl.parameter_list_2'),
    render: ({ row }: { row: ModelService }) => h(
      ElButton,
      {
        type: 'primary',
        link: true,
        onClick: () => handleShowParams(row),
      },
      () => t('tsl.view_parameters'),
    ),
  },
  {
    prop: 'required',
    label: t('tsl.required_2'),
    formatter: (row: ModelService) => row.required === true ? t('tsl.required') : t('tsl.param_optional_text'),
  },
  {
    prop: 'cz',
    slot: 'cz',
    width: 220,
    label: t('common.operation'),
  },
]
const {
  params: tableParams,
  dialogVisible,
  onSearch,
  onReset,
  onEdit: editRow,
  onAdd,
  diaTitle,
  currentItem,
} = useTable<ModelService>({
  diaName: t('device.service'),
  defParams: {
    productTypeId: props.typeId,
    productId: props.productId,
  },
})
const params = tableParams as ServiceParams

/** 表格行在模板插槽里是动态类型，这里统一做一次收窄后交给 useTable */
function onEdit(row: unknown) {
  editRow(row as ModelService)
}

function loadPropertiesDict() {
  propertyListApi({
    productTypeId: props.typeId,
    productId: props.productId,
    all: props.productId != null,
  })
    .then(({ data }) => {
      propertiesDct.value = data
    })
}
loadPropertiesDict()
</script>

<template>
  <div class="wh-full">
    <div class="flex flex-row mb-12px">
      <div class="w-240px mr-12px">
        <el-input v-model="params.search" clearable :placeholder="t('tsl.enter_service_name_identifier_search')" @keyup.enter="onSearch" />
      </div>
      <ElButton type="primary" @click="onSearch">
        {{ t('common.search') }}
      </ElButton>
      <ElButton :icon="RefreshRight" @click="onReset">
        {{ t('common.reset') }}
      </ElButton>
      <ElButton v-if="showEdite" type="primary" @click="onAdd">
        {{ t('tsl.add_service') }}
      </ElButton>
    </div>
    <IotTable
      ref="iotTableRef"
      row-key="id"
      :column="column"
      :params="params"
      :is-page="false"
      :api="productId ? customServiceListApi : standardServiceListApi"
    >
      <template #cz="{ row }">
        <ElButton v-if="showEdite" type="primary" link :icon="Edit" @click="onEdit(row)">
          {{ t('tsl.edit_definition_2') }}
        </ElButton>
        <ElButton v-if="showEdite" type="danger" link :icon="Delete" @click="handleDelete(row)">
          {{ t('common.delete') }}
        </ElButton>
      </template>
    </IotTable>
    <ServiceEdite
      v-if="dialogVisible"
      v-model="dialogVisible"
      :title="diaTitle"
      :type-id="typeId"
      :product-id="productId"
      :datas="currentItem"
      :properties="propertiesDct"
      @update="refreshTable"
    />
    <ParamShow
      v-if="dialogVisibleParams"
      v-model="dialogVisibleParams"
      :properties="propertiesDct"
      :datas="showDetailRow"
    />
  </div>
</template>

<style scoped lang="scss">

</style>
