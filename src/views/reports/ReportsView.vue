<script setup lang="ts">
import { ref, computed } from 'vue'
import { Card, CardHeader, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'

// Mock data for reports
const selectedPeriod = ref('today')
const selectedReport = ref('sales')

// Mock sales data
const salesData = {
  today: {
    totalSales: 1250.5,
    totalOrders: 89,
    averageOrder: 14.05,
    topProducts: [
      { name: 'Cappuccino', quantity: 45, revenue: 202.5 },
      { name: 'Americano', quantity: 32, revenue: 112.0 },
      { name: 'Latte', quantity: 28, revenue: 133.0 },
      { name: 'Croissant', quantity: 25, revenue: 87.5 },
    ],
    hourlyBreakdown: [
      { hour: '7:00', sales: 125.5, orders: 8 },
      { hour: '8:00', sales: 203.75, orders: 14 },
      { hour: '9:00', sales: 156.25, orders: 11 },
      { hour: '10:00', sales: 189.0, orders: 13 },
      { hour: '11:00', sales: 234.5, orders: 16 },
      { hour: '12:00', sales: 198.75, orders: 12 },
      { hour: '13:00', sales: 142.75, orders: 9 },
    ],
  },
  week: {
    totalSales: 8750.25,
    totalOrders: 623,
    averageOrder: 14.05,
    topProducts: [
      { name: 'Cappuccino', quantity: 315, revenue: 1417.5 },
      { name: 'Americano', quantity: 224, revenue: 784.0 },
      { name: 'Latte', quantity: 196, revenue: 931.0 },
      { name: 'Croissant', quantity: 175, revenue: 612.5 },
    ],
  },
  month: {
    totalSales: 37500.0,
    totalOrders: 2670,
    averageOrder: 14.04,
    topProducts: [
      { name: 'Cappuccino', quantity: 1350, revenue: 6075.0 },
      { name: 'Americano', quantity: 960, revenue: 3360.0 },
      { name: 'Latte', quantity: 840, revenue: 3990.0 },
      { name: 'Croissant', quantity: 750, revenue: 2625.0 },
    ],
  },
}

// Mock inventory data
const inventoryData = {
  lowStockItems: 12,
  totalValue: 15750.25,
  categories: [
    { name: 'Coffee', items: 8, value: 3250.0 },
    { name: 'Pastry', items: 15, value: 2100.5 },
    { name: 'Ingredients', items: 25, value: 8900.75 },
    { name: 'Supplies', items: 18, value: 1499.0 },
  ],
  movements: [
    { date: '2024-08-23', type: 'Stock In', item: 'Coffee Beans', quantity: 50, cost: 775.0 },
    { date: '2024-08-22', type: 'Stock Out', item: 'Milk', quantity: -20, cost: -24.0 },
    { date: '2024-08-21', type: 'Stock In', item: 'Sugar', quantity: 25, cost: 20.0 },
  ],
}

// Mock financial data
const financialData = {
  revenue: 37500.0,
  costs: 18750.0,
  profit: 18750.0,
  profitMargin: 50.0,
  expenses: [
    { category: 'Inventory', amount: 12500.0, percentage: 66.7 },
    { category: 'Staff', amount: 4500.0, percentage: 24.0 },
    { category: 'Utilities', amount: 1250.0, percentage: 6.7 },
    { category: 'Other', amount: 500.0, percentage: 2.7 },
  ],
}

const periodOptions = [
  { value: 'today', label: 'Today' },
  { value: 'week', label: 'This Week' },
  { value: 'month', label: 'This Month' },
]

const reportOptions = [
  { value: 'sales', label: 'Sales Report' },
  { value: 'inventory', label: 'Inventory Report' },
  { value: 'financial', label: 'Financial Report' },
]

const currentSalesData = computed(() => {
  return salesData[selectedPeriod.value as keyof typeof salesData] || salesData.today
})

function exportReport() {
  // In a real app, this would generate and download a PDF/Excel file
  alert(`Exporting ${selectedReport.value} report for ${selectedPeriod.value}...`)
}

function printReport() {
  window.print()
}
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex justify-between items-start">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
        <p class="text-gray-600">View detailed insights and generate reports</p>
      </div>

      <div class="flex gap-3">
        <Button @click="exportReport" variant="outline"> 📄 Export </Button>
        <Button @click="printReport" variant="outline"> 🖨️ Print </Button>
      </div>
    </div>

    <!-- Filters -->
    <Card>
      <CardContent class="p-6">
        <div class="flex gap-4">
          <div class="w-48">
            <label class="block text-sm font-medium text-gray-700 mb-2">Report Type</label>
            <Select v-model="selectedReport" :options="reportOptions" />
          </div>
          <div class="w-48">
            <label class="block text-sm font-medium text-gray-700 mb-2">Time Period</label>
            <Select v-model="selectedPeriod" :options="periodOptions" />
          </div>
        </div>
      </CardContent>
    </Card>

    <!-- Sales Report -->
    <div v-if="selectedReport === 'sales'" class="space-y-6">
      <!-- Sales Summary -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent class="p-6">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm font-medium text-gray-600">Total Sales</p>
                <p class="text-2xl font-bold text-green-600">
                  ${{ currentSalesData.totalSales.toFixed(2) }}
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
                <p class="text-sm font-medium text-gray-600">Total Orders</p>
                <p class="text-2xl font-bold text-blue-600">{{ currentSalesData.totalOrders }}</p>
              </div>
              <div class="text-3xl">📋</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent class="p-6">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm font-medium text-gray-600">Average Order</p>
                <p class="text-2xl font-bold text-purple-600">
                  ${{ currentSalesData.averageOrder.toFixed(2) }}
                </p>
              </div>
              <div class="text-3xl">📊</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent class="p-6">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm font-medium text-gray-600">Growth Rate</p>
                <p class="text-2xl font-bold text-emerald-600">+12.5%</p>
              </div>
              <div class="text-3xl">📈</div>
            </div>
          </CardContent>
        </Card>
      </div>

      <!-- Top Products -->
      <Card>
        <CardHeader>
          <h3 class="text-lg font-semibold">Top Selling Products</h3>
        </CardHeader>
        <CardContent>
          <div class="space-y-4">
            <div
              v-for="(product, index) in currentSalesData.topProducts"
              :key="product.name"
              class="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
            >
              <div class="flex items-center space-x-4">
                <div
                  class="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold"
                >
                  {{ index + 1 }}
                </div>
                <div>
                  <h4 class="font-medium">{{ product.name }}</h4>
                  <p class="text-sm text-gray-600">{{ product.quantity }} sold</p>
                </div>
              </div>
              <div class="text-right">
                <p class="font-bold text-green-600">${{ (product.revenue ?? 0).toFixed(2) }}</p>
                <p class="text-sm text-gray-600">
                  ${{ ((product.revenue ?? 0) / product.quantity).toFixed(2) }}/unit
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <!-- Hourly Breakdown (Today only) -->
      <Card v-if="selectedPeriod === 'today'">
        <CardHeader>
          <h3 class="text-lg font-semibold">Hourly Sales Breakdown</h3>
        </CardHeader>
        <CardContent>
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div
              v-for="hour in (currentSalesData as any).hourlyBreakdown || []"
              :key="hour.hour"
              class="bg-gray-50 p-4 rounded-lg"
            >
              <div class="text-center">
                <p class="font-medium text-sm">{{ hour.hour }}</p>
                <p class="text-xl font-bold text-green-600">${{ hour.sales.toFixed(0) }}</p>
                <p class="text-xs text-gray-600">{{ hour.orders }} orders</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>

    <!-- Inventory Report -->
    <div v-if="selectedReport === 'inventory'" class="space-y-6">
      <!-- Inventory Summary -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent class="p-6">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm font-medium text-gray-600">Total Value</p>
                <p class="text-2xl font-bold text-green-600">
                  ${{ inventoryData.totalValue.toFixed(2) }}
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
                <p class="text-sm font-medium text-gray-600">Low Stock Items</p>
                <p class="text-2xl font-bold text-orange-600">{{ inventoryData.lowStockItems }}</p>
              </div>
              <div class="text-3xl">⚠️</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent class="p-6">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm font-medium text-gray-600">Categories</p>
                <p class="text-2xl font-bold text-blue-600">
                  {{ inventoryData.categories.length }}
                </p>
              </div>
              <div class="text-3xl">📦</div>
            </div>
          </CardContent>
        </Card>
      </div>

      <!-- Category Breakdown -->
      <Card>
        <CardHeader>
          <h3 class="text-lg font-semibold">Inventory by Category</h3>
        </CardHeader>
        <CardContent>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div
              v-for="category in inventoryData.categories"
              :key="category.name"
              class="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
            >
              <div>
                <h4 class="font-medium">{{ category.name }}</h4>
                <p class="text-sm text-gray-600">{{ category.items }} items</p>
              </div>
              <div class="text-right">
                <p class="font-bold text-green-600">${{ category.value.toFixed(2) }}</p>
                <p class="text-sm text-gray-600">
                  {{ ((category.value / inventoryData.totalValue) * 100).toFixed(1) }}%
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <!-- Recent Movements -->
      <Card>
        <CardHeader>
          <h3 class="text-lg font-semibold">Recent Stock Movements</h3>
        </CardHeader>
        <CardContent>
          <div class="space-y-3">
            <div
              v-for="movement in inventoryData.movements"
              :key="movement.date + movement.item"
              class="flex items-center justify-between p-3 border rounded-lg"
            >
              <div class="flex items-center space-x-3">
                <div
                  :class="[
                    'w-3 h-3 rounded-full',
                    movement.type === 'Stock In' ? 'bg-green-500' : 'bg-red-500',
                  ]"
                ></div>
                <div>
                  <p class="font-medium text-sm">{{ movement.item }}</p>
                  <p class="text-xs text-gray-600">{{ movement.date }}</p>
                </div>
              </div>
              <div class="text-right">
                <p
                  :class="[
                    'font-medium text-sm',
                    movement.quantity > 0 ? 'text-green-600' : 'text-red-600',
                  ]"
                >
                  {{ movement.quantity > 0 ? '+' : '' }}{{ movement.quantity }}
                </p>
                <p :class="['text-xs', movement.cost > 0 ? 'text-green-600' : 'text-red-600']">
                  ${{ Math.abs(movement.cost).toFixed(2) }}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>

    <!-- Financial Report -->
    <div v-if="selectedReport === 'financial'" class="space-y-6">
      <!-- Financial Summary -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent class="p-6">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm font-medium text-gray-600">Revenue</p>
                <p class="text-2xl font-bold text-green-600">
                  ${{ financialData.revenue.toFixed(2) }}
                </p>
              </div>
              <div class="text-3xl">💵</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent class="p-6">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm font-medium text-gray-600">Costs</p>
                <p class="text-2xl font-bold text-red-600">${{ financialData.costs.toFixed(2) }}</p>
              </div>
              <div class="text-3xl">📉</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent class="p-6">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm font-medium text-gray-600">Profit</p>
                <p class="text-2xl font-bold text-blue-600">
                  ${{ financialData.profit.toFixed(2) }}
                </p>
              </div>
              <div class="text-3xl">🎆</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent class="p-6">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm font-medium text-gray-600">Profit Margin</p>
                <p class="text-2xl font-bold text-purple-600">
                  {{ financialData.profitMargin.toFixed(1) }}%
                </p>
              </div>
              <div class="text-3xl">📊</div>
            </div>
          </CardContent>
        </Card>
      </div>

      <!-- Expense Breakdown -->
      <Card>
        <CardHeader>
          <h3 class="text-lg font-semibold">Expense Breakdown</h3>
        </CardHeader>
        <CardContent>
          <div class="space-y-4">
            <div
              v-for="expense in financialData.expenses"
              :key="expense.category"
              class="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
            >
              <div class="flex-1">
                <div class="flex items-center justify-between mb-2">
                  <h4 class="font-medium">{{ expense.category }}</h4>
                  <div class="text-right">
                    <span class="font-bold">${{ expense.amount.toFixed(2) }}</span>
                    <span class="text-sm text-gray-600 ml-2">({{ expense.percentage }}%)</span>
                  </div>
                </div>
                <div class="w-full bg-gray-200 rounded-full h-2">
                  <div
                    class="bg-blue-600 h-2 rounded-full"
                    :style="{ width: expense.percentage + '%' }"
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  </div>
</template>
