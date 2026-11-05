# iot-web TypeScript 改造约定

> 所有并行改造 agent 必须遵守本文件。开工前请完整读一遍。

## 1. 工具链现状（已就绪，无需再装）

| 项 | 值 |
| --- | --- |
| TypeScript | 5.7.3 |
| vue-tsc | 2.2.0（`pnpm typecheck` = `vue-tsc --noEmit`） |
| tsconfig.json | `strict: true` + **`noImplicitAny: false`** |
| 路径别名 | `@/*` → `./src/*`（tsconfig 已配，vite 已配） |
| 类型补丁 | `src/types/shims.d.ts`（vue-grid-layout / vue-json-viewer） |

## 2. 硬性规则

1. **禁止 `any`**。类型不确定时用 `unknown` + 类型守卫；确实无法表达时用 `// eslint-disable-next-line` 并在报告中说明。
2. **不改变运行时行为**。只加类型，不改逻辑、不改接口契约、不删功能。若发现原代码有 bug，**报告但不要擅自改**（除 `noToken` 那类已授权修复）。
3. **改文件名必须用 `git mv`**（保留历史）：`git mv src/api/index.js src/api/index.ts`
4. **import 必须去掉显式 `.js` 后缀**。原代码大量写成 `@/api/index.js`、`@/utils/page.js`，改成 `.ts` 后带后缀会解析失败：
   - `@/api/index.js` → `@/api/index`
   - `@/utils/page.js` → `@/utils/page`
   - `@/components/IotTable.vue` → **保持不变**（`.vue` 后缀要保留）
5. **不执行 `git commit` / `git push`**。改完只改工作树，由主控统一分批提交。
6. **不修改自己职责范围之外的文件**。类型定义需要共享时，放进约定的公共文件并说明。

## 2.1 改造实测得出的硬规则（踩坑记录，务必遵守）

1. **目录形式的 `.vue` 导入必须写全路径**
   TS 不会对 `.vue` 做目录 index 解析，`@/layout` 会报 TS2307。
   - ✅ `@/layout/index.vue`、`@/views/home/index.vue`
   - ❌ `@/layout`、`@/views/home`
   （Vite 运行时两种写法都能解析，但 TS 不能，所以统一写全。）

2. **`createI18n` 的 options 必须保持内联对象字面量**（vue-i18n 11）
   抽成 `const messages = {...}` 再传入，TS 的 Options 推断会塌缩：
   返回类型从 `I18n<..., false>`（composition 模式）退化为 legacy 模式，
   `i18n.global.locale` 变成 `string`，`.locale.value` 直接报 TS2551。

3. **后端枚举按 `@JsonValue` 的实际序列化类型建模**
   - 带 `String @JsonValue` → JSON 里是**字符串**（如 `AlarmSeverity`、`RuleNodeType`、`DriverTypeEnum`）
   - 带 `int @JsonValue` → JSON 里是**数字**（如 `protoType`、`serviceType`、`dataType`、`platform`、`status`）
   前端现有代码按数字比较的，类型里也必须用数字联合类型。

4. **`BaseResult` / `PageResult` 的唯一权威定义在 `@/types/common`**
   `src/utils/request.ts` 只是转出，不要在那里重复定义。

5. **axios 的模块增强只在 `src/utils/request.ts` 声明一处**
   `declare module 'axios'` 里的 `__noToken` / `backOtherCode` 已在那里声明，
   其它文件重复声明会触发重复标识符错误。

6. **已知字段名特例**：`AlarmPage` 的时间字段是 `createdTime`（不是 `createTime`）。

7. **保留索引赋值 `config.headers[tokenName] = value`，不要改成 `set()`**
   axios 1.21 的 AxiosHeaders 以普通属性存 header，`set()` 会额外做名称归一化
   与值 sanitize，属于运行时行为变更。


## 3. 各层写法

### 3.1 纯逻辑模块（`.js` → `.ts`）

```ts
// src/utils/xxx.ts
export interface XxxOption {
  id: number
  name: string
}

export function xxx(options: XxxOption): string {
  // ...
}
```

### 3.2 Vue 组件（加 `lang="ts"`）

```vue
<script setup lang="ts">
import type { PropType } from 'vue'

interface Props {
  widget: { id: number; name: string }
  mode?: 'line' | 'gauge'
}

const props = withDefaults(defineProps<Props>(), {
  mode: 'line',
})

const emit = defineEmits<{
  refresh: []
}>()
</script>
```

- **优先用泛型式 `defineProps<Props>()`**；原代码是运行时对象式（`defineProps({ x: { type: ... } })`）的，改为泛型式 + `withDefaults` 补默认值。
- `defineEmits` 同理改为泛型式。
- 组件内部状态：`ref<T>()` / `reactive<T>()`。数组用 `ref<Xxx[]>([])`，不要用 `ref([])`（否则推导出 `never[]`）。

### 3.3 API 层（`src/api/*.ts`）

后端统一返回 `BaseResult<T>`，分页返回 `BaseResult<PageResult<T>>`：

```ts
// src/types/common.ts
export interface BaseResult<T = unknown> {
  code: number
  msg: string
  success: boolean
  data: T
}

export interface PageResult<T = unknown> {
  records: T[]
  total: number
  current: number
  size: number
}
```

axios 实例已泛型化，`src/utils/request.ts` 导出 `request<T>(config): Promise<BaseResult<T>>`。

### 3.4 后端数据模型类型

统一放 `src/types/api.ts`，按后端 Java VO/DTO 一一对应（字段名保持后端 camelCase 原样）：

```ts
export interface ProductVo {
  id: number
  name: string
  createTime: string
}
```

## 4. 验收标准（每个 agent 必做）

```bash
cd iot-web

# 1. 类型检查：自己负责的文件必须 0 错误
pnpm typecheck

# 2. lint：自己负责的文件不得有新增错误
pnpm exec eslint <你的文件列表>
```

**注意**：并行期间 `pnpm typecheck` 会报出**别人**文件里的错误——那不是你的责任，**不要去改别人的文件**，只在报告里提一句。

## 5. 报告格式

完成后用以下结构汇报：

```
【负责范围】改造了哪些文件
【类型产出】新增/修改了哪些类型定义
【遗留问题】any 的使用点、无法表达的类型、发现的原代码 bug
【验证结果】pnpm typecheck 中本范围文件的错误数（应为 0）、eslint 结果
```
