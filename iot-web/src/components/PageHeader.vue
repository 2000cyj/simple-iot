<script setup lang="ts">
import type { Component } from 'vue'

interface Props {
  /** 页面主标题 */
  title: string
  /** 副标题 */
  subtitle?: string
  /** 标题前的图标组件 */
  icon?: Component | null
}

const props = withDefaults(defineProps<Props>(), {
  subtitle: '',
  icon: null,
})
</script>

<template>
  <header class="iot-page-header">
    <div class="iot-page-header__inner">
      <div class="iot-page-header__main">
        <div class="iot-page-header__title-area">
          <h1 class="iot-page-header__title">
            <el-icon v-if="props.icon" :size="28" class="iot-page-header__icon">
              <component :is="props.icon" />
            </el-icon>
            {{ props.title }}
          </h1>
          <p v-if="props.subtitle" class="iot-page-header__subtitle">
            {{ props.subtitle }}
          </p>
        </div>
        <div v-if="$slots.actions" class="iot-page-header__actions">
          <slot name="actions" />
        </div>
      </div>
      <div v-if="$slots.extra" class="iot-page-header__extra">
        <slot name="extra" />
      </div>
    </div>
  </header>
</template>

<style scoped lang="scss">
.iot-page-header {
  &__inner {
    background: var(--iot-color-bg-card);
    backdrop-filter: blur(20px);
    border: 1px solid var(--iot-glass-border);
    border-radius: var(--iot-radius-lg);
    padding: var(--iot-space-xl) var(--iot-space-2xl);
    box-shadow: var(--iot-shadow-md);
    position: relative;
    overflow: hidden;
    transition: all var(--iot-transition-base);

    &::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 4px;
      background: linear-gradient(90deg, var(--iot-color-primary), var(--iot-color-accent));
    }
  }

  &__main {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: var(--iot-space-lg);
    flex-wrap: wrap;
  }

  &__title-area {
    flex: 1;
    min-width: 0;
  }

  &__title {
    font-size: 24px;
    font-weight: 700;
    margin: 0;
    display: flex;
    align-items: center;
    gap: var(--iot-space-sm);
    color: var(--iot-color-text-primary);
  }

  &__icon {
    color: var(--iot-color-primary);
  }

  &__subtitle {
    margin: var(--iot-space-sm) 0 0 0;
    font-size: 14px;
    color: var(--iot-color-text-secondary);
  }

  &__actions {
    display: flex;
    align-items: center;
    gap: var(--iot-space-sm);
    flex-shrink: 0;
  }

  &__extra {
    margin-top: var(--iot-space-lg);
  }
}
</style>
