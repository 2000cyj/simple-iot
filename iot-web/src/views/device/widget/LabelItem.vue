<script setup lang="ts">
interface Props {
  /** 标签名 */
  label?: string
  /** 展示值 */
  value?: string | number
}

withDefaults(defineProps<Props>(), {
  label: '',
  value: '',
})
</script>

<template>
  <div class="flex flex-col gap-1">
    <span class="text-sm font-medium text-gray-600">{{ label }}</span>
    <span class="text-base text-gray-900 truncate">{{ value || '-' }}</span>
  </div>
</template>
