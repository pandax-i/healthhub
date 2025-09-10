<script setup>
import { ref, onMounted, nextTick, watch } from 'vue'

// --- 状态 ---
const medications = ref([])
const showMedForm = ref(false)
const medForm = ref({ name: '', dosage: '', frequency: 1, stock: null, times: ['08:00'] })
const toast = ref({ show: false, message: '', isSuccess: true })
const API_BASE_URL = 'your_api_base_url' // 您的后端API地址
const showHistoryModal = ref(false)
const selectedMedLogs = ref([])
const selectedMedName = ref('')

// --- 侦听器 ---
// 侦听每日次数的变化，动态调整时间输入框的数量
watch(
  () => medForm.value.frequency,
  (newFreq) => {
    const count = Number(newFreq) || 1
    const currentTimes = medForm.value.times
    if (count > currentTimes.length) {
      // 增加时间输入框
      for (let i = currentTimes.length; i < count; i++) {
        currentTimes.push('12:00')
      }
    } else {
      // 减少时间输入框
      medForm.value.times = currentTimes.slice(0, count)
    }
  },
)

// --- 通用方法 ---
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

// --- 用药记录方法 ---
const loadMedications = async () => {
  try {
    medications.value = await apiRequest('/medications')
    nextTick(() => {
      if (typeof lucide !== 'undefined') lucide.createIcons()
    })
  } catch (error) {
    showToast(`加载用药记录失败: ${error.message}`, false)
  }
}

const addMedication = async () => {
  try {
    const payload = {
      ...medForm.value,
      medication_times: medForm.value.times.join(','), // 将时间数组转为字符串
    }
    const addedMed = await apiRequest('/medications', 'POST', payload)
    medications.value.unshift({ ...payload, id: addedMed.id })
    showToast('添加成功！')
    showMedForm.value = false
    medForm.value = { name: '', dosage: '', frequency: 1, stock: null, times: ['08:00'] }
  } catch (error) {
    showToast(`添加失败: ${error.message}`, false)
  }
}

const deleteMedication = async (med) => {
  if (confirm(`确定要删除 "${med.name}" 吗?`)) {
    try {
      await apiRequest(`/medications/${med.id}`, 'DELETE')
      medications.value = medications.value.filter((m) => m.id !== med.id)
      showToast('删除成功')
    } catch (error) {
      showToast(`删除失败: ${error.message}`, false)
    }
  }
}

const refillMedication = async (med) => {
  const amount = prompt(`为 "${med.name}" 补充多少库存?`, '10')
  if (amount && !isNaN(amount)) {
    const updatedMed = { ...med, stock: (med.stock || 0) + parseInt(amount) }
    try {
      await apiRequest(`/medications/${med.id}`, 'PUT', updatedMed)
      med.stock = updatedMed.stock
      showToast('库存补充成功')
    } catch (error) {
      showToast(`补充失败: ${error.message}`, false)
    }
  }
}

const takeMedication = async (med) => {
  const dosageAmount = parseFloat(med.dosage) || 1
  if (med.stock >= dosageAmount) {
    try {
      await apiRequest(`/medications/${med.id}/take`, 'POST', { dosageAmount })
      med.stock -= dosageAmount
      showToast(`已服用: ${med.name}`)
    } catch (error) {
      showToast(`操作失败: ${error.message}`, false)
    }
  } else {
    showToast('库存不足！', false)
  }
}

const viewHistory = async (med) => {
  try {
    selectedMedName.value = med.name
    selectedMedLogs.value = await apiRequest(`/medications/${med.id}/logs`)
    showHistoryModal.value = true
    nextTick(() => {
      if (typeof lucide !== 'undefined') lucide.createIcons()
    })
  } catch (error) {
    showToast(`加载历史失败: ${error.message}`, false)
  }
}

// --- 生命周期钩子 ---
onMounted(() => {
  loadMedications()
})
</script>

<template>
  <div class="container mx-auto p-4 md:p-6 max-w-3xl">
    <header class="flex justify-between items-center mb-6">
      <div class="bg-white/80 backdrop-blur-sm px-6 py-4 rounded-xl shadow border border-white/20">
        <h1 class="text-2xl font-bold">用药记录</h1>
        <p class="text-gray-500 mt-1">管理您的用药计划</p>
      </div>
      <button
        @click="showMedForm = !showMedForm"
        class="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg shadow-md transition-all flex items-center space-x-2"
      >
        <i data-lucide="plus-circle" class="w-5 h-5"></i>
        <span>添加药品</span>
      </button>
    </header>

    <div class="form-container" :class="{ open: showMedForm }">
      <div
        class="bg-white/80 backdrop-blur-sm p-6 rounded-xl shadow-md mb-6 border border-white/20"
      >
        <h2 class="text-xl font-semibold mb-4">添加新的用药计划</h2>
        <form @submit.prevent="addMedication">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="md:col-span-2">
              <label class="block text-sm font-medium text-gray-700">药品名称</label
              ><input
                type="text"
                v-model="medForm.name"
                required
                class="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700">每次用量</label
              ><input
                type="text"
                v-model="medForm.dosage"
                class="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700">每日次数</label
              ><input
                type="number"
                v-model.number="medForm.frequency"
                min="1"
                class="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div class="md:col-span-2">
              <label class="block text-sm font-medium text-gray-700">当前库存</label
              ><input
                type="number"
                v-model.number="medForm.stock"
                min="0"
                class="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <!-- 动态时间选择 -->
            <div class="md:col-span-2">
              <label class="block text-sm font-medium text-gray-700">服药时间</label>
              <div class="grid grid-cols-2 md:grid-cols-3 gap-2 mt-1">
                <div v-for="(time, index) in medForm.times" :key="index">
                  <input
                    type="time"
                    v-model="medForm.times[index]"
                    required
                    class="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>
          </div>
          <div class="mt-6 flex justify-end space-x-3">
            <button
              type="button"
              @click="showMedForm = false"
              class="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded-lg transition-all"
            >
              取消
            </button>
            <button
              type="submit"
              class="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg shadow-md transition-all"
            >
              确认添加
            </button>
          </div>
        </form>
      </div>
    </div>

    <main class="space-y-4">
      <div
        v-if="medications.length === 0"
        class="text-center py-12 bg-white/60 backdrop-blur-sm rounded-xl"
      >
        <i data-lucide="pilcrow" class="mx-auto h-12 w-12 text-gray-400"></i>
        <h3 class="mt-2 text-sm font-medium">暂无药品记录</h3>
      </div>
      <div
        v-for="med in medications"
        :key="med.id"
        class="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-5 border-l-4 border-blue-500 border-white/20"
      >
        <div class="flex flex-col md:flex-row justify-between items-start md:items-center">
          <div class="flex-1 mb-4 md:mb-0">
            <h3 class="text-lg font-bold">{{ med.name }}</h3>
            <p class="text-sm">
              用法: {{ med.dosage || '未设置' }} / 每次, {{ med.frequency || 'N/A' }}次 / 每日
            </p>
            <p v-if="med.medication_times" class="text-sm">时间: {{ med.medication_times }}</p>
            <p class="text-sm">
              库存: <span class="font-semibold text-lg">{{ med.stock || 0 }}</span>
            </p>
          </div>
          <div class="flex flex-wrap gap-2 w-full md:w-auto">
            <button
              @click="takeMedication(med)"
              class="flex-1 bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md"
            >
              服用
            </button>
            <button
              @click="viewHistory(med)"
              class="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded-lg transition-all"
            >
              记录
            </button>
            <button
              @click="refillMedication(med)"
              class="flex-1 bg-yellow-500 hover:bg-yellow-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md"
            >
              补充
            </button>
            <button
              @click="deleteMedication(med)"
              class="flex-1 bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md"
            >
              删除
            </button>
          </div>
        </div>
      </div>
    </main>

    <!-- 服药历史弹窗 -->
    <div
      v-if="showHistoryModal"
      @click.self="showHistoryModal = false"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
    >
      <div class="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
        <h2 class="text-xl font-bold mb-4">"{{ selectedMedName }}" 的服药历史</h2>
        <ul v-if="selectedMedLogs.length > 0" class="space-y-2 max-h-80 overflow-y-auto">
          <li
            v-for="log in selectedMedLogs"
            :key="log.id"
            class="p-2 bg-gray-100 rounded-md text-sm"
          >
            {{ new Date(log.taken_at).toLocaleString('zh-CN') }}
          </li>
        </ul>
        <p v-else class="text-gray-500 text-center py-4">暂无服药记录</p>
        <div class="mt-6 text-right">
          <button
            @click="showHistoryModal = false"
            class="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded-lg transition-all"
          >
            关闭
          </button>
        </div>
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
