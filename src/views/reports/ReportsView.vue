<script setup lang="ts">
import { ref, computed } from 'vue'
import { Card, CardHeader, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'
import { useEndOfDayStore } from '@/stores/endOfDay'

const endOfDayStore = useEndOfDayStore()

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
  { value: 'daily_summary', label: 'Daily Shift & EOD Reports' },
]

const activeReportDetail = ref<any | null>(null)

function closeReportDetail() {
  activeReportDetail.value = null
}

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

    <!-- Daily Summary Report (EOD & Shift Reconciliation) -->
    <div v-if="selectedReport === 'daily_summary'" class="space-y-6">
      <!-- Real-time Hourly Sales Chart and Top Products sold -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Sales Performance Chart -->
        <Card>
          <CardHeader>
            <div class="flex justify-between items-center">
              <div>
                <h3 class="text-base font-bold text-gray-900">Today's Peak Sales Performance</h3>
                <p class="text-xs text-gray-500">Hourly revenue and transaction volume peaks</p>
              </div>
              <span class="text-xs font-semibold px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-full">
                Active Shift
              </span>
            </div>
          </CardHeader>
          <CardContent class="p-6">
            <div class="space-y-6">
              <!-- Visual Bar Chart representation of Hourly sales -->
              <div class="h-44 flex items-end justify-between gap-2 pt-4 border-b border-gray-100">
                <div 
                  v-for="item in salesData.today.hourlyBreakdown" 
                  :key="item.hour" 
                  class="flex-1 flex flex-col items-center group relative cursor-pointer"
                >
                  <!-- Tooltip -->
                  <div class="absolute bottom-full mb-1 bg-slate-900 text-white text-[10px] font-semibold py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none shadow-md">
                    ${{ item.sales.toFixed(2) }} ({{ item.orders }} orders)
                  </div>
                  <!-- Bar -->
                  <div 
                    class="w-full bg-indigo-500 hover:bg-indigo-600 rounded-t transition-all duration-300"
                    :style="{ height: `${Math.max(10, (item.sales / 250) * 100)}%` }"
                  ></div>
                  <!-- Label -->
                  <span class="text-[10px] text-gray-400 font-bold mt-2 font-mono">{{ item.hour }}</span>
                </div>
              </div>
              
              <div class="grid grid-cols-3 gap-4 text-center">
                <div class="p-3 bg-gray-50 rounded-xl border border-gray-100/60">
                  <p class="text-[10px] text-gray-500 font-bold uppercase">Peak Hour</p>
                  <p class="text-sm font-extrabold text-slate-900 mt-0.5">11:00 AM</p>
                  <p class="text-[9px] text-slate-400">($234.50)</p>
                </div>
                <div class="p-3 bg-gray-50 rounded-xl border border-gray-100/60">
                  <p class="text-[10px] text-gray-500 font-bold uppercase">Avg Orders/Hr</p>
                  <p class="text-sm font-extrabold text-slate-900 mt-0.5">11.8</p>
                  <p class="text-[9px] text-slate-400">Transactions/hr</p>
                </div>
                <div class="p-3 bg-gray-50 rounded-xl border border-gray-100/60">
                  <p class="text-[10px] text-gray-500 font-bold uppercase">Target Pace</p>
                  <p class="text-sm font-extrabold text-emerald-600 mt-0.5">+12.5%</p>
                  <p class="text-[9px] text-slate-400">Above baseline</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <!-- Product Popularity and Share of Day -->
        <Card>
          <CardHeader>
            <div class="flex justify-between items-center">
              <div>
                <h3 class="text-base font-bold text-gray-900">Today's Best Sellers</h3>
                <p class="text-xs text-gray-500">Top contributors to today's menu revenue</p>
              </div>
              <span class="text-xs text-slate-400 font-mono">Synced</span>
            </div>
          </CardHeader>
          <CardContent class="p-6">
            <div class="space-y-4">
              <div 
                v-for="product in salesData.today.topProducts" 
                :key="product.name"
                class="space-y-1.5"
              >
                <div class="flex justify-between text-xs font-semibold">
                  <span class="text-gray-800">{{ product.name }}</span>
                  <div class="space-x-2 text-right">
                    <span class="text-gray-500">x{{ product.quantity }} sold</span>
                    <span class="text-gray-900 font-bold font-mono">${{ product.revenue.toFixed(2) }}</span>
                  </div>
                </div>
                <div class="w-full bg-gray-100 rounded-full h-2">
                  <div 
                    class="bg-amber-500 h-2 rounded-full transition-all duration-500" 
                    :style="{ width: `${(product.revenue / 202.5) * 100}%` }"
                  ></div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      <!-- KPI Row -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent class="p-6">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-xs font-semibold text-gray-500 uppercase">Today's POS Sales</p>
                <p class="text-2xl font-bold text-green-600 mt-1">
                  ${{ endOfDayStore.todaysSalesSummary.totalRevenue.toFixed(2) }}
                </p>
                <p class="text-xs text-gray-400 mt-1">
                  {{ endOfDayStore.todaysSalesSummary.totalTransactions }} orders processed
                </p>
              </div>
              <div class="text-3xl bg-green-50 p-2.5 rounded-xl">💰</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent class="p-6">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-xs font-semibold text-gray-500 uppercase">Petty Cash Net</p>
                <p :class="['text-2xl font-bold mt-1', endOfDayStore.pettyCashSummary.netChange >= 0 ? 'text-blue-600' : 'text-amber-600']">
                  ${{ endOfDayStore.pettyCashSummary.netChange.toFixed(2) }}
                </p>
                <p class="text-xs text-gray-400 mt-1">
                  +${{ endOfDayStore.pettyCashSummary.totalIn.toFixed(2) }} / -${{ endOfDayStore.pettyCashSummary.totalOut.toFixed(2) }}
                </p>
              </div>
              <div class="text-3xl bg-blue-50 p-2.5 rounded-xl">🪙</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent class="p-6">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-xs font-semibold text-gray-500 uppercase">Active Stock Audits</p>
                <p class="text-2xl font-bold text-indigo-600 mt-1">
                  {{ endOfDayStore.currentStockCheck.length || endOfDayStore.stockChecks.length }}
                </p>
                <p class="text-xs text-gray-400 mt-1">
                  Monitored products
                </p>
              </div>
              <div class="text-3xl bg-indigo-50 p-2.5 rounded-xl">📦</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent class="p-6">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-xs font-semibold text-gray-500 uppercase">EOD Reports Filed</p>
                <p class="text-2xl font-bold text-purple-600 mt-1">
                  {{ endOfDayStore.endOfDayReports.length }}
                </p>
                <p class="text-xs text-gray-400 mt-1">
                  Audit logs completed
                </p>
              </div>
              <div class="text-3xl bg-purple-50 p-2.5 rounded-xl">📋</div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Shift Checkpoints List -->
        <Card class="lg:col-span-1">
          <CardHeader class="pb-3">
            <h3 class="text-base font-bold text-gray-900">Today's Shift Progress</h3>
            <p class="text-xs text-gray-500">Active verification checklist</p>
          </CardHeader>
          <CardContent class="p-6 space-y-4">
            <!-- Stock Audit -->
            <div class="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
              <span class="text-base">
                {{ endOfDayStore.stockChecks.length > 0 ? '✅' : '⏳' }}
              </span>
              <div class="flex-1">
                <p class="text-sm font-semibold text-gray-900">Stock Take Checkpoint</p>
                <p class="text-xs text-gray-500">
                  {{ endOfDayStore.stockChecks.length > 0 ? 'Stock counts audit lock completed' : 'Pending shift stocktake count' }}
                </p>
              </div>
            </div>

            <!-- Petty Cash -->
            <div class="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
              <span class="text-base">
                {{ endOfDayStore.pettyCashSummary.entries.length > 0 ? '✅' : '⏳' }}
              </span>
              <div class="flex-1">
                <p class="text-sm font-semibold text-gray-900">Petty Cash Logs</p>
                <p class="text-xs text-gray-500">
                  {{ endOfDayStore.pettyCashSummary.entries.length }} active transaction entries
                </p>
              </div>
            </div>

            <!-- Drawer Reconciliation -->
            <div class="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
              <span class="text-base">
                {{ endOfDayStore.cashReconciliations.length > 0 ? '✅' : '⏳' }}
              </span>
              <div class="flex-1">
                <p class="text-sm font-semibold text-gray-900">Cash Drawer Reconciliation</p>
                <p class="text-xs text-gray-500">
                  {{ endOfDayStore.cashReconciliations.length > 0 ? 'Cash drawer counted & locked' : 'Awaiting physical count' }}
                </p>
              </div>
            </div>

            <!-- EOD File -->
            <div class="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
              <span class="text-base">
                {{ endOfDayStore.getTodaysEndOfDayReport() ? '✅' : '⏳' }}
              </span>
              <div class="flex-1">
                <p class="text-sm font-semibold text-gray-900">Final Shift Signoff</p>
                <p class="text-xs text-gray-500">
                  {{ endOfDayStore.getTodaysEndOfDayReport() ? 'EOD report filed & exported' : 'Waiting for shift tasks to close' }}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <!-- Historical EOD Reports Log -->
        <Card class="lg:col-span-2">
          <CardHeader class="pb-3 flex flex-row items-center justify-between space-y-0">
            <div>
              <h3 class="text-base font-bold text-gray-900">Historical Reconciliation Audits</h3>
              <p class="text-xs text-gray-500">Audited cash registers, discrepancies, and stock variances</p>
            </div>
            <span class="text-xs text-gray-400">Archived shift closures</span>
          </CardHeader>
          <CardContent class="p-6">
            <div class="overflow-x-auto">
              <table class="w-full text-sm text-left text-gray-500">
                <thead class="text-xs text-gray-700 uppercase bg-gray-50">
                  <tr>
                    <th scope="col" class="px-4 py-3">Date</th>
                    <th scope="col" class="px-4 py-3">Completed By</th>
                    <th scope="col" class="px-4 py-3">Sales</th>
                    <th scope="col" class="px-4 py-3">Variance</th>
                    <th scope="col" class="px-4 py-3">Status</th>
                    <th scope="col" class="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="report in endOfDayStore.endOfDayReports" :key="report.id" class="bg-white border-b hover:bg-gray-50">
                    <td class="px-4 py-3.5 font-medium text-gray-900 whitespace-nowrap">
                      {{ new Date(report.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' }) }}
                    </td>
                    <td class="px-4 py-3.5 text-gray-700">
                      {{ report.completedBy }}
                    </td>
                    <td class="px-4 py-3.5 font-semibold text-gray-900">
                      ${{ report.salesSummary.totalRevenue.toFixed(2) }}
                    </td>
                    <td class="px-4 py-3.5">
                      <span :class="[
                        'font-mono font-bold',
                        report.cashReconciliation.cashVariance === 0 ? 'text-green-600' :
                        Math.abs(report.cashReconciliation.cashVariance) <= 0.5 ? 'text-amber-500' : 'text-red-600'
                      ]">
                        {{ report.cashReconciliation.cashVariance > 0 ? '+' : '' }}{{ report.cashReconciliation.cashVariance.toFixed(2) }}
                      </span>
                    </td>
                    <td class="px-4 py-3.5">
                      <span :class="[
                        'px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider',
                        report.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      ]">
                        {{ report.status === 'completed' ? 'Balanced' : 'Flagged' }}
                      </span>
                    </td>
                    <td class="px-4 py-3.5 text-right">
                      <Button size="sm" variant="outline" @click="activeReportDetail = report" class="text-xs h-7 px-3">
                        🔎 View Audit
                      </Button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      <!-- Detail Overlay Modal -->
      <div v-if="activeReportDetail" class="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-end">
        <div class="bg-white w-full max-w-xl h-full shadow-2xl p-6 overflow-y-auto flex flex-col justify-between">
          <div>
            <div class="flex items-center justify-between border-b pb-4 mb-6">
              <div>
                <h3 class="text-lg font-bold text-gray-900">EOD Shift Reconciliation Audit</h3>
                <p class="text-xs text-gray-500">
                  Filed on {{ new Date(activeReportDetail.date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) }}
                </p>
              </div>
              <button @click="closeReportDetail" class="text-gray-400 hover:text-gray-600 text-xl border-none bg-transparent cursor-pointer">
                ✕
              </button>
            </div>

            <div class="space-y-6">
              <!-- Summary Grid -->
              <div class="grid grid-cols-3 gap-3">
                <div class="bg-gray-50 p-3 rounded-lg text-center border border-gray-100">
                  <span class="text-[10px] text-gray-500 font-bold uppercase block mb-1">Total Sales</span>
                  <span class="text-base font-bold text-gray-900">${{ activeReportDetail.salesSummary.totalRevenue.toFixed(2) }}</span>
                </div>
                <div class="bg-gray-50 p-3 rounded-lg text-center border border-gray-100">
                  <span class="text-[10px] text-gray-500 font-bold uppercase block mb-1">Cash Counted</span>
                  <span class="text-base font-bold text-gray-900">${{ activeReportDetail.cashReconciliation.actualCashCount.toFixed(2) }}</span>
                </div>
                <div class="bg-gray-50 p-3 rounded-lg text-center border border-gray-100">
                  <span class="text-[10px] text-gray-500 font-bold uppercase block mb-1">Discrepancy</span>
                  <span :class="['text-base font-bold block', activeReportDetail.cashReconciliation.cashVariance === 0 ? 'text-green-600' : 'text-red-600']">
                    ${{ activeReportDetail.cashReconciliation.cashVariance.toFixed(2) }}
                  </span>
                </div>
              </div>

              <!-- General Shift Info -->
              <div class="bg-blue-50 border border-blue-100 rounded-lg p-4 text-sm text-blue-900 space-y-2">
                <p><strong>Shift Supervisor:</strong> {{ activeReportDetail.completedBy }}</p>
                <p><strong>Opening Drawer:</strong> ${{ activeReportDetail.cashReconciliation.openingCash.toFixed(2) }}</p>
                <p><strong>Expected Drawer Cash:</strong> ${{ activeReportDetail.cashReconciliation.expectedCash.toFixed(2) }}</p>
                <p v-if="activeReportDetail.cashReconciliation.notes">
                  <strong>Notes:</strong> "{{ activeReportDetail.cashReconciliation.notes }}"
                </p>
              </div>

              <!-- Cash Breakdown Grid -->
              <div>
                <h4 class="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Physical Cash Counts</h4>
                <div class="bg-gray-50 rounded-lg p-4 border border-gray-100 grid grid-cols-2 gap-4">
                  <div>
                    <h5 class="text-xs font-bold text-gray-500 uppercase mb-2 border-b pb-1">Bills</h5>
                    <div class="space-y-1.5 text-xs font-mono">
                      <div class="flex justify-between">
                        <span>$100 Bills:</span>
                        <span class="font-bold text-gray-900">x{{ activeReportDetail.cashReconciliation.cashBreakdown.bills.hundred }}</span>
                      </div>
                      <div class="flex justify-between">
                        <span>$50 Bills:</span>
                        <span class="font-bold text-gray-900">x{{ activeReportDetail.cashReconciliation.cashBreakdown.bills.fifty }}</span>
                      </div>
                      <div class="flex justify-between">
                        <span>$20 Bills:</span>
                        <span class="font-bold text-gray-900">x{{ activeReportDetail.cashReconciliation.cashBreakdown.bills.twenty }}</span>
                      </div>
                      <div class="flex justify-between">
                        <span>$10 Bills:</span>
                        <span class="font-bold text-gray-900">x{{ activeReportDetail.cashReconciliation.cashBreakdown.bills.ten }}</span>
                      </div>
                      <div class="flex justify-between">
                        <span>$5 Bills:</span>
                        <span class="font-bold text-gray-900">x{{ activeReportDetail.cashReconciliation.cashBreakdown.bills.five }}</span>
                      </div>
                      <div class="flex justify-between">
                        <span>$1 Bills:</span>
                        <span class="font-bold text-gray-900">x{{ activeReportDetail.cashReconciliation.cashBreakdown.bills.one }}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h5 class="text-xs font-bold text-gray-500 uppercase mb-2 border-b pb-1">Coins</h5>
                    <div class="space-y-1.5 text-xs font-mono">
                      <div class="flex justify-between">
                        <span>Quarters (25¢):</span>
                        <span class="font-bold text-gray-900">x{{ activeReportDetail.cashReconciliation.cashBreakdown.coins.quarter }}</span>
                      </div>
                      <div class="flex justify-between">
                        <span>Dimes (10¢):</span>
                        <span class="font-bold text-gray-900">x{{ activeReportDetail.cashReconciliation.cashBreakdown.coins.dime }}</span>
                      </div>
                      <div class="flex justify-between">
                        <span>Nickels (5¢):</span>
                        <span class="font-bold text-gray-900">x{{ activeReportDetail.cashReconciliation.cashBreakdown.coins.nickel }}</span>
                      </div>
                      <div class="flex justify-between">
                        <span>Pennies (1¢):</span>
                        <span class="font-bold text-gray-900">x{{ activeReportDetail.cashReconciliation.cashBreakdown.coins.penny }}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Other Revenue Types -->
              <div>
                <h4 class="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Non-Cash Card & Mobile Channels</h4>
                <div class="grid grid-cols-2 gap-4 text-xs font-mono bg-gray-50 p-4 rounded-lg border border-gray-100">
                  <div class="flex justify-between">
                    <span class="text-gray-500">Terminal Card Sales:</span>
                    <span class="font-bold text-gray-900">${{ activeReportDetail.cashReconciliation.cardSales.toFixed(2) }}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-gray-500">Mobile Wallet Sales:</span>
                    <span class="font-bold text-gray-900">${{ activeReportDetail.cashReconciliation.mobileSales.toFixed(2) }}</span>
                  </div>
                </div>
              </div>

              <!-- Petty Cash & Stock Variance Summary -->
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <h4 class="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Petty Cash Netting</h4>
                  <div class="bg-gray-50 p-3 rounded-lg border border-gray-100 text-xs space-y-1">
                    <p class="flex justify-between"><span>Petty Cash In:</span> <span class="font-bold text-green-600">+${{ activeReportDetail.pettyCashSummary.totalIn.toFixed(2) }}</span></p>
                    <p class="flex justify-between"><span>Petty Cash Out:</span> <span class="font-bold text-red-600">-${{ activeReportDetail.pettyCashSummary.totalOut.toFixed(2) }}</span></p>
                    <p class="flex justify-between border-t pt-1 font-semibold"><span>Net Shift Cash:</span> <span class="text-gray-900 font-bold">${{ activeReportDetail.pettyCashSummary.netChange.toFixed(2) }}</span></p>
                  </div>
                </div>

                <div>
                  <h4 class="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Inventory Variances</h4>
                  <div class="bg-gray-50 p-3 rounded-lg border border-gray-100 text-xs space-y-1">
                    <p class="flex justify-between"><span>Audited Items:</span> <span class="font-bold text-gray-900">{{ activeReportDetail.stockCheck.totalItems }}</span></p>
                    <p class="flex justify-between"><span>Variance Items:</span> <span :class="['font-bold', activeReportDetail.stockCheck.itemsWithVariance > 0 ? 'text-red-600' : 'text-green-600']">{{ activeReportDetail.stockCheck.itemsWithVariance }} products</span></p>
                    <p class="flex justify-between border-t pt-1 font-semibold"><span>Variance Cost:</span> <span class="text-red-600 font-bold">-${{ Math.abs(activeReportDetail.stockCheck.totalStockVariance).toFixed(2) }}</span></p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="pt-4 border-t mt-6 flex gap-3">
            <Button class="w-full h-10 text-xs" variant="outline" @click="closeReportDetail"> Close Audit </Button>
            <Button class="w-full h-10 text-xs bg-blue-600 hover:bg-blue-700 text-white" @click="printReport"> 🖨️ Print Receipt Copy </Button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
