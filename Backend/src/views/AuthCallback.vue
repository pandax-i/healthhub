<template>
  <div class="min-h-screen flex items-center justify-center">
    <div class="text-center p-4">
      <p class="text-lg font-semibold">正在验证您的身份...</p>
      <p v-if="debugMessage" class="mt-4 p-2 bg-blue-100 text-blue-800 text-xs rounded break-all">{{ debugMessage }}</p>
      <p v-if="error" class="text-red-500 mt-2">{{ error }}</p>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';

const route = useRoute();
const error = ref('');
const debugMessage = ref(''); // 用于显示调试信息

onMounted(() => {
  const token = route.query.token;
  const loginError = route.query.error;

  debugMessage.value = `[1/3] 页面加载。从URL获取的Token: [${token || '未找到'}], 错误: [${loginError || '未找到'}]。`;

  if (loginError) {
    error.value = '使用 linux.do 登录失败。请重试。';
  } else if (token) {
    debugMessage.value += ' | [2/3] 找到Token，正在存入localStorage...';
    try {
      localStorage.setItem('authToken', token);
      debugMessage.value += ' | [3/3] 存储成功！3秒后将跳转到首页...';
      // 延迟跳转，以便用户能看到调试信息
      setTimeout(() => {
        window.location.href = '/';
      }, 3000);
    } catch (e) {
      error.value = '存储Token失败，您的浏览器可能禁用了localStorage。';
      debugMessage.value += ' | 存储失败！';
    }
  } else {
    error.value = '无效的回调。URL中没有找到Token，请重新登录。';
  }
});
</script>
