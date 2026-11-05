<script setup lang="ts">
import type { Product, ProductType } from '@/types/api'
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'
import { productDetailApi, productTypeDetailApi } from '@/api/index'
import Breadcrumb from '@/components/Breadcrumb.vue'
import ProductInfo from '@/views/tslModel/widget/productInfo.vue'
import ServiceConfig from '@/views/tslModel/widget/serviceConfig.vue'
import tslexpoert from '@/views/tslModel/widget/tslexpoert.vue'

/** 面包屑条目（结构与 Breadcrumb 组件的契约一致） */
interface BreadcrumbItem {
  label?: string
  path?: string
}

/**
 * 产品详情。
 *
 * 后端 `ProductVo` 在 `Product` 基础上追加了 `productType`；
 * `name` 是历史遗留字段（后端实体里并不存在，运行时取到 undefined）。
 */
interface ProductDetail extends Product {
  name?: string
  productType?: ProductType
}

const { t } = useI18n()
const activeName = ref('service')
const route = useRoute()
const breadcrumbs = ref<BreadcrumbItem[]>(
  [
    {
      label: t('menu.productType'),
      path: '/productType',
    },
    {
      label: t('tsl.tsl_model'),
    },
    {
      label: t('tsl.tsl_model'),
    },
  ],
)
const productDetails = ref<Partial<ProductDetail>>({})
// 路由 query 取到的是字符串，后端接口按数字 ID 拼接 URL。
// 这里只做类型层面的收窄，运行时不改变取值（URL 形态保持原样）。
const productTypeId = route.query.typeId as unknown as number
const productId = route.query.productId as unknown as number | undefined
function loadDetails() {
  if (productId) {
    productDetailApi(productId)
      .then(({ data }) => {
        // const data = res.data
        const detail = data as ProductDetail
        productDetails.value = detail
        breadcrumbs.value[2].label = detail.name
        const productType = detail.productType as ProductType
        breadcrumbs.value = [
          {
            label: productType.name,
            path: '/product',
          },
          {
            label: detail.model,
          },
          {
            label: t('tsl.tsl_model'),
          },
        ]
      })
  }
  else {
    productTypeDetailApi(productTypeId)
      .then((res) => {
        const data = res.data
        breadcrumbs.value[2].label = data.name
      })
  }
}
loadDetails()
</script>

<template>
  <div class="tsl-page">
    <Breadcrumb :breadcrumbs="breadcrumbs" />
    <div class="tsl-content">
      <el-tabs
        v-model="activeName"
        class="tsl-tabs"
      >
        <el-tab-pane :label="t('tsl.basic_information')" name="first">
          <ProductInfo :type-id="productTypeId" :product-id="productId" />
        </el-tab-pane>
        <el-tab-pane :label="t('tsl.service_definition')" name="service">
          <ServiceConfig :type-id="productTypeId" :product-id="productId" />
        </el-tab-pane>
        <el-tab-pane v-if="productId" label="TSL" name="tsl">
          <tslexpoert v-if="activeName === 'tsl'" :type-id="productTypeId" :product-id="productId" />
        </el-tab-pane>
      </el-tabs>
    </div>
  </div>
</template>

<style scoped lang="scss">
.tsl-page {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.tsl-content {
  flex: 1;
  padding: var(--space-lg) var(--space-xl);
  overflow: auto;
  background: var(--iot-glass-bg);
  border-radius: var(--radius-lg);
  margin: 0 var(--space-md) var(--space-md);
}

/* Tabs 样式 */
.tsl-tabs {
  :deep(.el-tabs__header) {
    margin-bottom: 16px;
  }
}
</style>
