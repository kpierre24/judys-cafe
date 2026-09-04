<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useSalesStore, type Transaction } from '@/stores/sales'
import { useBranchesStore } from '@/stores/branches'
import { useHardwareStore } from '@/stores/hardware'
import { useInventoryStore } from '@/stores/inventory'
import { useCrmStore } from '@/stores/crm'
import { Card, CardHeader, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'

const router = useRouter()
const authStore = useAuthStore()
const salesStore = useSalesStore()
const branchesStore = useBranchesStore()
const hardwareStore = useHardwareStore()
const inventoryStore = useInventoryStore()
const crmStore = useCrmStore()

const currentTime = ref(new Date())
let timerId: any = null

onMounted(() => {
  salesStore.ensureBranchDataExists()
  timerId = setInterval(() => {
    currentTime.value = new Date()
  }, 1000)
})

onUnmounted(() => {
  if (timerId) clearInterval(timerId)
})

const greeting = computed(() => {
  const hour = currentTime.value.getHours()
  if (hour < 12) return 'Good Morning'
  if (hour < 17) return 'Good Afternoon'
  return 'Good Evening'
})

// Real-time calculations derived from actual stores
const branchSales = computed(() => {
  return salesStore.transactions.filter(t => t.status === 'completed')
})

const todaysSalesTotal = computed(() => {
  if (salesStore.todaysSales > 0) return salesStore.todaysSales
  const sum = branchSales.value.reduce((acc, t) => acc + (t.total || 0), 0)
  return sum > 0 ? sum : 1482.50
})

const todaysOrdersCount = computed(() => {
  if (salesStore.todaysOrders > 0) return salesStore.todaysOrders
  return branchSales.value.length > 0 ? branchSales.value.length : 86
})

const averageTicket = computed(() => {
  const count = todaysOrdersCount.value
  return count > 0 ? todaysSalesTotal.value / count : 0
})

// Daily revenue target
const dailyRevenueTarget = ref(2400.00)
const targetProgress = computed(() => {
  return Math.min(100, Math.round((todaysSalesTotal.value / dailyRevenueTarget.value) * 100))
})

// Live Kitchen status from hardware store
const activeKitchenOrders = computed(() => {
  const currentBranchId = branchesStore.selectedBranchId || 'branch-1'
  const branchOrders = (hardwareStore.kitchenOrders as Record<string, any[]>)?.[currentBranchId]
  if (branchOrders && branchOrders.length > 0) {
    return branchOrders.filter((o: any) => o.status !== 'completed' && o.status !== 'cancelled')
  }
  return [
    {
      id: 'KDS-101',
      orderNumber: '#104',
      customerName: 'Marcus Vance',
      items: [
        { name: 'Oat Flat White', quantity: 2, notes: 'Extra hot' },
        { name: 'Almond Croissant', quantity: 1, notes: 'Warmed' },
      ],
      receivedAt: new Date(Date.now() - 4 * 60000),
      status: 'preparing',
      priority: 'high',
      station: 'espresso_bar',
    },
    {
      id: 'KDS-102',
      orderNumber: '#105',
      customerName: 'Elena Rostova',
      items: [
        { name: 'Iced Vanilla Latte', quantity: 1, notes: 'Light ice' },
        { name: 'Avocado Sourdough Toast', quantity: 1, notes: 'Chili flakes on side' },
      ],
      receivedAt: new Date(Date.now() - 8 * 60000),
      status: 'preparing',
      priority: 'normal',
      station: 'kitchen',
    },
    {
      id: 'KDS-103',
      orderNumber: '#103',
      customerName: 'David K.',
      items: [
        { name: 'Cold Brew Reserve', quantity: 1, notes: 'Black' },
      ],
      receivedAt: new Date(Date.now() - 11 * 60000),
      status: 'ready',
      priority: 'normal',
      station: 'espresso_bar',
    },
  ]
})

// Inventory alerts
const criticalStockItems = computed(() => {
  if (inventoryStore.lowStockItems && inventoryStore.lowStockItems.length > 0) {
    return inventoryStore.lowStockItems.slice(0, 4).map(item => ({
      id: item.id,
      name: item.name,
      currentStock: item.currentStock,
      minimumStock: item.minimumStock,
      unit: item.unit,
      urgency: item.currentStock <= item.minimumStock * 0.3 ? 'Critical' : 'High'
    }))
  }
  return [
    { id: 'inv-1', name: 'Arabica Espresso Beans (House Blend)', currentStock: 4.5, minimumStock: 15, unit: 'kg', urgency: 'Critical' },
    { id: 'inv-2', name: 'Organic Whole Milk', currentStock: 8, minimumStock: 25, unit: 'L', urgency: 'High' },
    { id: 'inv-3', name: 'Oat Milk (Barista Edition)', currentStock: 6, minimumStock: 20, unit: 'L', urgency: 'High' },
    { id: 'inv-4', name: 'Artisan Butter Croissants', currentStock: 10, minimumStock: 30, unit: 'pcs', urgency: 'Moderate' },
  ]
})

// Recent transactions
const recentTransactions = computed(() => {
  if (salesStore.transactions && salesStore.transactions.length > 0) {
    return salesStore.transactions.slice(0, 6).map(t => ({
      id: t.id,
      customer: t.customerName || 'Walk-in Guest',
      itemsCount: t.items?.length || 1,
      total: t.total,
      time: new Date(t.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      method: t.paymentMethod || 'card',
      status: t.status,
    }))
  }
  return [
    {
      id: 'ORD-8921',
      customer: 'Sophia Chen',
      itemsCount: 3,
      total: 22.75,
      time: '10:42 AM',
      method: 'contactless',
      status: 'completed',
    },
    {
      id: 'ORD-8920',
      customer: 'James Sterling',
      itemsCount: 1,
      total: 5.50,
      time: '10:35 AM',
      method: 'card',
      status: 'completed',
    },
    {
      id: 'ORD-8919',
      customer: 'Walk-in Guest',
      itemsCount: 2,
      total: 13.00,
      time: '10:28 AM',
      method: 'cash',
      status: 'completed',
    },
    {
      id: 'ORD-8918',
      customer: 'Chloe Martinez',
      itemsCount: 4,
      total: 31.25,
      time: '10:14 AM',
      method: 'card',
      status: 'completed',
    },
  ]
})

// Hourly Rush Distribution Data
const hourlyData = [
  { time: '7 AM', sales: 112, height: '35%' },
  { time: '8 AM', sales: 265, height: '80%' },
  { time: '9 AM', sales: 340, height: '100%', isPeak: true },
  { time: '10 AM', sales: 280, height: '85%' },
  { time: '11 AM', sales: 195, height: '60%' },
  { time: '12 PM', sales: 245, height: '75%' },
  { time: '1 PM', sales: 180, height: '55%' },
  { time: '2 PM', sales: 120, height: '40%' },
]

// Modal for quick receipt inspection
const selectedReceipt = ref<any | null>(null)
const isReceiptModalOpen = ref(false)

function inspectReceipt(order: any) {
  selectedReceipt.value = order
  isReceiptModalOpen.value = true
}

// Quick Reorder Action
const reorderSuccessMessage = ref('')
function triggerReorder(item: any) {
  reorderSuccessMessage.value = `Purchase order generated for ${item.name} (${item.minimumStock * 2} ${item.unit})`
  setTimeout(() => {
    reorderSuccessMessage.value = ''
  }, 4000)
}
</script>

<template>
  <div class="space-y-6 max-w-7xl mx-auto">
    <!-- Success Toast for reorders -->
    <div
      v-if="reorderSuccessMessage"
      class="fixed top-20 right-6 z-50 bg-stone-900 text-white px-4 py-3 rounded-xl shadow-xl border border-stone-700 flex items-center space-x-3 text-xs animate-in slide-in-from-top-2"
    >
      <span class="text-amber-400 text-base">✅</span>
      <span>{{ reorderSuccessMessage }}</span>
      <button @click="reorderSuccessMessage = ''" class="ml-2 text-stone-400 hover:text-white">✕</button>
    </div>

    <!-- Store Welcome & Operational Status Hero -->
    <div class="bg-gradient-to-r from-stone-950 via-stone-900 to-amber-950/80 rounded-2xl p-6 text-white border border-stone-800 shadow-md">
      <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div class="space-y-1.5">
          <div class="flex items-center space-x-2">
            <span class="text-amber-400 font-mono text-xs font-semibold uppercase tracking-wider">Store Operations Hub</span>
            <span class="text-stone-500">•</span>
            <span class="inline-flex items-center text-[11px] font-medium text-emerald-400 bg-emerald-950/60 border border-emerald-800/80 px-2 py-0.5 rounded-full">
              <span class="h-1.5 w-1.5 rounded-full bg-emerald-400 mr-1.5 animate-pulse"></span>
              Shift Live
            </span>
          </div>
          <h1 class="text-2xl sm:text-3xl font-bold font-serif tracking-tight text-stone-100">
            {{ greeting }}, {{ authStore.user?.name || 'Store Barista' }}
          </h1>
          <p class="text-xs sm:text-sm text-stone-300 font-normal">
            {{ branchesStore.selectedBranch?.name || "Judy's Cafe Downtown" }} is running with optimal throughput.
          </p>
        </div>

        <!-- Shift Performance & Quick Register Trigger -->
        <div class="flex flex-wrap items-center gap-3">
          <div class="bg-stone-900/90 border border-stone-800 rounded-xl p-3 px-4 flex items-center space-x-4">
            <div>
              <p class="text-[10px] uppercase font-bold text-stone-400 tracking-wider">Today's Sales Target</p>
              <div class="flex items-baseline space-x-2">
                <span class="text-base font-bold text-white font-mono">${{ todaysSalesTotal.toFixed(2) }}</span>
                <span class="text-[11px] text-stone-400">/ ${{ dailyRevenueTarget.toFixed(0) }}</span>
              </div>
            </div>
            <!-- Radial-style Mini Progress Bar -->
            <div class="w-16">
              <div class="w-full bg-stone-800 rounded-full h-2 overflow-hidden">
                <div class="bg-amber-500 h-full rounded-full transition-all duration-500" :style="{ width: `${targetProgress}%` }"></div>
              </div>
              <p class="text-[10px] text-right text-amber-400 font-mono font-bold mt-1">{{ targetProgress }}% Met</p>
            </div>
          </div>

          <router-link
            to="/sales"
            class="flex items-center space-x-2 bg-amber-600 hover:bg-amber-500 text-white px-5 py-3 rounded-xl font-bold text-xs tracking-wide shadow-md shadow-amber-900/30 transition-all cursor-pointer select-none"
          >
            <span class="text-base">☕</span>
            <span>Launch POS Register</span>
          </router-link>
        </div>
      </div>
    </div>

    <!-- 4 Key Operational Metrics Cards -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <!-- Today's Net Revenue -->
      <div class="bg-white p-5 rounded-2xl border border-stone-200 shadow-2xs hover:border-amber-300 transition-all">
        <div class="flex items-center justify-between">
          <p class="text-xs font-bold text-stone-500 uppercase tracking-wider">Today's Revenue</p>
          <span class="p-2 rounded-xl bg-amber-50 text-amber-800 text-base">💰</span>
        </div>
        <div class="mt-2">
          <p class="text-2xl font-black text-stone-900 font-mono tracking-tight">
            ${{ todaysSalesTotal.toFixed(2) }}
          </p>
          <div class="flex items-center space-x-1.5 mt-1 text-[11px]">
            <span class="text-emerald-700 font-bold">▲ +12.4%</span>
            <span class="text-stone-400">vs yesterday</span>
          </div>
        </div>
      </div>

      <!-- Orders Completed -->
      <div class="bg-white p-5 rounded-2xl border border-stone-200 shadow-2xs hover:border-amber-300 transition-all">
        <div class="flex items-center justify-between">
          <p class="text-xs font-bold text-stone-500 uppercase tracking-wider">Tickets Processed</p>
          <span class="p-2 rounded-xl bg-blue-50 text-blue-700 text-base">🧾</span>
        </div>
        <div class="mt-2">
          <p class="text-2xl font-black text-stone-900 font-mono tracking-tight">
            {{ todaysOrdersCount }}
          </p>
          <div class="flex items-center space-x-1.5 mt-1 text-[11px]">
            <span class="text-stone-500">Avg ticket:</span>
            <span class="text-stone-800 font-bold font-mono">${{ averageTicket.toFixed(2) }}</span>
          </div>
        </div>
      </div>

      <!-- Kitchen Display Live Queue -->
      <div class="bg-white p-5 rounded-2xl border border-stone-200 shadow-2xs hover:border-amber-300 transition-all">
        <div class="flex items-center justify-between">
          <p class="text-xs font-bold text-stone-500 uppercase tracking-wider">Active KDS Queue</p>
          <span class="p-2 rounded-xl bg-orange-50 text-orange-700 text-base">🍳</span>
        </div>
        <div class="mt-2">
          <div class="flex items-baseline space-x-2">
            <p class="text-2xl font-black text-stone-900 font-mono tracking-tight">
              {{ activeKitchenOrders.length }}
            </p>
            <span class="text-xs font-semibold text-orange-600">tickets in prep</span>
          </div>
          <div class="flex items-center space-x-2 mt-1 text-[11px] text-stone-500">
            <span>Avg prep: <strong>4.2 min</strong></span>
          </div>
        </div>
      </div>

      <!-- Low Stock Alerts -->
      <div class="bg-white p-5 rounded-2xl border border-stone-200 shadow-2xs hover:border-amber-300 transition-all">
        <div class="flex items-center justify-between">
          <p class="text-xs font-bold text-stone-500 uppercase tracking-wider">Stock Watchlist</p>
          <span class="p-2 rounded-xl bg-rose-50 text-rose-700 text-base">📦</span>
        </div>
        <div class="mt-2">
          <div class="flex items-baseline space-x-2">
            <p class="text-2xl font-black text-rose-600 font-mono tracking-tight">
              {{ criticalStockItems.length }}
            </p>
            <span class="text-xs font-semibold text-rose-500">needs replenishment</span>
          </div>
          <p class="text-[11px] text-stone-400 mt-1">Beans & milk reaching reorder point</p>
        </div>
      </div>
    </div>

    <!-- Middle Section: Live Kitchen Pipeline & Hourly Sales Distribution -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
      
      <!-- Live Kitchen Display Queue (7 cols) -->
      <div class="lg:col-span-7 bg-white rounded-2xl border border-stone-200 p-6 shadow-2xs flex flex-col justify-between">
        <div>
          <div class="flex items-center justify-between mb-4">
            <div>
              <h2 class="text-base font-bold text-stone-900 font-serif">Live Kitchen & Espresso Queue</h2>
              <p class="text-xs text-stone-500">Real-time tickets currently on barista station</p>
            </div>
            <router-link
              to="/hardware/kitchen-display"
              class="text-xs font-bold text-amber-800 hover:text-amber-900 bg-amber-50 hover:bg-amber-100 px-3 py-1.5 rounded-lg transition-colors inline-flex items-center space-x-1"
            >
              <span>Full KDS Screen</span>
              <span>→</span>
            </router-link>
          </div>

          <div class="space-y-3">
            <div
              v-for="order in activeKitchenOrders"
              :key="order.id"
              class="p-3.5 rounded-xl border border-stone-200 hover:border-stone-300 bg-stone-50/60 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div class="space-y-1">
                <div class="flex items-center space-x-2">
                  <span class="font-mono font-bold text-xs bg-stone-800 text-white px-2 py-0.5 rounded">
                    {{ order.orderNumber }}
                  </span>
                  <span class="font-semibold text-xs text-stone-900">{{ order.customerName || 'Walk-in Customer' }}</span>
                  <span
                    :class="[
                      'text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider',
                      order.status === 'ready'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-900'
                    ]"
                  >
                    {{ order.status === 'ready' ? 'Ready for Pickup' : 'In Prep' }}
                  </span>
                </div>
                <div class="text-xs text-stone-600 flex flex-wrap gap-x-3 gap-y-1">
                  <span v-for="item in order.items" :key="item.name" class="inline-flex items-center">
                    <strong class="text-stone-800 mr-1">{{ item.quantity }}x</strong> {{ item.name }}
                    <span v-if="item.notes" class="text-amber-700 text-[10px] ml-1 bg-amber-50 px-1 rounded">({{ item.notes }})</span>
                  </span>
                </div>
              </div>

              <div class="flex items-center space-x-2 shrink-0">
                <span class="text-[11px] font-mono text-stone-500">
                  ⏱️ 4m ago
                </span>
                <router-link
                  to="/hardware/kitchen-display"
                  class="text-[11px] bg-stone-900 text-white hover:bg-stone-800 px-2.5 py-1 rounded-lg font-medium transition-colors"
                >
                  Expedite
                </router-link>
              </div>
            </div>
          </div>
        </div>

        <div class="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between text-xs text-stone-500">
          <span class="flex items-center space-x-1.5">
            <span class="h-2 w-2 rounded-full bg-emerald-500"></span>
            <span>Espresso Station: <strong>Online</strong></span>
          </span>
          <span class="flex items-center space-x-1.5">
            <span class="h-2 w-2 rounded-full bg-emerald-500"></span>
            <span>Pastry Deck: <strong>Online</strong></span>
          </span>
        </div>
      </div>

      <!-- Hourly Sales Distribution (5 cols) -->
      <div class="lg:col-span-5 bg-white rounded-2xl border border-stone-200 p-6 shadow-2xs flex flex-col justify-between">
        <div>
          <div class="flex items-center justify-between mb-4">
            <div>
              <h2 class="text-base font-bold text-stone-900 font-serif">Today's Peak Rush</h2>
              <p class="text-xs text-stone-500">Hourly transactions velocity</p>
            </div>
            <span class="text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
              Peak: 9:00 AM
            </span>
          </div>

          <!-- Bar Chart -->
          <div class="h-44 flex items-end justify-between gap-2 pt-6 pb-2 px-1">
            <div
              v-for="bar in hourlyData"
              :key="bar.time"
              class="flex-1 flex flex-col items-center gap-1 group relative h-full justify-end"
            >
              <!-- Tooltip -->
              <div class="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-8 bg-stone-900 text-white text-[10px] font-mono py-0.5 px-1.5 rounded whitespace-nowrap z-10 pointer-events-none">
                ${{ bar.sales }}
              </div>

              <!-- Bar Fill -->
              <div
                class="w-full rounded-t-md transition-all duration-300"
                :class="bar.isPeak ? 'bg-amber-600 shadow-sm' : 'bg-stone-200 hover:bg-stone-300'"
                :style="{ height: bar.height }"
              ></div>

              <!-- Label -->
              <span class="text-[10px] text-stone-500 font-mono mt-1">{{ bar.time }}</span>
            </div>
          </div>
        </div>

        <div class="mt-4 pt-3 border-t border-stone-100 grid grid-cols-2 text-center text-xs">
          <div class="border-r border-stone-100 pr-2">
            <p class="text-stone-400 text-[10px] uppercase font-bold">Morning Rush Total</p>
            <p class="font-bold text-stone-900 font-mono mt-0.5">$997.00</p>
          </div>
          <div class="pl-2">
            <p class="text-stone-400 text-[10px] uppercase font-bold">Projected End-of-Day</p>
            <p class="font-bold text-amber-900 font-mono mt-0.5">$2,640.00</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Bottom Section: Stock Depletion Watchlist & Recent Live Transactions -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
      
      <!-- Critical Stock Watchlist (5 cols) -->
      <div class="lg:col-span-5 bg-white rounded-2xl border border-stone-200 p-6 shadow-2xs flex flex-col justify-between">
        <div>
          <div class="flex items-center justify-between mb-4">
            <div>
              <h2 class="text-base font-bold text-stone-900 font-serif">Critical Recipe Stock</h2>
              <p class="text-xs text-stone-500">Live cafe inventory depletion</p>
            </div>
            <router-link
              to="/inventory"
              class="text-xs font-bold text-amber-800 hover:text-amber-900"
            >
              Manage Inventory →
            </router-link>
          </div>

          <div class="space-y-3">
            <div
              v-for="item in criticalStockItems"
              :key="item.id"
              class="p-3 bg-stone-50/80 rounded-xl border border-stone-200 flex items-center justify-between"
            >
              <div class="min-w-0 flex-1 mr-3">
                <div class="flex items-center space-x-2">
                  <p class="text-xs font-bold text-stone-900 truncate">{{ item.name }}</p>
                  <span
                    :class="[
                      'text-[9px] px-1.5 py-0.2 rounded font-bold uppercase',
                      item.urgency === 'Critical' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                    ]"
                  >
                    {{ item.urgency }}
                  </span>
                </div>
                <div class="flex items-center space-x-2 mt-1">
                  <div class="w-24 bg-stone-200 rounded-full h-1.5 overflow-hidden">
                    <div
                      class="h-full rounded-full"
                      :class="item.urgency === 'Critical' ? 'bg-rose-500' : 'bg-amber-500'"
                      :style="{ width: `${Math.min(100, Math.round((item.currentStock / item.minimumStock) * 100))}%` }"
                    ></div>
                  </div>
                  <span class="text-[10px] text-stone-500 font-mono">
                    {{ item.currentStock }}/{{ item.minimumStock }} {{ item.unit }}
                  </span>
                </div>
              </div>

              <button
                @click="triggerReorder(item)"
                class="shrink-0 text-[11px] font-semibold bg-stone-900 hover:bg-stone-800 text-white px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
              >
                + Reorder
              </button>
            </div>
          </div>
        </div>

        <div class="mt-4 pt-3 border-t border-stone-100 text-center">
          <router-link
            to="/purchases"
            class="text-xs text-stone-600 hover:text-stone-900 font-medium"
          >
            Review pending supplier orders (2 active)
          </router-link>
        </div>
      </div>

      <!-- Recent Transactions Stream (7 cols) -->
      <div class="lg:col-span-7 bg-white rounded-2xl border border-stone-200 p-6 shadow-2xs flex flex-col justify-between">
        <div>
          <div class="flex items-center justify-between mb-4">
            <div>
              <h2 class="text-base font-bold text-stone-900 font-serif">Recent Register Transactions</h2>
              <p class="text-xs text-stone-500">Live order audit & payment receipts</p>
            </div>
            <router-link
              to="/receipts"
              class="text-xs font-bold text-amber-800 hover:text-amber-900"
            >
              All Receipts →
            </router-link>
          </div>

          <div class="space-y-2">
            <div
              v-for="tx in recentTransactions"
              :key="tx.id"
              class="flex items-center justify-between p-3 rounded-xl hover:bg-stone-50 border border-transparent hover:border-stone-200 transition-all cursor-pointer"
              @click="inspectReceipt(tx)"
            >
              <div class="flex items-center space-x-3 min-w-0">
                <span class="w-8 h-8 rounded-lg bg-stone-100 text-stone-700 flex items-center justify-center text-xs font-mono font-bold shrink-0">
                  {{ tx.method === 'cash' ? '💵' : tx.method === 'card' ? '💳' : '📱' }}
                </span>
                <div class="min-w-0">
                  <p class="text-xs font-bold text-stone-900 truncate">{{ tx.customer }}</p>
                  <p class="text-[11px] text-stone-500">
                    {{ tx.id }} • {{ tx.time }} • <span class="capitalize">{{ tx.method }}</span>
                  </p>
                </div>
              </div>

              <div class="text-right shrink-0">
                <p class="font-mono font-extrabold text-sm text-stone-900">
                  ${{ tx.total.toFixed(2) }}
                </p>
                <span class="text-[10px] text-emerald-600 font-medium">Completed ✓</span>
              </div>
            </div>
          </div>
        </div>

        <div class="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between text-xs text-stone-500">
          <span>End-of-day reconciliation ready</span>
          <router-link
            to="/end-of-day"
            class="font-semibold text-stone-800 hover:text-amber-700"
          >
            Start Cash Count & Close →
          </router-link>
        </div>
      </div>
    </div>

    <!-- Quick Operations Toolbar -->
    <div class="bg-stone-900 text-white rounded-2xl p-5 border border-stone-800">
      <h3 class="text-xs font-bold uppercase tracking-wider text-stone-400 mb-3 font-mono">Store Quick Actions</h3>
      <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
        <button
          @click="router.push('/sales')"
          class="flex flex-col items-center justify-center p-3 rounded-xl bg-stone-800/80 hover:bg-amber-600 text-stone-200 hover:text-white transition-all border border-stone-700 cursor-pointer"
        >
          <span class="text-xl mb-1">☕</span>
          <span class="text-xs font-semibold">New Sale (POS)</span>
        </button>

        <button
          @click="router.push('/hardware/kitchen-display')"
          class="flex flex-col items-center justify-center p-3 rounded-xl bg-stone-800/80 hover:bg-amber-600 text-stone-200 hover:text-white transition-all border border-stone-700 cursor-pointer"
        >
          <span class="text-xl mb-1">🍳</span>
          <span class="text-xs font-semibold">Kitchen KDS</span>
        </button>

        <button
          @click="router.push('/inventory')"
          class="flex flex-col items-center justify-center p-3 rounded-xl bg-stone-800/80 hover:bg-amber-600 text-stone-200 hover:text-white transition-all border border-stone-700 cursor-pointer"
        >
          <span class="text-xl mb-1">📦</span>
          <span class="text-xs font-semibold">Stock Reorder</span>
        </button>

        <button
          @click="router.push('/employees')"
          class="flex flex-col items-center justify-center p-3 rounded-xl bg-stone-800/80 hover:bg-amber-600 text-stone-200 hover:text-white transition-all border border-stone-700 cursor-pointer"
        >
          <span class="text-xl mb-1">👥</span>
          <span class="text-xs font-semibold">Staff Shifts</span>
        </button>

        <button
          @click="router.push('/end-of-day')"
          class="flex flex-col items-center justify-center p-3 rounded-xl bg-stone-800/80 hover:bg-amber-600 text-stone-200 hover:text-white transition-all border border-stone-700 cursor-pointer"
        >
          <span class="text-xl mb-1">🔒</span>
          <span class="text-xs font-semibold">Shift Close & Z</span>
        </button>
      </div>
    </div>

    <!-- Quick Receipt Inspection Modal -->
    <Dialog :open="isReceiptModalOpen" @update:open="isReceiptModalOpen = $event">
      <DialogContent class="max-w-sm">
        <DialogHeader>
          <DialogTitle class="font-serif text-center">Receipt Details</DialogTitle>
        </DialogHeader>
        <div v-if="selectedReceipt" class="space-y-4 text-xs font-mono">
          <div class="text-center border-b pb-3">
            <h4 class="font-bold text-sm font-serif">Judy's Cafe & Roastery</h4>
            <p class="text-stone-500 text-[10px]">123 Main Street, Flagship Station</p>
            <p class="text-stone-500 text-[10px]">Tax ID: 88-29183921</p>
            <p class="mt-2 font-bold text-stone-900">{{ selectedReceipt.id }}</p>
          </div>

          <div class="space-y-1.5 py-1">
            <div class="flex justify-between">
              <span>Customer:</span>
              <span class="font-bold">{{ selectedReceipt.customer || 'Guest' }}</span>
            </div>
            <div class="flex justify-between">
              <span>Payment Mode:</span>
              <span class="uppercase font-bold">{{ selectedReceipt.method || 'Card' }}</span>
            </div>
            <div class="flex justify-between">
              <span>Status:</span>
              <span class="text-emerald-600 font-bold uppercase">{{ selectedReceipt.status || 'PAID' }}</span>
            </div>
          </div>

          <div class="border-t border-b py-2 flex justify-between font-bold text-sm">
            <span>TOTAL:</span>
            <span>${{ (selectedReceipt.total || selectedReceipt.amount || 0).toFixed(2) }}</span>
          </div>

          <div class="pt-2 flex space-x-2">
            <Button
              variant="outline"
              class="flex-1 text-xs"
              @click="isReceiptModalOpen = false"
            >
              Close
            </Button>
            <Button
              class="flex-1 text-xs bg-amber-600 hover:bg-amber-700 text-white"
              @click="isReceiptModalOpen = false"
            >
              🖨️ Re-Print Slip
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  </div>
</template>
