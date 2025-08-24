<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useHardwareStore } from '@/stores/hardware'
import { useBranchesStore } from '@/stores/branches'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import {
  WifiIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  BoltIcon,
  FireIcon,
  EyeIcon,
  CogIcon,
  BellIcon,
  ShieldCheckIcon,
  CloudIcon,
  SignalIcon,
  CalendarIcon,
  PlayIcon,
  CheckIcon,
} from '@heroicons/vue/24/outline'
import type { IoTDevice, IoTAlert } from '@/stores/hardware'

const hardwareStore = useHardwareStore()
const branchesStore = useBranchesStore()

const activeTab = ref('overview')
const selectedDevice = ref<IoTDevice | null>(null)
const autoRefresh = ref(true)
const refreshInterval = ref<NodeJS.Timeout | null>(null)

// Computed
const systemStats = computed(() => {
  const devices = hardwareStore.currentBranchIoTDevices
  const alerts = hardwareStore.unacknowledgedAlerts

  return {
    totalDevices: devices.length,
    onlineDevices: devices.filter((d) => d.status === 'online').length,
    offlineDevices: devices.filter((d) => d.status === 'offline').length,
    warningDevices: devices.filter((d) => d.status === 'warning').length,
    criticalDevices: devices.filter((d) => d.status === 'critical').length,
    totalAlerts: alerts.length,
    criticalAlerts: alerts.filter((a) => a.severity === 'critical').length,
    overdueMaintenanceTasks: hardwareStore.overdueMaintenance.length,
  }
})

const devicesByType = computed(() => {
  const devices = hardwareStore.currentBranchIoTDevices
  return {
    temperature: devices.filter((d) => d.type === 'temperature'),
    humidity: devices.filter((d) => d.type === 'humidity'),
    air_quality: devices.filter((d) => d.type === 'air_quality'),
    energy: devices.filter((d) => d.type === 'energy'),
    security: devices.filter((d) => d.type === 'security'),
    equipment: devices.filter((d) => d.type === 'equipment'),
  }
})

const recentEnergyUsage = computed(() => {
  const readings = hardwareStore.currentEnergyReadings.slice(-24)
  const totalUsage = readings.reduce((sum, reading) => sum + reading.totalConsumption, 0)
  const totalCost = readings.reduce((sum, reading) => sum + reading.cost, 0)
  const currentDemand = readings[readings.length - 1]?.currentDemand || 0

  return { totalUsage, totalCost, currentDemand, readings }
})

const urgentMaintenanceTasks = computed(() => {
  return hardwareStore.currentMaintenanceSchedules
    .filter((task) => task.isOverdue || task.priority === 'high')
    .sort((a, b) => {
      if (a.isOverdue && !b.isOverdue) return -1
      if (!a.isOverdue && b.isOverdue) return 1
      return a.nextDue.getTime() - b.nextDue.getTime()
    })
})

// Functions
function getDeviceStatusColor(status: IoTDevice['status']) {
  const colors = {
    online: 'text-green-600 bg-green-100',
    offline: 'text-red-600 bg-red-100',
    warning: 'text-yellow-600 bg-yellow-100',
    critical: 'text-red-600 bg-red-100',
  }
  return colors[status]
}

function getAlertSeverityColor(severity: IoTAlert['severity']) {
  const colors = {
    low: 'border-blue-200 bg-blue-50',
    medium: 'border-yellow-200 bg-yellow-50',
    high: 'border-orange-200 bg-orange-50',
    critical: 'border-red-200 bg-red-50',
  }
  return colors[severity]
}

function getDeviceIcon(type: IoTDevice['type']) {
  const icons = {
    temperature: FireIcon,
    humidity: CloudIcon,
    air_quality: EyeIcon,
    energy: BoltIcon,
    security: ShieldCheckIcon,
    equipment: CogIcon,
  }
  return icons[type] || CogIcon
}

function formatValue(device: IoTDevice) {
  if (device.type === 'security') {
    return device.currentValue === 1 ? 'Armed' : 'Disarmed'
  }
  return `${device.currentValue.toFixed(1)} ${device.unit}`
}

function isValueInRange(device: IoTDevice) {
  if (device.minThreshold && device.currentValue < device.minThreshold) return false
  if (device.maxThreshold && device.currentValue > device.maxThreshold) return false
  return true
}

function acknowledgeAlert(alertId: string) {
  hardwareStore.acknowledgeAlert(alertId)
}

function resolveAlert(alertId: string) {
  hardwareStore.resolveAlert(alertId)
}

function completeMaintenance(scheduleId: string) {
  hardwareStore.completeMaintenance(scheduleId)
}

function refreshReadings() {
  hardwareStore.simulateDeviceReadings()
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount)
}

function formatTimeAgo(date: Date) {
  const minutes = Math.floor((Date.now() - date.getTime()) / 60000)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

function changeTab(tab: string) {
  activeTab.value = tab
}

// Auto-refresh setup
onMounted(() => {
  if (autoRefresh.value) {
    refreshInterval.value = setInterval(() => {
      refreshReadings()
    }, 30000) // Refresh every 30 seconds
  }
})

onUnmounted(() => {
  if (refreshInterval.value) {
    clearInterval(refreshInterval.value)
  }
})
</script>

<template>
  <div class="space-y-6">
    <div class="flex justify-between items-center">
      <div>
        <h1 class="text-3xl font-bold">IoT Monitoring Dashboard</h1>
        <p class="text-gray-600 mt-1">Monitor equipment, environment, and energy usage</p>
      </div>
      <div class="flex items-center space-x-4">
        <div class="text-right">
          <p class="text-sm text-gray-600">System Health</p>
          <p
            class="text-lg font-bold"
            :class="
              systemStats.onlineDevices / systemStats.totalDevices > 0.8
                ? 'text-green-600'
                : 'text-red-600'
            "
          >
            {{ Math.round((systemStats.onlineDevices / systemStats.totalDevices) * 100) }}%
          </p>
        </div>
        <Button @click="refreshReadings" class="border border-gray-300">
          <WifiIcon class="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>
    </div>

    <!-- System Overview -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card>
        <CardContent class="p-4 text-center">
          <div
            class="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-3"
          >
            <CheckCircleIcon class="h-6 w-6 text-green-600" />
          </div>
          <p class="text-2xl font-bold text-green-600">{{ systemStats.onlineDevices }}</p>
          <p class="text-sm text-gray-600">Online Devices</p>
        </CardContent>
      </Card>

      <Card>
        <CardContent class="p-4 text-center">
          <div
            class="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mx-auto mb-3"
          >
            <ExclamationTriangleIcon class="h-6 w-6 text-red-600" />
          </div>
          <p class="text-2xl font-bold text-red-600">{{ systemStats.totalAlerts }}</p>
          <p class="text-sm text-gray-600">Active Alerts</p>
        </CardContent>
      </Card>

      <Card>
        <CardContent class="p-4 text-center">
          <div
            class="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3"
          >
            <BoltIcon class="h-6 w-6 text-blue-600" />
          </div>
          <p class="text-2xl font-bold text-blue-600">
            {{ recentEnergyUsage.totalUsage.toFixed(1) }}
          </p>
          <p class="text-sm text-gray-600">kWh Today</p>
        </CardContent>
      </Card>

      <Card>
        <CardContent class="p-4 text-center">
          <div
            class="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center mx-auto mb-3"
          >
            <CalendarIcon class="h-6 w-6 text-yellow-600" />
          </div>
          <p class="text-2xl font-bold text-yellow-600">
            {{ systemStats.overdueMaintenanceTasks }}
          </p>
          <p class="text-sm text-gray-600">Overdue Tasks</p>
        </CardContent>
      </Card>
    </div>

    <!-- Tab Navigation -->
    <div class="bg-white rounded-lg border">
      <div class="border-b border-gray-200">
        <nav class="flex space-x-8 px-6">
          <button
            v-for="tab in ['overview', 'devices', 'alerts', 'energy', 'maintenance']"
            :key="tab"
            @click="changeTab(tab)"
            :class="[
              'py-4 px-1 border-b-2 font-medium text-sm capitalize',
              activeTab === tab
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300',
            ]"
          >
            {{ tab }}
          </button>
        </nav>
      </div>

      <!-- Tab Content -->
      <div class="p-6">
        <!-- Overview Tab -->
        <div v-if="activeTab === 'overview'" class="space-y-6">
          <!-- Critical Alerts -->
          <div v-if="hardwareStore.criticalAlerts.length > 0">
            <h3 class="text-lg font-semibold mb-4 text-red-600">Critical Alerts</h3>
            <div class="space-y-3">
              <div
                v-for="alert in hardwareStore.criticalAlerts"
                :key="alert.id"
                class="p-4 border border-red-200 bg-red-50 rounded-lg"
              >
                <div class="flex items-center justify-between">
                  <div>
                    <h4 class="font-semibold text-red-800">{{ alert.deviceName }}</h4>
                    <p class="text-sm text-red-700">{{ alert.message }}</p>
                    <p class="text-xs text-red-600 mt-1">{{ formatTimeAgo(alert.timestamp) }}</p>
                  </div>
                  <div class="flex space-x-2">
                    <Button
                      @click="acknowledgeAlert(alert.id)"
                      size="sm"
                      class="bg-yellow-600 hover:bg-yellow-700"
                    >
                      Acknowledge
                    </Button>
                    <Button
                      @click="resolveAlert(alert.id)"
                      size="sm"
                      class="bg-green-600 hover:bg-green-700"
                    >
                      Resolve
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Device Status by Type -->
          <div class="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            <Card v-for="(devices, type) in devicesByType" :key="type">
              <template v-if="devices.length > 0">
              <CardHeader class="pb-3">
                <h3 class="text-lg font-semibold flex items-center capitalize">
                  <component :is="getDeviceIcon(type as any)" class="h-5 w-5 mr-2" />
                  {{ type.replace('_', ' ') }}
                </h3>
              </CardHeader>
              <CardContent>
                <div class="space-y-3">
                  <div
                    v-for="device in devices"
                    :key="device.id"
                    class="flex items-center justify-between p-3 border rounded"
                  >
                    <div>
                      <p class="font-medium">{{ device.name }}</p>
                      <p class="text-sm text-gray-600">{{ device.location }}</p>
                      <p
                        class="text-sm font-mono"
                        :class="isValueInRange(device) ? 'text-green-600' : 'text-red-600'"
                      >
                        {{ formatValue(device) }}
                      </p>
                    </div>
                    <span
                      :class="`px-2 py-1 rounded-full text-xs font-medium ${getDeviceStatusColor(device.status)}`"
                    >
                      {{ device.status.toUpperCase() }}
                    </span>
                  </div>
                </div>
              </CardContent>
              </template>
            </Card>
          </div>

          <!-- Recent Energy Usage -->
          <Card>
            <CardHeader>
              <h3 class="text-lg font-semibold flex items-center">
                <BoltIcon class="h-5 w-5 mr-2" />
                Energy Usage (Last 24 Hours)
              </h3>
            </CardHeader>
            <CardContent>
              <div class="grid grid-cols-3 gap-6 mb-4">
                <div class="text-center">
                  <p class="text-2xl font-bold text-blue-600">
                    {{ recentEnergyUsage.totalUsage.toFixed(1) }} kWh
                  </p>
                  <p class="text-sm text-gray-600">Total Consumption</p>
                </div>
                <div class="text-center">
                  <p class="text-2xl font-bold text-green-600">
                    {{ formatCurrency(recentEnergyUsage.totalCost) }}
                  </p>
                  <p class="text-sm text-gray-600">Total Cost</p>
                </div>
                <div class="text-center">
                  <p class="text-2xl font-bold text-purple-600">
                    {{ recentEnergyUsage.currentDemand.toFixed(1) }} kW
                  </p>
                  <p class="text-sm text-gray-600">Current Demand</p>
                </div>
              </div>

              <!-- Simple energy chart representation -->
              <div class="h-32 bg-gray-50 rounded-lg flex items-end justify-center p-4">
                <div class="flex items-end space-x-1 h-full">
                  <div
                    v-for="(reading, index) in recentEnergyUsage.readings.slice(-12)"
                    :key="index"
                    class="bg-blue-500 rounded-t flex-1 min-w-0"
                    :style="`height: ${Math.max((reading.totalConsumption / 3) * 100, 10)}%`"
                    :title="`${reading.totalConsumption.toFixed(1)} kWh at ${reading.timestamp.toLocaleTimeString()}`"
                  ></div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <!-- Devices Tab -->
        <div v-if="activeTab === 'devices'" class="space-y-6">
          <div class="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            <Card v-for="device in hardwareStore.currentBranchIoTDevices" :key="device.id">
              <CardHeader class="pb-3">
                <div class="flex items-center justify-between">
                  <div class="flex items-center space-x-3">
                    <component :is="getDeviceIcon(device.type)" class="h-6 w-6 text-gray-600" />
                    <div>
                      <h3 class="font-semibold">{{ device.name }}</h3>
                      <p class="text-sm text-gray-600">{{ device.location }}</p>
                    </div>
                  </div>
                  <span
                    :class="`px-2 py-1 rounded-full text-xs font-medium ${getDeviceStatusColor(device.status)}`"
                  >
                    {{ device.status.toUpperCase() }}
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <div class="space-y-3">
                  <div class="text-center p-3 bg-gray-50 rounded">
                    <p
                      class="text-2xl font-bold"
                      :class="isValueInRange(device) ? 'text-green-600' : 'text-red-600'"
                    >
                      {{ formatValue(device) }}
                    </p>
                    <p class="text-xs text-gray-500 mt-1">
                      Updated {{ formatTimeAgo(device.lastReading) }}
                    </p>
                  </div>

                  <div class="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p class="text-gray-600">Model</p>
                      <p class="font-medium">{{ device.model }}</p>
                    </div>
                    <div>
                      <p class="text-gray-600">Firmware</p>
                      <p class="font-medium">{{ device.firmware }}</p>
                    </div>
                  </div>

                  <div class="flex items-center justify-between">
                    <div class="flex items-center space-x-2">
                      <WifiIcon class="h-4 w-4 text-gray-400" />
                      <span class="text-sm">{{ device.signalStrength }}%</span>
                    </div>
                    <div v-if="device.batteryLevel" class="flex items-center space-x-2">
                      <SignalIcon class="h-4 w-4 text-gray-400" />
                      <span class="text-sm">{{ device.batteryLevel }}%</span>
                    </div>
                  </div>

                  <div
                    v-if="device.minThreshold || device.maxThreshold"
                    class="text-xs text-gray-500"
                  >
                    Range: {{ device.minThreshold || '-' }} - {{ device.maxThreshold || '-' }}
                    {{ device.unit }}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <!-- Alerts Tab -->
        <div v-if="activeTab === 'alerts'" class="space-y-6">
          <div class="flex justify-between items-center">
            <h3 class="text-lg font-semibold">Active Alerts</h3>
            <div class="text-sm text-gray-600">
              {{ hardwareStore.unacknowledgedAlerts.length }} unacknowledged
            </div>
          </div>

          <div v-if="hardwareStore.currentBranchIoTAlerts.length === 0" class="text-center py-8">
            <CheckCircleIcon class="h-16 w-16 mx-auto text-green-500 mb-4" />
            <p class="text-xl text-gray-600">No active alerts</p>
            <p class="text-gray-500">All systems are running smoothly</p>
          </div>

          <div v-else class="space-y-3">
            <div
              v-for="alert in hardwareStore.currentBranchIoTAlerts"
              :key="alert.id"
              :class="`p-4 border rounded-lg ${getAlertSeverityColor(alert.severity)}`"
            >
              <div class="flex items-center justify-between">
                <div class="flex-1">
                  <div class="flex items-center space-x-2 mb-1">
                    <h4 class="font-semibold">{{ alert.deviceName }}</h4>
                    <span class="px-2 py-1 bg-white rounded text-xs font-medium capitalize">
                      {{ alert.severity }}
                    </span>
                  </div>
                  <p class="text-sm text-gray-700">{{ alert.message }}</p>
                  <p class="text-xs text-gray-600 mt-1">{{ formatTimeAgo(alert.timestamp) }}</p>
                </div>
                <div v-if="!alert.acknowledged" class="flex space-x-2">
                  <Button @click="acknowledgeAlert(alert.id)" size="sm" variant="outline">
                    Acknowledge
                  </Button>
                  <Button @click="resolveAlert(alert.id)" size="sm"> Resolve </Button>
                </div>
                <div v-else class="text-sm text-green-600 font-medium">
                  {{ alert.resolvedAt ? 'Resolved' : 'Acknowledged' }}
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Energy Tab -->
        <div v-if="activeTab === 'energy'" class="space-y-6">
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardContent class="p-4 text-center">
                <BoltIcon class="h-8 w-8 mx-auto text-blue-600 mb-2" />
                <p class="text-2xl font-bold text-blue-600">
                  {{ recentEnergyUsage.totalUsage.toFixed(1) }}
                </p>
                <p class="text-sm text-gray-600">kWh Today</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent class="p-4 text-center">
                <div
                  class="w-8 h-8 mx-auto bg-green-100 rounded-full flex items-center justify-center mb-2"
                >
                  <span class="text-green-600 font-bold">$</span>
                </div>
                <p class="text-2xl font-bold text-green-600">
                  {{ formatCurrency(recentEnergyUsage.totalCost) }}
                </p>
                <p class="text-sm text-gray-600">Cost Today</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent class="p-4 text-center">
                <div
                  class="w-8 h-8 mx-auto bg-purple-100 rounded-full flex items-center justify-center mb-2"
                >
                  <BoltIcon class="h-5 w-5 text-purple-600" />
                </div>
                <p class="text-2xl font-bold text-purple-600">
                  {{ recentEnergyUsage.currentDemand.toFixed(1) }}
                </p>
                <p class="text-sm text-gray-600">kW Current</p>
              </CardContent>
            </Card>
          </div>

          <!-- Energy Breakdown -->
          <Card>
            <CardHeader>
              <h3 class="text-lg font-semibold">Energy Breakdown</h3>
            </CardHeader>
            <CardContent>
              <div v-if="recentEnergyUsage.readings.length > 0" class="space-y-4">
                <div
                  v-for="(value, category) in recentEnergyUsage.readings[
                    recentEnergyUsage.readings.length - 1
                  ]?.deviceBreakdown || {}"
                  :key="category"
                  class="flex items-center justify-between"
                >
                  <span class="font-medium">{{ category }}</span>
                  <div class="flex items-center space-x-3 flex-1 mx-4">
                    <div class="flex-1 bg-gray-200 rounded-full h-2">
                      <div
                        class="bg-blue-600 h-2 rounded-full"
                        :style="`width: ${(value / 10) * 100}%`"
                      ></div>
                    </div>
                    <span class="text-sm font-medium w-16 text-right"
                      >{{ value.toFixed(1) }} kW</span
                    >
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <!-- Maintenance Tab -->
        <div v-if="activeTab === 'maintenance'" class="space-y-6">
          <div class="flex justify-between items-center">
            <h3 class="text-lg font-semibold">Maintenance Schedule</h3>
            <div class="text-sm text-gray-600">
              {{ hardwareStore.overdueMaintenance.length }} overdue tasks
            </div>
          </div>

          <div class="space-y-4">
            <div
              v-for="schedule in urgentMaintenanceTasks"
              :key="schedule.id"
              :class="[
                'p-4 border rounded-lg',
                schedule.isOverdue ? 'border-red-200 bg-red-50' : 'border-yellow-200 bg-yellow-50',
              ]"
            >
              <div class="flex items-center justify-between">
                <div class="flex-1">
                  <div class="flex items-center space-x-2 mb-1">
                    <h4 class="font-semibold">{{ schedule.taskName }}</h4>
                    <span
                      v-if="schedule.isOverdue"
                      class="px-2 py-1 bg-red-200 text-red-800 rounded text-xs font-medium"
                    >
                      OVERDUE
                    </span>
                    <span
                      v-else
                      class="px-2 py-1 bg-yellow-200 text-yellow-800 rounded text-xs font-medium"
                    >
                      DUE SOON
                    </span>
                  </div>
                  <p class="text-sm text-gray-600">
                    {{ schedule.type.charAt(0).toUpperCase() + schedule.type.slice(1) }} maintenance
                  </p>
                  <p class="text-sm text-gray-600">
                    Due: {{ schedule.nextDue.toLocaleDateString() }} • Duration:
                    {{ schedule.estimatedDuration }} min
                  </p>
                </div>
                <Button
                  @click="completeMaintenance(schedule.id)"
                  :class="
                    schedule.isOverdue
                      ? 'bg-red-600 hover:bg-red-700'
                      : 'bg-yellow-600 hover:bg-yellow-700'
                  "
                >
                  <CheckIcon class="h-4 w-4 mr-2" />
                  Complete
                </Button>
              </div>
            </div>
          </div>

          <!-- All Maintenance Tasks -->
          <Card>
            <CardHeader>
              <h3 class="text-lg font-semibold">All Scheduled Tasks</h3>
            </CardHeader>
            <CardContent>
              <div class="space-y-3">
                <div
                  v-for="schedule in hardwareStore.currentMaintenanceSchedules"
                  :key="schedule.id"
                  class="flex items-center justify-between p-3 border rounded"
                >
                  <div>
                    <p class="font-medium">{{ schedule.taskName }}</p>
                    <p class="text-sm text-gray-600">
                      {{ schedule.type.charAt(0).toUpperCase() + schedule.type.slice(1) }}
                    </p>
                    <p class="text-xs text-gray-500">
                      Next: {{ schedule.nextDue.toLocaleDateString() }}
                    </p>
                  </div>
                  <div class="text-right">
                    <span
                      :class="[
                        'px-2 py-1 rounded text-xs font-medium',
                        schedule.isOverdue
                          ? 'bg-red-100 text-red-800'
                          : schedule.priority === 'high'
                            ? 'bg-orange-100 text-orange-800'
                            : 'bg-green-100 text-green-800',
                      ]"
                    >
                      {{ schedule.isOverdue ? 'OVERDUE' : schedule.priority.toUpperCase() }}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  </div>
</template>
