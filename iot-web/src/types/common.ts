/**
 * 通用契约类型（地基层）。
 *
 * 对应后端类：
 * - com.github.dingdaoyi.core.base.BaseResult<T>      统一响应信封
 * - com.github.dingdaoyi.core.base.PageResult<T>       分页载荷
 * - com.github.dingdaoyi.model.PageQuery               分页查询基类
 * - com.github.dingdaoyi.model.vo.DictDataVO            字典项（继承 entity/Dict）
 *
 * 全局约定（后续所有 agent 必须遵守）：
 * 1. 后端 ObjectMapper 全局 `JsonInclude.NON_NULL`（见 MicaConfig.objectMapper()），
 *    Java 侧为 null 的字段根本不会出现在 JSON 里 —— 所以「可为空」的字段一律带 `?`。
 * 2. 时间字段一律是字符串（后端 @JsonFormat，格式 `yyyy-MM-dd HH:mm:ss`），
 *    不使用 `Date`，避免跨端时区问题。
 * 3. Java 枚举一律用字面量联合（见 `src/types/api.ts`），
 *    `@JsonValue` 为 String 的取名称字符串，`@JsonValue` 为 int 的取数字。
 */

/**
 * 统一响应结果。
 *
 * 对应后端 `com.github.dingdaoyi.core.base.BaseResult<T>`。
 *
 * 注意：后端 `BaseResult` 标注了 `@JsonInclude(NON_NULL)`，
 * 当 `data` 为 null 时该属性整体缺失（不会返回 `"data": null`）。
 * 需要“无载荷”的响应时请用 `BaseResult<void>` 并自行判空。
 */
export interface BaseResult<T = unknown> {
  /** 响应码。1 / 200 代表成功，其余为业务错误码 */
  code: number
  /** 响应消息，失败时为错误提示 */
  msg: string
  /** 是否成功。后端由 `BaseResult.isSuccess()` 从 code 推导，Jackson 序列化为 success 属性 */
  success: boolean
  /** 响应数据 */
  data: T
}

/**
 * 分页数据。
 *
 * 对应后端 `com.github.dingdaoyi.core.base.PageResult<T>`。
 * 对外 HTTP 响应统一是 `BaseResult<PageResult<T>>`。
 */
export interface PageResult<T = unknown> {
  /** 数据列表 */
  records: T[]
  /** 总记录数 */
  total: number
  /** 当前页码 */
  current: number
  /** 每页大小 */
  size: number
}

/**
 * 排序方式。
 * 对应后端 `com.github.dingdaoyi.model.PageQuery.Direction`。
 */
export type SortDirection = 'ASC' | 'DESC'

/**
 * 分页查询基类。
 *
 * 对应后端 `com.github.dingdaoyi.model.PageQuery`。
 * 各模块的分页查询对象继承自它（见 `src/types/api.ts` 中的 `*PageQuery`）。
 */
export interface PageQuery {
  /** 当前页数。后端默认 0（从 0 开始计数） */
  page: number
  /** 每页数量。后端默认 20 */
  size: number
  /** 基础名称（模糊搜索关键字）。后端可为空 */
  name?: string
  /** 排序字段 */
  sortFields?: string[]
  /** 排序方式。后端默认 DESC */
  sortDirection?: SortDirection
}

/**
 * 字典项。
 *
 * 对应后端 `com.github.dingdaoyi.model.vo.DictDataVO`（继承 `entity/Dict.java`）。
 * 注意字典项的 `label` / `value` 取自数据库列 `dict_label` / `dict_value`。
 */
export interface DictItem {
  /** 主键 */
  id: number
  /** 字典分组（字典编码）。可为空 */
  dictGroup?: string
  /** 字典键 */
  label: string
  /** 字典值 */
  value: string
  /** 备注信息。可为空 */
  remark?: string
  /** 排序字段。可为空 */
  sort?: number
  /** 创建时间。可为空 */
  createTime?: string
  /** 更新时间。可为空 */
  updateTime?: string
}

/**
 * 通用选项（前端下拉框的单项）。
 *
 * 后端无一一对应的类；与 Element Plus 的 `el-option` 对齐。
 */
export interface Option<T = string | number> {
  /** 展示文本 */
  label: string
  /** 选项值 */
  value: T
}

/**
 * 通用选项项（前端下拉框）。
 *
 * 在 `Option` 基础上补充 Element Plus 支持、且后端告警统计接口
 * （`/alarm/statistics`）实际返回的 `color` 字段。
 */
export interface OptionItem<T = string | number> extends Option<T> {
  /** 是否禁用 */
  disabled?: boolean
  /** 展示颜色（如告警严重程度色值 `#dc2626`） */
  color?: string
}
