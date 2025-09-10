<script setup>
import { ref, onMounted, computed, nextTick } from 'vue'

// --- 状态 ---
const API_BASE_URL = 'your_api_base_url' // 您的后端API地址
const toast = ref({ show: false, message: '', isSuccess: true })

const accounts = ref([])
const transactions = ref([])
const loans = ref([])
const currentView = ref('dashboard') // dashboard, transactions, loans
const showForm = ref(null) // 'account', 'transaction', 'loan'

const newAccount = ref({ account_name: '', initial_balance: 0 })
const newTransaction = ref({
  account_id: null,
  transaction_type: 'expense',
  amount: null,
  category: '',
  notes: '',
  transaction_date: new Date().toISOString().split('T')[0],
})
const newLoan = ref({
  loan_type: 'lend',
  person_name: '',
  amount: null,
  notes: '',
  loan_date: new Date().toISOString().split('T')[0],
})

// --- Computed ---
const totalAssets = computed(() =>
  accounts.value.reduce((sum, acc) => sum + parseFloat(acc.current_balance), 0),
)
const totalLend = computed(() =>
  loans.value
    .filter((l) => l.loan_type === 'lend' && l.status === 'unpaid')
    .reduce((sum, l) => sum + parseFloat(l.amount), 0),
)
const totalBorrow = computed(() =>
  loans.value
    .filter((l) => l.loan_type === 'borrow' && l.status === 'unpaid')
    .reduce((sum, l) => sum + parseFloat(l.amount), 0),
)
const netAssets = computed(() => totalAssets.value + totalLend.value - totalBorrow.value)

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

const loadAllFinanceData = async () => {
  try {
    await Promise.all([loadAccounts(), loadTransactions(), loadLoans()])
  } finally {
    nextTick(() => {
      if (typeof lucide !== 'undefined') lucide.createIcons()
    })
  }
}

const loadAccounts = async () => {
  accounts.value = await apiRequest('/finance/accounts')
}
const loadTransactions = async () => {
  transactions.value = await apiRequest('/finance/transactions')
}
const loadLoans = async () => {
  loans.value = await apiRequest('/finance/loans')
}

const addAccount = async () => {
  if (!newAccount.value.account_name) {
    showToast('账户名称不能为空', false)
    return
  }
  await apiRequest('/finance/accounts', 'POST', newAccount.value)
  showToast('账户已添加')
  await loadAccounts()
  showForm.value = null
  newAccount.value = { account_name: '', initial_balance: 0 }
}

const addTransaction = async () => {
  if (!newTransaction.value.account_id || !newTransaction.value.amount) {
    showToast('账户和金额为必填项', false)
    return
  }
  await apiRequest('/finance/transactions', 'POST', newTransaction.value)
  showToast('交易已记录')
  await Promise.all([loadAccounts(), loadTransactions()])
  showForm.value = null
  newTransaction.value = {
    account_id: null,
    transaction_type: 'expense',
    amount: null,
    category: '',
    notes: '',
    transaction_date: new Date().toISOString().split('T')[0],
  }
}

const addLoan = async () => {
  if (!newLoan.value.person_name || !newLoan.value.amount) {
    showToast('对方姓名和金额为必填项', false)
    return
  }
  await apiRequest('/finance/loans', 'POST', newLoan.value)
  showToast('借贷已记录')
  await loadLoans()
  showForm.value = null
  newLoan.value = {
    loan_type: 'lend',
    person_name: '',
    amount: null,
    notes: '',
    loan_date: new Date().toISOString().split('T')[0],
  }
}

const markLoanAsPaid = async (loan) => {
  if (loan.status === 'paid') return
  if (!confirm(`确定要将这笔与 ${loan.person_name} 的借贷标记为已还清吗？`)) return
  await apiRequest(`/finance/loans/${loan.id}/status`, 'PUT', { status: 'paid' })
  showToast('状态已更新')
  await loadLoans()
}

const formatCurrency = (value) => {
  return new Intl.NumberFormat('zh-CN', { style: 'currency', currency: 'CNY' }).format(value)
}

// --- 生命周期 ---
onMounted(loadAllFinanceData)
</script>

<template>
  <div class="container mx-auto p-4 md:p-6 max-w-4xl">
    <header class="mb-6">
      <div class="bg-white/80 backdrop-blur-sm px-6 py-4 rounded-xl shadow border border-white/20">
        <h1 class="text-2xl font-bold">个人记账</h1>
        <p class="text-gray-500 mt-1">清晰掌握您的财务状况</p>
      </div>
    </header>

    <!-- 导航 -->
    <div
      class="flex items-center justify-between bg-white/80 backdrop-blur-sm p-2 rounded-xl shadow-md mb-6 border border-white/20"
    >
      <button
        @click="currentView = 'dashboard'"
        :class="{ 'bg-blue-500 text-white': currentView === 'dashboard' }"
        class="flex-1 py-2 px-4 rounded-lg"
      >
        总览
      </button>
      <button
        @click="currentView = 'transactions'"
        :class="{ 'bg-blue-500 text-white': currentView === 'transactions' }"
        class="flex-1 py-2 px-4 rounded-lg"
      >
        交易明细
      </button>
      <button
        @click="currentView = 'loans'"
        :class="{ 'bg-blue-500 text-white': currentView === 'loans' }"
        class="flex-1 py-2 px-4 rounded-lg"
      >
        借还款
      </button>
    </div>

    <!-- 总览视图 -->
    <div v-if="currentView === 'dashboard'">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div class="bg-white/80 backdrop-blur-sm p-4 rounded-xl shadow border">
          <p class="text-sm text-gray-500">总资产</p>
          <p class="text-2xl font-bold">{{ formatCurrency(totalAssets) }}</p>
        </div>
        <div class="bg-white/80 backdrop-blur-sm p-4 rounded-xl shadow border">
          <p class="text-sm text-gray-500">总借出</p>
          <p class="text-2xl font-bold text-green-600">{{ formatCurrency(totalLend) }}</p>
        </div>
        <div class="bg-white/80 backdrop-blur-sm p-4 rounded-xl shadow border">
          <p class="text-sm text-gray-500">总借入</p>
          <p class="text-2xl font-bold text-red-600">{{ formatCurrency(totalBorrow) }}</p>
        </div>
        <div class="md:col-span-3 bg-white/80 backdrop-blur-sm p-4 rounded-xl shadow border">
          <p class="text-sm text-gray-500">净资产 (总资产 + 总借出 - 总借入)</p>
          <p class="text-3xl font-bold text-blue-600">{{ formatCurrency(netAssets) }}</p>
        </div>
      </div>
      <div class="bg-white/80 backdrop-blur-sm p-4 rounded-xl shadow-md border">
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-xl font-semibold">我的账户</h2>
          <button
            @click="showForm = 'account'"
            class="bg-blue-500 text-white py-1 px-3 rounded-lg text-sm"
          >
            添加账户
          </button>
        </div>
        <ul class="space-y-2">
          <li
            v-for="acc in accounts"
            :key="acc.id"
            class="flex justify-between items-center p-2 bg-gray-50 rounded-md"
          >
            <span>{{ acc.account_name }}</span>
            <span class="font-semibold">{{ formatCurrency(acc.current_balance) }}</span>
          </li>
        </ul>
      </div>
    </div>

    <!-- 交易明细视图 -->
    <div v-if="currentView === 'transactions'">
      <div class="bg-white/80 backdrop-blur-sm p-4 rounded-xl shadow-md border">
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-xl font-semibold">交易明细</h2>
          <button
            @click="showForm = 'transaction'"
            class="bg-blue-500 text-white py-1 px-3 rounded-lg text-sm"
          >
            记录一笔
          </button>
        </div>
        <ul class="space-y-3">
          <li
            v-for="t in transactions"
            :key="t.id"
            class="flex justify-between items-center p-3 bg-gray-50 rounded-md"
          >
            <div>
              <p class="font-semibold">
                {{ t.category || (t.transaction_type === 'income' ? '收入' : '支出') }}
              </p>
              <p class="text-xs text-gray-500">
                {{ new Date(t.transaction_date).toLocaleDateString() }} · {{ t.account_name }}
              </p>
              <p v-if="t.notes" class="text-xs text-gray-500 mt-1">备注: {{ t.notes }}</p>
            </div>
            <p
              class="font-bold"
              :class="t.transaction_type === 'income' ? 'text-green-600' : 'text-red-600'"
            >
              {{ t.transaction_type === 'income' ? '+' : '-' }} {{ formatCurrency(t.amount) }}
            </p>
          </li>
        </ul>
      </div>
    </div>

    <!-- 借还款视图 -->
    <div v-if="currentView === 'loans'">
      <div class="bg-white/80 backdrop-blur-sm p-4 rounded-xl shadow-md border">
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-xl font-semibold">借还款</h2>
          <button
            @click="showForm = 'loan'"
            class="bg-blue-500 text-white py-1 px-3 rounded-lg text-sm"
          >
            添加记录
          </button>
        </div>
        <ul class="space-y-3">
          <li v-for="l in loans" :key="l.id" class="p-3 bg-gray-50 rounded-md">
            <div class="flex justify-between items-start">
              <div>
                <p class="font-semibold">{{ l.person_name }}</p>
                <p class="text-xs text-gray-500">
                  {{ new Date(l.loan_date).toLocaleDateString() }}
                </p>
                <p v-if="l.notes" class="text-xs text-gray-500 mt-1">备注: {{ l.notes }}</p>
              </div>
              <div class="text-right">
                <p
                  class="font-bold"
                  :class="l.loan_type === 'lend' ? 'text-green-600' : 'text-red-600'"
                >
                  {{ l.loan_type === 'lend' ? '借出' : '借入' }} {{ formatCurrency(l.amount) }}
                </p>
                <p
                  class="text-xs"
                  :class="l.status === 'paid' ? 'text-gray-400' : 'text-orange-500'"
                >
                  {{
                    l.status === 'paid'
                      ? `已于 ${new Date(l.repayment_date).toLocaleDateString()} 还清`
                      : '未还清'
                  }}
                </p>
              </div>
            </div>
            <div v-if="l.status === 'unpaid'" class="text-right mt-2">
              <button
                @click="markLoanAsPaid(l)"
                class="text-xs bg-green-100 text-green-700 hover:bg-green-200 py-1 px-3 rounded-md"
              >
                标记为已还清
              </button>
            </div>
          </li>
        </ul>
      </div>
    </div>

    <!-- 添加表单弹窗 -->
    <div
      v-if="showForm"
      @click.self="showForm = null"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
    >
      <div class="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
        <!-- 添加账户 -->
        <form v-if="showForm === 'account'" @submit.prevent="addAccount" class="space-y-4">
          <h2 class="text-xl font-bold">添加新账户</h2>
          <div>
            <label class="block text-sm">账户名称</label
            ><input
              v-model="newAccount.account_name"
              type="text"
              required
              class="w-full px-3 py-2 border rounded-md"
            />
          </div>
          <div>
            <label class="block text-sm">初始余额</label
            ><input
              v-model.number="newAccount.initial_balance"
              type="number"
              step="0.01"
              required
              class="w-full px-3 py-2 border rounded-md"
            />
          </div>
          <div class="flex justify-end space-x-2">
            <button type="button" @click="showForm = null" class="py-2 px-4 rounded-lg bg-gray-200">
              取消</button
            ><button type="submit" class="py-2 px-4 rounded-lg bg-blue-500 text-white">保存</button>
          </div>
        </form>
        <!-- 添加交易 -->
        <form v-if="showForm === 'transaction'" @submit.prevent="addTransaction" class="space-y-4">
          <h2 class="text-xl font-bold">记录一笔交易</h2>
          <div>
            <label class="block text-sm">类型</label
            ><select
              v-model="newTransaction.transaction_type"
              class="w-full px-3 py-2 border rounded-md"
            >
              <option value="expense">支出</option>
              <option value="income">收入</option>
            </select>
          </div>
          <div>
            <label class="block text-sm">账户</label
            ><select
              v-model.number="newTransaction.account_id"
              required
              class="w-full px-3 py-2 border rounded-md"
            >
              <option :value="null" disabled>选择一个账户</option>
              <option v-for="acc in accounts" :key="acc.id" :value="acc.id">
                {{ acc.account_name }}
              </option>
            </select>
          </div>
          <div>
            <label class="block text-sm">金额</label
            ><input
              v-model.number="newTransaction.amount"
              type="number"
              step="0.01"
              required
              class="w-full px-3 py-2 border rounded-md"
            />
          </div>
          <div>
            <label class="block text-sm">分类 (可选)</label
            ><input
              v-model="newTransaction.category"
              type="text"
              class="w-full px-3 py-2 border rounded-md"
            />
          </div>
          <div>
            <label class="block text-sm">日期</label
            ><input
              v-model="newTransaction.transaction_date"
              type="date"
              required
              class="w-full px-3 py-2 border rounded-md"
            />
          </div>
          <div>
            <label class="block text-sm">备注 (可选)</label
            ><textarea
              v-model="newTransaction.notes"
              rows="2"
              class="w-full px-3 py-2 border rounded-md"
            ></textarea>
          </div>
          <div class="flex justify-end space-x-2">
            <button type="button" @click="showForm = null" class="py-2 px-4 rounded-lg bg-gray-200">
              取消</button
            ><button type="submit" class="py-2 px-4 rounded-lg bg-blue-500 text-white">保存</button>
          </div>
        </form>
        <!-- 添加借贷 -->
        <form v-if="showForm === 'loan'" @submit.prevent="addLoan" class="space-y-4">
          <h2 class="text-xl font-bold">记录一笔借贷</h2>
          <div>
            <label class="block text-sm">类型</label
            ><select v-model="newLoan.loan_type" class="w-full px-3 py-2 border rounded-md">
              <option value="lend">我借给别人</option>
              <option value="borrow">别人借给我</option>
            </select>
          </div>
          <div>
            <label class="block text-sm">对方姓名</label
            ><input
              v-model="newLoan.person_name"
              type="text"
              required
              class="w-full px-3 py-2 border rounded-md"
            />
          </div>
          <div>
            <label class="block text-sm">金额</label
            ><input
              v-model.number="newLoan.amount"
              type="number"
              step="0.01"
              required
              class="w-full px-3 py-2 border rounded-md"
            />
          </div>
          <div>
            <label class="block text-sm">日期</label
            ><input
              v-model="newLoan.loan_date"
              type="date"
              required
              class="w-full px-3 py-2 border rounded-md"
            />
          </div>
          <div>
            <label class="block text-sm">备注 (可选)</label
            ><textarea
              v-model="newLoan.notes"
              rows="2"
              class="w-full px-3 py-2 border rounded-md"
            ></textarea>
          </div>
          <div class="flex justify-end space-x-2">
            <button type="button" @click="showForm = null" class="py-2 px-4 rounded-lg bg-gray-200">
              取消</button
            ><button type="submit" class="py-2 px-4 rounded-lg bg-blue-500 text-white">保存</button>
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
