<script setup>
// 目前首页只是静态展示，所以 script 部分为空
</script>

<template>
  <div class="container mx-auto p-4 md:p-6 max-w-4xl">
    <header class="text-center mb-8">
      <!-- 【修改】给标题加上半透明背景和圆角，使其在复杂背景下更易读 -->
      <div class="inline-block bg-white/80 backdrop-blur-sm px-6 py-4 rounded-xl shadow">
        <h1 class="text-3xl md:text-4xl font-bold text-blue-600">健康生活管理平台</h1>
        <p class="text-gray-500 mt-2">您的一站式健康与生活助手</p>
      </div>
    </header>
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 text-center">
      <!-- 【修改】给所有功能卡片加上半透明的磨砂玻璃效果 -->
      <a
        href="#/meds"
        class="feature-card bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-md hover:shadow-xl hover:-translate-y-1 transition-all flex flex-col items-center justify-center border border-white/20"
      >
        <div class="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-3">
          <i data-lucide="pilcrow" class="text-blue-600"></i>
        </div>
        <h3 class="font-semibold text-gray-800">用药记录</h3>
      </a>
      <a
        href="#/stool"
        class="feature-card bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-md hover:shadow-xl hover:-translate-y-1 transition-all flex flex-col items-center justify-center border border-white/20"
      >
        <div class="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-3">
          <i data-lucide="activity" class="text-green-600"></i>
        </div>
        <h3 class="font-semibold text-gray-800">排便记录</h3>
      </a>
      <a
        href="#/daily"
        class="feature-card bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-md hover:shadow-xl hover:-translate-y-1 transition-all flex flex-col items-center justify-center border border-white/20"
      >
        <div class="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mb-3">
          <i data-lucide="clipboard-list" class="text-yellow-600"></i>
        </div>
        <h3 class="font-semibold text-gray-800">每日清单</h3>
      </a>
      <a
        href="#/memos"
        class="feature-card bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-md hover:shadow-xl hover:-translate-y-1 transition-all flex flex-col items-center justify-center border border-white/20"
      >
        <div class="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mb-3">
          <i data-lucide="check-square" class="text-purple-600"></i>
        </div>
        <h3 class="font-semibold text-gray-800">备忘录</h3>
      </a>
      <a
        href="#/pomodoro"
        class="feature-card bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-md hover:shadow-xl hover:-translate-y-1 transition-all flex flex-col items-center justify-center border border-white/20"
      >
        <div class="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mb-3">
          <i data-lucide="timer" class="text-orange-600"></i>
        </div>
        <h3 class="font-semibold text-gray-800">番茄钟</h3>
      </a>
      <a
        href="#/finance"
        class="feature-card bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-md hover:shadow-xl hover:-translate-y-1 transition-all flex flex-col items-center justify-center col-span-2 md:col-span-4 border border-white/20"
      >
        <div class="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-3">
          <i data-lucide="landmark" class="text-red-600"></i>
        </div>
        <h3 class="font-semibold text-gray-800">个人记账</h3>
      </a>
    </div>
  </div>
</template>
