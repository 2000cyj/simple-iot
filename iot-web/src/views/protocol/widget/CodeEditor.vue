<script setup lang="ts">
import { computed, ref } from 'vue'

interface Props {
  /** 编辑器内容 */
  modelValue?: string
  /** 脚本语言 */
  language?: string
  /** 编辑器高度（数字按 px 处理） */
  height?: string | number
  /** 是否只读 */
  readonly?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
  language: 'javascript',
  height: 400,
  readonly: false,
})

const emits = defineEmits<{
  'update:modelValue': [value: string]
}>()

const textareaRef = ref<HTMLTextAreaElement | null>(null)
const isFocused = ref(false)

// Monaco 编辑器高度
const editorHeight = computed(() => {
  return typeof props.height === 'number' ? `${props.height}px` : props.height
})

// 更新值
function updateValue(event: Event) {
  emits('update:modelValue', (event.target as HTMLTextAreaElement).value)
}

// Tab 键支持
function handleKeyDown(event: KeyboardEvent) {
  if (event.key === 'Tab') {
    event.preventDefault()
    const textarea = event.target as HTMLTextAreaElement
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const value = textarea.value

    textarea.value = `${value.substring(0, start)}  ${value.substring(end)}`
    textarea.selectionStart = textarea.selectionEnd = start + 2
    emits('update:modelValue', textarea.value)
  }
}

// 暴露方法
defineExpose({
  focus() {
    textareaRef.value?.focus()
  },
  getValue() {
    return textareaRef.value?.value || props.modelValue
  },
  setValue(value: string) {
    if (textareaRef.value) {
      textareaRef.value.value = value
    }
  },
})
</script>

<template>
  <div
    class="simple-code-editor"
    :class="{ focused: isFocused }"
    :style="{ height: editorHeight }"
  >
    <textarea
      ref="textareaRef"
      :value="modelValue"
      :readonly="readonly"
      class="editor-textarea"
      spellcheck="false"
      @input="updateValue"
      @keydown="handleKeyDown"
      @focus="isFocused = true"
      @blur="isFocused = false"
    />
  </div>
</template>

<style lang="scss" scoped>
.simple-code-editor {
  width: 100%;
  min-height: 200px;
  background: #1e1e1e;
  border-radius: 0 0 var(--radius-md) var(--radius-md);
  overflow: hidden;
  position: relative;
  transition: border-color var(--transition-fast);
  border: 1px solid transparent;

  &.focused {
    border-color: var(--iot-color-primary);
  }

  .editor-textarea {
    width: 100%;
    height: 100%;
    min-height: inherit;
    padding: 16px;
    background: transparent;
    color: #d4d4d4;
    font-family: 'Fira Code', 'Consolas', 'Monaco', 'Courier New', monospace;
    font-size: 14px;
    line-height: 1.6;
    border: none;
    outline: none;
    resize: none;
    white-space: pre;
    overflow-wrap: normal;
    overflow-x: auto;
    tab-size: 2;

    &::placeholder {
      color: #6a6a6a;
    }

    &::selection {
      background: rgba(99, 102, 241, 0.3);
    }

    &:readonly {
      cursor: not-allowed;
      opacity: 0.8;
    }
  }
}
</style>
