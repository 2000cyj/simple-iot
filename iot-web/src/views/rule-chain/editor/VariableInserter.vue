<script setup lang="ts">
import type { RuleTemplateVariable } from '@/api/index'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

/**
 * 模板变量插入器
 * - 系统变量 / 属性变量分组展示
 * - 点击在光标位置插入，而不是简单追加
 * - hover tooltip 显示变量描述
 *
 * 用法：
 *   <VariableInserter
 *     :target-ref="inputRef"
 *     :system-variables="systemVariables"
 *     :property-variables="propertyVariables"
 *     :value="config.message"
 *     @update="updateConfig('message', $event)"
 *   />
 */

/**
 * 变量插入器的目标元素。
 *
 * 与 NodeConfigPanel.vue 中的同名接口保持一致（SFC 之间无法互相导出类型）。
 */
interface VariableInsertTarget {
  input?: HTMLInputElement
  textarea?: HTMLTextAreaElement
  $el?: Element & { querySelector?: (selectors: string) => Element | null }
}

interface Props {
  /** 输入框/textarea 的 ref（用于读 selectionStart/End） */
  targetRef?: VariableInsertTarget | null
  /** 当前值 */
  value?: string
  /** 系统变量列表 */
  systemVariables?: RuleTemplateVariable[]
  /** 属性变量列表 */
  propertyVariables?: RuleTemplateVariable[]
  /** 最多展示多少个属性变量，超出折叠 */
  maxProperties?: number
  /** 自定义标题 */
  label?: string
}

const props = withDefaults(defineProps<Props>(), {
  targetRef: null,
  value: '',
  systemVariables: () => [],
  propertyVariables: () => [],
  maxProperties: 8,
  label: '',
})
const emit = defineEmits<{
  update: [value: string]
}>()
const { t } = useI18n()
const hasSystem = computed(() => props.systemVariables.length > 0)
const hasProperty = computed(() => props.propertyVariables.length > 0)
const displayLabel = computed(() => props.label || t('ruleChain.available_variables'))

// 获取真正的 input/textarea DOM
function getInputEl(): HTMLInputElement | HTMLTextAreaElement | null {
  const target = props.targetRef
  if (!target)
    return null
  // Element Plus 包了一层，真实 DOM 在 .input 或 .textarea
  return target.input
    ?? target.textarea
    ?? (target.$el?.querySelector?.('input,textarea') as HTMLInputElement | HTMLTextAreaElement | null)
    ?? null
}

function insertAt(variable: string) {
  const el = getInputEl()
  const current = props.value || ''
  const start = el?.selectionStart

  if (!el || typeof start !== 'number') {
    // 拿不到光标，退回追加
    emit('update', current + variable)
    return
  }

  const end = el.selectionEnd as number
  const next = current.slice(0, start) + variable + current.slice(end)
  emit('update', next)

  // 光标移到插入末尾，下次插入接着写
  requestAnimationFrame(() => {
    el.focus()
    const pos = start + variable.length
    el.setSelectionRange(pos, pos)
  })
}
</script>

<template>
  <div v-if="hasSystem || hasProperty" class="variable-inserter">
    <div class="vi-label">
      <el-icon :size="12" class="vi-icon">
        <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" /></svg>
      </el-icon>
      <span>{{ displayLabel }}</span>
      <span class="vi-hint">{{ t('ruleChain.click_insert_at_cursor') }}</span>
    </div>

    <div v-if="hasSystem" class="vi-group">
      <span class="vi-group-title sys">{{ t('ruleChain.editor_variableinserter_rule_chain_editor_variableinserter') }}</span>
      <el-tooltip
        v-for="v in systemVariables"
        :key="v.variable"
        :content="v.description || v.name || v.variable"
        placement="top"
        :show-after="300"
      >
        <el-tag
          size="small"
          effect="plain"
          class="vi-tag vi-tag-sys"
          @click="insertAt(v.variable)"
        >
          {{ v.variable }}
        </el-tag>
      </el-tooltip>
    </div>

    <div v-if="hasProperty" class="vi-group">
      <span class="vi-group-title prop">{{ t('ruleChain.rule_chain_editor_variableinserter') }}</span>
      <el-tooltip
        v-for="v in propertyVariables.slice(0, maxProperties)"
        :key="v.variable"
        :content="`${v.name || v.variable}${v.description ? ` · ${v.description}` : ''}`"
        placement="top"
        :show-after="300"
      >
        <el-tag
          size="small"
          effect="plain"
          class="vi-tag vi-tag-prop"
          @click="insertAt(v.variable)"
        >
          {{ v.variable }}
        </el-tag>
      </el-tooltip>
      <el-popover
        v-if="propertyVariables.length > maxProperties"
        placement="top"
        :width="280"
        trigger="click"
      >
        <template #reference>
          <el-tag size="small" effect="plain" class="vi-tag vi-tag-more">
            +{{ propertyVariables.length - maxProperties }}
          </el-tag>
        </template>
        <div class="vi-popover-list">
          <el-tag
            v-for="v in propertyVariables.slice(maxProperties)"
            :key="v.variable"
            size="small"
            effect="plain"
            class="vi-tag vi-tag-prop"
            @click="insertAt(v.variable)"
          >
            {{ v.variable }}
          </el-tag>
        </div>
      </el-popover>
    </div>
  </div>
</template>

<style scoped>
.variable-inserter {
  margin-top: 6px;
  padding: 8px 10px;
  background: rgba(99, 102, 241, 0.04);
  border: 1px dashed rgba(99, 102, 241, 0.2);
  border-radius: 6px;
}

.vi-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 500;
  color: var(--iot-color-text-secondary);
  margin-bottom: 6px;
}

.vi-icon {
  color: var(--iot-color-primary);
}

.vi-hint {
  margin-left: auto;
  font-weight: 400;
  font-size: 11px;
  color: var(--iot-color-text-muted);
}

.vi-group {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px;
  margin-top: 4px;
}

.vi-group-title {
  font-size: 11px;
  color: var(--iot-color-text-muted);
  margin-right: 4px;
  padding: 1px 6px;
  border-radius: 3px;
  letter-spacing: 0.5px;

  &.sys {
    background: rgba(16, 185, 129, 0.1);
    color: #047857;
  }
  &.prop {
    background: rgba(99, 102, 241, 0.1);
    color: #4338ca;
  }
}

.vi-tag {
  cursor: pointer;
  font-family: var(--iot-font-mono, ui-monospace, 'SF Mono', Menlo, monospace);
  font-size: 11px;
  transition: all 0.15s ease-out;
  user-select: none;
}

.vi-tag-sys {
  border-color: rgba(16, 185, 129, 0.4) !important;
  color: #047857 !important;
  background: rgba(16, 185, 129, 0.05) !important;

  &:hover {
    background: rgba(16, 185, 129, 0.15) !important;
    transform: translateY(-1px);
  }
}

.vi-tag-prop {
  border-color: rgba(99, 102, 241, 0.4) !important;
  color: #4338ca !important;
  background: rgba(99, 102, 241, 0.05) !important;

  &:hover {
    background: rgba(99, 102, 241, 0.15) !important;
    transform: translateY(-1px);
  }
}

.vi-tag-more {
  border-color: rgba(0, 0, 0, 0.15) !important;
  color: var(--iot-color-text-secondary) !important;
  background: rgba(0, 0, 0, 0.03) !important;
}

.vi-popover-list {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  max-height: 220px;
  overflow-y: auto;
}

:global(.dark) .variable-inserter {
  background: rgba(99, 102, 241, 0.08);
  border-color: rgba(99, 102, 241, 0.3);
}
</style>
