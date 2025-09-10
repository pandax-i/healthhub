import { createRouter, createWebHashHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import LoginView from '../views/LoginView.vue'
import AuthCallback from '../views/AuthCallback.vue'

const router = createRouter({
  history: createWebHashHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', name: 'home', component: HomeView, meta: { requiresAuth: true } },
    { path: '/login', name: 'login', component: LoginView },
    { path: '/auth/callback', name: 'authCallback', component: AuthCallback },
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
    // “我的”页面路由
    {
      path: '/profile',
      name: 'profile',
      component: () => import('../views/ProfileView.vue'),
      meta: { requiresAuth: true },
    },
  ],
})

router.beforeEach((to, from, next) => {
  console.log(`%c[Router Guard] Navigation Triggered!`, 'color: blue; font-weight: bold;');
  console.log(`From: ${from.fullPath}`);
  console.log(`To: ${to.fullPath}`);
  console.log('Full "to" object:', to); // 打印完整的 "to" 对象

  const loggedIn = localStorage.getItem('authToken');

  // 规则1：如果目标是回调页，直接放行
  if (to.name === 'authCallback') {
    console.log('%c[Router Guard] Decision: ALLOW - Target is authCallback.', 'color: green;');
    next();
    return;
  }

  // 规则2：如果目标是登录页，直接放行
  if (to.name === 'login') {
    console.log('%c[Router Guard] Decision: ALLOW - Target is login page.', 'color: green;');
    next();
    return;
  }

  // 规则3：如果目标需要登录，但用户未登录，则重定向到登录页
  if (to.meta.requiresAuth && !loggedIn) {
    console.log(`%c[Router Guard] Decision: REDIRECT - Auth required for ${to.path} and user is NOT logged in. Redirecting to /login.`, 'color: red;');
    next({ name: 'login' });
    return;
  }

  // 规则4：其他所有情况（例如已登录访问或访问公共页面），直接放行
  console.log(`%c[Router Guard] Decision: ALLOW - Navigation to ${to.path} permitted.`, 'color: green;');
  next();
})

export default router
