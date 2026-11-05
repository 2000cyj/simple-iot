<script setup lang="ts">
interface Props {
  /** 主题主色（当前模板未使用，保留以兼容父组件传参） */
  themeColor?: string
}

defineProps<Props>()
</script>

<template>
  <div class="absolute z-1 wh-full overflow-hidden">
    <div class="absolute -right-300px -top-900px <sm:(-right-100px -top-1170px)">
      <!--      <corner-top :start-color="lightColor" :end-color="darkColor" /> -->
    </div>
    <div class="absolute -left-200px -bottom-400px <sm:(-left-100px -bottom-760px)">
      <!--      <corner-bottom :start-color="darkColor" :end-color="lightColor" /> -->
    </div>
  </div>
</template>

<style scoped></style>
