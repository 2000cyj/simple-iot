<script setup lang="ts">
import type { TableParams } from '@/composables/useTable'
import type { ModelProperty } from '@/types/api'
import { Delete, Edit, RefreshRight } from '@element-plus/icons-vue'
import { useI18n } from 'vue-i18n'
import { propertyDeleteApi, propertyListApi } from '@/api/index'
import IotTable from '@/components/IotTable.vue'
import { useTable } from '@/composables/useTable'
import PropertyEdite from '@/views/tslModel/widget/propertyEdite.vue'

interface Props {
  /** 产品类型 ID */
  typeId: number
  /** 产品 ID（标准物模型下为空） */
  productId?: number
  /** 是否展示编辑操作（模板里存在静态写法 show-edite="true"，故也接受字符串） */
  showEdite?: boolean | string
}

/** 属性表格列配置 */
interface PropertyColumn {
  prop: string
  label: string
  width?: number
  slot?: string
  formatter?: (row: ModelProperty) => string
}

/** 查询参数：useTable 的通用参数 + 属性搜索关键字 */
interface PropertyParams extends TableParams {
  search?: string
}

const props = defineProps<Props>()
const { t } = useI18n()
const column: PropertyColumn[] = [
  {
    prop: 'name',
    label: t('tsl.property_name'),
  },
  {
    prop: 'identifier',
    label: t('tsl.property_identifier_2'),
  },
  {
    prop: 'id',
    label: t('tsl.id'),
  },
  {
    prop: 'dataTypeName',
    label: t('tsl.data_type'),
  },
  {
    prop: 'definitions',
    label: t('tsl.data_definition'),
  },
  {
    prop: 'accessMode',
    label: t('tsl.access_mode_2'),
    formatter: (row: ModelProperty) => row.accessMode === 'r' ? t('tsl.property_read_only') : t('tsl.read_write'),
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
  updatePage,
  onSearch,
  onReset,
  dwTable,
  onDelete: deleteRow,
  onEdit: editRow,
  onAdd,
  diaTitle,
  currentItem,
} = useTable<ModelProperty>({
  // useTable 的 deleteApi 声明为 (id: number | string) => Promise<unknown>，
  // 而后端删除接口只接受数字 id；这里只做类型层面的放宽，运行时的调用方式完全不变。
  deleteApi: propertyDeleteApi as (id: number | string) => Promise<unknown>,
  diaName: t('tsl.property'),
  defParams: {
    productTypeId: props.typeId,
    productId: props.productId,
  },
})
const params = tableParams as PropertyParams

/** 表格行在模板插槽里是动态类型，这里统一做一次收窄后交给 useTable */
function onEdit(row: unknown) {
  editRow(row as ModelProperty)
}
function onDelete(row: unknown) {
  void deleteRow(row as ModelProperty)
}
</script>

<template>
  <div class="wh-full">
    <div class="flex flex-row mb-12px">
      <div class="w-240px mr-12px">
        <el-input v-model="params.search" clearable :placeholder="t('tsl.enter_property_name_identifier_search')" @keyup.enter="onSearch" />
      </div>
      <el-button type="primary" @click="onSearch">
        {{ t('common.search') }}
      </el-button>
      <el-button :icon="RefreshRight" @click="onReset">
        {{ t('common.reset') }}
      </el-button>
      <el-button v-if="showEdite" type="primary" @click="onAdd">
        {{ t('tsl.add_property') }}
      </el-button>
    </div>
    <IotTable
      ref="dwTable"
      row-key="id"
      :column="column"
      :params="params"
      :is-page="false"
      :api="propertyListApi"
    >
      <template #cz="{ row }">
        <el-button v-if="showEdite" type="primary" link :icon="Edit" @click="onEdit(row)">
          {{ t('tsl.edit_definition') }}
        </el-button>
        <el-button v-if="showEdite" type="danger" link :icon="Delete" @click="onDelete(row)">
          {{ t('common.delete') }}
        </el-button>
      </template>
    </IotTable>
    <PropertyEdite
      v-if="dialogVisible"
      v-model="dialogVisible"
      :title="diaTitle"
      :type-id="typeId"
      :product-id="productId"
      :datas="currentItem"
      @update="updatePage"
    />
  </div>
</template>

<style scoped lang="scss">

</style>
