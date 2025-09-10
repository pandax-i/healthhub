<template>
  <div class="p-4 md:p-8">
    <div class="max-w-2xl mx-auto bg-white rounded-lg shadow-md p-6">
      <h1 class="text-2xl font-bold text-gray-800 mb-6 border-b pb-4">我的账户</h1>

      <div v-if="loading" class="text-center">
        <p>正在加载用户信息...</p>
      </div>

      <div v-if="error" class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
        <strong class="font-bold">加载失败：</strong>
        <span class="block sm:inline">{{ error }}</span>
      </div>

      <div v-if="user" class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-500">用户名</label>
          <p class="mt-1 text-lg text-gray-900">{{ user.username || '未设置' }}</p>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-500">邮箱</label>
          <p class="mt-1 text-lg text-gray-900">{{ user.email }}</p>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-500">用户ID</label>
          <p class="mt-1 text-lg text-gray-900">{{ user.id }}</p>
        </div>
      </div>

      <!-- 分隔线 -->
      <hr class="my-6">

      <!-- 更改密码表单 -->
      <div v-if="user && user.password_hash !== null">
        <h2 class="text-xl font-bold text-gray-800 mb-4">更改密码</h2>
        <form @submit.prevent="changePassword">
          <div class="space-y-4">
            <div>
              <label for="oldPassword" class="block text-sm font-medium text-gray-700">旧密码</label>
              <input type="password" id="oldPassword" v-model="passwordForm.oldPassword" required class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500">
            </div>
            <div>
              <label for="newPassword" class="block text-sm font-medium text-gray-700">新密码 (至少6位)</label>
              <input type="password" id="newPassword" v-model="passwordForm.newPassword" required class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500">
            </div>
          </div>
          <div class="mt-6">
            <button type="submit" class="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg transition-all" :disabled="passwordLoading">
              {{ passwordLoading ? '正在提交...' : '确认更改' }}
            </button>
          </div>
        </form>
        <p v-if="passwordMessage" class="mt-2 text-sm" :class="passwordError ? 'text-red-500' : 'text-green-600'">{{ passwordMessage }}</p>
      </div>

      <!-- 第三方登录提示 -->
      <div v-if="user && user.password_hash === null" class="mt-6 p-4 bg-gray-100 rounded-lg">
        <p class="text-sm text-gray-700">您通过第三方服务 (linux.do) 登录，无需设置或更改密码。</p>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';

const user = ref(null);
const loading = ref(true);
const error = ref('');
const API_BASE_URL = 'your_api_base_url'; // 您的后端API地址

// 更改密码相关状态
const passwordForm = ref({ oldPassword: '', newPassword: '' });
const passwordLoading = ref(false);
const passwordMessage = ref('');
const passwordError = ref(false);

const fetchUserProfile = async () => {
  const token = localStorage.getItem('authToken');
  if (!token) {
    error.value = '您尚未登录。';
    loading.value = false;
    return;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/me`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: `服务器错误 (状态码: ${response.status})` }));
      throw new Error(errorData.message);
    }
    user.value = await response.json();
  } catch (e) {
    error.value = e.message || '无法连接到服务器。';
  } finally {
    loading.value = false;
  }
};

const changePassword = async () => {
  passwordLoading.value = true;
  passwordMessage.value = '';
  passwordError.value = false;
  const token = localStorage.getItem('authToken');

  try {
    const response = await fetch(`${API_BASE_URL}/change-password`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(passwordForm.value)
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || '操作失败。');
    }

    passwordMessage.value = data.message;
    passwordForm.value.oldPassword = '';
    passwordForm.value.newPassword = '';
  } catch (e) {
    passwordError.value = true;
    passwordMessage.value = e.message || '无法连接到服务器。';
  } finally {
    passwordLoading.value = false;
  }
};

onMounted(fetchUserProfile);
</script>
