<script setup lang="ts">
import type { Product, ProductType } from '@/types/api'
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { productDetailApi, productTypeDetailApi } from '@/api/index'

/**
 * 产品详情。
 *
 * 后端实体 Product 的描述字段是 remark，页面上展示的是历史遗留的 mark，
 * 这里补一个可选字段保持模板原样（运行时取到 undefined）。
 */
interface ProductDetail extends Product {
  mark?: string
}

interface Props {
  /** 产品类型 ID */
  typeId: number
  /** 产品 ID（标准物模型下为空） */
  productId?: number
}

const props = defineProps<Props>()
const { t } = useI18n()
const product = ref<Partial<ProductDetail>>({})
const productType = ref<Partial<ProductType>>({})
if (props.productId) {
  productDetailApi(props.productId)
    .then(({ data }) => {
      product.value = data
      productType.value = data.productType as ProductType
    })
}
else {
  productTypeDetailApi(props.typeId)
    .then(({ data }) => {
      productType.value = data
    })
}
</script>

<template>
  <div class="wh-full flex flex-col gap-20px p-20px">
    <div class="flex gap-20px ">
      <div class="flex">
        <div class="w-120px">
          {{ t('tsl.product_type_name') }}
        </div>
        <div class="text-gray">
          {{ productType.name || '' }}
        </div>
      </div>
    </div>
    <el-divider />
    <div v-if="productId" class="flex gap-20px ">
      <div class="flex w-200px gap-20px">
        <div>
          {{ t('tsl.info_manufacturer') }}
        </div>
        <div class="text-gray">
          {{ product.manufacturer || '' }}
        </div>
      </div>
      <div class="flex w-200px gap-20px">
        <div class="">
          {{ t('tsl.product_model') }}
        </div>
        <div class="text-gray">
          {{ product.model || '' }}
        </div>
      </div>
      <div class="flex w-300px gap-20px">
        <div class="">
          {{ t('tsl.product_access_key') }}
        </div>
        <div class="text-gray">
          {{ product.productKey || '' }}
        </div>
      </div>
    </div>
    <div class="flex  gap-20px">
      <div class="">
        {{ t('tsl.product_description') }}
      </div>
      <div class="text-gray">
        {{ product.mark || '' }}
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">

</style>
