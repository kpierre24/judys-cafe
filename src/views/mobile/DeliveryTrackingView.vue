<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useCRMStore } from '@/stores/crm'
import { useBranchesStore } from '@/stores/branches'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import {
  TruckIcon,
  MapPinIcon,
  ClockIcon,
  PhoneIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowPathIcon,
  UserIcon,
} from '@heroicons/vue/24/outline'

const crmStore = useCRMStore()
const branchesStore = useBranchesStore()

const currentTab = ref('active')
const selectedDelivery = ref<any | null>(null)
const driverLocation = ref({ lat: 40.7128, lng: -74.006 })

// Mock delivery driver info
const currentDriver = ref({
  id: 'driver-1',
  name: 'Alex Rodriguez',
  phone: '+1-555-0301',
  vehicle: 'Honda Civic - ABC123',
  rating: 4.8,
  deliveriesCompleted: 156,
})

// Mock delivery orders
const deliveryOrders = ref([
  {
    id: 'delivery-1',
    orderId: 'ORD-001',
    customer: {
      name: 'Sarah Johnson',
      phone: '+1-555-0201',
      address: '123 Main St, Coffee City, CA 90210',
    },
    items: [
      { name: 'Cappuccino x2', price: 9.0 },
      { name: 'Croissant', price: 3.5 },
    ],
    total: 12.5,
    status: 'assigned',
    assignedAt: new Date(Date.now() - 10 * 60 * 1000),
    estimatedDelivery: new Date(Date.now() + 15 * 60 * 1000),
    distance: '1.2 miles',
    customerLocation: { lat: 40.7589, lng: -73.9851 },
    specialInstructions: 'Ring doorbell, apartment 4B',
  },
  {
    id: 'delivery-2',
    orderId: 'ORD-002',
    customer: {
      name: 'Mike Chen',
      phone: '+1-555-0202',
      address: '456 Oak Ave, Bean Town, CA 90211',
    },
    items: [
      { name: 'Americano', price: 4.5 },
      { name: 'Muffin', price: 2.75 },
    ],
    total: 7.25,
    status: 'picked_up',
    assignedAt: new Date(Date.now() - 25 * 60 * 1000),
    pickedUpAt: new Date(Date.now() - 5 * 60 * 1000),
    estimatedDelivery: new Date(Date.now() + 8 * 60 * 1000),
    distance: '0.8 miles',
    customerLocation: { lat: 40.7505, lng: -73.9934 },
    specialInstructions: 'Leave at front desk',
  },
  {
    id: 'delivery-3',
    orderId: 'ORD-003',
    customer: {
      name: 'Lisa Wang',
      phone: '+1-555-0203',
      address: '789 Pine St, Espresso Heights, CA 90212',
    },
    items: [
      { name: 'Latte x3', price: 13.5 },
      { name: 'Sandwich x2', price: 15.0 },
    ],
    total: 28.5,
    status: 'delivered',
    assignedAt: new Date(Date.now() - 45 * 60 * 1000),
    pickedUpAt: new Date(Date.now() - 30 * 60 * 1000),
    deliveredAt: new Date(Date.now() - 5 * 60 * 1000),
    distance: '2.1 miles',
    customerLocation: { lat: 40.7282, lng: -73.7949 },
  },
])

// Computed
const activeDeliveries = computed(() =>
  deliveryOrders.value.filter((order) => ['assigned', 'picked_up'].includes(order.status)),
)

const completedDeliveries = computed(() =>
  deliveryOrders.value.filter((order) => order.status === 'delivered'),
)

const nextDelivery = computed(
  () =>
    activeDeliveries.value.find((order) => order.status === 'assigned') ||
    activeDeliveries.value[0],
)

const currentDelivery = computed(() =>
  activeDeliveries.value.find((order) => order.status === 'picked_up'),
)

const todaysStats = computed(() => ({
  totalDeliveries: deliveryOrders.value.length,
  completed: completedDeliveries.value.length,
  active: activeDeliveries.value.length,
  totalEarnings: deliveryOrders.value
    .filter((order) => order.status === 'delivered')
    .reduce((sum, order) => sum + order.total * 0.15, 0), // 15% commission
}))

// Functions
function updateOrderStatus(orderId: string, status: string) {
  const order = deliveryOrders.value.find((o) => o.id === orderId)
  if (order) {
    order.status = status
    if (status === 'picked_up') {
      order.pickedUpAt = new Date()
    } else if (status === 'delivered') {
      order.deliveredAt = new Date()
    }
  }
}

function simulateLocationUpdate() {
  // Simulate GPS movement
  const variation = 0.001
  driverLocation.value = {
    lat: driverLocation.value.lat + (Math.random() - 0.5) * variation,
    lng: driverLocation.value.lng + (Math.random() - 0.5) * variation,
  }
}

function markAsPickedUp(orderId: string) {
  updateOrderStatus(orderId, 'picked_up')
}

function markAsDelivered(orderId: string) {
  updateOrderStatus(orderId, 'delivered')
}

function callCustomer(phone: string) {
  // Simulate call functionality
  alert(`Calling ${phone}...`)
}

function openNavigation(address: string) {
  // Simulate navigation app opening
  alert(`Opening navigation to: ${address}`)
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
    assigned: 'bg-blue-100 text-blue-800',
    picked_up: 'bg-orange-100 text-orange-800',
    delivered: 'bg-green-100 text-green-800',
  }
  return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800'
}

function changeTab(tab: string) {
  currentTab.value = tab
}

// Simulate live location updates
onMounted(() => {
  setInterval(simulateLocationUpdate, 5000) // Update every 5 seconds
})
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Header -->
    <div class="bg-gradient-to-r from-green-600 to-blue-600 text-white p-4 sticky top-0 z-10">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-xl font-bold">Delivery Tracker</h1>
          <p class="text-sm text-green-100">{{ currentDriver.name }}</p>
        </div>
        <div class="flex items-center space-x-3">
          <div class="text-right">
            <p class="text-sm font-medium">
              {{ todaysStats.completed }}/{{ todaysStats.totalDeliveries }}
            </p>
            <p class="text-xs text-green-100">Today</p>
          </div>
          <div class="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
            <TruckIcon class="h-6 w-6" />
          </div>
        </div>
      </div>
    </div>

    <!-- Driver Stats -->
    <div class="p-4">
      <div class="grid grid-cols-3 gap-3 mb-4">
        <Card>
          <CardContent class="p-3 text-center">
            <p class="text-lg font-bold text-green-600">{{ todaysStats.completed }}</p>
            <p class="text-xs text-gray-600">Completed</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent class="p-3 text-center">
            <p class="text-lg font-bold text-blue-600">{{ todaysStats.active }}</p>
            <p class="text-xs text-gray-600">Active</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent class="p-3 text-center">
            <p class="text-lg font-bold text-purple-600">
              {{ formatCurrency(todaysStats.totalEarnings) }}
            </p>
            <p class="text-xs text-gray-600">Earnings</p>
          </CardContent>
        </Card>
      </div>
    </div>

    <!-- Current Delivery Priority -->
    <div v-if="currentDelivery" class="px-4 mb-4">
      <Card class="border-orange-200 bg-orange-50">
        <CardHeader class="pb-3">
          <h3 class="text-lg font-semibold text-orange-800 flex items-center">
            <TruckIcon class="h-5 w-5 mr-2" />
            Current Delivery - En Route
          </h3>
        </CardHeader>
        <CardContent>
          <div class="space-y-3">
            <div class="flex items-center justify-between">
              <div>
                <p class="font-semibold">{{ currentDelivery.customer.name }}</p>
                <p class="text-sm text-gray-600">{{ currentDelivery.customer.address }}</p>
              </div>
              <span
                class="px-3 py-1 bg-orange-200 text-orange-800 rounded-full text-sm font-medium"
              >
                {{ currentDelivery.distance }}
              </span>
            </div>

            <div class="flex items-center space-x-2 text-sm text-gray-600">
              <ClockIcon class="h-4 w-4" />
              <span>ETA: {{ formatTime(currentDelivery.estimatedDelivery) }}</span>
            </div>

            <div class="space-y-1">
              <p class="text-sm font-medium">Order Items:</p>
              <div class="text-sm text-gray-600">
                <p v-for="item in currentDelivery.items" :key="item.name">{{ item.name }}</p>
              </div>
            </div>

            <div
              v-if="currentDelivery.specialInstructions"
              class="p-2 bg-yellow-50 border border-yellow-200 rounded"
            >
              <p class="text-sm">
                <strong>Special Instructions:</strong> {{ currentDelivery.specialInstructions }}
              </p>
            </div>

            <div class="grid grid-cols-3 gap-2 mt-4">
              <Button @click="callCustomer(currentDelivery.customer.phone)" class="text-sm h-9">
                <PhoneIcon class="h-4 w-4 mr-1" />
                Call
              </Button>
              <Button @click="openNavigation(currentDelivery.customer.address)" class="text-sm h-9">
                <ArrowPathIcon class="h-4 w-4 mr-1" />
                Navigate
              </Button>
              <Button
                @click="markAsDelivered(currentDelivery.id)"
                class="text-sm h-9 bg-green-600 hover:bg-green-700"
              >
                <CheckCircleIcon class="h-4 w-4 mr-1" />
                Delivered
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>

    <!-- Next Delivery -->
    <div v-if="nextDelivery && !currentDelivery" class="px-4 mb-4">
      <Card class="border-blue-200 bg-blue-50">
        <CardHeader class="pb-3">
          <h3 class="text-lg font-semibold text-blue-800 flex items-center">
            <MapPinIcon class="h-5 w-5 mr-2" />
            Next Delivery
          </h3>
        </CardHeader>
        <CardContent>
          <div class="space-y-3">
            <div class="flex items-center justify-between">
              <div>
                <p class="font-semibold">{{ nextDelivery.customer.name }}</p>
                <p class="text-sm text-gray-600">{{ nextDelivery.customer.address }}</p>
              </div>
              <span class="px-3 py-1 bg-blue-200 text-blue-800 rounded-full text-sm font-medium">
                {{ nextDelivery.distance }}
              </span>
            </div>

            <div class="flex items-center space-x-2 text-sm text-gray-600">
              <ClockIcon class="h-4 w-4" />
              <span>Ready for pickup</span>
            </div>

            <div class="space-y-1">
              <p class="text-sm font-medium">Order Items:</p>
              <div class="text-sm text-gray-600">
                <p v-for="item in nextDelivery.items" :key="item.name">{{ item.name }}</p>
              </div>
            </div>

            <Button
              @click="markAsPickedUp(nextDelivery.id)"
              class="w-full bg-blue-600 hover:bg-blue-700"
            >
              <CheckCircleIcon class="h-4 w-4 mr-2" />
              Mark as Picked Up
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>

    <!-- Main Content -->
    <div class="pb-20">
      <!-- Active Deliveries Tab -->
      <div v-if="currentTab === 'active'" class="px-4 space-y-4">
        <h3 class="text-lg font-semibold">Active Deliveries</h3>

        <div v-if="activeDeliveries.length === 0" class="text-center py-8">
          <TruckIcon class="h-12 w-12 mx-auto text-gray-300 mb-2" />
          <p class="text-gray-500">No active deliveries</p>
        </div>

        <Card v-for="delivery in activeDeliveries" :key="delivery.id">
          <CardContent class="p-4">
            <div class="flex items-center justify-between mb-3">
              <div>
                <p class="font-semibold">{{ delivery.customer.name }}</p>
                <p class="text-sm text-gray-600">Order #{{ delivery.orderId }}</p>
              </div>
              <span
                :class="`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(delivery.status)}`"
              >
                {{ delivery.status.replace('_', ' ').toUpperCase() }}
              </span>
            </div>

            <div class="space-y-2 text-sm">
              <div class="flex items-center space-x-2">
                <MapPinIcon class="h-4 w-4 text-gray-400" />
                <span>{{ delivery.customer.address }}</span>
              </div>
              <div class="flex items-center space-x-2">
                <ClockIcon class="h-4 w-4 text-gray-400" />
                <span>ETA: {{ formatTime(delivery.estimatedDelivery) }}</span>
              </div>
            </div>

            <div class="flex items-center justify-between mt-3 pt-3 border-t">
              <span class="font-medium">{{ formatCurrency(delivery.total) }}</span>
              <div class="flex space-x-2">
                <Button @click="callCustomer(delivery.customer.phone)" class="text-xs h-7 px-2">
                  <PhoneIcon class="h-3 w-3" />
                </Button>
                <Button @click="openNavigation(delivery.customer.address)" class="text-xs h-7 px-2">
                  <ArrowPathIcon class="h-3 w-3" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <!-- Completed Deliveries Tab -->
      <div v-if="currentTab === 'completed'" class="px-4 space-y-4">
        <h3 class="text-lg font-semibold">Completed Deliveries</h3>

        <Card v-for="delivery in completedDeliveries" :key="delivery.id">
          <CardContent class="p-4">
            <div class="flex items-center justify-between mb-3">
              <div>
                <p class="font-semibold">{{ delivery.customer.name }}</p>
                <p class="text-sm text-gray-600">Order #{{ delivery.orderId }}</p>
              </div>
              <span class="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                DELIVERED
              </span>
            </div>

            <div class="space-y-2 text-sm">
              <div class="flex items-center space-x-2">
                <MapPinIcon class="h-4 w-4 text-gray-400" />
                <span>{{ delivery.customer.address }}</span>
              </div>
              <div class="flex items-center space-x-2">
                <CheckCircleIcon class="h-4 w-4 text-green-500" />
                <span>Delivered at {{ formatTime(delivery.deliveredAt!) }}</span>
              </div>
            </div>

            <div class="flex items-center justify-between mt-3 pt-3 border-t">
              <div>
                <span class="font-medium">{{ formatCurrency(delivery.total) }}</span>
                <span class="text-sm text-gray-500 ml-2">
                  ({{ formatCurrency(delivery.total * 0.15) }} earned)
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <!-- Profile Tab -->
      <div v-if="currentTab === 'profile'" class="px-4 space-y-4">
        <Card>
          <CardContent class="p-4">
            <div class="flex items-center space-x-4 mb-4">
              <div class="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center">
                <UserIcon class="h-8 w-8 text-white" />
              </div>
              <div>
                <h3 class="font-semibold">{{ currentDriver.name }}</h3>
                <p class="text-sm text-gray-600">{{ currentDriver.vehicle }}</p>
                <div class="flex items-center space-x-1 mt-1">
                  <span class="text-yellow-500">⭐</span>
                  <span class="text-sm">{{ currentDriver.rating }} rating</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <!-- Driver Stats -->
        <Card>
          <CardHeader class="pb-3">
            <h3 class="text-lg font-semibold">Driver Statistics</h3>
          </CardHeader>
          <CardContent>
            <div class="grid grid-cols-2 gap-4">
              <div class="text-center p-3 bg-blue-50 rounded-lg">
                <p class="text-lg font-bold text-blue-600">
                  {{ currentDriver.deliveriesCompleted }}
                </p>
                <p class="text-xs text-blue-600">Total Deliveries</p>
              </div>
              <div class="text-center p-3 bg-green-50 rounded-lg">
                <p class="text-lg font-bold text-green-600">{{ currentDriver.rating }}</p>
                <p class="text-xs text-green-600">Average Rating</p>
              </div>
              <div class="text-center p-3 bg-purple-50 rounded-lg">
                <p class="text-lg font-bold text-purple-600">{{ todaysStats.completed }}</p>
                <p class="text-xs text-purple-600">Today's Deliveries</p>
              </div>
              <div class="text-center p-3 bg-yellow-50 rounded-lg">
                <p class="text-lg font-bold text-yellow-600">
                  {{ formatCurrency(todaysStats.totalEarnings) }}
                </p>
                <p class="text-xs text-yellow-600">Today's Earnings</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <!-- Vehicle Info -->
        <Card>
          <CardHeader class="pb-3">
            <h3 class="text-lg font-semibold">Vehicle Information</h3>
          </CardHeader>
          <CardContent>
            <div class="space-y-3">
              <div class="flex justify-between">
                <span class="text-gray-600">Vehicle</span>
                <span class="font-medium">{{ currentDriver.vehicle }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-600">Status</span>
                <span class="text-green-600 font-medium">Active</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-600">GPS Location</span>
                <span class="font-medium">
                  {{ driverLocation.lat.toFixed(4) }}, {{ driverLocation.lng.toFixed(4) }}
                </span>
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
          @click="changeTab('active')"
          :class="[
            'flex flex-col items-center justify-center space-y-1',
            currentTab === 'active' ? 'text-blue-600 bg-blue-50' : 'text-gray-600',
          ]"
        >
          <TruckIcon class="h-5 w-5" />
          <span class="text-xs">Active</span>
          <span
            v-if="activeDeliveries.length > 0"
            class="absolute top-1 ml-6 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center"
          >
            {{ activeDeliveries.length }}
          </span>
        </button>

        <button
          @click="changeTab('completed')"
          :class="[
            'flex flex-col items-center justify-center space-y-1',
            currentTab === 'completed' ? 'text-blue-600 bg-blue-50' : 'text-gray-600',
          ]"
        >
          <CheckCircleIcon class="h-5 w-5" />
          <span class="text-xs">Completed</span>
        </button>

        <button
          @click="changeTab('profile')"
          :class="[
            'flex flex-col items-center justify-center space-y-1',
            currentTab === 'profile' ? 'text-blue-600 bg-blue-50' : 'text-gray-600',
          ]"
        >
          <UserIcon class="h-5 w-5" />
          <span class="text-xs">Profile</span>
        </button>
      </div>
    </div>
  </div>
</template>
