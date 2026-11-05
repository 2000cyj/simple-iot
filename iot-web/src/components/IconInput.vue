<script setup lang="ts">
import type { Icon } from '@/types/api'
import { onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { iconListApi } from '@/api/index'
import DefaultIcon from '@/components/DefaultIcon.vue'

interface Props {
  /** 当前选中的图标 ID */
  value?: string | number
}

const props = withDefaults(defineProps<Props>(), {
  value: '',
})

const emit = defineEmits<{
  'update:value': [value: number]
}>()

const { t } = useI18n()

const list = ref<Icon[]>([])
const actIcon = ref<Icon | null>(null)
const imageLoadError = ref(false)

onMounted(async () => {
  try {
    const rs = await iconListApi()
    list.value = rs.data || []
    rs.data.forEach((item) => {
      if (String(item.id) === String(props.value)) {
        actIcon.value = item
        imageLoadError.value = false
      }
    })
  }
  catch (error) {
    console.warn('Failed to load icon list:', error)
    list.value = []
  }
})

function change(command: string | number | object) {
  const icon = command as Icon
  actIcon.value = icon
  imageLoadError.value = false
  emit('update:value', icon.id)
}

function onImageError() {
  imageLoadError.value = true
}

function onImageLoad() {
  imageLoadError.value = false
}

/** 列表项图片加载失败时隐藏该图片 */
function hideBrokenImage(e: Event) {
  const target = e.target
  if (target instanceof HTMLElement)
    target.style.display = 'none'
}
</script>

<template>
  <div class="icon-input-wrapper">
    <el-dropdown max-height="300px" @command="change">
      <div class="icon-selector">
        <div v-if="actIcon" class="selected-icon">
          <img
            v-if="!imageLoadError"
            class="icon-image"
            :src="actIcon.path"
            @error="onImageError"
            @load="onImageLoad"
          >
          <DefaultIcon v-else name="default" :size="24" class="icon-fallback" />
          <span class="icon-name">{{ actIcon.name }}</span>
        </div>
        <span v-else class="placeholder">{{ t('icon.select_icon') }}</span>
        <el-icon class="el-icon--right">
          <arrow-down />
        </el-icon>
      </div>
      <template #dropdown>
        <el-dropdown-menu>
          <el-dropdown-item
            v-for="item in list"
            :key="item.id"
            class="icon-list-item"
            :command="item"
          >
            <img
              class="list-icon-image"
              :src="item.path"
              @error="hideBrokenImage"
            >
            <DefaultIcon
              name="default"
              :size="20"
              class="list-icon-fallback"
            />
            {{ item.name }}
          </el-dropdown-item>
        </el-dropdown-menu>
      </template>
    </el-dropdown>
  </div>
</template>

<style scoped lang="scss">
.icon-input-wrapper {
  width: 100%;
}

.icon-selector {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  min-width: 180px;
  padding: var(--space-sm) var(--space-md);
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: all var(--transition-fast);
  border: 1px solid var(--iot-glass-border);

  &:hover {
    background: var(--iot-glass-bg-hover);
    border-color: var(--iot-color-primary);
  }
}

.selected-icon {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
}

.icon-image {
  width: 24px;
  height: 24px;
  object-fit: contain;
  flex-shrink: 0;
}

.icon-fallback {
  flex-shrink: 0;
  color: var(--iot-color-text-muted);
}

.icon-name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 120px;
}

.placeholder {
  color: var(--iot-color-text-muted);
  flex: 1;
}

.icon-list-item {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-sm) var(--space-md);
  min-width: 200px;
}

.list-icon-image {
  width: 20px;
  height: 20px;
  object-fit: contain;
  flex-shrink: 0;
}

.list-icon-fallback {
  flex-shrink: 0;
  color: var(--iot-color-text-muted);
}

:deep(.el-dropdown-menu__item:hover) {
  background: var(--iot-glass-bg-hover);
}
</style>
