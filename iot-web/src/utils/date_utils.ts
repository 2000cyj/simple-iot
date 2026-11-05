import type { ConfigType, OpUnitType } from 'dayjs'
import dayjs from 'dayjs'

/**
 * 'quarter' 不在 dayjs 自带的 OpUnitType 联合类型中
 * （OpUnitType 只包含 week/w 等，不含 quarter），
 * 这里做一次纯类型层面的收窄，运行时传入的仍是 'quarter' 字符串。
 */
const QUARTER_UNIT = 'quarter' as OpUnitType

/** dayjs duration 插件的最小类型（当前项目未安装该插件） */
interface DurationLike {
  hours: () => number
  minutes: () => number
}

/** 带 duration 工厂方法的 dayjs（仅类型层面，运行时仍是同一个 dayjs 实例） */
type DayjsWithDuration = typeof dayjs & {
  duration: (milliseconds: number) => DurationLike
}

/** DateUtils 对外暴露的方法签名 */
export interface DateUtilsApi {
  /** 格式化日期 */
  formatDate: (date: ConfigType, format?: string) => string
  /** 获取给定日期的月初时间 */
  getMonthStart: (date?: ConfigType) => Date
  /** 获取给定日期的月末时间 */
  getMonthEnd: (date?: ConfigType) => Date
  /** 获取给定日期的本日开始时间 */
  getStartOfDay: (date?: ConfigType) => Date
  /** 获取给定日期的本日结束时间 */
  getEndOfDay: (date?: ConfigType) => Date
  /** 获取本季度的开始时间 */
  getQuarterStart: (date?: ConfigType) => Date
  /** 获取本季度的结束时间 */
  getQuarterEnd: (date?: ConfigType) => Date
  /** 获取本年的开始时间 */
  getYearStart: (date?: ConfigType) => Date
  /** 获取本年的结束时间 */
  getYearEnd: (date?: ConfigType) => Date
  /** 获取本月的开始和结束时间（格式化为字符串） */
  getLocalMonthStartEnd: () => { beginTime: string, endTime: string }
  /** 计算两个日期之间的时间差，返回 "XX小时XX分钟" 格式 */
  calculateTimeDifference: (date1: ConfigType, date2: ConfigType) => string
}

const DateUtils: DateUtilsApi = {
  // 格式化日期
  formatDate(date, format = 'YYYY-MM-DD HH:mm:ss') {
    return dayjs(date).format(format)
  },

  // 获取给定日期的月初时间
  getMonthStart(date = new Date()) {
    return dayjs(date).startOf('month').toDate()
  },

  // 获取给定日期的月末时间
  getMonthEnd(date = new Date()) {
    return dayjs(date).endOf('month').toDate()
  },

  // 获取给定日期的本日开始时间
  getStartOfDay(date = new Date()) {
    return dayjs(date).startOf('day').toDate()
  },

  // 获取给定日期的本日结束时间
  getEndOfDay(date = new Date()) {
    return dayjs(date).endOf('day').toDate()
  },

  // 获取本季度的开始时间
  getQuarterStart(date = new Date()) {
    return dayjs(date).startOf(QUARTER_UNIT).toDate()
  },

  // 获取本季度的结束时间
  getQuarterEnd(date = new Date()) {
    return dayjs(date).endOf(QUARTER_UNIT).toDate()
  },

  // 获取本年的开始时间
  getYearStart(date = new Date()) {
    return dayjs(date).startOf('year').toDate()
  },

  // 获取本年的结束时间
  getYearEnd(date = new Date()) {
    return dayjs(date).endOf('year').toDate()
  },

  // 获取本月的开始和结束时间（格式化为字符串）
  getLocalMonthStartEnd() {
    return {
      beginTime: this.formatDate(this.getMonthStart()),
      endTime: this.formatDate(this.getMonthEnd()),
    }
  },

  // 计算两个日期之间的时间差，返回 "XX小时XX分钟" 格式
  calculateTimeDifference(date1, date2) {
    const diff = dayjs(date2).diff(dayjs(date1))
    const duration = (dayjs as DayjsWithDuration).duration(diff)
    const hours = duration.hours()
    const minutes = duration.minutes()
    return `${hours}小时${minutes}分`
  },
}

export { DateUtils }
