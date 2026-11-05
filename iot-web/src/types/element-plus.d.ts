/**
 * Element Plus 全局类型增强
 *
 * element-plus 自带 global.d.ts，其中把 $message / $msgbox / $alert / $confirm /
 * $prompt / $notify / $loading 等全局属性挂到了 Vue 的 ComponentCustomProperties 上。
 *
 * 项目在 main.ts 里通过 app.config.globalProperties 挂了这些方法，
 * 这里引用官方声明，让模板与 script 里的 ctx.$message 有准确类型，
 * 避免各视图各写一份本地交叉类型。
 *
 * 注意：运行时不能用 import 'element-plus/global'（该导出仅在 types 条件下存在），
 * 因此只能用 triple-slash reference。
 */

/// <reference types="element-plus/global" />
