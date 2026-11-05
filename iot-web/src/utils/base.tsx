import type { VNode } from 'vue'

/** 状态类选项（激活 / 在线），供表格列 render 使用 */
export interface StatusOption {
  /** 展示文案 */
  label: string
  /** 文字颜色 */
  color: string
  /** 选项值 */
  value: boolean
  /** 自定义渲染 */
  render: (this: StatusOption) => VNode
}

export const activateOpts: StatusOption[] = [{
  label: '已激活',
  color: '#00B42A',
  value: true,
  render() {
    return <div style={{ color: this.color }}>{this.label}</div>
  },
}, {
  label: '未激活',
  color: '#A9A9A9',
  value: false,
  render() {
    return <div style={{ color: this.color }}>{this.label}</div>
  },
}]

export const onlineOpts: StatusOption[] = [{
  label: '在线',
  value: true,
  color: '#00B42A',
  render() {
    return <div style={{ color: this.color }}>{this.label}</div>
  },
}, {
  label: '离线',
  value: false,
  color: '#6E7279',
  render() {
    return <div style={{ color: this.color }}>{this.label}</div>
  },
}]
