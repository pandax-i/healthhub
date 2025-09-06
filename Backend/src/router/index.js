import { createRouter, createWebHashHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import LoginView from '../views/LoginView.vue'

const router = createRouter({
  history: createWebHashHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', name: 'home', component: HomeView, meta: { requiresAuth: true } },
    { path: '/login', name: 'login', component: LoginView },
    {
      path: '/meds',
      name: 'meds',
      component: () => import('../views/MedicationView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/stool',
      name: 'stool',
      component: () => import('../views/StoolView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/daily',
      name: 'daily',
      component: () => import('../views/DailyView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/memos',
      name: 'memos',
      component: () => import('../views/MemoView.vue'),
      meta: { requiresAuth: true },
    },
    // 【修改】记账页面的路由
    {
      path: '/finance',
      name: 'finance',
      component: () => import('../views/FinanceView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/pomodoro',
      name: 'pomodoro',
      component: () => import('../views/PomodoroView.vue'),
      meta: { requiresAuth: true },
    },
  ],
})

router.beforeEach((to, from, next) => {
  const loggedIn = localStorage.getItem('authToken')
  if (to.meta.requiresAuth && !loggedIn) {
    next('/login')
  } else {
    next()
  }
})

export default router
