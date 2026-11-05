import type { Component } from 'vue'
import type { RouteRecordRaw } from 'vue-router'
// Element Plus 图标
import {
  Bell,
  Box,
  ChatDotRound,
  Connection,
  Document,
  House,
  Message,
  Operation,
  Picture,
  Promotion,
  Setting,
  Tools,
  TrendCharts,
  UploadFilled,
  Warning,
} from '@element-plus/icons-vue'
import layout from '@/layout/index.vue'

/**
 * 路由 meta 的自定义字段。
 *
 * vue-router 的 `RouteMeta` 默认为空接口，需要通过模块扩展才能携带
 * `title` / `icon` 等业务字段。放在本文件里，随路由表一起生效。
 */
declare module 'vue-router' {
  interface RouteMeta {
    /** 菜单标题（中文兜底文案） */
    title?: string
    /** 菜单标题的 i18n key，优先于 title 使用 */
    i18nKey?: string
    /** 菜单图标组件 */
    icon?: Component
    /** 是否在菜单中隐藏 */
    hidden?: boolean
  }
}

const home = () => import('@/views/home/index.vue')
const productType = () => import('@/views/productType/index.vue')
const protocol = () => import('@/views/protocol/index.vue')
const product = () => import('@/views/product/index.vue')
const device = () => import('@/views/device/index.vue')
const deviceGroup = () => import('@/views/device-group/index.vue')
const tslModel = () => import('@/views/tslModel/index.vue')
const deviceDetails = () => import('@/views/device/widget/details.vue')
const icon = () => import('@/views/system/icon/index.vue')
const sms = () => import('@/views/system/sms/index.vue')
const email = () => import('@/views/system/email/index.vue')
const messageReceive = () => import('@/views/system/messageReceive/index.vue')
const pushConfig = () => import('@/views/push-config/index.vue')
const driver = () => import('@/views/driver/index.vue')
const ruleChain = () => import('@/views/rule-chain/index.vue')
const ruleChainEditor = () => import('@/views/rule-chain/editor/index.vue')
const alarm = () => import('@/views/alarm/index.vue')
const dashboardList = () => import('@/views/dashboard/DashboardList.vue')
const dashboardEditor = () => import('@/views/dashboard/DashboardEditor.vue')
const ota = () => import('@/views/ota/index.vue')
const modbus = () => import('@/views/modbus/index.vue')
const webhook = () => import('@/views/webhook/index.vue')
const imPush = () => import('@/views/im-push/index.vue')

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'layout',
    component: layout,
    children: [
      {
        path: '/home',
        name: 'home',
        component: home,
        meta: {
          title: '首页',
          i18nKey: 'menu.home',
          icon: House,
        },
      },
      {
        path: '/productType',
        name: 'productType',
        meta: {
          title: '产品管理',
          i18nKey: 'menu.productManagement',
          icon: Box,
        },
        children: [
          {
            path: '/productType',
            name: 'productTypePage',
            component: productType,
            meta: {
              title: '产品类型',
              i18nKey: 'menu.productType',
              icon: Box,
            },
          },
          {
            path: '/driver',
            name: 'driver',
            component: driver,
            meta: {
              title: '驱动管理',
              i18nKey: 'menu.driver',
              icon: Tools,
            },
          },
          {
            path: '/protocol',
            name: 'protocol',
            component: protocol,
            meta: {
              title: '协议管理',
              i18nKey: 'menu.protocol',
              icon: Connection,
            },
          },
          {
            path: '/product',
            name: 'product',
            component: product,
            meta: {
              title: '产品管理',
              i18nKey: 'menu.product',
              icon: TrendCharts,
            },
          },
          {
            path: '/device',
            name: 'device',
            component: device,
            meta: {
              title: '设备管理',
              i18nKey: 'menu.device',
              icon: Document,
            },
          },
          {
            path: '/device-group',
            name: 'deviceGroup',
            component: deviceGroup,
            meta: {
              title: '设备分组',
              i18nKey: 'menu.deviceGroup',
              icon: Connection,
            },
          },
          {
            path: '/tslModel',
            name: 'tslModel',
            component: tslModel,
            meta: {
              hidden: true,
              title: '物模型配置',
              i18nKey: 'menu.tslModel',
              icon: Setting,
            },
          },
          {
            path: '/deviceDetails',
            name: 'deviceDetails',
            component: deviceDetails,
            meta: {
              hidden: true,
              title: '设备详情',
              i18nKey: 'menu.deviceDetails',
              icon: Document,
            },
          },
          {
            path: '/rule-chain',
            name: 'ruleChain',
            component: ruleChain,
            meta: {
              title: '规则引擎',
              i18nKey: 'menu.ruleChain',
              icon: Operation,
            },
          },
          {
            path: '/rule-chain/editor',
            name: 'ruleChainEditor',
            component: ruleChainEditor,
            meta: {
              hidden: true,
              title: '规则引擎编辑器',
              i18nKey: 'menu.ruleChainEditor',
              icon: Operation,
            },
          },
          {
            path: '/rule-chain/editor/:id',
            name: 'ruleChainEditorEdit',
            component: ruleChainEditor,
            meta: {
              hidden: true,
              title: '编辑规则引擎',
              i18nKey: 'menu.ruleChainEdit',
              icon: Operation,
            },
          },
          {
            path: '/alarm',
            name: 'alarm',
            component: alarm,
            meta: {
              title: '告警管理',
              i18nKey: 'menu.alarm',
              icon: Warning,
            },
          },
          {
            path: '/dashboard',
            name: 'dashboardList',
            component: dashboardList,
            meta: {
              title: '自定义仪表盘',
              i18nKey: 'menu.dashboard',
              icon: TrendCharts,
            },
          },
          {
            path: '/dashboard/editor',
            name: 'dashboardEditor',
            component: dashboardEditor,
            meta: {
              hidden: true,
              title: '仪表盘编辑器',
              i18nKey: 'menu.dashboardEditor',
              icon: TrendCharts,
            },
          },
          {
            path: '/dashboard/editor/:id',
            name: 'dashboardEditorEdit',
            component: dashboardEditor,
            meta: {
              hidden: true,
              title: '编辑仪表盘',
              i18nKey: 'menu.dashboardEdit',
              icon: TrendCharts,
            },
          },
        ],
      },
      {
        path: '/ota',
        name: 'ota',
        meta: {
          title: 'OTA升级',
          i18nKey: 'menu.ota',
          icon: UploadFilled,
        },
        children: [
          {
            path: '/ota',
            name: 'otaManagement',
            component: ota,
            meta: {
              title: 'OTA固件管理',
              i18nKey: 'menu.otaManagement',
              icon: UploadFilled,
            },
          },
        ],
      },
      {
        path: '/modbus',
        name: 'modbus',
        meta: {
          title: 'Modbus',
          i18nKey: 'menu.modbus',
          icon: Connection,
        },
        children: [
          {
            path: '/modbus',
            name: 'modbusManagement',
            component: modbus,
            meta: {
              title: 'Modbus TCP',
              i18nKey: 'menu.modbusManagement',
              icon: Connection,
            },
          },
        ],
      },
      {
        path: '/webhook',
        name: 'webhook',
        meta: {
          title: 'Webhook',
          i18nKey: 'menu.webhook',
          icon: Promotion,
        },
        children: [
          {
            path: '/webhook',
            name: 'webhookManagement',
            component: webhook,
            meta: {
              title: 'Webhook',
              i18nKey: 'menu.webhookManagement',
              icon: Promotion,
            },
          },
        ],
      },
      {
        path: '/im-push',
        name: 'imPush',
        meta: {
          title: 'IM 推送',
          i18nKey: 'menu.imPush',
          icon: ChatDotRound,
        },
        children: [
          {
            path: '/im-push',
            name: 'imPushConfig',
            component: imPush,
            meta: {
              title: 'IM 推送配置',
              i18nKey: 'menu.imPush',
              icon: ChatDotRound,
            },
          },
        ],
      },
      {
        path: '/system',
        name: 'system',
        meta: {
          title: '系统管理',
          i18nKey: 'menu.system',
          icon: Setting,
        },
        children: [
          {
            path: '/icon',
            name: 'iconManagement',
            component: icon,
            meta: {
              title: '图标管理',
              i18nKey: 'menu.iconManagement',
              icon: Picture,
            },
          },
          {
            path: '/sms',
            name: 'sms',
            component: sms,
            meta: {
              title: '短信配置',
              i18nKey: 'menu.sms',
              icon: ChatDotRound,
            },
          },
          {
            path: '/email',
            name: 'email',
            component: email,
            meta: {
              title: '邮箱配置',
              i18nKey: 'menu.email',
              icon: Message,
            },
          },
          {
            path: '/message',
            name: 'message',
            component: messageReceive,
            meta: {
              title: '消息通知',
              i18nKey: 'menu.message',
              icon: Bell,
            },
          },
          {
            path: '/push-config',
            name: 'pushConfig',
            component: pushConfig,
            meta: {
              title: '推送配置',
              i18nKey: 'menu.pushConfig',
              icon: Promotion,
            },
          },
        ],
      },
    ],
  },
]

export default routes
