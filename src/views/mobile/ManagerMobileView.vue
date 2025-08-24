<script setup lang="ts">
import { ref, computed } from 'vue'
import { useAnalyticsStore } from '@/stores/analytics'
import { useEmployeeStore } from '@/stores/employees'
import { useSalesStore } from '@/stores/sales'
import { useInventoryStore } from '@/stores/inventory'
import { useBranchesStore } from '@/stores/branches'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import {
  ChartBarIcon,
  UsersIcon,
  ExclamationTriangleIcon,
  CurrencyDollarIcon,
  ClockIcon,
  BellIcon,
  CogIcon,
  EyeIcon,
  CheckCircleIcon,
  XCircleIcon,
} from '@heroicons/vue/24/outline'

const analyticsStore = useAnalyticsStore()
const employeeStore = useEmployeeStore()
const salesStore = useSalesStore()
const inventoryStore = useInventoryStore()
const branchesStore = useBranchesStore()

const currentTab = ref('dashboard')

// Computed
const todaysMetrics = computed(() => ({
  sales: salesStore.todaysSales,
  orders: salesStore.todaysOrders,
  staffOnDuty: employeeStore.currentlyWorking.length,
  averageOrderValue: salesStore.todaysSales / Math.max(salesStore.todaysOrders, 1),
}))

const criticalAlerts = computed(() => [
  ...inventoryStore.criticalAlerts.map((alert) => ({
    id: alert.id,
    type: 'inventory',
    priority: 'high',
    message: alert.message,
    time: new Date().toLocaleTimeString(),
  })),
  ...employeeStore.pendingRequests.slice(0, 3).map((request) => ({
    id: request.id,
    type: 'staff',
    priority: 'medium',
    message: `${request.type.replace('_', ' ')} request pending`,
    time: request.requestDate.toLocaleTimeString(),
  })),
])

const todaysStaff = computed(() => {
  return employeeStore.todaysSchedule.map((schedule) => {
    const employee = employeeStore.employees.find((emp) => emp.id === schedule.employeeId)
    const timeEntry = employeeStore.timeEntries.find(
      (entry) =>
        entry.employeeId === schedule.employeeId &&
        entry.date.toDateString() === new Date().toDateString(),
    )
    return {
      schedule,
      employee,
      timeEntry,
      status: getEmployeeStatus(schedule.employeeId),
    }
  })
})

const realtimeOrders = computed(() => [
  {
    id: 'order-1',
    customer: 'John D.',
    items: ['Cappuccino', 'Croissant'],
    total: 12.5,
    status: 'preparing',
    timeOrdered: new Date(Date.now() - 5 * 60 * 1000),
    estimatedReady: new Date(Date.now() + 3 * 60 * 1000),
  },
  {
    id: 'order-2',
    customer: 'Sarah M.',
    items: ['Latte', 'Muffin'],
    total: 8.75,
    status: 'ready',
    timeOrdered: new Date(Date.now() - 12 * 60 * 1000),
    estimatedReady: new Date(Date.now() - 2 * 60 * 1000),
  },
  {
    id: 'order-3',
    customer: 'Mike C.',
    items: ['Americano'],
    total: 4.5,
    status: 'pending',
    timeOrdered: new Date(Date.now() - 2 * 60 * 1000),
    estimatedReady: new Date(Date.now() + 8 * 60 * 1000),
  },
])

const performanceData = computed(() => ({
  salesVsTarget: (todaysMetrics.value.sales / 1000) * 100, // Target: $1000
  ordersVsTarget: (todaysMetrics.value.orders / 80) * 100, // Target: 80 orders
  staffEfficiency: 87.5, // Mock data
  customerSatisfaction: 4.6,
}))

// Functions
function getEmployeeStatus(employeeId: string) {
  const timeEntry = employeeStore.timeEntries.find(
    (entry) =>
      entry.employeeId === employeeId &&
      entry.date.toDateString() === new Date().toDateString() &&
      entry.status === 'clocked_in',
  )

  if (timeEntry) {
    return timeEntry.status === 'on_break' ? 'On Break' : 'Working'
  }

  const todaySchedule = employeeStore.todaysSchedule.find((s) => s.employeeId === employeeId)
  if (todaySchedule) {
    const now = new Date()
    const [startHour, startMin] = todaySchedule.startTime.split(':').map(Number)
    const [endHour, endMin] = todaySchedule.endTime.split(':').map(Number)

    const startTime = new Date()
    startTime.setHours(startHour, startMin, 0, 0)
    const endTime = new Date()
    endTime.setHours(endHour, endMin, 0, 0)

    if (now >= startTime && now <= endTime) {
      return 'Scheduled'
    }
  }

  return 'Off Duty'
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount)
}

function formatTime(date: Date) {
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
}

function getStatusColor(status: string) {
  const colors = {
    Working: 'text-green-600 bg-green-100',
    'On Break': 'text-yellow-600 bg-yellow-100',
    Scheduled: 'text-blue-600 bg-blue-100',
    'Off Duty': 'text-gray-600 bg-gray-100',
    preparing: 'text-orange-600 bg-orange-100',
    ready: 'text-green-600 bg-green-100',
    pending: 'text-blue-600 bg-blue-100',
  }
  return colors[status as keyof typeof colors] || 'text-gray-600 bg-gray-100'
}

function getAlertColor(priority: string) {
  const colors = {
    high: 'border-red-200 bg-red-50',
    medium: 'border-yellow-200 bg-yellow-50',
    low: 'border-blue-200 bg-blue-50',
  }
  return colors[priority as keyof typeof colors] || 'border-gray-200 bg-gray-50'
}

function approveRequest(requestId: string) {
  employeeStore.approveShiftRequest(requestId, 'Approved via mobile')
}

function denyRequest(requestId: string) {
  employeeStore.denyShiftRequest(requestId, 'Denied via mobile')
}

function changeTab(tab: string) {
  currentTab.value = tab
}
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Header -->
    <div class="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-4 sticky top-0 z-10">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-xl font-bold">Manager Dashboard</h1>
          <p class="text-sm text-purple-100">{{ branchesStore.selectedBranch?.name }}</p>
        </div>
        <div class="flex items-center space-x-3">
          <div class="relative">
            <BellIcon class="h-6 w-6" />
            <span
              v-if="criticalAlerts.length > 0"
              class="absolute -top-1 -right-1 bg-red-500 text-xs rounded-full w-4 h-4 flex items-center justify-center"
            >
              {{ criticalAlerts.length }}
            </span>
          </div>
          <CogIcon class="h-6 w-6" />
        </div>
      </div>
    </div>

    <!-- Quick Stats -->
    <div class="p-4">
      <div class="grid grid-cols-2 gap-3 mb-4">
        <Card>
          <CardContent class="p-4 text-center">
            <CurrencyDollarIcon class="h-6 w-6 mx-auto text-green-600 mb-2" />
            <p class="text-2xl font-bold text-green-600">
              {{ formatCurrency(todaysMetrics.sales) }}
            </p>
            <p class="text-xs text-gray-600">Today's Sales</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent class="p-4 text-center">
            <ChartBarIcon class="h-6 w-6 mx-auto text-blue-600 mb-2" />
            <p class="text-2xl font-bold text-blue-600">{{ todaysMetrics.orders }}</p>
            <p class="text-xs text-gray-600">Orders Today</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent class="p-4 text-center">
            <UsersIcon class="h-6 w-6 mx-auto text-purple-600 mb-2" />
            <p class="text-2xl font-bold text-purple-600">{{ todaysMetrics.staffOnDuty }}</p>
            <p class="text-xs text-gray-600">Staff On Duty</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent class="p-4 text-center">
            <ClockIcon class="h-6 w-6 mx-auto text-orange-600 mb-2" />
            <p class="text-2xl font-bold text-orange-600">
              {{ formatCurrency(todaysMetrics.averageOrderValue) }}
            </p>
            <p class="text-xs text-gray-600">Avg Order Value</p>
          </CardContent>
        </Card>
      </div>
    </div>

    <!-- Main Content -->
    <div class="pb-20">
      <!-- Dashboard Tab -->
      <div v-if="currentTab === 'dashboard'" class="px-4 space-y-4">
        <!-- Critical Alerts -->
        <Card v-if="criticalAlerts.length > 0">
          <CardHeader class="pb-3">
            <h3 class="text-lg font-semibold flex items-center">
              <ExclamationTriangleIcon class="h-5 w-5 mr-2 text-red-500" />
              Critical Alerts
            </h3>
          </CardHeader>
          <CardContent>
            <div class="space-y-2">
              <div
                v-for="alert in criticalAlerts"
                :key="alert.id"
                :class="`p-3 border rounded-lg ${getAlertColor(alert.priority)}`"
              >
                <div class="flex items-center justify-between">
                  <div class="flex-1">
                    <p class="font-medium text-sm">{{ alert.message }}</p>
                    <p class="text-xs text-gray-600">{{ alert.time }}</p>
                  </div>
                  <span class="px-2 py-1 rounded text-xs font-medium bg-white">
                    {{ alert.type.toUpperCase() }}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <!-- Performance Overview -->
        <Card>
          <CardHeader class="pb-3">
            <h3 class="text-lg font-semibold">Performance Overview</h3>
          </CardHeader>
          <CardContent>
            <div class="space-y-4">
              <div>
                <div class="flex justify-between text-sm mb-1">
                  <span>Sales vs Target</span>
                  <span>{{ Math.round(performanceData.salesVsTarget) }}%</span>
                </div>
                <div class="w-full bg-gray-200 rounded-full h-2">
                  <div
                    class="bg-green-500 h-2 rounded-full"
                    :style="`width: ${Math.min(performanceData.salesVsTarget, 100)}%`"
                  ></div>
                </div>
              </div>

              <div>
                <div class="flex justify-between text-sm mb-1">
                  <span>Orders vs Target</span>
                  <span>{{ Math.round(performanceData.ordersVsTarget) }}%</span>
                </div>
                <div class="w-full bg-gray-200 rounded-full h-2">
                  <div
                    class="bg-blue-500 h-2 rounded-full"
                    :style="`width: ${Math.min(performanceData.ordersVsTarget, 100)}%`"
                  ></div>
                </div>
              </div>

              <div>
                <div class="flex justify-between text-sm mb-1">
                  <span>Staff Efficiency</span>
                  <span>{{ performanceData.staffEfficiency }}%</span>
                </div>
                <div class="w-full bg-gray-200 rounded-full h-2">
                  <div
                    class="bg-purple-500 h-2 rounded-full"
                    :style="`width: ${performanceData.staffEfficiency}%`"
                  ></div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <!-- Recent Orders -->
        <Card>
          <CardHeader class="pb-3">
            <h3 class="text-lg font-semibold">Live Orders</h3>
          </CardHeader>
          <CardContent>
            <div class="space-y-3">
              <div
                v-for="order in realtimeOrders"
                :key="order.id"
                class="flex items-center justify-between p-3 border rounded-lg"
              >
                <div class="flex-1">
                  <div class="flex items-center justify-between mb-1">
                    <span class="font-medium">{{ order.customer }}</span>
                    <span
                      :class="`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`"
                    >
                      {{ order.status.charAt(0).toUpperCase() + order.status.slice(1) }}
                    </span>
                  </div>
                  <p class="text-sm text-gray-600">{{ order.items.join(', ') }}</p>
                  <div class="flex items-center justify-between mt-1">
                    <span class="text-sm font-medium">{{ formatCurrency(order.total) }}</span>
                    <span class="text-xs text-gray-500">
                      {{
                        order.status === 'ready'
                          ? 'Ready now'
                          : `Ready ${formatTime(order.estimatedReady)}`
                      }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <!-- Staff Tab -->
      <div v-if="currentTab === 'staff'" class="px-4 space-y-4">
        <Card>
          <CardHeader class="pb-3">
            <h3 class="text-lg font-semibold">Today's Staff</h3>
          </CardHeader>
          <CardContent>
            <div class="space-y-3">
              <div
                v-for="staff in todaysStaff"
                :key="staff.schedule.id"
                class="flex items-center justify-between p-3 border rounded-lg"
              >
                <div class="flex items-center space-x-3">
                  <div
                    class="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold"
                  >
                    {{ staff.employee?.firstName?.charAt(0)
                    }}{{ staff.employee?.lastName?.charAt(0) }}
                  </div>
                  <div>
                    <p class="font-medium">
                      {{ staff.employee?.firstName }} {{ staff.employee?.lastName }}
                    </p>
                    <p class="text-sm text-gray-600">
                      {{ formatTime(new Date(`2000-01-01T${staff.schedule.startTime}`)) }} -
                      {{ formatTime(new Date(`2000-01-01T${staff.schedule.endTime}`)) }}
                    </p>
                  </div>
                </div>
                <span
                  :class="`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(staff.status)}`"
                >
                  {{ staff.status }}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <!-- Pending Requests -->
        <Card v-if="employeeStore.pendingRequests.length > 0">
          <CardHeader class="pb-3">
            <h3 class="text-lg font-semibold">Pending Requests</h3>
          </CardHeader>
          <CardContent>
            <div class="space-y-3">
              <div
                v-for="request in employeeStore.pendingRequests"
                :key="request.id"
                class="p-3 border rounded-lg"
              >
                <div class="flex items-center justify-between mb-2">
                  <span class="font-medium">{{
                    request.type.replace('_', ' ').toUpperCase()
                  }}</span>
                  <span class="text-xs text-gray-500">{{
                    request.requestDate.toLocaleDateString()
                  }}</span>
                </div>
                <p class="text-sm text-gray-600 mb-3">{{ request.reason }}</p>
                <div class="flex space-x-2">
                  <Button
                    @click="approveRequest(request.id)"
                    class="flex-1 h-8 text-sm bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircleIcon class="h-4 w-4 mr-1" />
                    Approve
                  </Button>
                  <Button
                    @click="denyRequest(request.id)"
                    class="flex-1 h-8 text-sm bg-red-600 hover:bg-red-700"
                  >
                    <XCircleIcon class="h-4 w-4 mr-1" />
                    Deny
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <!-- Analytics Tab -->
      <div v-if="currentTab === 'analytics'" class="px-4 space-y-4">
        <Card>
          <CardHeader class="pb-3">
            <h3 class="text-lg font-semibold">Key Metrics</h3>
          </CardHeader>
          <CardContent>
            <div class="grid grid-cols-2 gap-4">
              <div class="text-center p-3 bg-blue-50 rounded-lg">
                <p class="text-lg font-bold text-blue-600">
                  {{ formatCurrency(todaysMetrics.sales) }}
                </p>
                <p class="text-xs text-blue-600">Today's Sales</p>
              </div>
              <div class="text-center p-3 bg-green-50 rounded-lg">
                <p class="text-lg font-bold text-green-600">{{ todaysMetrics.orders }}</p>
                <p class="text-xs text-green-600">Orders</p>
              </div>
              <div class="text-center p-3 bg-purple-50 rounded-lg">
                <p class="text-lg font-bold text-purple-600">
                  {{ formatCurrency(todaysMetrics.averageOrderValue) }}
                </p>
                <p class="text-xs text-purple-600">Avg Order</p>
              </div>
              <div class="text-center p-3 bg-yellow-50 rounded-lg">
                <p class="text-lg font-bold text-yellow-600">
                  {{ performanceData.customerSatisfaction }}
                </p>
                <p class="text-xs text-yellow-600">Rating</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader class="pb-3">
            <h3 class="text-lg font-semibold">Performance Trends</h3>
          </CardHeader>
          <CardContent>
            <div class="space-y-4">
              <div class="text-center py-8 bg-gray-50 rounded-lg">
                <ChartBarIcon class="h-12 w-12 mx-auto text-gray-400 mb-2" />
                <p class="text-gray-600">Analytics Chart</p>
                <p class="text-sm text-gray-500">View detailed analytics in desktop app</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <!-- Operations Tab -->
      <div v-if="currentTab === 'operations'" class="px-4 space-y-4">
        <Card>
          <CardHeader class="pb-3">
            <h3 class="text-lg font-semibold">Inventory Alerts</h3>
          </CardHeader>
          <CardContent>
            <div class="space-y-3">
              <div
                v-if="inventoryStore.lowStockItems.length === 0"
                class="text-center py-4 text-gray-500"
              >
                <CheckCircleIcon class="h-8 w-8 mx-auto mb-2 text-green-500" />
                <p>All inventory levels are good</p>
              </div>
              <div
                v-for="item in inventoryStore.lowStockItems.slice(0, 5)"
                :key="item.id"
                class="flex items-center justify-between p-3 border border-red-200 bg-red-50 rounded-lg"
              >
                <div>
                  <p class="font-medium text-red-800">{{ item.name }}</p>
                  <p class="text-sm text-red-600">
                    {{ item.currentStock }} {{ item.unit }} remaining
                  </p>
                </div>
                <span class="px-2 py-1 bg-red-200 text-red-800 rounded text-xs font-medium">
                  LOW STOCK
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader class="pb-3">
            <h3 class="text-lg font-semibold">Equipment Status</h3>
          </CardHeader>
          <CardContent>
            <div class="space-y-3">
              <div class="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p class="font-medium">Espresso Machine #1</p>
                  <p class="text-sm text-gray-600">Last maintenance: 3 days ago</p>
                </div>
                <span class="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-medium">
                  OPERATIONAL
                </span>
              </div>

              <div class="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p class="font-medium">Coffee Grinder #2</p>
                  <p class="text-sm text-gray-600">Maintenance due in 2 days</p>
                </div>
                <span class="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs font-medium">
                  ATTENTION
                </span>
              </div>

              <div class="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p class="font-medium">Refrigerator #1</p>
                  <p class="text-sm text-gray-600">Temperature: 38°F</p>
                </div>
                <span class="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-medium">
                  OPTIMAL
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>

    <!-- Bottom Navigation -->
    <div class="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200">
      <div class="grid grid-cols-4 h-16">
        <button
          @click="changeTab('dashboard')"
          :class="[
            'flex flex-col items-center justify-center space-y-1',
            currentTab === 'dashboard' ? 'text-blue-600 bg-blue-50' : 'text-gray-600',
          ]"
        >
          <ChartBarIcon class="h-5 w-5" />
          <span class="text-xs">Dashboard</span>
        </button>

        <button
          @click="changeTab('staff')"
          :class="[
            'flex flex-col items-center justify-center space-y-1',
            currentTab === 'staff' ? 'text-blue-600 bg-blue-50' : 'text-gray-600',
          ]"
        >
          <UsersIcon class="h-5 w-5" />
          <span class="text-xs">Staff</span>
        </button>

        <button
          @click="changeTab('analytics')"
          :class="[
            'flex flex-col items-center justify-center space-y-1',
            currentTab === 'analytics' ? 'text-blue-600 bg-blue-50' : 'text-gray-600',
          ]"
        >
          <EyeIcon class="h-5 w-5" />
          <span class="text-xs">Analytics</span>
        </button>

        <button
          @click="changeTab('operations')"
          :class="[
            'flex flex-col items-center justify-center space-y-1',
            currentTab === 'operations' ? 'text-blue-600 bg-blue-50' : 'text-gray-600',
          ]"
        >
          <CogIcon class="h-5 w-5" />
          <span class="text-xs">Operations</span>
        </button>
      </div>
    </div>
  </div>
</template>
