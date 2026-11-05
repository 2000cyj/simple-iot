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

declare module '*.vue' {
  import type { DefineComponent } from 'vue'

  const component: DefineComponent<Record<string, unknown>, Record<string, unknown>, unknown>
  export default component
}
