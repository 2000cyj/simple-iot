# iot-web 全量 TypeScript 改造方案

| 项目 | 内容 |
| --- | --- |
| 目标模块 | `iot-web/`（Vue 3.5 + Vite 7 + Element Plus） |
| 规模 | 92 文件 / 24,610 行（63 `.vue` / 28 `.js` / 1 `.jsx`） |
| 编写日期 | 2026-11-05 |
| 状态 | 待评审 → 建议先执行 P0 校准 |
| 验收标准 | `vue-tsc --noEmit` 退出码 0 + lint 通过 + dev/build 正常 |
| 明确不做 | 不写单元测试 |

---

## 零、决策前提（决定了下面所有取舍）

| 项 | 决定 | 影响 |
| --- | --- | --- |
| 验收标准 | `vue-tsc --noEmit` 退出码 0 + lint 通过 + dev/build 正常 | 不追求"类型完美"，只追求"编译干净" |
| 测试 | 不写单元测试 | 行为回归风险靠人工冒烟兜底（见风险章节） |
| 严格度 | `strict: true` + `noImplicitAny: false` | **关键折中**：保留 null 安全（真 bug 来源），放弃"每个参数都要标类型"（纯体力活） |
| 分批 | 每模块一个 commit，**重命名与内容改动分开提交** | 保证任意时刻可回滚 |

> 为什么选 `strict:true + noImplicitAny:false`：strictNullChecks 能抓出 `res.data.maybeUndefined` 这类真实崩溃，是类型系统在本项目里**最值钱的能力**；而 `noImplicitAny` 抓的是"你没写类型"，那 165 个 api 函数全都会中招，却不降低任何 bug 率——纯属体力消耗。

---

## 一、现状基线（实测，非估算）

| 维度 | 数据 |
| --- | --- |
| 总量 | 92 文件 / 24,610 行（63 `.vue` 18,346 + 28 `.js` 6,234 + 1 `.jsx` 30） |
| 类型存量 | `@type` **0 处**；`@param` 66 处但全无类型 |
| 需建模 props | 26 个组件含 `defineProps`/`defineEmits`（无一带泛型） |
| 响应式 | 258 `ref` / 11 `reactive` / 93 `computed` / 995 `.value` |
| API 层 | 165 个导出函数 / 10 文件 |
| 后端契约 | 32 Controller / 179 接口 / 40+ VO / OpenAPI 在 `/v3/api-docs` |
| 隐性依赖 | **59 处 import 带显式 `.js` 后缀**（8 个路径）——改名为 `.ts` 后**必断** |
| JSX | 16 个 `.vue` 使用 JSX + `utils/base.jsx` → 需 `.tsx` 与 `jsx` 配置 |
| 缺类型依赖 | `vue-grid-layout` / `vue-json-viewer` / `lodash` |
| 测试 | **0 个** |

### 1.1 显式 `.js` 后缀 import 明细（改名前必须处理）

```
59 处 / 8 个路径：
  @/api/index.js          @/utils/page.js
  @/composables/useForm.js  @/utils/request.js
  @/composables/useTheme.js @/utils/date_utils.js
  @/composables/useSidebar.js
```

### 1.2 含 props/emits 的 26 个组件（需建模）

```
views/rule-chain/editor/NodeConfigPanel.vue    938 行  props×2 emits×1
views/device/widget/deviceService.vue           647 行  props×2
views/protocol/widget/editDia.vue               492 行  emits×1
views/push-config/widget/editDia.vue            480 行  emits×1
components/IotTable.vue                         387 行  props×2 emits×1
views/tslModel/widget/propertyEdite.vue         382 行  emits×1
views/dashboard/WidgetRenderer.vue              342 行  props×2
components/AlarmDetailDialog.vue                279 行  props×2 emits×1
views/product/widget/editDia.vue                265 行  emits×1
views/tslModel/widget/serviceEdite.vue          246 行  emits×1
views/rule-chain/editor/VariableInserter.vue    245 行  props×2 emits×1
views/system/icon/widget/editDia.vue            233 行  emits×1
views/device/widget/editDia.vue                 171 行  emits×1
views/device/widget/deviceEvent.vue             160 行  props×2
components/IconInput.vue                        154 行  props×2 emits×1
views/protocol/widget/CodeEditor.vue            121 行  props×2 emits×1
views/system/messageReceive/widget/editDia.vue  117 行  emits×1
components/PageHeader.vue                       102 行  props×2
views/productType/widget/editDia.vue             89 行  emits×1
components/Breadcrumb.vue                        87 行  props×2
components/DefaultIcon.vue                       54 行  props×2
views/login/weight/LoginBg/CornerBottom.vue      37 行  props×2
views/device/widget/PropMetric.vue               35 行  props×2
views/login/weight/LoginBg/CornerTop.vue         31 行  props×2
views/device/widget/LabelItem.vue                18 行  props×2
views/login/weight/LoginBg/index.vue             16 行  props×2
```

---

## 二、P0：工具链骨架（0.5-1 天）

> 独立成阶段，因为**必须先有能跑的 vue-tsc**，否则后续每一步都无校验依据。

| 动作 | 细节 |
| --- | --- |
| 新增 devDeps | `typescript@5.7`、`vue-tsc@2.2`、`@vue/tsconfig` |
| 新增 `tsconfig.json` | `strict:true` + `noImplicitAny:false` + `paths:{"@/*":["./src/*"]}` + `include:["src/**/*","src/**/*.vue"]` |
| 新增 `tsconfig.node.json` | 覆盖 `vite.config.ts` / `uno.config.ts` |
| 删除 `jsconfig.json` | 与 tsconfig 冲突（`baseUrl`/`paths` 重复定义） |
| 改名 | `vite.config.mjs` → `vite.config.ts`；`uno.config.js` → `uno.config.ts` |
| 新增 `src/types/shims.d.ts` | 3 个缺类型依赖的声明（**必须逐字段写实**，不能 `any` 兜底） |
| `package.json` scripts | 加 `"typecheck": "vue-tsc --noEmit"`；`build` 改为 `"vue-tsc --noEmit && vite build"` |
| ESLint | `@antfu/eslint-config` v3 自动支持 TS，只需确保 `typescript` 在 devDeps |
| **基线测量** | 配好后先跑一次 `vue-tsc --noEmit`，记录真实错误数 → **这是后续所有工时估算的校准点** |

**交付标准**：`pnpm typecheck` 可运行；`vite build` 产物与改造前一致（字节级 diff 可验证）。

---

## 三、分层策略

TS 的严格度是**项目级**而非文件级，所以"核心严格、视图宽松"无法直接实现。落地做法：

| 层 | 模块 | 类型要求 | 手段 |
| --- | --- | --- | --- |
| **L1 精确层** | `types/` `api/` `store/` `composables/` `utils/` `router/` | 手写精确类型，`any` = 0 | OpenAPI codegen + 人工建模 |
| **L2 半精确层** | `components/` `layout/` | props/emits 必须建模，内部逻辑不强求 | `defineProps<T>()` |
| **L3 宽松层** | `views/` | 只需 `vue-tsc` 不报错，允许 `unknown` 兜底 | 优先用 `unknown` 而非 `any` |

**`any` 配额机制**（防收益归零的核心）：

- CI 加一步 `grep -c ": any\|as any\|<any>" src/` 统计，数值不得高于基线
- ESLint 开 `@typescript-eslint/no-explicit-any: 'warn'`，P7 阶段升级为 error（允许白名单）

---

## 四、P1-P7 执行计划（精确到模块）

### P1 · 类型基建 + 基础设施层（1.5-2.5 天）

| 模块 | 文件 | 行数 | 做法 |
| --- | --- | --- | --- |
| `src/types/` | 新建 | — | `api.d.ts`（codegen 产物）+ `shims.d.ts` + `common.d.ts`（`BaseResult<T>` / `PageResult<T>` 泛型封装） |
| `src/api/` | 10 | ~1,500 | **165 个函数**补签名；`api/index.js` 823 行是重点。按 `openapi-typescript` 生成的 `components['schemas'][...]` 引用 |
| `src/utils/` | 5 | 214 | `request.js` 重写为泛型 axios 实例 `request<T>()`；`base.jsx` → `base.tsx` |

> **关键杠杆**：后端已有 OpenAPI。跑一次
> `openapi-typescript http://localhost:5010/v3/api-docs -o src/types/api.d.ts`，
> 40+ 个 VO/DTO 的接口类型**自动到手**，前端 165 个 api 函数的类型从"手写"变成"引用"——这是 P1 能压到 1.5 天的唯一原因，也是整个方案里最大的成本节约点。

### P2 · 状态 / 组合式 / 路由（1-1.5 天）

| 模块 | 文件 | 行数 | 要点 |
| --- | --- | --- | --- |
| `src/store/` | 3 | 117 | `account.js` / `theme.js` 加 `defineStore` 泛型；`store/index.js` 的聚合导出需补类型 |
| `src/composables/` | 4 | 343 | `useTable.js` 162 行是重点：12 个返回值 + `dwTable` 结构必须建模（**全项目复用率最高的契约**）；`useForm` / `useSidebar` / `useTheme` 补泛型 |
| `src/router/` | 2 | 401 | `layoutRout.js` 373 行的路由表 → `RouteRecordRaw[]`；动态 `addRoute` 需 `RouteLocationNormalized` 处理 |
| `src/locales/` | 3 | 3,862 | `en-US.js` / `zh-CN.js` 1907 行 × 2 → `as const` + 生成 `LocaleKey` 联合类型（**最后做**，可选） |

### P3 · 公共组件 + 布局（1.5-2 天）

| 模块 | 文件 | 行数 | 要点 |
| --- | --- | --- | --- |
| `src/components/` | 8 | 1,187 | `IotTable.vue` 387 行（表格列/分页 props 动态）→ 需 `TableColumn` 接口；26 个组件中含 props 的全部建模 |
| `src/layout/` | 3 | 613 | `header.vue` 302 行含 JSX + 主题切换；`slider.vue` 238 行 |

### P4 · 简单业务模块（3-4 天）——低风险，可快速过

| 模块 | 文件 | 行数 | 备注 |
| --- | --- | --- | --- |
| `views/login/` | 1+3 | 227 | 登录表单，`BaseResult` 泛型首个落点 |
| `views/im-push/` | 1 | 130 | 纯 CRUD 弹窗 |
| `views/webhook/` | 1 | 280 | |
| `views/modbus/` | 1 | 244 | |
| `views/driver/` | 1 | 221 | |
| `views/ota/` | 1 | 364 | |
| `views/device-group/` | 1 | 484 | |

### P5 · 中等业务模块（4-5 天）

| 模块 | 文件 | 行数 | 风险点 |
| --- | --- | --- | --- |
| `views/product/` | 2 | 925 | `index.vue` 660 行 + `widget/editDia.vue` 265 |
| `views/productType/` | 2 | 399 | |
| `views/protocol/` | 3 | 985 | `editDia.vue` 492 含代码编辑器 |
| `views/push-config/` | 2 | 894 | `editDia.vue` 480 |
| `views/system/` | 4 | 1,545 | 4 个子模块（email / icon / messageReceive / sms） |

### P6 · 重型业务模块（8-11 天）——**成本大头，风险最高**

| 模块 | 文件 | 行数 | 最大文件 | 风险 |
| --- | --- | --- | --- | --- |
| **`views/rule-chain/`** | 4 | **3,630** | `editor/index.vue` **2,162 行** | ⚠️ 最高。节点/连线为后端动态结构 + 画布拖拽 + 缩放平移 + 4 类拖拽状态机。`NodeConfigPanel.vue` 938 行含 2 props + 1 emit |
| `views/device/` | 8 | 1,956 | `widget/deviceService.vue` 647 | 设备服务列表，多 props |
| `views/dashboard/` | 3 | 1,088 | `DashboardEditor.vue` 531 | **echarts option 类型体操** + JSX 渲染 `WidgetRenderer.vue` 342 |
| `views/tslModel/` | 9 | 1,355 | `widget/propertyEdite.vue` 382 | 物模型 JSON 动态结构，8 个 widget 文件 |
| `views/alarm/` | 1 | 653 | `index.vue` 653 | 含 JSX |
| `views/home/` | 1 | 711 | `index.vue` 711 | 含 JSX |

### P7 · 收尾：门禁与治理（0.5-1 天）

| 动作 | 说明 |
| --- | --- |
| CI 加门禁 | `.github/workflows/ci.yml` 增加 `pnpm typecheck` 步骤，**放在 lint 之前** |
| `any` 配额检查 | CI 脚本统计 `any` 数量，与基线比较，不得上升 |
| ESLint 规则 | `@typescript-eslint/no-explicit-any` 升级为 error（允许白名单） |
| 文档 | 更新 `iot-web/STYLE_GUIDE.md` / `iot-web/src/views/REFACTOR_GUIDE.md`，加入 TS 约定 |

---

## 五、跨模块的通用改造技法（一次做，全项目受益）

| 技法 | 涉及量 | 说明 |
| --- | --- | --- |
| **去显式 `.js` 后缀** | 59 处 / 8 路径 | `@/api/index.js` → `@/api/index`；不改则改名为 `.ts` 后**全部解析失败** |
| **JSX → TSX** | 16 `.vue` + 1 `.jsx` | `utils/base.jsx` → `base.tsx`；`tsconfig` 需 `jsx: "preserve"` + `jsxImportSource: "vue"` |
| **axios 泛型化** | `utils/request.js` | 改 `service` 为泛型封装，165 个 api 函数返回类型自动贯通（收益最大的一处改动） |
| **`BaseResult<T>` 封装** | 全项目 | 后端 `BaseResult` + `PageResult` 两种 `data` 形态 → `useTable` 的 `normalizePage` 对应类型守卫 |
| **Element Plus 动态表单** | 20+ 弹窗 | 表单项是运行时数组 → `FormField[]` 接口 + `Record<string, unknown>`，不强求穷举 |
| **i18n key 类型** | locales 3,862 行 | `as const` + 导出 key 联合类型（**放最后做，可选**） |

---

## 六、提交策略（防 git 历史污染）

每个模块拆两个 commit，**绝不合并**：

```bash
# ① 纯重命名（零内容改动）—— 可随时 revert，不影响运行时
git mv src/views/product/index.vue src/views/product/index.tsx
# 批量替换 import 显式 .js 后缀（单独 commit）

# ② 类型补全 —— 含运行时改动，出问题从这里 bisect
git commit -m "refactor(product): 补全产品模块类型定义"
```

理由：92 个文件重命名若与内容改写混在一起，`git bisect` 会因为"改名前后同名"而完全失效。

---

## 七、成本汇总

| 阶段 | 内容 | 人天 |
| --- | --- | --- |
| P0 | 工具链骨架 + 基线测量 | 0.5-1 |
| P1 | types + api + utils | 1.5-2.5 |
| P2 | store + composables + router + locales | 1-1.5 |
| P3 | components + layout | 1.5-2 |
| P4 | 7 个简单业务模块 | 3-4 |
| P5 | 5 个中等业务模块 | 4-5 |
| P6 | 6 个重型业务模块 | 8-11 |
| P7 | CI 门禁 + any 配额 + 文档 | 0.5-1 |
| **合计** | | **20-26** |

**折算：单人 4-5.5 周全量投入。**

### 降本开关（按优先级）

| 措施 | 省 | 代价 |
| --- | --- | --- |
| P6 视图层允许 `unknown` 兜底，不追精确类型 | -3~-4 天 | 视图层类型收益减半（本来也低） |
| `locales` 不做 key 类型化（保持 `as any`） | -0.5 天 | i18n 拼错 key 不报错 |
| `views` 层不迁，永久保留 `.js` | -8~-11 天 | 与"全部改造"目标冲突 |
| echarts option 用 `EChartsOption` 宽松断言 | -0.5 天 | 该模块类型保护基本失效 |

### 前置依赖（决定成败）

- ✅ 后端 OpenAPI 可访问（`/v3/api-docs`）→ P1 效率的决定性前提
- ⚠️ `vue-tsc` + TS 5.7 + Vue 3.5 + Vite 7 版本矩阵**未经实测** → **P0 的"基线测量"步骤就是为此设计的，必须先做**
- ⚠️ 无测试网 → 行为回归只能靠人工冒烟，**每阶段至少留 0.5 天做关键页面手工回归**

---

## 八、里程碑验收标准（DoD）

| 阶段 | 验收 |
| --- | --- |
| P0 | `pnpm typecheck` 可跑；`pnpm build` 产物与改造前一致 |
| P1 | `api/` 下 165 个函数**零 `any`**；`vue-tsc` 通过 |
| P2 | `useTable` 等 4 个 composable 返回值类型完整 |
| P3 | 26 个组件的 props/emits 全部建模 |
| P4-P6 | 每模块 `vue-tsc` 通过 + 关键页面人工冒烟通过 |
| P7 | CI 门禁生效；`any` 计数 ≤ 基线；新代码禁止 `any` |

---

## 九、风险登记

| 风险 | 等级 | 表现 | 缓解 |
| --- | --- | --- | --- |
| `any` 逃逸 | **高** | 改造完看似有类型保护，实则形同虚设 | `any` 配额门禁 + ESLint 规则 + 每阶段 review |
| 行为回归无测试网发现 | **高** | 编译通过但运行时错 | 分阶段人工冒烟；改动运行时语义的类型改造单独提交 |
| 假类型（手写 shim） | 中 | shim 写错反而掩盖真实错误 | shim 逐字段写实，禁止 `any` 兜底 |
| 迁移期双轨 | 中 | `.js`/`.ts` 混存，lint 规则出现盲区 | ESLint 按文件类型统一配置；构建产物 diff 校验 |
| 版本矩阵 | 中 | vue-tsc 与 Vue 3.5/Vite 7 不兼容 | P0 基线测量阶段提前暴露 |
| git 历史污染 | 中 | 92 文件改名 + 改写混合，`bisect` 失效 | 重命名与内容改动分 commit |
| 业务窗口期 | 中 | 单人项目迭代停滞 4-5.5 周 | 按 P0-P7 分段推进，可随时中止 |
| 假类型化收益归零 | 中 | `vue-tsc` 变常绿门禁 | `any` 配额不得上升 |

**类型检查的能力边界**：`vue-tsc` 能抓"字段名拼错、类型不匹配、未定义变量"；抓不到"逻辑等价性变化、事件时序、异步竞态、DOM 行为"。对本项目（CRUD 后台为主），字段名拼错占实际 bug 大头，类型检查约能覆盖 **20-30% 的真实缺陷**，其余依赖人工回归。

---

## 十、建议执行顺序

**先只做 P0（0.5-1 天）**，产出两个决策依据：

1. `vue-tsc` 基线错误数与分布 → 校准 P1-P7 的工时估算（当前基于经验值，实测后可能 ±30%）
2. 版本矩阵是否兼容 → 若有兼容问题，P0 阶段就暴露，而不是在 P6 才发现

P0 完成后按 P1 → P7 逐阶段推进，每阶段独立可验收、可中止。
