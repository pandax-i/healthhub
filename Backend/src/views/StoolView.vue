<script setup>
import { ref, onMounted, computed, nextTick } from 'vue'

// --- 状态 ---
const API_BASE_URL = 'your_api_base_url' // 您的后端API地址
const toast = ref({ show: false, message: '', isSuccess: true })

// 日历状态
const viewDate = ref(new Date())

// 记录状态
const allStoolLogs = ref([])
const searchQuery = ref('')
const showEditModal = ref(false)
const editingLog = ref(null)
const stoolForm = ref({
  log_date: new Date().toISOString().split('T')[0],
  stool_type: null,
  notes: '',
})

const stoolTypeDescriptions = {
  1: '颗粒状硬球',
  2: '香肠状，表面凹凸',
  3: '香肠状，表面有裂痕',
  4: '香肠或蛇状，光滑柔软',
  5: '断边光滑的柔软团块',
  6: '蓬松的糊状、烂便',
  7: '水样，无固体块',
}

// --- Computed ---
const filteredLogs = computed(() => {
  if (!searchQuery.value) {
    return allStoolLogs.value
  }
  return allStoolLogs.value.filter(
    (log) =>
      log.log_date.includes(searchQuery.value) ||
      (log.notes && log.notes.includes(searchQuery.value)),
  )
})

const displayLogs = computed(() => {
  if (searchQuery.value) {
    return filteredLogs.value
  }
  return filteredLogs.value.slice(0, 3)
})

const calendar = computed(() => {
  const year = viewDate.value.getFullYear()
  const month = viewDate.value.getMonth()
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1)
  const blanks = Array.from({ length: firstDay === 0 ? 6 : firstDay - 1 }, () => null) // 假设周一为一周第一天

  return [...blanks, ...days]
})

const currentMonthDisplay = computed(() => {
  return viewDate.value.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long' })
})

// 【修复】将 loggedDates 改为计算属性，并使用 timezone-agnostic 的方式处理日期
const loggedDates = computed(() => {
  const dates = new Set()
  for (const log of allStoolLogs.value) {
    // 直接从日期时间字符串中截取日期部分 "YYYY-MM-DD"，避免时区转换问题
    if (log.log_date && typeof log.log_date === 'string') {
      dates.add(log.log_date.split('T')[0])
    }
  }
  return dates
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
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }
  const config = { method, headers }
  if (body) {
    config.body = JSON.stringify(body)
  }
  const response = await fetch(`${API_BASE_URL}${endpoint}`, config)
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: '请求失败' }))
    throw new Error(errorData.message)
  }
  if (response.status === 204 || response.headers.get('content-length') === '0') return null
  return response.json()
}

const loadAllData = async () => {
  await loadStoolLogs()
  nextTick(() => {
    if (typeof lucide !== 'undefined') lucide.createIcons()
  })
}

const loadStoolLogs = async () => {
  try {
    allStoolLogs.value = await apiRequest('/stool-logs')
  } catch (error) {
    showToast(`加载记录失败: ${error.message}`, false)
  }
}

const addStoolLog = async () => {
  try {
    const newLog = {
      ...stoolForm.value,
      stool_type: stoolForm.value.stool_type ? parseInt(stoolForm.value.stool_type) : null,
    }
    const addedLog = await apiRequest('/stool-logs', 'POST', newLog)
    // 只需更新主列表，日历标记会自动更新
    allStoolLogs.value.unshift(addedLog)
    showToast('记录已保存！')
    stoolForm.value = {
      log_date: new Date().toISOString().split('T')[0],
      stool_type: null,
      notes: '',
    }
  } catch (error) {
    showToast(`保存失败: ${error.message}`, false)
  }
}

const openEditModal = (log) => {
  // 确保 log_date 是 YYYY-MM-DD 格式
  editingLog.value = {
    ...log,
    stool_type: log.stool_type || null,
    log_date: log.log_date.split('T')[0],
  }
  showEditModal.value = true
}

const updateStoolLog = async () => {
  if (!editingLog.value) return
  try {
    const updatedLog = await apiRequest(
      `/stool-logs/${editingLog.value.id}`,
      'PUT',
      editingLog.value,
    )
    const index = allStoolLogs.value.findIndex((l) => l.id === updatedLog.id)
    if (index !== -1) {
      allStoolLogs.value[index] = updatedLog
    }
    showToast('更新成功！')
    showEditModal.value = false
    editingLog.value = null
    // 重新加载以确保日历标记正确
    await loadStoolLogs()
  } catch (error) {
    showToast(`更新失败: ${error.message}`, false)
  }
}

const deleteStoolLog = async (log) => {
  if (confirm('确定要删除这条记录吗？')) {
    try {
      await apiRequest(`/stool-logs/${log.id}`, 'DELETE')
      // 只需更新主列表，日历标记会自动重新计算
      allStoolLogs.value = allStoolLogs.value.filter((l) => l.id !== log.id)
      showToast('删除成功')
    } catch (error) {
      showToast(`删除失败: ${error.message}`, false)
    }
  }
}

const changeMonth = (offset) => {
  const newDate = new Date(viewDate.value)
  newDate.setMonth(newDate.getMonth() + offset)
  viewDate.value = newDate
}

const getDayClasses = (day) => {
  const classes = {}
  const today = new Date()
  const isCurrentDayToday =
    today.getDate() === day &&
    today.getMonth() === viewDate.value.getMonth() &&
    today.getFullYear() === viewDate.value.getFullYear()

  const checkDate = `${viewDate.value.getFullYear()}-${String(viewDate.value.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
  const hasLog = loggedDates.value.has(checkDate)

  if (isCurrentDayToday) {
    classes['bg-blue-100'] = true
    classes['text-blue-600'] = true
    classes['font-bold'] = true
  }
  if (hasLog) {
    classes['bg-red-200'] = true
    classes['text-red-700'] = true
    classes['font-semibold'] = true
  }
  return classes
}

// --- 生命周期钩子 ---
onMounted(loadAllData)
</script>

<template>
  <div class="container mx-auto p-4 md:p-6 max-w-3xl">
    <header class="mb-6">
      <div class="bg-white/80 backdrop-blur-sm px-6 py-4 rounded-xl shadow border border-white/20">
        <h1 class="text-2xl font-bold">排便记录</h1>
        <p class="text-gray-500 mt-1">记录您的每日健康状况</p>
      </div>
    </header>

    <!-- 日历视图 -->
    <div class="bg-white/80 backdrop-blur-sm p-4 rounded-xl shadow-md mb-6 border border-white/20">
      <div class="flex items-center justify-between mb-2">
        <button @click="changeMonth(-1)" class="p-2 rounded-full hover:bg-gray-200">
          <i data-lucide="chevron-left"></i>
        </button>
        <h3 class="font-semibold text-lg">{{ currentMonthDisplay }}</h3>
        <button @click="changeMonth(1)" class="p-2 rounded-full hover:bg-gray-200">
          <i data-lucide="chevron-right"></i>
        </button>
      </div>
      <div class="grid grid-cols-7 gap-1 text-center text-xs text-gray-500 mb-2">
        <span>一</span><span>二</span><span>三</span><span>四</span><span>五</span><span>六</span
        ><span>日</span>
      </div>
      <div class="grid grid-cols-7 gap-1">
        <div
          v-for="(day, index) in calendar"
          :key="index"
          class="h-9 flex items-center justify-center"
        >
          <div
            v-if="day"
            class="w-8 h-8 flex items-center justify-center rounded-full relative transition-colors"
            :class="getDayClasses(day)"
          >
            {{ day }}
          </div>
        </div>
      </div>
    </div>

    <!-- 添加记录表单 -->
    <div class="bg-white/80 backdrop-blur-sm p-6 rounded-xl shadow-md mb-6 border border-white/20">
      <h2 class="text-xl font-semibold mb-4">添加记录</h2>
      <form @submit.prevent="addStoolLog">
        <div class="space-y-4">
          <div>
            <label for="stool-date-add" class="block text-sm font-medium text-gray-700">日期</label>
            <input
              type="date"
              id="stool-date-add"
              v-model="stoolForm.log_date"
              required
              class="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label for="stool-type-add" class="block text-sm font-medium text-gray-700"
              >大便类型 (布里斯托分类法)</label
            >
            <select
              id="stool-type-add"
              v-model.number="stoolForm.stool_type"
              class="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option :value="null">不记录类型</option>
              <option v-for="(desc, type) in stoolTypeDescriptions" :key="type" :value="type">
                类型{{ type }}: {{ desc }}
              </option>
            </select>
          </div>
          <div>
            <label for="stool-notes-add" class="block text-sm font-medium text-gray-700"
              >备注</label
            >
            <textarea
              id="stool-notes-add"
              v-model="stoolForm.notes"
              rows="3"
              class="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="例如：颜色、感觉等..."
            ></textarea>
          </div>
        </div>
        <div class="mt-6 flex justify-end">
          <button
            type="submit"
            class="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg transition-all flex items-center space-x-2"
          >
            <i data-lucide="save" class="w-5 h-5"></i>
            <span>保存记录</span>
          </button>
        </div>
      </form>
    </div>

    <!-- 历史记录 -->
    <main>
      <h2 class="text-xl font-semibold mb-4">历史记录</h2>
      <input
        type="text"
        v-model="searchQuery"
        placeholder="按日期(YYYY-MM-DD)或备注搜索..."
        class="w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm mb-4"
      />

      <div
        v-if="displayLogs.length === 0"
        class="text-center py-12 bg-white/60 backdrop-blur-sm rounded-xl"
      >
        <p>{{ searchQuery ? '没有找到匹配的记录' : '最近没有记录' }}</p>
      </div>
      <div class="space-y-3">
        <div
          v-for="log in displayLogs"
          :key="log.id"
          class="bg-white/80 backdrop-blur-sm p-4 rounded-lg shadow-sm flex justify-between items-start border border-white/20"
        >
          <div>
            <p class="font-semibold">{{ new Date(log.log_date).toLocaleDateString() }}</p>
            <p class="text-sm text-gray-700">
              {{
                log.stool_type
                  ? `类型${log.stool_type}: ${stoolTypeDescriptions[log.stool_type]}`
                  : '已记录'
              }}
            </p>
            <p v-if="log.notes" class="text-xs text-gray-500 mt-1 pl-1 border-l-2">
              备注: {{ log.notes }}
            </p>
          </div>
          <div class="flex space-x-2">
            <button @click="openEditModal(log)" class="text-blue-500 hover:text-blue-700 p-1">
              <i data-lucide="edit-3" class="w-4 h-4"></i>
            </button>
            <button @click="deleteStoolLog(log)" class="text-red-500 hover:text-red-700 p-1">
              <i data-lucide="trash-2" class="w-4 h-4"></i>
            </button>
          </div>
        </div>
      </div>
      <p
        v-if="!searchQuery && allStoolLogs.length > 3"
        class="text-center text-sm text-gray-500 mt-4"
      >
        仅显示最近3条记录，使用搜索框查看更多。
      </p>
    </main>

    <!-- 编辑弹窗 -->
    <div
      v-if="showEditModal"
      @click.self="showEditModal = false"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
    >
      <div class="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
        <h2 class="text-xl font-bold mb-4">编辑记录</h2>
        <form v-if="editingLog" @submit.prevent="updateStoolLog">
          <div class="space-y-4">
            <div>
              <label for="stool-date-edit" class="block text-sm font-medium text-gray-700"
                >日期</label
              >
              <input
                type="date"
                id="stool-date-edit"
                v-model="editingLog.log_date"
                required
                class="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label for="stool-type-edit" class="block text-sm font-medium text-gray-700"
                >大便类型</label
              >
              <select
                id="stool-type-edit"
                v-model.number="editingLog.stool_type"
                class="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option :value="null">不记录类型</option>
                <option v-for="(desc, type) in stoolTypeDescriptions" :key="type" :value="type">
                  类型{{ type }}: {{ desc }}
                </option>
              </select>
            </div>
            <div>
              <label for="stool-notes-edit" class="block text-sm font-medium text-gray-700"
                >备注</label
              >
              <textarea
                id="stool-notes-edit"
                v-model="editingLog.notes"
                rows="3"
                class="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              ></textarea>
            </div>
          </div>
          <div class="mt-6 flex justify-end space-x-2">
            <button
              type="button"
              @click="showEditModal = false"
              class="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded-lg"
            >
              取消
            </button>
            <button
              type="submit"
              class="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg"
            >
              保存更改
            </button>
          </div>
        </form>
      </div>
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
