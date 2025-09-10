<script setup>
import { RouterView, RouterLink } from 'vue-router'
import { ref, onMounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'

const currentUser = ref(null)
const router = useRouter()

const checkAuthState = () => {
  const token = localStorage.getItem('authToken')
  if (token) {
    currentUser.value = { token }
  } else {
    currentUser.value = null
    router.push('/login')
  }
  nextTick(() => {
    if (typeof lucide !== 'undefined') {
      lucide.createIcons()
    }
  })
}

const logout = () => {
  localStorage.removeItem('authToken')
  currentUser.value = null
  router.push('/login')
}

onMounted(() => {
  checkAuthState()
  window.addEventListener('storage', checkAuthState)
})

router.afterEach(() => {
  nextTick(() => {
    if (typeof lucide !== 'undefined') {
      lucide.createIcons()
    }
  })
})
</script>

<template>
  <nav
    v-if="currentUser"
    class="fixed bottom-0 left-0 right-0 bg-white shadow-t-lg border-t z-50 md:top-0 md:bottom-auto md:border-b"
  >
    <div class="max-w-4xl mx-auto flex justify-around p-2 md:justify-end md:space-x-8 md:px-6">
      <RouterLink
        to="/"
        class="nav-link flex flex-col items-center text-gray-500 hover:text-blue-600"
        ><i data-lucide="home"></i><span class="text-xs mt-1">首页</span></RouterLink
      >
      <RouterLink
        to="/meds"
        class="nav-link flex flex-col items-center text-gray-500 hover:text-blue-600"
        ><i data-lucide="pilcrow"></i><span class="text-xs mt-1">用药</span></RouterLink
      >
      <RouterLink
        to="/stool"
        class="nav-link flex flex-col items-center text-gray-500 hover:text-blue-600"
        ><i data-lucide="activity"></i><span class="text-xs mt-1">排便</span></RouterLink
      >
      <RouterLink
        to="/daily"
        class="nav-link flex flex-col items-center text-gray-500 hover:text-blue-600"
        ><i data-lucide="clipboard-list"></i><span class="text-xs mt-1">清单</span></RouterLink
      >
      <RouterLink
        to="/memos"
        class="nav-link flex flex-col items-center text-gray-500 hover:text-blue-600"
        ><i data-lucide="check-square"></i><span class="text-xs mt-1">备忘录</span></RouterLink
      >
      <RouterLink
        to="/finance"
        class="nav-link flex flex-col items-center text-gray-500 hover:text-blue-600"
        ><i data-lucide="dollar-sign"></i><span class="text-xs mt-1">记账</span></RouterLink
      >
      <RouterLink
        to="/pomodoro"
        class="nav-link flex flex-col items-center text-gray-500 hover:text-blue-600"
        ><i data-lucide="timer"></i><span class="text-xs mt-1">番茄钟</span></RouterLink
      >
      <RouterLink
        to="/profile"
        class="nav-link flex flex-col items-center text-gray-500 hover:text-blue-600"
        ><i data-lucide="user"></i><span class="text-xs mt-1">我的</span></RouterLink
      >
      <button @click="logout" class="flex flex-col items-center text-gray-500 hover:text-red-600">
        <i data-lucide="log-out"></i><span class="text-xs mt-1">登出</span>
      </button>
    </div>
  </nav>

  <main class="pb-20 md:pt-16">
    <RouterView />
  </main>
</template>
