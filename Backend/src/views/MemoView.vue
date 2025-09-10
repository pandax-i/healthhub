<script setup>
import { ref, onMounted, computed, nextTick } from 'vue'

// --- 状态 ---
const API_BASE_URL = 'your_api_base_url' // 您的后端API地址
const toast = ref({ show: false, message: '', isSuccess: true })
const allMemos = ref([])
const newMemo = ref({ task_name: '', priority: 'medium' })
const filter = ref('pending') // 【修改】默认筛选'待办'
const historySearchQuery = ref('')
const historySearchResults = ref([])
const isSearching = ref(false)

// --- Computed ---
const priorityMap = {
  high: { text: '高', color: 'bg-red-500', border: 'border-red-500' },
  medium: { text: '中', color: 'bg-yellow-500', border: 'border-yellow-500' },
  low: { text: '低', color: 'bg-blue-500', border: 'border-blue-500' },
}

const filteredMemos = computed(() => {
  let memos = allMemos.value
  if (filter.value === 'pending') {
    memos = memos.filter((memo) => !memo.is_completed)
  }
  if (filter.value === 'completed') {
    memos = memos.filter((memo) => memo.is_completed)
  }
  return memos
})

// --- 方法 ---
const showToast = (message, isSuccess = true) => {
  toast.value = { show: true, message, isSuccess }
  setTimeout(() => {
    toast.value.show = false
  }, 3000)
}

const apiRequest = async (endpoint, method = 'GET', body = null) => {
  const headers = { 'Content-Type': 'application/json' }
  const token = localStorage.getItem('authToken')
  if (token) headers['Authorization'] = `Bearer ${token}`
  const config = { method, headers }
  if (body) config.body = JSON.stringify(body)
  const response = await fetch(`${API_BASE_URL}${endpoint}`, config)
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: '请求失败' }))
    throw new Error(errorData.message)
  }
  if (response.status === 204 || response.headers.get('content-length') === '0') return null
  return response.json()
}

const loadMemos = async () => {
  try {
    allMemos.value = await apiRequest('/memos')
    nextTick(() => {
      if (typeof lucide !== 'undefined') lucide.createIcons()
    })
  } catch (error) {
    showToast(`加载备忘录失败: ${error.message}`, false)
  }
}

const sortMemos = () => {
  allMemos.value.sort((a, b) => {
    const priorityOrder = { high: 1, medium: 2, low: 3 }
    // 未完成的在前
    if (a.is_completed !== b.is_completed) {
      return a.is_completed - b.is_completed
    }
    // 按优先级排序
    return priorityOrder[a.priority] - priorityOrder[b.priority]
  })
}

const addMemo = async () => {
  if (!newMemo.value.task_name.trim()) {
    showToast('任务内容不能为空', false)
    return
  }
  try {
    const addedMemo = await apiRequest('/memos', 'POST', newMemo.value)
    allMemos.value.unshift(addedMemo)
    sortMemos() // 排序
    newMemo.value = { task_name: '', priority: 'medium' }
    showToast('任务已添加')
  } catch (error) {
    showToast(`添加失败: ${error.message}`, false)
  }
}

const toggleMemoStatus = async (memo) => {
  try {
    const newStatus = !memo.is_completed
    await apiRequest(`/memos/${memo.id}/status`, 'PUT', { is_completed: newStatus })
    memo.is_completed = newStatus
    memo.completed_at = newStatus ? new Date().toISOString() : null // 立即更新完成时间
    sortMemos() // 状态改变后重新排序
  } catch (error) {
    showToast(`更新状态失败: ${error.message}`, false)
  }
}

const deleteMemo = async (memo) => {
  if (confirm(`确定要删除任务 "${memo.task_name}" 吗？`)) {
    try {
      await apiRequest(`/memos/${memo.id}`, 'DELETE')
      allMemos.value = allMemos.value.filter((m) => m.id !== memo.id)
      showToast('任务已删除')
    } catch (error) {
      showToast(`删除失败: ${error.message}`, false)
    }
  }
}

const searchHistory = async () => {
  if (!historySearchQuery.value.trim()) {
    historySearchResults.value = []
    return
  }
  isSearching.value = true
  try {
    const results = await apiRequest(
      `/memos/history/search?q=${encodeURIComponent(historySearchQuery.value)}`,
    )
    historySearchResults.value = results
  } catch (error) {
    showToast('搜索失败: ' + error.message, false)
  } finally {
    isSearching.value = false
  }
}

// --- 生命周期 ---
onMounted(loadMemos)
</script>

<template>
  <div class="container mx-auto p-4 md:p-6 max-w-3xl">
    <header class="mb-6">
      <div class="bg-white/80 backdrop-blur-sm px-6 py-4 rounded-xl shadow border border-white/20">
        <h1 class="text-2xl font-bold">备忘录</h1>
        <p class="text-gray-500 mt-1">记录和管理您的待办事项</p>
      </div>
    </header>

    <!-- 添加任务表单 -->
    <div class="bg-white/80 backdrop-blur-sm p-6 rounded-xl shadow-md mb-6 border border-white/20">
      <form @submit.prevent="addMemo" class="space-y-4">
        <input
          type="text"
          v-model="newMemo.task_name"
          placeholder="需要做什么？"
          class="w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm"
        />
        <div class="flex items-center justify-between">
          <div class="flex items-center space-x-4">
            <label class="flex items-center"
              ><input
                type="radio"
                v-model="newMemo.priority"
                value="high"
                class="mr-1 text-red-500 focus:ring-red-500"
              />
              <span class="text-red-600 font-semibold">高</span></label
            >
            <label class="flex items-center"
              ><input
                type="radio"
                v-model="newMemo.priority"
                value="medium"
                class="mr-1 text-yellow-500 focus:ring-yellow-500"
              />
              <span class="text-yellow-600 font-semibold">中</span></label
            >
            <label class="flex items-center"
              ><input
                type="radio"
                v-model="newMemo.priority"
                value="low"
                class="mr-1 text-blue-500 focus:ring-blue-500"
              />
              <span class="text-blue-600 font-semibold">低</span></label
            >
          </div>
          <button
            type="submit"
            class="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg shadow-md"
          >
            添加任务
          </button>
        </div>
      </form>
    </div>

    <!-- 筛选和列表 -->
    <main class="mb-8">
      <div
        class="flex items-center justify-between bg-white/80 backdrop-blur-sm p-2 rounded-xl shadow-md mb-6 border border-white/20"
      >
        <!-- 【修改】调整按钮顺序 -->
        <button
          @click="filter = 'pending'"
          :class="{ 'bg-blue-500 text-white': filter === 'pending' }"
          class="flex-1 py-2 px-4 rounded-lg"
        >
          待办
        </button>
        <button
          @click="filter = 'completed'"
          :class="{ 'bg-blue-500 text-white': filter === 'completed' }"
          class="flex-1 py-2 px-4 rounded-lg"
        >
          已完成
        </button>
        <button
          @click="filter = 'all'"
          :class="{ 'bg-blue-500 text-white': filter === 'all' }"
          class="flex-1 py-2 px-4 rounded-lg"
        >
          全部
        </button>
      </div>

      <div
        v-if="filteredMemos.length === 0"
        class="text-center py-12 bg-white/60 backdrop-blur-sm rounded-xl"
      >
        <p>太棒了！当前分类下没有任务。</p>
      </div>
      <div class="space-y-3">
        <div
          v-for="memo in filteredMemos"
          :key="memo.id"
          class="bg-white/80 backdrop-blur-sm p-4 rounded-lg shadow-sm flex items-start justify-between border-l-4"
          :class="priorityMap[memo.priority].border"
        >
          <div class="flex items-start">
            <input
              type="checkbox"
              :checked="memo.is_completed"
              @change="toggleMemoStatus(memo)"
              class="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-4 mt-1"
            />
            <div>
              <span :class="{ 'line-through text-gray-400': memo.is_completed }">{{
                memo.task_name
              }}</span>
              <div class="flex items-center text-xs text-gray-500 mt-1">
                <span
                  class="w-3 h-3 rounded-full mr-1"
                  :class="priorityMap[memo.priority].color"
                ></span>
                <span>优先级: {{ priorityMap[memo.priority].text }}</span>
                <template v-if="memo.is_completed && memo.completed_at">
                  <span class="mx-2">|</span>
                  <span>完成于: {{ new Date(memo.completed_at).toLocaleString('zh-CN') }}</span>
                </template>
              </div>
            </div>
          </div>
          <button @click="deleteMemo(memo)" class="text-red-500 hover:text-red-700 p-1">
            <i data-lucide="trash-2" class="w-5 h-5"></i>
          </button>
        </div>
      </div>
    </main>

    <!-- 历史记录查询 -->
    <div>
      <div
        class="bg-white/80 backdrop-blur-sm p-4 rounded-xl shadow-md mb-4 border border-white/20"
      >
        <h2 class="text-xl font-semibold">查询已完成的任务</h2>
      </div>
      <form @submit.prevent="searchHistory" class="flex items-center space-x-2 mb-4">
        <input
          type="text"
          v-model="historySearchQuery"
          placeholder="输入关键词搜索..."
          class="w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm"
        />
        <button
          type="submit"
          class="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg shadow-md"
        >
          搜索
        </button>
      </form>
      <main class="space-y-3">
        <div v-if="isSearching" class="text-center py-8 bg-white/60 backdrop-blur-sm rounded-xl">
          <p>正在搜索...</p>
        </div>
        <div
          v-else-if="historySearchResults.length === 0"
          class="text-center py-8 bg-white/60 backdrop-blur-sm rounded-xl"
        >
          <p>{{ historySearchQuery ? '没有找到匹配的已完成记录' : '输入关键词以查询历史' }}</p>
        </div>
        <div
          v-for="result in historySearchResults"
          :key="result.id"
          class="bg-white/80 backdrop-blur-sm p-4 rounded-lg shadow-sm border-l-4"
          :class="priorityMap[result.priority].border"
        >
          <p class="font-semibold line-through text-gray-500">{{ result.task_name }}</p>
          <p class="text-sm text-gray-600">
            完成于: {{ new Date(result.completed_at).toLocaleString('zh-CN') }}
          </p>
        </div>
      </main>
    </div>

    <div
      v-if="toast.show"
      :class="toast.isSuccess ? 'bg-green-500' : 'bg-red-500'"
      class="fixed bottom-24 md:bottom-5 right-5 text-white py-2 px-4 rounded-lg shadow-xl z-50"
    >
      {{ toast.message }}
    </div>
  </div>
</template>
