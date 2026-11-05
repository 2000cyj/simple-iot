<script setup lang="ts">
import type { ModelProperty, ModelService } from '@/types/api'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import IotTable from '@/components/IotTable.vue'

interface Props {
  /** 服务数据（入参 / 出参 ID 从这里取） */
  datas?: ModelService | null
  /** 可选属性列表 */
  properties: ModelProperty[]
}

const props = defineProps<Props>()
const { t } = useI18n()
const inputParam = ref<ModelProperty[]>([])
const outPutParam = ref<ModelProperty[]>([])
function findItem(id: number) {
  // 运行时可能查不到（属性已被删除），这里只在类型层面收窄，
  // 表格里仍然会拿到 undefined 行，行为与改造前一致。
  return props.properties.find(item => item.id === id) as ModelProperty
}
inputParam.value = props.datas?.inputParamIds?.map(id => findItem(id)) || []
outPutParam.value = props.datas?.outputParamIds?.map(id => findItem(id)) || []

const outputColumns = computed(() => [
  { prop: 'name', label: t('common.name') },
  { prop: 'identifier', label: t('tsl.identifier') },
])

const inputColumns = computed(() => [
  { prop: 'name', label: t('common.name') },
  { prop: 'identifier', label: t('tsl.identifier') },
])
</script>

<template>
  <el-dialog
    :title="t('tsl.parameter_list')"
    width="620px"
  >
    <div class="flex flex-col gap-40px">
      <div v-if="outPutParam.length > 0" class="flex flex-col w-full">
        <div class="text-16px">
          {{ t('tsl.output_params_3') }}
        </div>
        <el-divider />
        <IotTable :columns="outputColumns" :data="outPutParam" :is-page="false" />
      </div>
      <div v-if="inputParam.length > 0" class="flex flex-col w-full">
        <div class="text-16px">
          {{ t('tsl.input_params_2') }}
        </div>
        <el-divider />
        <IotTable :columns="inputColumns" :data="inputParam" :is-page="false" />
      </div>
    </div>
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
