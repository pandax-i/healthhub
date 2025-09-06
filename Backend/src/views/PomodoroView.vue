<template>
  <div class="pomodoro-view">
    <PomodoroTimer />
  </div>
</template>

<script setup>
import PomodoroTimer from '@/components/PomodoroTimer.vue'
</script>

<style scoped>
.pomodoro-view {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
}
</style>
