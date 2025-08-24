<script setup lang="ts">
import { ref, computed } from 'vue'
import { useAnalyticsStore } from '@/stores/analytics'
import { useBranchesStore } from '@/stores/branches'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Dialog } from '@/components/ui/dialog'
import {
  ChartBarIcon,
  CurrencyDollarIcon,
  UsersIcon,
  ClockIcon,
  EyeIcon,
  CalendarIcon,
  ArrowUpIcon,
  ArrowDownIcon,
} from '@heroicons/vue/24/outline'

const analyticsStore = useAnalyticsStore()
const branchesStore = useBranchesStore()

const activeTab = ref('overview')
const selectedTimeRange = ref('30d')
const showForecastDialog = ref(false)
const forecastDays = ref(30)

// Computed
const kpiCards = computed(() => {
  return analyticsStore.kpis.map((kpi) => ({
    ...kpi,
    icon: getKPIIcon(kpi.category),
    color: getKPIColor(kpi.trend, kpi.value >= kpi.target),
  }))
})

const realtimeMetrics = computed(() => {
  return analyticsStore.realtimeDashboard.liveMetrics
})

// Functions
function getKPIIcon(category: string) {
  const icons: Record<string, typeof ChartBarIcon> = {
    sales: CurrencyDollarIcon,
    operations: ClockIcon,
    customer: UsersIcon,
    financial: ChartBarIcon,
  }
  return icons[category] || ChartBarIcon
}

function getKPIColor(trend: string, metTarget: boolean) {
  if (trend === 'up' && metTarget) return 'text-green-600'
  if (trend === 'down') return 'text-red-600'
  return 'text-blue-600'
}

function getTrendIcon(trend: string) {
  return trend === 'up' ? ArrowUpIcon : trend === 'down' ? ArrowDownIcon : null
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount)
}

function formatPercentage(value: number) {
  return `${value.toFixed(1)}%`
}

function generateForecast() {
  analyticsStore.generateForecast('daily', Number(forecastDays.value))
  showForecastDialog.value = false
}

function changeTab(tab: string) {
  activeTab.value = tab
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex justify-between items-center">
      <div>
        <h1 class="text-3xl font-bold">Analytics & Business Intelligence</h1>
        <p class="text-gray-600 mt-1">Advanced insights and data-driven decision making</p>
      </div>
      <div class="flex space-x-2">
        <select v-model="selectedTimeRange" class="border rounded px-3 py-2">
          <option value="7d">Last 7 Days</option>
          <option value="30d">Last 30 Days</option>
          <option value="90d">Last 90 Days</option>
          <option value="1y">Last Year</option>
        </select>
        <Button @click="showForecastDialog = true" class="border border-gray-300">
          Generate Forecast
        </Button>
      </div>
    </div>

    <!-- Real-time Dashboard Header -->
    <div class="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg p-6">
      <div class="flex justify-between items-center">
        <div>
          <h2 class="text-xl font-semibold">Real-time Dashboard</h2>
          <p class="text-blue-100">Live metrics for {{ branchesStore.selectedBranch?.name }}</p>
        </div>
        <div class="text-right">
          <p class="text-blue-100">Last Updated</p>
          <p class="font-semibold">
            {{ analyticsStore.realtimeDashboard.currentTime.toLocaleTimeString() }}
          </p>
        </div>
      </div>
    </div>

    <!-- KPI Cards -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
      <Card v-for="kpi in kpiCards" :key="kpi.name" class="relative overflow-hidden">
        <CardHeader class="pb-2">
          <div class="flex items-center justify-between">
            <component :is="kpi.icon" class="h-5 w-5 text-gray-600" />
            <span class="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">
              {{ kpi.period.toUpperCase() }}
            </span>
          </div>
          <h3 class="text-sm font-medium text-gray-600">{{ kpi.name }}</h3>
        </CardHeader>
        <CardContent>
          <div class="space-y-1">
            <div class="flex items-center justify-between">
              <span class="text-2xl font-bold" :class="kpi.color">
                {{
                  kpi.unit === 'USD'
                    ? formatCurrency(kpi.value)
                    : kpi.unit === '%'
                      ? formatPercentage(kpi.value)
                      : `${kpi.value.toFixed(1)}${kpi.unit === 'orders' ? '' : kpi.unit}`
                }}
              </span>
              <component
                v-if="getTrendIcon(kpi.trend)"
                :is="getTrendIcon(kpi.trend)"
                class="h-4 w-4"
                :class="kpi.color"
              />
            </div>
            <div class="flex items-center justify-between text-sm">
              <span class="text-gray-500"
                >Target:
                {{
                  kpi.unit === 'USD'
                    ? formatCurrency(kpi.target)
                    : kpi.unit === '%'
                      ? formatPercentage(kpi.target)
                      : `${kpi.target}${kpi.unit === 'orders' ? '' : kpi.unit}`
                }}</span
              >
              <span :class="kpi.color" class="font-medium">
                {{ kpi.changePercent > 0 ? '+' : '' }}{{ formatPercentage(kpi.changePercent) }}
              </span>
            </div>
            <div class="w-full bg-gray-200 rounded-full h-1 mt-2">
              <div
                class="h-1 rounded-full"
                :class="kpi.value >= kpi.target ? 'bg-green-500' : 'bg-blue-500'"
                :style="`width: ${Math.min((kpi.value / kpi.target) * 100, 100)}%`"
              ></div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>

    <!-- Live Metrics -->
    <div class="grid grid-cols-1 md:grid-cols-5 gap-4">
      <Card>
        <CardHeader class="pb-2">
          <h3 class="text-sm font-medium">Current Orders</h3>
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-bold text-orange-600">{{ realtimeMetrics.currentOrders }}</div>
          <p class="text-xs text-gray-600">Active orders</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader class="pb-2">
          <h3 class="text-sm font-medium">Queue Length</h3>
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-bold text-blue-600">{{ realtimeMetrics.ordersInQueue }}</div>
          <p class="text-xs text-gray-600">Orders waiting</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader class="pb-2">
          <h3 class="text-sm font-medium">Avg Wait Time</h3>
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-bold text-purple-600">
            {{ realtimeMetrics.averageWaitTime }}m
          </div>
          <p class="text-xs text-gray-600">Minutes</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader class="pb-2">
          <h3 class="text-sm font-medium">Staff On Duty</h3>
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-bold text-green-600">{{ realtimeMetrics.staffOnDuty }}</div>
          <p class="text-xs text-gray-600">Employees</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader class="pb-2">
          <h3 class="text-sm font-medium">Stock Alerts</h3>
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-bold text-red-600">{{ realtimeMetrics.lowStockAlerts }}</div>
          <p class="text-xs text-gray-600">Low stock items</p>
        </CardContent>
      </Card>
    </div>

    <!-- Tab Navigation -->
    <div class="bg-white rounded-lg border">
      <div class="border-b border-gray-200">
        <nav class="flex space-x-8 px-6">
          <button
            v-for="tab in ['overview', 'forecasting', 'insights']"
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
        <div v-if="activeTab === 'overview'" class="space-y-4">
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <!-- Hourly Trends -->
            <Card>
              <CardHeader>
                <h3 class="flex items-center text-lg font-semibold">
                  <ChartBarIcon class="h-5 w-5 mr-2" />
                  Today's Hourly Trends
                </h3>
              </CardHeader>
              <CardContent>
                <div class="space-y-3">
                  <div
                    v-for="trend in analyticsStore.realtimeDashboard.hourlyTrends.slice(6, 22)"
                    :key="trend.hour"
                    class="flex items-center justify-between"
                  >
                    <span class="text-sm font-medium">{{ trend.hour }}:00</span>
                    <div class="flex items-center space-x-3 flex-1 mx-4">
                      <div class="flex-1 bg-gray-200 rounded-full h-2">
                        <div
                          class="bg-blue-600 h-2 rounded-full"
                          :style="`width: ${(trend.sales / 100) * 100}%`"
                        ></div>
                      </div>
                      <span class="text-sm text-gray-600 w-16 text-right">
                        {{ formatCurrency(trend.sales) }}
                      </span>
                    </div>
                    <span class="text-sm text-gray-500 w-12 text-right"
                      >{{ trend.orders }} orders</span
                    >
                  </div>
                </div>
              </CardContent>
            </Card>

            <!-- Performance Highlights -->
            <Card>
              <CardHeader>
                <h3 class="flex items-center text-lg font-semibold">
                  <EyeIcon class="h-5 w-5 mr-2" />
                  Performance Highlights
                </h3>
              </CardHeader>
              <CardContent>
                <div class="space-y-4">
                  <div class="flex items-center justify-between p-3 bg-green-50 rounded">
                    <div>
                      <p class="font-medium text-green-800">Best Sales Hour</p>
                      <p class="text-sm text-green-600">12:00 PM - 1:00 PM</p>
                    </div>
                    <div class="text-right">
                      <p class="font-bold text-green-800">{{ formatCurrency(85.5) }}</p>
                      <p class="text-sm text-green-600">15 orders</p>
                    </div>
                  </div>

                  <div class="flex items-center justify-between p-3 bg-blue-50 rounded">
                    <div>
                      <p class="font-medium text-blue-800">Customer Satisfaction</p>
                      <p class="text-sm text-blue-600">Average rating today</p>
                    </div>
                    <div class="text-right">
                      <p class="font-bold text-blue-800">4.7/5.0</p>
                      <p class="text-sm text-blue-600">⭐⭐⭐⭐⭐</p>
                    </div>
                  </div>

                  <div class="flex items-center justify-between p-3 bg-purple-50 rounded">
                    <div>
                      <p class="font-medium text-purple-800">Staff Efficiency</p>
                      <p class="text-sm text-purple-600">Orders per staff member</p>
                    </div>
                    <div class="text-right">
                      <p class="font-bold text-purple-800">12.3</p>
                      <p class="text-sm text-purple-600">Above target</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <!-- Forecasting Tab -->
        <div v-else-if="activeTab === 'forecasting'" class="space-y-4">
          <Card>
            <CardHeader>
              <h3 class="flex items-center text-lg font-semibold">
                <CalendarIcon class="h-5 w-5 mr-2" />
                Sales Forecasting
              </h3>
            </CardHeader>
            <CardContent>
              <div class="space-y-4">
                <div
                  v-for="forecast in analyticsStore.branchAnalytics[
                    branchesStore.selectedBranchId!
                  ]?.forecasts?.slice(0, 7) || []"
                  :key="forecast.date.toISOString()"
                  class="flex items-center justify-between p-3 border rounded"
                >
                  <div>
                    <p class="font-medium">{{ forecast.date.toLocaleDateString() }}</p>
                    <p class="text-sm text-gray-600">
                      {{ forecast.date.toLocaleDateString('en-US', { weekday: 'long' }) }}
                    </p>
                  </div>
                  <div class="text-center">
                    <p class="font-bold text-lg">{{ formatCurrency(forecast.predictedSales) }}</p>
                    <div class="flex items-center space-x-2 mt-1">
                      <div class="w-16 bg-gray-200 rounded-full h-1">
                        <div
                          class="bg-blue-500 h-1 rounded-full"
                          :style="`width: ${forecast.confidence}%`"
                        ></div>
                      </div>
                      <span class="text-xs text-gray-500"
                        >{{ Math.round(forecast.confidence) }}% confidence</span
                      >
                    </div>
                  </div>
                  <div class="text-right">
                    <p v-if="forecast.factors.weather" class="text-xs text-gray-500">
                      {{ forecast.factors.weather }}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <!-- Insights Tab -->
        <div v-else-if="activeTab === 'insights'" class="space-y-4">
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <h3 class="text-lg font-semibold">Business Intelligence</h3>
              </CardHeader>
              <CardContent>
                <div class="space-y-4">
                  <div class="p-3 bg-yellow-50 border border-yellow-200 rounded">
                    <h4 class="font-medium text-yellow-800">⚠️ Actionable Insights</h4>
                    <p class="text-sm text-yellow-700 mt-1">
                      Peak hours are 12-2 PM. Consider adding staff during lunch rush.
                    </p>
                  </div>

                  <div class="p-3 bg-green-50 border border-green-200 rounded">
                    <h4 class="font-medium text-green-800">📈 Growth Opportunity</h4>
                    <p class="text-sm text-green-700 mt-1">
                      Weekend sales are 30% higher. Expand weekend promotions.
                    </p>
                  </div>

                  <div class="p-3 bg-blue-50 border border-blue-200 rounded">
                    <h4 class="font-medium text-blue-800">👥 Customer Behavior</h4>
                    <p class="text-sm text-blue-700 mt-1">
                      VIP customers prefer morning visits. Schedule best staff early.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <h3 class="text-lg font-semibold">Customer Analytics</h3>
              </CardHeader>
              <CardContent>
                <div class="space-y-4">
                  <div class="p-4 bg-blue-50 rounded">
                    <h4 class="font-semibold text-blue-800">Customer Acquisition</h4>
                    <p class="text-sm text-blue-600 mt-1">Cost per new customer</p>
                    <p class="text-xl font-bold text-blue-800 mt-2">{{ formatCurrency(25.5) }}</p>
                  </div>

                  <div class="p-4 bg-green-50 rounded">
                    <h4 class="font-semibold text-green-800">Conversion Rate</h4>
                    <p class="text-sm text-green-600 mt-1">Visitors to customers</p>
                    <p class="text-xl font-bold text-green-800 mt-2">
                      {{ formatPercentage(68.5) }}
                    </p>
                  </div>

                  <div class="p-4 bg-purple-50 rounded">
                    <h4 class="font-semibold text-purple-800">Repeat Customers</h4>
                    <p class="text-sm text-purple-600 mt-1">Customer retention rate</p>
                    <p class="text-xl font-bold text-purple-800 mt-2">
                      {{ formatPercentage(45.8) }}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>

    <!-- Generate Forecast Dialog -->
    <Dialog v-if="showForecastDialog">
      <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div class="bg-white rounded-lg p-6 w-96">
          <h3 class="text-lg font-semibold mb-4">Generate Sales Forecast</h3>
          <div class="space-y-4">
            <div>
              <label class="text-sm font-medium">Forecast Period (Days)</label>
              <select v-model="forecastDays" class="w-full border rounded px-3 py-2 mt-1">
                <option :value="7">7 Days</option>
                <option :value="14">14 Days</option>
                <option :value="30">30 Days</option>
                <option :value="90">90 Days</option>
              </select>
            </div>
            <div class="flex justify-end space-x-2">
              <Button @click="showForecastDialog = false" class="border border-gray-300"
                >Cancel</Button
              >
              <Button @click="generateForecast">Generate</Button>
            </div>
          </div>
        </div>
      </div>
    </Dialog>
  </div>
</template>
