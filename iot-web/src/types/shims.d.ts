/**
 * 第三方模块类型补丁
 *
 * 原则：逐字段写实，不用 any 兜底 —— 假类型比没有类型更危险，
 * 它会让编译器基于错误假设放行，掩盖真实错误。
 */

// ------------------------------------------------------------------
// vue-grid-layout 3.0.0-beta1：上游未提供类型声明
// ------------------------------------------------------------------
declare module 'vue-grid-layout' {
  import type { DefineComponent } from 'vue'

  export interface GridLayoutItem {
    i: string
    x: number
    y: number
    w: number
    h: number
    moved?: boolean
    static?: boolean
  }

  export interface GridLayoutProps {
    'layout': GridLayoutItem[]
    'colNum'?: number
    'rowHeight'?: number
    'maxRows'?: number
    'margin'?: number | number[]
    'isDraggable'?: boolean
    'isResizable'?: boolean
    'isMirrored'?: boolean
    'isBounded'?: boolean
    'autoSize'?: boolean
    'verticalCompact'?: boolean
    'preventCollision'?: boolean
    'useCssTransforms'?: boolean
    'responsive'?: boolean
    'breakpoints'?: Record<string, number>
    'cols'?: Record<string, number>
    'v-model:layout'?: GridLayoutItem[]
  }

  export interface GridLayoutExpose {
    layout: GridLayoutItem[]
  }

  const GridLayout: DefineComponent<GridLayoutProps, GridLayoutExpose>
  export default GridLayout
}

// ------------------------------------------------------------------
// vue-json-viewer 3.0.4：上游未提供类型声明
// ------------------------------------------------------------------
declare module 'vue-json-viewer' {
  import type { DefineComponent } from 'vue'

  export interface JsonViewerProps {
    value: unknown
    collapsed?: boolean
    collapseStringsAfterLength?: number
    depth?: number
    enabledObjectSize?: boolean
    displayDataTypes?: boolean
    displayObjectSize?: boolean
    theme?: string
    hideRoot?: boolean
    pathExpanded?: string
  }

  const JsonViewer: DefineComponent<JsonViewerProps>
  export default JsonViewer
}

// ------------------------------------------------------------------
// vite-plugin-svg-icons 注入的全局组件与虚拟模块
// ------------------------------------------------------------------
declare module 'virtual:svg-icons-register' {
  const register: (id: string) => void
  export default register
}

// 注意：这里刻意不声明 `declare module '*.vue'`。
// Vue 3 + vue-tsc 会原生解析 .vue 的真实类型，
// 通配声明反而会遮蔽 SFC 的 props/emits 类型（Vue 2 时代的遗留写法）。
