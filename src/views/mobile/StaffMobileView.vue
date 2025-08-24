<script setup lang="ts">
import { ref, computed } from 'vue'
import { useEmployeeStore } from '@/stores/employees'
import { useSalesStore } from '@/stores/sales'
import { useAuthStore } from '@/stores/auth'
import { useBranchesStore } from '@/stores/branches'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import {
  ClockIcon,
  CalendarIcon,
  CheckIcon,
  UserIcon,
  CurrencyDollarIcon,
  BellIcon,
  CogIcon,
  PlayIcon,
  StopIcon,
  PauseIcon,
} from '@heroicons/vue/24/outline'

const employeeStore = useEmployeeStore()
const salesStore = useSalesStore()
const authStore = useAuthStore()
const branchesStore = useBranchesStore()

const currentTab = ref('dashboard')
const isClockingIn = ref(false)

// Mock current employee for demo
const currentEmployee = computed(() => {
  return employeeStore.employees.find((emp) => emp.id === 'emp-2') || employeeStore.employees[0]
})

const currentTimeEntry = computed(() => {
  const today = new Date()
  return employeeStore.timeEntries.find(
    (entry) =>
      entry.employeeId === currentEmployee.value?.id &&
      entry.date.toDateString() === today.toDateString() &&
      entry.status === 'clocked_in',
  )
})

const todaySchedule = computed(() => {
  const today = new Date()
  return employeeStore.schedules.find(
    (schedule) =>
      schedule.employeeId === currentEmployee.value?.id &&
      schedule.date.toDateString() === today.toDateString(),
  )
})

const todaysTasks = computed(() => [
  { id: 1, title: 'Clean espresso machine', completed: true, priority: 'high' },
  { id: 2, title: 'Restock milk supplies', completed: false, priority: 'medium' },
  { id: 3, title: 'Check inventory levels', completed: false, priority: 'low' },
  { id: 4, title: 'Sanitize work surfaces', completed: true, priority: 'high' },
  { id: 5, title: 'Update daily specials board', completed: false, priority: 'medium' },
])

const weeklySchedule = computed(() => {
  const today = new Date()
  const schedule = []

  for (let i = 0; i < 7; i++) {
    const date = new Date(today)
    date.setDate(date.getDate() - today.getDay() + i)

    const daySchedule = employeeStore.schedules.find(
      (s) =>
        s.employeeId === currentEmployee.value?.id && s.date.toDateString() === date.toDateString(),
    )

    schedule.push({
      date,
      dayName: date.toLocaleDateString('en-US', { weekday: 'short' }),
      schedule: daySchedule,
      isToday: date.toDateString() === today.toDateString(),
    })
  }

  return schedule
})

const notifications = computed(() => [
  { id: 1, message: 'New schedule available for next week', time: '10:30 AM', type: 'info' },
  { id: 2, message: 'Break reminder: 15 minutes', time: '2:00 PM', type: 'warning' },
  { id: 3, message: 'Team meeting at 4:00 PM', time: '3:45 PM', type: 'info' },
])

// Functions
function simulateClockIn() {
  if (currentEmployee.value) {
    isClockingIn.value = true
    setTimeout(() => {
      employeeStore.clockIn(currentEmployee.value!.id, { lat: 40.7128, lng: -74.006 })
      isClockingIn.value = false
    }, 2000)
  }
}

function simulateClockOut() {
  if (currentEmployee.value) {
    employeeStore.clockOut(currentEmployee.value.id)
  }
}

function toggleTask(taskId: number) {
  const task = todaysTasks.value.find((t) => t.id === taskId)
  if (task) {
    task.completed = !task.completed
  }
}

function formatTime(timeString: string) {
  const [hours, minutes] = timeString.split(':').map(Number)
  const date = new Date()
  date.setHours(hours, minutes)
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount)
}

function getPriorityColor(priority: string) {
  const colors = {
    high: 'text-red-600',
    medium: 'text-yellow-600',
    low: 'text-green-600',
  }
  return colors[priority as keyof typeof colors] || 'text-gray-600'
}

function changeTab(tab: string) {
  currentTab.value = tab
}
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Header -->
    <div class="bg-blue-600 text-white p-4 sticky top-0 z-10">
      <div class="flex items-center justify-between">
        <div class="flex items-center space-x-3">
          <div class="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
            <UserIcon class="h-5 w-5" />
          </div>
          <div>
            <h1 class="font-semibold">
              {{ currentEmployee?.firstName }} {{ currentEmployee?.lastName }}
            </h1>
            <p class="text-xs text-blue-100">{{ currentEmployee?.position.replace('_', ' ') }}</p>
          </div>
        </div>
        <div class="flex items-center space-x-2">
          <div class="relative">
            <BellIcon class="h-6 w-6" />
            <span
              class="absolute -top-1 -right-1 bg-red-500 text-xs rounded-full w-4 h-4 flex items-center justify-center"
              >3</span
            >
          </div>
          <CogIcon class="h-6 w-6" />
        </div>
      </div>
    </div>

    <!-- Clock Status Banner -->
    <div v-if="currentTimeEntry" class="bg-green-100 border-b border-green-200 p-3">
      <div class="flex items-center justify-between">
        <div class="flex items-center space-x-2">
          <ClockIcon class="h-4 w-4 text-green-600" />
          <span class="text-sm font-medium text-green-800">Currently Clocked In</span>
        </div>
        <span class="text-sm text-green-600">
          Since
          {{
            currentTimeEntry.clockIn.toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit',
            })
          }}
        </span>
      </div>
    </div>

    <!-- Main Content -->
    <div class="pb-20">
      <!-- Dashboard Tab -->
      <div v-if="currentTab === 'dashboard'" class="p-4 space-y-4">
        <!-- Quick Actions -->
        <Card>
          <CardHeader class="pb-3">
            <h2 class="text-lg font-semibold">Quick Actions</h2>
          </CardHeader>
          <CardContent>
            <div class="grid grid-cols-2 gap-3">
              <Button
                v-if="!currentTimeEntry"
                @click="simulateClockIn"
                :disabled="isClockingIn"
                class="flex flex-col items-center p-4 h-auto bg-green-600 hover:bg-green-700"
              >
                <PlayIcon class="h-6 w-6 mb-1" />
                <span class="text-sm">{{ isClockingIn ? 'Clocking In...' : 'Clock In' }}</span>
              </Button>

              <Button
                v-else
                @click="simulateClockOut"
                class="flex flex-col items-center p-4 h-auto bg-red-600 hover:bg-red-700"
              >
                <StopIcon class="h-6 w-6 mb-1" />
                <span class="text-sm">Clock Out</span>
              </Button>

              <Button
                class="flex flex-col items-center p-4 h-auto bg-yellow-600 hover:bg-yellow-700"
              >
                <PauseIcon class="h-6 w-6 mb-1" />
                <span class="text-sm">Break</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        <!-- Today's Schedule -->
        <Card>
          <CardHeader class="pb-3">
            <h2 class="text-lg font-semibold flex items-center">
              <CalendarIcon class="h-5 w-5 mr-2" />
              Today's Schedule
            </h2>
          </CardHeader>
          <CardContent>
            <div v-if="todaySchedule" class="space-y-2">
              <div class="flex justify-between items-center">
                <span class="font-medium"
                  >{{ formatTime(todaySchedule.startTime) }} -
                  {{ formatTime(todaySchedule.endTime) }}</span
                >
                <span class="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                  {{ todaySchedule.position.replace('_', ' ') }}
                </span>
              </div>
              <p class="text-sm text-gray-600">
                {{ todaySchedule.shiftType.replace('_', ' ').toUpperCase() }} shift
              </p>
              <div v-if="todaySchedule.notes" class="text-sm text-gray-500">
                Note: {{ todaySchedule.notes }}
              </div>
            </div>
            <div v-else class="text-gray-500 text-sm">No schedule for today</div>
          </CardContent>
        </Card>

        <!-- Performance -->
        <Card>
          <CardHeader class="pb-3">
            <h2 class="text-lg font-semibold flex items-center">
              <CurrencyDollarIcon class="h-5 w-5 mr-2" />
              Today's Performance
            </h2>
          </CardHeader>
          <CardContent>
            <div class="grid grid-cols-2 gap-4">
              <div class="text-center">
                <p class="text-2xl font-bold text-blue-600">{{ salesStore.todaysOrders }}</p>
                <p class="text-xs text-gray-600">Orders Served</p>
              </div>
              <div class="text-center">
                <p class="text-2xl font-bold text-green-600">
                  {{ formatCurrency(salesStore.todaysSales) }}
                </p>
                <p class="text-xs text-gray-600">Sales Generated</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <!-- Notifications -->
        <Card>
          <CardHeader class="pb-3">
            <h2 class="text-lg font-semibold flex items-center">
              <BellIcon class="h-5 w-5 mr-2" />
              Notifications
            </h2>
          </CardHeader>
          <CardContent>
            <div class="space-y-3">
              <div
                v-for="notification in notifications"
                :key="notification.id"
                class="flex items-start space-x-3 p-2 bg-gray-50 rounded"
              >
                <div
                  class="w-2 h-2 rounded-full mt-2"
                  :class="notification.type === 'warning' ? 'bg-yellow-500' : 'bg-blue-500'"
                ></div>
                <div class="flex-1">
                  <p class="text-sm">{{ notification.message }}</p>
                  <p class="text-xs text-gray-500">{{ notification.time }}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <!-- Tasks Tab -->
      <div v-if="currentTab === 'tasks'" class="p-4 space-y-4">
        <Card>
          <CardHeader class="pb-3">
            <h2 class="text-lg font-semibold">Today's Tasks</h2>
          </CardHeader>
          <CardContent>
            <div class="space-y-3">
              <div
                v-for="task in todaysTasks"
                :key="task.id"
                class="flex items-center space-x-3 p-3 border rounded-lg"
                :class="task.completed ? 'bg-green-50 border-green-200' : 'bg-white'"
              >
                <button
                  @click="toggleTask(task.id)"
                  class="w-5 h-5 rounded-full border-2 flex items-center justify-center"
                  :class="task.completed ? 'bg-green-500 border-green-500' : 'border-gray-300'"
                >
                  <CheckIcon v-if="task.completed" class="h-3 w-3 text-white" />
                </button>
                <div class="flex-1">
                  <p
                    class="font-medium"
                    :class="task.completed ? 'text-green-800 line-through' : ''"
                  >
                    {{ task.title }}
                  </p>
                  <p class="text-xs" :class="getPriorityColor(task.priority)">
                    {{ task.priority.toUpperCase() }} PRIORITY
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <!-- Schedule Tab -->
      <div v-if="currentTab === 'schedule'" class="p-4 space-y-4">
        <Card>
          <CardHeader class="pb-3">
            <h2 class="text-lg font-semibold">This Week's Schedule</h2>
          </CardHeader>
          <CardContent>
            <div class="space-y-3">
              <div
                v-for="day in weeklySchedule"
                :key="day.date.toISOString()"
                class="flex items-center justify-between p-3 border rounded-lg"
                :class="day.isToday ? 'bg-blue-50 border-blue-200' : 'bg-white'"
              >
                <div>
                  <p class="font-medium" :class="day.isToday ? 'text-blue-800' : ''">
                    {{ day.dayName }} {{ day.date.getDate() }}
                  </p>
                  <p class="text-xs text-gray-600">
                    {{ day.date.toLocaleDateString('en-US', { month: 'short' }) }}
                  </p>
                </div>
                <div v-if="day.schedule" class="text-right">
                  <p class="font-medium">
                    {{ formatTime(day.schedule.startTime) }} -
                    {{ formatTime(day.schedule.endTime) }}
                  </p>
                  <p class="text-xs text-gray-600">{{ day.schedule.position.replace('_', ' ') }}</p>
                </div>
                <div v-else class="text-gray-400 text-sm">Off</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>

    <!-- Bottom Navigation -->
    <div class="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200">
      <div class="grid grid-cols-3 h-16">
        <button
          @click="changeTab('dashboard')"
          :class="[
            'flex flex-col items-center justify-center space-y-1',
            currentTab === 'dashboard' ? 'text-blue-600 bg-blue-50' : 'text-gray-600',
          ]"
        >
          <UserIcon class="h-5 w-5" />
          <span class="text-xs">Dashboard</span>
        </button>

        <button
          @click="changeTab('tasks')"
          :class="[
            'flex flex-col items-center justify-center space-y-1',
            currentTab === 'tasks' ? 'text-blue-600 bg-blue-50' : 'text-gray-600',
          ]"
        >
          <CheckIcon class="h-5 w-5" />
          <span class="text-xs">Tasks</span>
        </button>

        <button
          @click="changeTab('schedule')"
          :class="[
            'flex flex-col items-center justify-center space-y-1',
            currentTab === 'schedule' ? 'text-blue-600 bg-blue-50' : 'text-gray-600',
          ]"
        >
          <CalendarIcon class="h-5 w-5" />
          <span class="text-xs">Schedule</span>
        </button>
      </div>
    </div>
  </div>
</template>
