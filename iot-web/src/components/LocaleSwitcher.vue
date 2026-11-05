<script setup lang="ts">
import type { Locale } from '@/locales'
import { ElMessage } from 'element-plus'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { LOCALES, setLocale } from '@/locales'

const { t, locale } = useI18n()

const currentLocale = computed(() => locale.value)

const currentLocaleLabel = computed(() => {
  return currentLocale.value === 'zh-CN' ? t('locale.zh_cn') : t('locale.en_us')
})

/**
 * el-dropdown 的 @command 载荷类型为 string | number | object，
 * 这里收窄为受支持的 Locale，避免把非法值写入 i18n。
 */
function toLocale(command: string | number | object): Locale | undefined {
  return LOCALES.find(locale => locale === command)
}

function handleCommand(command: string | number | object) {
  const nextLocale = toLocale(command)
  if (!nextLocale)
    return

  setLocale(nextLocale)
  ElMessage.success({
    message: nextLocale === 'zh-CN' ? t('locale.switched_zh') : t('locale.switched_en'),
    duration: 1500,
  })
  // 刷新页面以应用新语言（Element Plus 需要重新初始化）
  setTimeout(() => {
    window.location.reload()
  }, 500)
}
</script>

<template>
  <el-dropdown trigger="click" @command="handleCommand">
    <span class="locale-switcher">
      <el-icon><Grid /></el-icon>
      <span class="locale-text">{{ currentLocaleLabel }}</span>
    </span>
    <template #dropdown>
      <el-dropdown-menu>
        <el-dropdown-item command="zh-CN" :disabled="currentLocale === 'zh-CN'">
          {{ t('locale.zh_cn') }}
        </el-dropdown-item>
        <el-dropdown-item command="en-US" :disabled="currentLocale === 'en-US'">
          English
        </el-dropdown-item>
      </el-dropdown-menu>
    </template>
  </el-dropdown>
</template>

<style scoped>
.locale-switcher {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  cursor: pointer;
  padding: 8px 12px;
  border-radius: 4px;
  transition: all 0.2s;
}

.locale-switcher:hover {
  background-color: rgba(0, 0, 0, 0.05);
}

.locale-text {
  font-size: 14px;
  color: var(--el-text-color-regular);
}

:global(.dark) .locale-switcher:hover {
  background-color: rgba(255, 255, 255, 0.1);
}
</style>
