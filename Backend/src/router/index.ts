import { createRouter, createWebHashHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import LoginView from '../views/LoginView.vue'

const router = createRouter({
  history: createWebHashHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
      meta: { requiresAuth: true }, // 这个页面需要登录才能访问
    },
    {
      path: '/login',
      name: 'login',
      component: LoginView,
    },
    {
      path: '/meds',
      name: 'meds',
      // 路由懒加载：只有当用户访问 /meds 时，才会加载这个组件的文件
      component: () => import('../views/MedicationView.vue'),
      meta: { requiresAuth: true },
    },
    // 【新增】排便记录页面的路由
    {
      path: '/stool',
      name: 'stool',
      component: () => import('../views/StoolView.vue'),
      meta: { requiresAuth: true },
    },
  ],
})

// 全局路由守卫
router.beforeEach((to, from, next) => {
  const loggedIn = localStorage.getItem('authToken')

  // 如果目标路由需要认证，但用户未登录
  if (to.meta.requiresAuth && !loggedIn) {
    // 将用户重定向到登录页
    next('/login')
  } else {
    // 否则，正常放行
    next()
  }
})

export default router
