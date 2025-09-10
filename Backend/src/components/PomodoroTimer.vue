<template>
  <div
    class="w-full max-w-md mx-auto p-6 md:p-8 relative text-gray-800 bg-white/80 backdrop-blur-sm rounded-xl shadow-lg"
  >
    <div class="absolute top-4 right-4 md:top-6 md:right-6">
      <button
        @click="openModal"
        class="text-gray-500 hover:text-gray-800 transition-colors duration-200"
        title="设置"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
          ></path>
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
          ></path>
        </svg>
      </button>
    </div>
    <div class="text-center mb-8">
      <h1 class="text-4xl font-bold text-gray-800">番茄钟</h1>
      <p class="text-lg text-teal-400 mt-2">{{ sessionStatusText }}</p>
    </div>

    <!-- Timer Display -->
    <div class="relative w-64 h-64 sm:w-80 sm:h-80 mx-auto mb-8">
      <svg class="w-full h-full" viewBox="0 0 100 100">
        <circle
          class="text-gray-200 stroke-current"
          stroke-width="4"
          cx="50"
          cy="50"
          r="45"
          fill="transparent"
        ></circle>
        <circle
          id="timer-progress"
          class="stroke-current timer-circle-progress"
          :class="progressColorClass"
          stroke-width="4"
          cx="50"
          cy="50"
          r="45"
          fill="transparent"
          stroke-linecap="round"
          transform="rotate(-90 50 50)"
          :style="{ strokeDasharray: 282.74, strokeDashoffset: progressOffset }"
        ></circle>
      </svg>
      <div
        class="absolute inset-0 flex items-center justify-center text-5xl sm:text-6xl font-bold tracking-wider"
      >
        {{ formattedTime }}
      </div>
    </div>

    <!-- Controls -->
    <div class="flex justify-center items-center space-x-4">
      <button
        @click="handleStartPause"
        class="w-32 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition-all duration-200 shadow-lg transform hover:scale-105"
      >
        {{ isRunning ? '暂停' : '开始' }}
      </button>
      <button
        @click="resetTimer"
        class="w-32 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-3 px-4 rounded-lg transition-all duration-200 shadow-lg transform hover:scale-105"
      >
        重置
      </button>
    </div>

    <!-- Pomodoro Counter -->
    <div class="mt-8 text-center">
      <p class="text-gray-500">已完成的番茄钟</p>
      <div class="flex justify-center space-x-2 mt-2">
        <div
          v-for="i in POMODOROS_UNTIL_LONG_BREAK"
          :key="i"
          class="w-4 h-4 rounded-full"
          :class="getDotClass(i)"
        ></div>
      </div>
    </div>

    <!-- Task List -->
    <div class="mt-8 text-left max-w-sm mx-auto">
      <h3 class="text-lg font-semibold text-gray-700 mb-2 text-center">任务列表</h3>
      <div class="flex space-x-2 mb-4">
        <input
          type="text"
          v-model="newTaskText"
          @keypress.enter="addTask"
          class="flex-grow bg-white border-gray-300 rounded-md shadow-sm py-2 px-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
          placeholder="添加新任务..."
        />
        <button
          @click="addTask"
          class="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-md transition-colors duration-200"
        >
          添加
        </button>
      </div>
      <ul class="space-y-2 max-h-40 overflow-y-auto">
        <li v-if="tasks.length === 0" class="text-center text-gray-500 p-3">还没有任务</li>
        <li
          v-for="task in tasks"
          :key="task.id"
          :data-id="task.id"
          @click="setActiveTask(task.id)"
          class="flex items-center justify-between p-3 rounded-md transition-colors duration-200 cursor-pointer"
          :class="[task.id === activeTaskId ? 'bg-blue-100' : 'bg-white hover:bg-gray-50']"
        >
          <div class="flex items-center overflow-hidden">
            <input
              type="checkbox"
              :checked="task.completed"
              @change="toggleTask(task.id)"
              @click.stop
              class="task-checkbox h-5 w-5 rounded bg-gray-100 border-gray-300 text-teal-500 focus:ring-teal-500 cursor-pointer flex-shrink-0"
            />
            <span
              class="ml-3 truncate"
              :class="[task.completed ? 'line-through text-gray-500' : 'text-gray-800']"
              :title="task.text"
              >{{ task.text }}</span
            >
          </div>
          <button
            @click.stop="deleteTask(task.id)"
            class="delete-task-btn text-gray-500 hover:text-red-500 transition-colors duration-200 ml-2 flex-shrink-0"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </li>
      </ul>
    </div>

    <!-- Settings Modal -->
    <div
      v-if="isSettingsModalOpen"
      class="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4"
    >
      <div class="bg-white rounded-lg p-6 md:p-8 w-full max-w-sm shadow-2xl">
        <h2 class="text-2xl font-bold mb-6 text-center text-gray-800">时间设置</h2>
        <div class="space-y-4">
          <div>
            <label for="pomodoro-duration" class="block text-sm font-medium text-gray-700"
              >专注 (分钟)</label
            >
            <input
              type="number"
              v-model.number="settings.pomodoro"
              id="pomodoro-duration"
              class="mt-1 block w-full bg-white border-gray-300 rounded-md shadow-sm py-2 px-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              min="1"
            />
          </div>
          <div>
            <label for="short-break-duration" class="block text-sm font-medium text-gray-700"
              >短休息 (分钟)</label
            >
            <input
              type="number"
              v-model.number="settings.shortBreak"
              id="short-break-duration"
              class="mt-1 block w-full bg-white border-gray-300 rounded-md shadow-sm py-2 px-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              min="1"
            />
          </div>
          <div>
            <label for="long-break-duration" class="block text-sm font-medium text-gray-700"
              >长休息 (分钟)</label
            >
            <input
              type="number"
              v-model.number="settings.longBreak"
              id="long-break-duration"
              class="mt-1 block w-full bg-white border-gray-300 rounded-md shadow-sm py-2 px-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              min="1"
            />
          </div>
        </div>
        <div class="mt-8 flex justify-end space-x-3">
          <button
            @click="closeModal"
            class="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold rounded-md transition-colors duration-200"
          >
            取消
          </button>
          <button
            @click="saveSettings"
            class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-md transition-colors duration-200"
          >
            保存
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
import * as Tone from 'tone'

// Timer Constants
const SESSIONS = reactive({
  POMODORO: 25,
  SHORT_BREAK: 5,
  LONG_BREAK: 15,
})
const SESSION_TITLES = {
  POMODORO: '专注',
  SHORT_BREAK: '短休息',
  LONG_BREAK: '长休息',
}
const POMODOROS_UNTIL_LONG_BREAK = 4
const CIRCLE_CIRCUMFERENCE = 2 * Math.PI * 45 // 2 * PI * radius

// App State
const timerId = ref(null)
const timeRemaining = ref(SESSIONS.POMODORO * 60)
const currentSession = ref('POMODORO') // 'POMODORO', 'SHORT_BREAK', 'LONG_BREAK'
const pomodorosCompleted = ref(0)
const isRunning = ref(false)
const tasks = ref([])
const activeTaskId = ref(null)
const newTaskText = ref('')
const isSettingsModalOpen = ref(false)
const settings = reactive({
  pomodoro: SESSIONS.POMODORO,
  shortBreak: SESSIONS.SHORT_BREAK,
  longBreak: SESSIONS.LONG_BREAK,
})

// --- Computed Properties ---

const formattedTime = computed(() => {
  const minutes = Math.floor(timeRemaining.value / 60)
    .toString()
    .padStart(2, '0')
  const seconds = (timeRemaining.value % 60).toString().padStart(2, '0')
  return `${minutes}:${seconds}`
})

const progressOffset = computed(() => {
  const totalDuration = SESSIONS[currentSession.value] * 60
  const progress = (totalDuration - timeRemaining.value) / totalDuration
  return CIRCLE_CIRCUMFERENCE * (1 - progress)
})

const progressColorClass = computed(() => {
  switch (currentSession.value) {
    case 'POMODORO':
      return 'text-teal-500'
    case 'SHORT_BREAK':
      return 'text-green-500'
    case 'LONG_BREAK':
      return 'text-blue-500'
    default:
      return 'text-teal-500'
  }
})

const sessionStatusText = computed(() => {
  const activeTask = tasks.value.find((task) => task.id === activeTaskId.value)
  if (currentSession.value === 'POMODORO') {
    return activeTask && !activeTask.completed ? `专注: ${activeTask.text}` : '专注时间！'
  }
  return `${SESSION_TITLES[currentSession.value]}时间！`
})

// --- Core Timer Functions ---

function updateTitle() {
  document.title = `${formattedTime.value} - ${SESSION_TITLES[currentSession.value]}`
}

function playSound() {
  try {
    const synth = new Tone.Synth().toDestination()
    synth.triggerAttackRelease('C5', '8n', Tone.now())
    synth.triggerAttackRelease('G5', '8n', Tone.now() + 0.2)
  } catch (e) {
    console.error('Audio could not be played.', e)
  }
}

function switchSession() {
  if (currentSession.value === 'POMODORO') {
    pomodorosCompleted.value++
    if (pomodorosCompleted.value % POMODOROS_UNTIL_LONG_BREAK === 0) {
      setSession('LONG_BREAK')
    } else {
      setSession('SHORT_BREAK')
    }
  } else {
    setSession('POMODORO')
  }
  playSound()
  startTimer()
}

function setSession(sessionType) {
  currentSession.value = sessionType
  timeRemaining.value = SESSIONS[sessionType] * 60
  updateTitle()
}

function timerTick() {
  if (timeRemaining.value > 0) {
    timeRemaining.value--
    updateTitle()
  } else {
    clearInterval(timerId.value)
    isRunning.value = false
    switchSession()
  }
}

// --- Control Functions ---

function startTimer() {
  if (!isRunning.value) {
    isRunning.value = true
    timerId.value = setInterval(timerTick, 1000)
  }
}

function pauseTimer() {
  if (isRunning.value) {
    isRunning.value = false
    clearInterval(timerId.value)
  }
}

function handleStartPause() {
  if (isRunning.value) {
    pauseTimer()
  } else {
    startTimer()
  }
}

function resetTimer() {
  pauseTimer()
  setSession('POMODORO')
}

// --- UI Update Functions ---

function getDotClass(index) {
  const completedInCycle = pomodorosCompleted.value % POMODOROS_UNTIL_LONG_BREAK
  const isLongBreakCycle = completedInCycle === 0 && pomodorosCompleted.value > 0
  const dotsToShow = isLongBreakCycle ? POMODOROS_UNTIL_LONG_BREAK : completedInCycle

  if (index <= dotsToShow) {
    if (isLongBreakCycle && currentSession.value !== 'LONG_BREAK' && pomodorosCompleted.value > 0) {
      return 'bg-blue-500'
    }
    return 'bg-teal-500'
  }
  return 'bg-gray-200'
}

// --- Task List Functions ---

function saveTasks() {
  localStorage.setItem('pomodoro_tasks', JSON.stringify(tasks.value))
  localStorage.setItem('pomodoro_activeTaskId', activeTaskId.value)
}

function loadTasks() {
  const storedTasks = localStorage.getItem('pomodoro_tasks')
  const storedActiveTaskId = localStorage.getItem('pomodoro_activeTaskId')
  tasks.value = storedTasks ? JSON.parse(storedTasks) : []
  activeTaskId.value = storedActiveTaskId ? storedActiveTaskId : null
}

function addTask() {
  const text = newTaskText.value.trim()
  if (text) {
    const newTask = { id: Date.now().toString(), text, completed: false }
    tasks.value.push(newTask)
    newTaskText.value = ''
    saveTasks()
  }
}

function toggleTask(id) {
  tasks.value = tasks.value.map((task) =>
    task.id === id ? { ...task, completed: !task.completed } : task,
  )
  saveTasks()
}

function deleteTask(id) {
  tasks.value = tasks.value.filter((task) => task.id !== id)
  if (activeTaskId.value === id) {
    activeTaskId.value = null
  }
  saveTasks()
}

function setActiveTask(id) {
  activeTaskId.value = id
  saveTasks()
}

// --- Settings Modal Functions ---

function openModal() {
  settings.pomodoro = SESSIONS.POMODORO
  settings.shortBreak = SESSIONS.SHORT_BREAK
  settings.longBreak = SESSIONS.LONG_BREAK
  isSettingsModalOpen.value = true
}

function closeModal() {
  isSettingsModalOpen.value = false
}

function saveSettings() {
  if (settings.pomodoro > 0 && settings.shortBreak > 0 && settings.longBreak > 0) {
    SESSIONS.POMODORO = settings.pomodoro
    SESSIONS.SHORT_BREAK = settings.shortBreak
    SESSIONS.LONG_BREAK = settings.longBreak

    pauseTimer()
    pomodorosCompleted.value = 0
    setSession('POMODORO')

    closeModal()
  } else {
    console.error('Please enter valid minute values greater than 0.')
  }
}

// --- Lifecycle Hooks ---
onMounted(() => {
  loadTasks()
  timeRemaining.value = SESSIONS.POMODORO * 60
  updateTitle()
  // Request permission for notifications
  if ('Notification' in window && Notification.permission !== 'granted') {
    Notification.requestPermission()
  }
})

onUnmounted(() => {
  clearInterval(timerId.value)
})
</script>

<style scoped>
.timer-circle-progress {
  transition: stroke-dashoffset 1s linear;
}
</style>
