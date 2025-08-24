<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useHardwareStore } from '@/stores/hardware'
import { useBranchesStore } from '@/stores/branches'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import {
  ComputerDesktopIcon,
  ClockIcon,
  BellIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  FireIcon,
  UserIcon,
  MapPinIcon,
  PlayIcon,
  CheckIcon,
  EyeIcon,
  Cog6ToothIcon,
} from '@heroicons/vue/24/outline'
import type { KitchenOrder, KitchenOrderItem } from '@/stores/hardware'

const hardwareStore = useHardwareStore()
const branchesStore = useBranchesStore()

const selectedStation = ref<'all' | 'grill' | 'cold_prep' | 'coffee' | 'dessert'>('all')
const autoRefresh = ref(true)
const showSettings = ref(false)
const refreshInterval = ref<NodeJS.Timeout | null>(null)
const currentTime = ref(new Date())

// Settings
const tempSettings = ref({
  autoRefresh: true,
  refreshInterval: 30,
  soundAlerts: true,
  showTimer: true,
  maxOrdersPerScreen: 12,
  defaultEstimatedTime: 15,
})

// Computed
const filteredOrders = computed(() => {
  return hardwareStore.getOrdersByStation(selectedStation.value).sort((a, b) => {
    // Sort by priority (urgent > high > normal) then by received time
    const priorityOrder = { urgent: 3, high: 2, normal: 1 }
    const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority]
    if (priorityDiff !== 0) return priorityDiff
    return a.receivedAt.getTime() - b.receivedAt.getTime()
  })
})

const stationStats = computed(() => {
  const stats = {
    all: { orders: 0, avgTime: 0, urgent: 0 },
    grill: { orders: 0, avgTime: 0, urgent: 0 },
    cold_prep: { orders: 0, avgTime: 0, urgent: 0 },
    coffee: { orders: 0, avgTime: 0, urgent: 0 },
    dessert: { orders: 0, avgTime: 0, urgent: 0 },
  }

  hardwareStore.activeKitchenOrders.forEach((order) => {
    stats.all.orders++
    if (order.priority === 'urgent' || order.priority === 'high') stats.all.urgent++

    order.items.forEach((item) => {
      if (stats[item.station]) {
        stats[item.station].orders++
        if (order.priority === 'urgent' || order.priority === 'high') {
          stats[item.station].urgent++
        }
      }
    })
  })

  return stats
})

const systemStatus = computed(() => {
  const device = hardwareStore.currentBranchDevices.find((d) => d.type === 'kitchen_display')
  return {
    online: device?.status === 'online',
    lastUpdate: hardwareStore.deviceStatuses.kitchenDisplay.lastUpdate,
    ordersDisplayed: hardwareStore.activeKitchenOrders.length,
    screensOnline: hardwareStore.deviceStatuses.kitchenDisplay.screensOnline,
  }
})

// Functions
function getOrderElapsedTime(order: KitchenOrder) {
  const startTime = order.startTime || order.receivedAt
  return Math.floor((currentTime.value.getTime() - startTime.getTime()) / 60000)
}

function getOrderStatusColor(status: KitchenOrder['status']) {
  const colors = {
    new: 'bg-blue-100 border-blue-300 text-blue-800',
    acknowledged: 'bg-yellow-100 border-yellow-300 text-yellow-800',
    preparing: 'bg-orange-100 border-orange-300 text-orange-800',
    ready: 'bg-green-100 border-green-300 text-green-800',
    completed: 'bg-gray-100 border-gray-300 text-gray-800',
  }
  return colors[status] || 'bg-gray-100 border-gray-300 text-gray-800'
}

function getPriorityColor(priority: KitchenOrder['priority']) {
  const colors = {
    normal: 'text-gray-600',
    high: 'text-orange-600',
    urgent: 'text-red-600',
  }
  return colors[priority] || 'text-gray-600'
}

function getPriorityIcon(priority: KitchenOrder['priority']) {
  if (priority === 'urgent') return FireIcon
  if (priority === 'high') return ExclamationTriangleIcon
  return null
}

function getItemStatusColor(status: KitchenOrderItem['status']) {
  const colors = {
    pending: 'bg-gray-100 text-gray-700',
    preparing: 'bg-blue-100 text-blue-700',
    ready: 'bg-green-100 text-green-700',
  }
  return colors[status] || 'bg-gray-100 text-gray-700'
}

function getTimeColor(elapsed: number, estimated: number) {
  if (elapsed <= estimated) return 'text-green-600'
  if (elapsed <= estimated * 1.2) return 'text-yellow-600'
  return 'text-red-600'
}

function acknowledgeOrder(orderId: string) {
  hardwareStore.updateKitchenOrderStatus(orderId, 'acknowledged')
}

function startPreparation(orderId: string) {
  hardwareStore.updateKitchenOrderStatus(orderId, 'preparing')
}

function markOrderReady(orderId: string) {
  hardwareStore.updateKitchenOrderStatus(orderId, 'ready')
}

function completeOrder(orderId: string) {
  hardwareStore.updateKitchenOrderStatus(orderId, 'completed')
}

function toggleItemStatus(
  orderId: string,
  itemId: string,
  currentStatus: KitchenOrderItem['status'],
) {
  const nextStatus =
    currentStatus === 'pending' ? 'preparing' : currentStatus === 'preparing' ? 'ready' : 'pending'
  hardwareStore.updateKitchenOrderItemStatus(orderId, itemId, nextStatus)
}

function addTestOrder() {
  hardwareStore.simulateNewKitchenOrder()
}

function changeStation(station: typeof selectedStation.value) {
  selectedStation.value = station
}

function updateSettings() {
  hardwareStore.updateKitchenDisplaySettings(tempSettings.value)
  showSettings.value = false

  // Update auto-refresh
  if (refreshInterval.value) {
    clearInterval(refreshInterval.value)
    refreshInterval.value = null
  }

  if (tempSettings.value.autoRefresh) {
    refreshInterval.value = setInterval(() => {
      currentTime.value = new Date()
    }, tempSettings.value.refreshInterval * 1000)
  }
}

function formatTime(minutes: number) {
  if (minutes < 60) return `${minutes}m`
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return `${hours}h ${mins}m`
}

// Initialize settings
onMounted(() => {
  tempSettings.value = { ...hardwareStore.kitchenDisplaySettings }

  // Update current time every second
  setInterval(() => {
    currentTime.value = new Date()
  }, 1000)

  // Auto-refresh setup
  if (tempSettings.value.autoRefresh) {
    refreshInterval.value = setInterval(() => {
      // Refresh logic here
    }, tempSettings.value.refreshInterval * 1000)
  }
})

onUnmounted(() => {
  if (refreshInterval.value) {
    clearInterval(refreshInterval.value)
  }
})
</script>

<template>
  <div class="min-h-screen bg-gray-900 text-white">
    <!-- Header -->
    <div class="bg-gray-800 border-b border-gray-700 p-4">
      <div class="flex justify-between items-center">
        <div class="flex items-center space-x-4">
          <div class="flex items-center space-x-2">
            <ComputerDesktopIcon class="h-8 w-8 text-blue-400" />
            <div>
              <h1 class="text-2xl font-bold">Kitchen Display System</h1>
              <p class="text-sm text-gray-400">{{ branchesStore.selectedBranch?.name }}</p>
            </div>
          </div>

          <!-- Status Indicator -->
          <div class="flex items-center space-x-2">
            <div
              :class="systemStatus.online ? 'bg-green-500' : 'bg-red-500'"
              class="w-3 h-3 rounded-full animate-pulse"
            ></div>
            <span class="text-sm">{{ systemStatus.online ? 'ONLINE' : 'OFFLINE' }}</span>
          </div>
        </div>

        <div class="flex items-center space-x-4">
          <!-- Current Time -->
          <div class="text-right">
            <p class="text-2xl font-mono">{{ currentTime.toLocaleTimeString() }}</p>
            <p class="text-sm text-gray-400">{{ currentTime.toLocaleDateString() }}</p>
          </div>

          <!-- Quick Stats -->
          <div class="flex space-x-4 text-center">
            <div class="bg-blue-600 px-3 py-2 rounded">
              <p class="text-lg font-bold">{{ systemStatus.ordersDisplayed }}</p>
              <p class="text-xs">Active Orders</p>
            </div>
            <div class="bg-red-600 px-3 py-2 rounded">
              <p class="text-lg font-bold">{{ stationStats.all.urgent }}</p>
              <p class="text-xs">Priority</p>
            </div>
          </div>

          <!-- Controls -->
          <div class="flex space-x-2">
            <Button @click="addTestOrder" class="bg-green-600 hover:bg-green-700">
              + New Order
            </Button>
            <Button
              @click="showSettings = true"
              variant="outline"
              class="border-gray-600 text-gray-300"
            >
              <Cog6ToothIcon class="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>

    <!-- Station Filters -->
    <div class="bg-gray-800 border-b border-gray-700 px-4 py-3">
      <div class="flex space-x-2">
        <button
          v-for="station in ['all', 'coffee', 'grill', 'cold_prep', 'dessert']"
          :key="station"
          @click="changeStation(station as any)"
          :class="[
            'px-4 py-2 rounded-lg font-medium transition-colors',
            selectedStation === station
              ? 'bg-blue-600 text-white'
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600',
          ]"
        >
          {{ station.replace('_', ' ').toUpperCase() }}
          <span
            v-if="stationStats[station as keyof typeof stationStats].orders > 0"
            class="ml-2 px-2 py-1 bg-white bg-opacity-20 rounded-full text-xs"
          >
            {{ stationStats[station as keyof typeof stationStats].orders }}
          </span>
        </button>
      </div>
    </div>

    <!-- Orders Grid -->
    <div class="p-4">
      <div v-if="filteredOrders.length === 0" class="text-center py-12">
        <ComputerDesktopIcon class="h-16 w-16 mx-auto text-gray-600 mb-4" />
        <p class="text-xl text-gray-400">No active orders</p>
        <p class="text-gray-500">All caught up! 🎉</p>
      </div>

      <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        <div
          v-for="order in filteredOrders.slice(0, tempSettings.maxOrdersPerScreen)"
          :key="order.id"
          :class="[
            'bg-gray-800 rounded-lg border-2 p-4 transition-all duration-200',
            getOrderStatusColor(order.status),
            order.priority === 'urgent' ? 'ring-2 ring-red-500 animate-pulse' : '',
            order.priority === 'high' ? 'ring-1 ring-orange-400' : '',
          ]"
        >
          <!-- Order Header -->
          <div class="flex justify-between items-start mb-3">
            <div>
              <div class="flex items-center space-x-2">
                <h3 class="text-lg font-bold">{{ order.orderNumber }}</h3>
                <component
                  v-if="getPriorityIcon(order.priority)"
                  :is="getPriorityIcon(order.priority)"
                  class="h-4 w-4"
                  :class="getPriorityColor(order.priority)"
                />
              </div>
              <p class="text-sm opacity-75">{{ order.customerName }}</p>
              <div class="flex items-center space-x-3 mt-1">
                <span class="text-xs px-2 py-1 bg-black bg-opacity-30 rounded">
                  {{ order.orderType.replace('_', ' ').toUpperCase() }}
                </span>
                <span v-if="order.tableNumber" class="text-xs flex items-center">
                  <MapPinIcon class="h-3 w-3 mr-1" />
                  {{ order.tableNumber }}
                </span>
              </div>
            </div>

            <!-- Timer -->
            <div class="text-right">
              <div class="flex items-center space-x-1">
                <ClockIcon class="h-4 w-4" />
                <span
                  :class="getTimeColor(getOrderElapsedTime(order), order.estimatedTime)"
                  class="font-mono font-bold"
                >
                  {{ formatTime(getOrderElapsedTime(order)) }}
                </span>
              </div>
              <p class="text-xs opacity-75">/ {{ formatTime(order.estimatedTime) }}</p>
            </div>
          </div>

          <!-- Order Items -->
          <div class="space-y-2 mb-4">
            <div
              v-for="item in order.items"
              :key="item.id"
              class="flex items-center justify-between p-2 bg-black bg-opacity-20 rounded"
            >
              <div class="flex-1">
                <div class="flex items-center space-x-2">
                  <span class="font-medium">{{ item.quantity }}x {{ item.name }}</span>
                  <span
                    :class="getItemStatusColor(item.status)"
                    class="px-2 py-1 rounded text-xs font-medium"
                  >
                    {{ item.status }}
                  </span>
                </div>
                <div v-if="item.modifications.length > 0" class="text-xs opacity-75 mt-1">
                  {{ item.modifications.join(', ') }}
                </div>
                <div v-if="item.allergens.length > 0" class="text-xs text-red-400 mt-1">
                  ⚠️ {{ item.allergens.join(', ') }}
                </div>
              </div>
              <Button
                @click="toggleItemStatus(order.id, item.id, item.status)"
                size="sm"
                :class="item.status === 'ready' ? 'bg-green-600' : 'bg-blue-600'"
              >
                <CheckIcon v-if="item.status === 'ready'" class="h-3 w-3" />
                <PlayIcon v-else class="h-3 w-3" />
              </Button>
            </div>
          </div>

          <!-- Special Instructions -->
          <div
            v-if="order.specialInstructions"
            class="mb-4 p-2 bg-yellow-600 bg-opacity-20 rounded"
          >
            <p class="text-sm font-medium">📝 Special Instructions:</p>
            <p class="text-sm">{{ order.specialInstructions }}</p>
          </div>

          <!-- Order Actions -->
          <div class="grid grid-cols-2 gap-2">
            <Button
              v-if="order.status === 'new'"
              @click="acknowledgeOrder(order.id)"
              class="bg-blue-600 hover:bg-blue-700"
            >
              Acknowledge
            </Button>

            <Button
              v-if="order.status === 'acknowledged'"
              @click="startPreparation(order.id)"
              class="bg-orange-600 hover:bg-orange-700"
            >
              Start Prep
            </Button>

            <Button
              v-if="order.status === 'preparing'"
              @click="markOrderReady(order.id)"
              class="bg-green-600 hover:bg-green-700"
            >
              Mark Ready
            </Button>

            <Button
              v-if="order.status === 'ready'"
              @click="completeOrder(order.id)"
              class="bg-gray-600 hover:bg-gray-700"
            >
              Complete
            </Button>

            <!-- Secondary action -->
            <Button
              v-if="['new', 'acknowledged'].includes(order.status)"
              @click="markOrderReady(order.id)"
              variant="outline"
              class="border-gray-600 text-gray-300"
            >
              Quick Ready
            </Button>
          </div>
        </div>
      </div>
    </div>

    <!-- Settings Modal -->
    <div
      v-if="showSettings"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
    >
      <div class="bg-gray-800 rounded-lg p-6 w-96 text-white">
        <div class="flex justify-between items-center mb-4">
          <h3 class="text-lg font-semibold">Display Settings</h3>
          <Button @click="showSettings = false" variant="outline" size="sm" class="border-gray-600"
            >✕</Button
          >
        </div>

        <div class="space-y-4">
          <div class="flex items-center justify-between">
            <label class="text-sm font-medium">Auto Refresh</label>
            <input
              v-model="tempSettings.autoRefresh"
              type="checkbox"
              class="rounded bg-gray-700 border-gray-600"
            />
          </div>

          <div>
            <label class="text-sm font-medium mb-2 block">Refresh Interval (seconds)</label>
            <input
              v-model.number="tempSettings.refreshInterval"
              type="number"
              min="5"
              max="300"
              class="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2"
            />
          </div>

          <div class="flex items-center justify-between">
            <label class="text-sm font-medium">Sound Alerts</label>
            <input
              v-model="tempSettings.soundAlerts"
              type="checkbox"
              class="rounded bg-gray-700 border-gray-600"
            />
          </div>

          <div class="flex items-center justify-between">
            <label class="text-sm font-medium">Show Timer</label>
            <input
              v-model="tempSettings.showTimer"
              type="checkbox"
              class="rounded bg-gray-700 border-gray-600"
            />
          </div>

          <div>
            <label class="text-sm font-medium mb-2 block">Max Orders Per Screen</label>
            <input
              v-model.number="tempSettings.maxOrdersPerScreen"
              type="number"
              min="4"
              max="20"
              class="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2"
            />
          </div>

          <div class="flex space-x-2 pt-4">
            <Button @click="updateSettings" class="flex-1 bg-blue-600 hover:bg-blue-700">
              Save Settings
            </Button>
            <Button @click="showSettings = false" variant="outline" class="flex-1 border-gray-600">
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style>
/* Custom scrollbar for dark theme */
::-webkit-scrollbar {
  width: 8px;
}

::-webkit-scrollbar-track {
  background: #374151;
}

::-webkit-scrollbar-thumb {
  background: #6b7280;
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: #9ca3af;
}
</style>
