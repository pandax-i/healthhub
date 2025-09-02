<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

// --- 响应式状态 ---
const isLogin = ref(true)
const authForm = ref({ email: '', password: '' })
const authError = ref('')
const API_BASE_URL = 'http://129.204.252.237:3000/api' // 您的后端API地址

// --- 方法 ---
const apiRequest = async (endpoint, method = 'GET', body = null) => {
  const headers = { 'Content-Type': 'application/json' }
  const config = { method, headers }
  if (body) config.body = JSON.stringify(body)

  const response = await fetch(`${API_BASE_URL}${endpoint}`, config)
  const data = await response.json()
  if (!response.ok) {
    throw new Error(data.message || '操作失败')
  }
  return data
}

const handleAuth = async () => {
  authError.value = ''
  const endpoint = isLogin.value ? '/login' : '/register'
  try {
    const data = await apiRequest(endpoint, 'POST', authForm.value)
    if (isLogin.value) {
      localStorage.setItem('authToken', data.token)
      // 登录成功后，我们不直接操作 App.vue 的状态，而是跳转页面
      // App.vue 会监听到 storage 变化或在页面加载时重新检查登录状态
      window.dispatchEvent(new Event('storage')) // 立即触发 storage 事件
      router.push('/') // 跳转到首页
    } else {
      alert('注册成功！请使用您的新账户登录。')
      isLogin.value = true
      authForm.value = { email: '', password: '' }
    }
  } catch (error) {
    authError.value = error.message
  }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center p-4">
    <!-- 【修改】将 bg-white 改为半透明的磨砂玻璃效果 -->
    <div
      class="max-w-md w-full bg-white/80 backdrop-blur-sm p-8 rounded-2xl shadow-lg border border-white/20"
    >
      <h2 class="text-2xl font-bold text-center text-blue-600 mb-6">
        {{ isLogin ? '登录' : '注册' }}
      </h2>
      <form @submit.prevent="handleAuth">
        <div class="mb-4">
          <label for="email" class="block text-sm font-medium text-gray-700">邮箱</label>
          <input
            type="email"
            v-model="authForm.email"
            required
            class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div class="mb-6">
          <label for="password" class="block text-sm font-medium text-gray-700"
            >密码 (至少6位)</label
          >
          <input
            type="password"
            v-model="authForm.password"
            required
            class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <button
          type="submit"
          class="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg transition-all"
        >
          {{ isLogin ? '登录' : '注册' }}
        </button>
      </form>
      <p class="text-center text-sm text-gray-600 mt-4">
        <span>{{ isLogin ? '还没有账户？' : '已有账户？' }}</span>
        <a
          href="#"
          @click.prevent="isLogin = !isLogin"
          class="font-medium text-blue-600 hover:text-blue-500"
          >{{ isLogin ? '立即注册' : '立即登录' }}</a
        >
      </p>
      <p v-if="authError" class="text-red-500 text-sm mt-2 text-center">{{ authError }}</p>
    </div>
  </div>
</template>
