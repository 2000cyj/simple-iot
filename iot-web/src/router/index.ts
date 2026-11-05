import type { RouteRecordRaw } from 'vue-router'
import { createRouter, createWebHashHistory } from 'vue-router'
import login from '@/views/login/index.vue'
import layoutRout from './modules/layoutRout'

/* 菜单栏的路由 */
// 固定菜单

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    redirect: '/home',
  },
  {
    path: '/login',
    component: login,
  },
  ...layoutRout,
]

const router = createRouter({
  history: createWebHashHistory(),
  routes,
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    }
    else {
      return { left: 0, top: 0 }
    }
  },
})

export default router
