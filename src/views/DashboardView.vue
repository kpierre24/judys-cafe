<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { Card, CardHeader, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

const authStore = useAuthStore()

// Mock data - in real app, this would come from an API
const dashboardData = ref({
  todaySales: 1250.5,
  todayOrders: 89,
  lowStockItems: 12,
  totalRevenue: 45280.75,
  recentOrders: [
    { id: 'ORD-001', customer: 'John Doe', amount: 25.5, time: '10:30 AM', status: 'completed' },
    { id: 'ORD-002', customer: 'Jane Smith', amount: 18.75, time: '10:25 AM', status: 'preparing' },
    { id: 'ORD-003', customer: 'Bob Wilson', amount: 32.0, time: '10:20 AM', status: 'completed' },
    {
      id: 'ORD-004',
      customer: 'Alice Brown',
      amount: 14.25,
      time: '10:15 AM',
      status: 'completed',
    },
  ],
  topProducts: [
    { name: 'Cappuccino', sold: 45, revenue: 337.5 },
    { name: 'Croissant', sold: 32, revenue: 160.0 },
    { name: 'Americano', sold: 28, revenue: 168.0 },
    { name: 'Latte', sold: 25, revenue: 187.5 },
  ],
  lowStockProducts: [
    { name: 'Coffee Beans (Arabica)', current: 5, minimum: 20, unit: 'kg' },
    { name: 'Milk', current: 8, minimum: 15, unit: 'liters' },
    { name: 'Sugar', current: 2, minimum: 10, unit: 'kg' },
    { name: 'Croissants', current: 12, minimum: 30, unit: 'pieces' },
  ],
})

const currentTime = ref(new Date())

onMounted(() => {
  // Update time every minute
  setInterval(() => {
    currentTime.value = new Date()
  }, 60000)
})

const greeting = computed(() => {
  const hour = currentTime.value.getHours()
  if (hour < 12) return 'Good Morning'
  if (hour < 18) return 'Good Afternoon'
  return 'Good Evening'
})

function getStatusColor(status: string) {
  const colors = {
    completed: 'text-green-600',
    preparing: 'text-yellow-600',
    pending: 'text-blue-600',
    cancelled: 'text-red-600',
  }
  return colors[status as keyof typeof colors] || 'text-gray-600'
}
</script>

<template>
  <div class="space-y-6">
    <!-- Welcome Header -->
    <div class="flex justify-between items-start">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">
          {{ greeting }}, {{ authStore.user?.name }}!
        </h1>
        <p class="text-gray-600">Here's what's happening at Judy's Cafe today</p>
      </div>
      <div class="text-right">
        <p class="text-sm text-gray-500">{{ currentTime.toLocaleDateString() }}</p>
        <p class="text-sm text-gray-500">{{ currentTime.toLocaleTimeString() }}</p>
      </div>
    </div>

    <!-- Key Metrics Cards -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <Card>
        <CardContent class="p-6">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-gray-600">Today's Sales</p>
              <p class="text-2xl font-bold text-green-600">
                ${{ dashboardData.todaySales.toFixed(2) }}
              </p>
            </div>
            <div class="text-3xl">💰</div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent class="p-6">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-gray-600">Orders Today</p>
              <p class="text-2xl font-bold text-blue-600">{{ dashboardData.todayOrders }}</p>
            </div>
            <div class="text-3xl">📋</div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent class="p-6">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-gray-600">Low Stock Items</p>
              <p class="text-2xl font-bold text-orange-600">{{ dashboardData.lowStockItems }}</p>
            </div>
            <div class="text-3xl">⚠️</div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent class="p-6">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-gray-600">Total Revenue</p>
              <p class="text-2xl font-bold text-purple-600">
                ${{ dashboardData.totalRevenue.toFixed(2) }}
              </p>
            </div>
            <div class="text-3xl">📈</div>
          </div>
        </CardContent>
      </Card>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Recent Orders -->
      <Card>
        <CardHeader>
          <h3 class="text-lg font-semibold">Recent Orders</h3>
        </CardHeader>
        <CardContent class="space-y-4">
          <div
            v-for="order in dashboardData.recentOrders"
            :key="order.id"
            class="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
          >
            <div class="flex-1">
              <p class="font-medium">{{ order.customer }}</p>
              <p class="text-sm text-gray-600">{{ order.id }} • {{ order.time }}</p>
            </div>
            <div class="text-right">
              <p class="font-semibold">${{ order.amount.toFixed(2) }}</p>
              <p :class="['text-sm capitalize', getStatusColor(order.status)]">
                {{ order.status }}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <!-- Top Products -->
      <Card>
        <CardHeader>
          <h3 class="text-lg font-semibold">Top Products Today</h3>
        </CardHeader>
        <CardContent class="space-y-4">
          <div
            v-for="(product, index) in dashboardData.topProducts"
            :key="product.name"
            class="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
          >
            <div class="flex items-center space-x-3">
              <span
                class="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-bold"
              >
                {{ index + 1 }}
              </span>
              <div>
                <p class="font-medium">{{ product.name }}</p>
                <p class="text-sm text-gray-600">{{ product.sold }} sold</p>
              </div>
            </div>
            <p class="font-semibold text-green-600">${{ product.revenue.toFixed(2) }}</p>
          </div>
        </CardContent>
      </Card>
    </div>

    <!-- Low Stock Alert -->
    <Card v-if="dashboardData.lowStockProducts.length > 0" class="border-orange-200">
      <CardHeader>
        <h3 class="text-lg font-semibold text-orange-600 flex items-center">
          <span class="mr-2">⚠️</span>
          Low Stock Alert
        </h3>
      </CardHeader>
      <CardContent>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div
            v-for="item in dashboardData.lowStockProducts"
            :key="item.name"
            class="flex items-center justify-between p-3 bg-orange-50 rounded-lg"
          >
            <div>
              <p class="font-medium">{{ item.name }}</p>
              <p class="text-sm text-gray-600">Current: {{ item.current }} {{ item.unit }}</p>
            </div>
            <div class="text-right">
              <p class="text-sm text-orange-600">Min: {{ item.minimum }} {{ item.unit }}</p>
              <Button variant="outline" size="sm" class="mt-1"> Reorder </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>

    <!-- Quick Actions -->
    <Card>
      <CardHeader>
        <h3 class="text-lg font-semibold">Quick Actions</h3>
      </CardHeader>
      <CardContent>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Button variant="outline" class="h-20 flex flex-col items-center space-y-2">
            <span class="text-2xl">🛒</span>
            <span class="text-sm">New Sale</span>
          </Button>
          <Button variant="outline" class="h-20 flex flex-col items-center space-y-2">
            <span class="text-2xl">📦</span>
            <span class="text-sm">Add Stock</span>
          </Button>
          <Button variant="outline" class="h-20 flex flex-col items-center space-y-2">
            <span class="text-2xl">📊</span>
            <span class="text-sm">View Reports</span>
          </Button>
          <Button variant="outline" class="h-20 flex flex-col items-center space-y-2">
            <span class="text-2xl">🏪</span>
            <span class="text-sm">Manage Branch</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  </div>
</template>
