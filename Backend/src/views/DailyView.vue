<template>
  <div class="container mx-auto p-4 md:p-6 max-w-4xl">
    <header class="mb-6">
      <div class="inline-block bg-white/80 backdrop-blur-sm rounded-xl p-4 shadow">
        <h1 class="text-2xl font-bold">每日清单</h1>
        <p class="text-gray-500 mt-1">追踪您的每日习惯与一次性任务</p>
      </div>
    </header>

    <main class="space-y-6">
      <!-- 管理区域 -->
      <div class="bg-white/80 backdrop-blur-sm rounded-xl p-4 shadow">
        <div class="flex justify-between items-center">
          <h2 class="text-xl font-semibold">任务管理</h2>
          <button
            @click="isManaging = !isManaging"
            class="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg transition-all text-sm"
          >
            {{ isManaging ? '完成' : '添加 / 管理' }}
          </button>
        </div>
        <div v-if="isManaging" class="mt-4 border-t pt-4">
          <form @submit.prevent="handleAddItem" class="flex flex-col sm:flex-row gap-2 mb-4">
            <input
              v-model="newItemName"
              type="text"
              placeholder="输入新任务名称..."
              class="flex-grow px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
            <select
              v-model="newItemType"
              class="px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="daily">每日任务</option>
              <option value="one-time">一次性任务</option>
            </select>
            <button
              type="submit"
              class="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg transition-all"
            >
              添加
            </button>
          </form>
        </div>
      </div>

      <!-- 任务列表区域 -->
      <div class="bg-white/80 backdrop-blur-sm rounded-xl p-4 shadow">
        <div
          class="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4"
        >
          <h2 class="text-xl font-semibold">今日任务</h2>
          <input
            type="date"
            v-model="selectedDate"
            class="px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <!-- 每日任务 -->
        <div v-if="dailyTasks.length > 0">
          <h3 class="text-lg font-semibold mb-2 text-gray-700">每日任务</h3>
          <ul class="space-y-2">
            <li
              v-for="item in dailyTasks"
              :key="item.id"
              class="flex justify-between items-center p-3 bg-gray-50 rounded-lg"
            >
              <span>{{ item.item_name }}</span>
              <div class="flex items-center gap-2">
                <template v-if="getLogStatus(item.item_name) === 'pending'">
                  <button
                    @click="updateLogStatus(item.item_name, 'completed')"
                    class="text-xs bg-green-500 hover:bg-green-600 text-white font-semibold py-1 px-3 rounded-full transition-all"
                  >
                    完成
                  </button>
                  <button
                    @click="updateLogStatus(item.item_name, 'skipped')"
                    class="text-xs bg-yellow-500 hover:bg-yellow-600 text-white font-semibold py-1 px-3 rounded-full transition-all"
                  >
                    跳过
                  </button>
                </template>
                <template v-else>
                  <span
                    :class="
                      getLogStatus(item.item_name) === 'completed'
                        ? 'text-green-600'
                        : 'text-yellow-600'
                    "
                    class="text-sm font-semibold"
                  >
                    {{ getLogStatus(item.item_name) === 'completed' ? '今日已完成' : '今日已跳过' }}
                  </span>
                  <button
                    @click="updateLogStatus(item.item_name, 'pending')"
                    class="text-xs text-gray-500 hover:text-gray-700"
                  >
                    撤销
                  </button>
                </template>
                <!-- 【已修复】将图标按钮替换为文字按钮 -->
                <button
                  v-if="isManaging"
                  @click="handleDeleteItem(item)"
                  class="text-xs bg-red-500 hover:bg-red-600 text-white font-semibold py-1 px-2 rounded-full transition-all"
                >
                  删除
                </button>
              </div>
            </li>
          </ul>
        </div>

        <!-- 一次性任务 -->
        <div v-if="oneTimeTasks.length > 0" class="mt-4">
          <h3 class="text-lg font-semibold mb-2 text-gray-700">一次性任务</h3>
          <ul class="space-y-2">
            <li
              v-for="item in oneTimeTasks"
              :key="item.id"
              class="flex justify-between items-center p-3 bg-gray-50 rounded-lg"
            >
              <span :class="{ 'line-through text-gray-400': item.status === 'completed' }">{{
                item.item_name
              }}</span>
              <div class="flex items-center gap-2">
                <span
                  v-if="item.status === 'completed'"
                  class="text-sm font-semibold text-green-600"
                  >已完成</span
                >
                <button
                  v-else
                  @click="completeOneTimeTask(item)"
                  class="text-xs bg-green-500 hover:bg-green-600 text-white font-semibold py-1 px-3 rounded-full transition-all"
                >
                  完成
                </button>
                <!-- 【已修复】将图标按钮替换为文字按钮 -->
                <button
                  v-if="isManaging"
                  @click="handleDeleteItem(item)"
                  class="text-xs bg-red-500 hover:bg-red-600 text-white font-semibold py-1 px-2 rounded-full transition-all"
                >
                  删除
                </button>
              </div>
            </li>
          </ul>
        </div>

        <div
          v-if="!isLoading && dailyTasks.length === 0 && oneTimeTasks.length === 0"
          class="text-center py-8 text-gray-500"
        >
          <p>暂无任务项目。</p>
          <p>点击 "添加 / 管理" 来创建您的第一个任务吧！</p>
        </div>
      </div>

      <!-- 历史记录查询 -->
      <div class="bg-white/80 backdrop-blur-sm rounded-xl p-4 shadow">
        <h2 class="text-xl font-semibold mb-4">历史记录查询</h2>
        <div class="flex gap-2">
          <input
            type="text"
            v-model="searchQuery"
            @keyup.enter="searchHistory"
            placeholder="输入关键词搜索历史..."
            class="flex-grow px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
          <button
            @click="searchHistory"
            class="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg transition-all"
          >
            搜索
          </button>
        </div>
        <div v-if="isSearching" class="text-center py-4">正在搜索...</div>
        <ul v-if="searchResults.length > 0" class="mt-4 space-y-2">
          <li v-for="log in searchResults" :key="log.id" class="p-3 bg-gray-50 rounded-lg text-sm">
            <span class="font-semibold">{{ new Date(log.log_date).toLocaleDateString() }}</span> -
            <span>{{ log.item_name }}</span
            >:
            <span
              class="font-medium"
              :class="log.status === 'completed' ? 'text-green-600' : 'text-yellow-600'"
              >{{ log.status === 'completed' ? '已完成' : '已跳过' }}</span
            >
            <p v-if="log.notes" class="text-xs text-gray-500 mt-1 pl-2 border-l-2">
              {{ log.notes }}
            </p>
          </li>
        </ul>
        <p
          v-if="!isSearching && searchResults.length === 0 && hasSearched"
          class="mt-4 text-center text-gray-500"
        >
          未找到相关记录。
        </p>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch, nextTick } from 'vue'

// --- State ---
const isLoading = ref(true)
const isManaging = ref(false)
const dailyItems = ref([])
const dailyLogs = ref({})
const selectedDate = ref(new Date().toISOString().split('T')[0])

const newItemName = ref('')
const newItemType = ref('daily')

const searchQuery = ref('')
const searchResults = ref([])
const isSearching = ref(false)
const hasSearched = ref(false)

const API_BASE_URL = 'your_api_base_url' // 您的后端API地址

// --- Methods ---
const showToast = (message, isSuccess = true) => {
  const toast = document.createElement('div')
  toast.textContent = message
  toast.className = `fixed bottom-5 right-5 text-white py-2 px-4 rounded-lg shadow-xl transition-all duration-300 z-50 ${isSuccess ? 'bg-green-500' : 'bg-red-500'}`
  document.body.appendChild(toast)
  setTimeout(() => {
    toast.style.opacity = '0'
    toast.style.transform = 'translateY(10px)'
    setTimeout(() => document.body.removeChild(toast), 300)
  }, 2000)
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
    throw new Error(errorData.message || '服务器响应异常')
  }
  if (response.status === 204 || response.headers.get('content-length') === '0') return null
  return response.json()
}

// Computed Properties
const dailyTasks = computed(() => {
  return (Array.isArray(dailyItems.value) ? dailyItems.value : []).filter(
    (item) => item.item_type === 'daily',
  )
})

const oneTimeTasks = computed(() => {
  return (Array.isArray(dailyItems.value) ? dailyItems.value : []).filter(
    (item) => item.item_type === 'one-time',
  )
})

const loadAllData = async () => {
  isLoading.value = true
  try {
    await Promise.all([loadItems(), loadLogsForDate(selectedDate.value)])
  } catch (error) {
    showToast('加载初始数据失败', false)
  } finally {
    isLoading.value = false
  }
}

const loadItems = async () => {
  try {
    const responseData = await apiRequest('/daily-logs/items')
    dailyItems.value = Array.isArray(responseData) ? responseData : []
  } catch (error) {
    showToast(`获取清单项目失败: ${error.message}`, false)
    dailyItems.value = []
  }
}

const loadLogsForDate = async (date) => {
  try {
    const logs = await apiRequest(`/daily-logs/logs/${date}`)
    dailyLogs.value = (Array.isArray(logs) ? logs : []).reduce((acc, log) => {
      acc[log.item_name] = log
      return acc
    }, {})
  } catch (error) {
    showToast(`获取当日记录失败: ${error.message}`, false)
    dailyLogs.value = {}
  }
}

const getLogStatus = (itemName) => {
  return dailyLogs.value[itemName]?.status || 'pending'
}

const updateLogStatus = async (itemName, status) => {
  const logData = {
    log_date: selectedDate.value,
    item_name: itemName,
    status: status,
    notes: dailyLogs.value[itemName]?.notes || '',
  }
  try {
    await apiRequest('/daily-logs/logs', 'POST', logData)
    await loadLogsForDate(selectedDate.value)
  } catch (error) {
    showToast(`更新状态失败: ${error.message}`, false)
  }
}

const completeOneTimeTask = async (item) => {
  try {
    await apiRequest(`/daily-logs/items/${item.id}/complete`, 'PUT')
    showToast(`任务 "${item.item_name}" 已完成!`)
    const taskIndex = dailyItems.value.findIndex((t) => t.id === item.id)
    if (taskIndex !== -1) {
      dailyItems.value[taskIndex].status = 'completed'
    }
  } catch (error) {
    showToast(`操作失败: ${error.message}`, false)
  }
}

const handleAddItem = async () => {
  if (!newItemName.value.trim()) {
    showToast('任务名称不能为空', false)
    return
  }
  try {
    const newItem = {
      item_name: newItemName.value.trim(),
      item_type: newItemType.value,
    }
    const addedItem = await apiRequest('/daily-logs/items', 'POST', newItem)
    dailyItems.value.push(addedItem)
    newItemName.value = ''
    showToast('新任务已添加')
  } catch (error) {
    showToast(`添加失败: ${error.message}`, false)
  }
}

const handleDeleteItem = async (itemToDelete) => {
  if (
    confirm(`确定要删除任务 "${itemToDelete.item_name}" 吗？\n这将同时删除所有相关的历史记录。`)
  ) {
    try {
      await apiRequest(`/daily-logs/items/${itemToDelete.id}`, 'DELETE')
      await loadAllData() // Reload all data for consistency
      showToast('任务已删除')
    } catch (error) {
      showToast(`删除失败: ${error.message}`, false)
    }
  }
}

const searchHistory = async () => {
  if (!searchQuery.value.trim()) return
  isSearching.value = true
  hasSearched.value = true
  try {
    const data = await apiRequest(
      `/daily-logs/history/search?q=${encodeURIComponent(searchQuery.value.trim())}`,
    )
    searchResults.value = Array.isArray(data) ? data : []
  } catch (error) {
    showToast(`搜索失败: ${error.message}`, false)
    searchResults.value = []
  } finally {
    isSearching.value = false
  }
}

// Hooks
onMounted(() => {
  loadAllData()
})

watch(selectedDate, (newDate) => {
  loadLogsForDate(newDate)
})

watch(
  [isManaging, dailyItems, dailyLogs],
  () => {
    nextTick(() => {
      if (typeof lucide !== 'undefined') {
        lucide.createIcons()
      }
    })
  },
  { deep: true },
)
</script>
