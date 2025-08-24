<script setup lang="ts">
import { ref, computed } from 'vue'
import { useSalesStore } from '@/stores/sales'
import { useCRMStore } from '@/stores/crm'
import { useBranchesStore } from '@/stores/branches'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  ShoppingCartIcon,
  StarIcon,
  MapPinIcon,
  ClockIcon,
  GiftIcon,
  UserIcon,
  MagnifyingGlassIcon,
  HeartIcon,
  PlusIcon,
  MinusIcon,
} from '@heroicons/vue/24/outline'
import type { Product } from '@/stores/sales'
import type { Customer } from '@/stores/crm'

const salesStore = useSalesStore()
const crmStore = useCRMStore()
const branchesStore = useBranchesStore()

const currentTab = ref('menu')
const searchQuery = ref('')
const selectedCategory = ref('all')
const cart = ref<Array<{ product: Product; quantity: number; customizations: string[] }>>([])
const showItemDetails = ref(false)
const selectedItem = ref<Product | null>(null)

// Mock customer for demo
const currentCustomer = computed((): Customer => {
  return (
    crmStore.customers[0] || {
      id: 'demo-customer',
      customerId: 'DEMO001',
      firstName: 'Demo',
      lastName: 'Customer',
      email: 'demo@customer.com',
      phone: '+1-555-0100',
      loyaltyCard: {
        number: 'LC10000',
        points: 850,
        tier: 'gold',
        joinDate: new Date('2023-01-01'),
        lastVisit: new Date(),
        totalSpent: 456.75,
        visitCount: 28,
      },
      preferences: {
        favoriteProducts: ['1', '3'],
        allergens: [],
        dietaryRestrictions: [],
        communicationPreference: 'email',
      },
      isActive: true,
      createdAt: new Date('2023-01-01'),
      branchId: branchesStore.selectedBranchId || 'branch-1',
    }
  )
})

const filteredProducts = computed(() => {
  let products = salesStore.products

  if (selectedCategory.value !== 'all') {
    products = products.filter((p) => p.category === selectedCategory.value)
  }

  if (searchQuery.value) {
    products = products.filter(
      (p) =>
        p.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
        p.description?.toLowerCase().includes(searchQuery.value.toLowerCase()),
    )
  }

  return products
})

const categories = computed(() => {
  const cats = ['all', ...new Set(salesStore.products.map((p) => p.category))]
  return cats
})

const cartTotal = computed(() => {
  return cart.value.reduce((sum, item) => sum + item.product.price * item.quantity, 0)
})

const cartItemCount = computed(() => {
  return cart.value.reduce((sum, item) => sum + item.quantity, 0)
})

const favoriteProducts = computed(() => {
  return salesStore.products.filter((p) =>
    currentCustomer.value.preferences.favoriteProducts.includes(p.id),
  )
})

const recentOrders = computed(() => [
  {
    id: 'order-1',
    date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    total: 12.5,
    status: 'completed',
    items: ['Cappuccino', 'Croissant'],
  },
  {
    id: 'order-2',
    date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    total: 8.75,
    status: 'completed',
    items: ['Latte', 'Muffin'],
  },
  {
    id: 'order-3',
    date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    total: 15.25,
    status: 'completed',
    items: ['Americano', 'Sandwich', 'Cookie'],
  },
])

const currentOrder = ref({
  id: 'current-order-1',
  status: 'preparing',
  estimatedTime: 8,
  items: ['Cappuccino', 'Croissant'],
  total: 12.5,
})

// Functions
function addToCart(product: Product) {
  const existingItem = cart.value.find((item) => item.product.id === product.id)
  if (existingItem) {
    existingItem.quantity++
  } else {
    cart.value.push({
      product,
      quantity: 1,
      customizations: [],
    })
  }
}

function removeFromCart(productId: string) {
  const itemIndex = cart.value.findIndex((item) => item.product.id === productId)
  if (itemIndex !== -1) {
    if (cart.value[itemIndex].quantity > 1) {
      cart.value[itemIndex].quantity--
    } else {
      cart.value.splice(itemIndex, 1)
    }
  }
}

function getQuantityInCart(productId: string) {
  const item = cart.value.find((item) => item.product.id === productId)
  return item ? item.quantity : 0
}

function showDetails(product: Product) {
  selectedItem.value = product
  showItemDetails.value = true
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount)
}

function getTierColor(tier: string) {
  const colors = {
    bronze: 'text-orange-600',
    silver: 'text-gray-600',
    gold: 'text-yellow-600',
    platinum: 'text-purple-600',
  }
  return colors[tier as keyof typeof colors] || 'text-gray-600'
}

function placeOrder() {
  // Simulate order placement
  const order = {
    customerId: currentCustomer.value.id,
    branchId: branchesStore.selectedBranchId!,
    items: cart.value.map((item) => ({
      productId: item.product.id,
      quantity: item.quantity,
      customizations: item.customizations,
      price: item.product.price,
    })),
    subtotal: cartTotal.value,
    tax: cartTotal.value * 0.08,
    tip: 0,
    loyaltyPointsUsed: 0,
    loyaltyDiscount: 0,
    total: cartTotal.value * 1.08,
    orderType: 'pickup' as const,
    specialInstructions: '',
    paymentMethod: 'card' as const,
    estimatedTime: 10,
  }

  crmStore.placeMobileOrder(order)
  cart.value = []
  currentTab.value = 'orders'
}

function changeTab(tab: string) {
  currentTab.value = tab
}
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Header -->
    <div class="bg-white shadow-sm p-4 sticky top-0 z-10">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-xl font-bold text-gray-900">Judy's Cafe</h1>
          <div class="flex items-center space-x-1 text-sm text-gray-600">
            <MapPinIcon class="h-4 w-4" />
            <span>{{ branchesStore.selectedBranch?.name }}</span>
          </div>
        </div>
        <div class="flex items-center space-x-3">
          <div class="relative">
            <ShoppingCartIcon class="h-6 w-6 text-gray-700" />
            <span
              v-if="cartItemCount > 0"
              class="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center"
            >
              {{ cartItemCount }}
            </span>
          </div>
          <div class="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
            <UserIcon class="h-5 w-5 text-white" />
          </div>
        </div>
      </div>
    </div>

    <!-- Customer Info Banner -->
    <div class="bg-gradient-to-r from-yellow-400 to-yellow-500 text-white p-4">
      <div class="flex items-center justify-between">
        <div>
          <p class="font-semibold">
            {{ currentCustomer.firstName }} {{ currentCustomer.lastName }}
          </p>
          <p class="text-sm text-yellow-100 capitalize">
            {{ currentCustomer.loyaltyCard.tier }} Member
          </p>
        </div>
        <div class="text-right">
          <p class="font-bold">{{ currentCustomer.loyaltyCard.points }} points</p>
          <p class="text-sm text-yellow-100">Available</p>
        </div>
      </div>
    </div>

    <!-- Main Content -->
    <div class="pb-20">
      <!-- Menu Tab -->
      <div v-if="currentTab === 'menu'" class="p-4 space-y-4">
        <!-- Search -->
        <div class="relative">
          <MagnifyingGlassIcon
            class="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400"
          />
          <Input v-model="searchQuery" placeholder="Search menu items..." class="pl-10" />
        </div>

        <!-- Categories -->
        <div class="flex space-x-2 overflow-x-auto pb-2">
          <button
            v-for="category in categories"
            :key="category"
            @click="selectedCategory = category"
            :class="[
              'px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap',
              selectedCategory === category
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 border',
            ]"
          >
            {{ category === 'all' ? 'All' : category.charAt(0).toUpperCase() + category.slice(1) }}
          </button>
        </div>

        <!-- Favorites Section -->
        <div v-if="favoriteProducts.length > 0 && selectedCategory === 'all'">
          <h3 class="text-lg font-semibold mb-3 flex items-center">
            <HeartIcon class="h-5 w-5 mr-2 text-red-500" />
            Your Favorites
          </h3>
          <div class="grid grid-cols-2 gap-3 mb-6">
            <Card
              v-for="product in favoriteProducts.slice(0, 4)"
              :key="product.id"
              class="cursor-pointer"
              @click="showDetails(product)"
            >
              <CardContent class="p-3">
                <div
                  class="aspect-square bg-gray-200 rounded-lg mb-2 flex items-center justify-center"
                >
                  <span class="text-2xl">☕</span>
                </div>
                <h4 class="font-medium text-sm">{{ product.name }}</h4>
                <p class="text-green-600 font-bold">{{ formatCurrency(product.price) }}</p>
                <Button @click.stop="addToCart(product)" class="w-full mt-2 h-8 text-xs">
                  Add to Cart
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        <!-- All Products -->
        <div>
          <h3 class="text-lg font-semibold mb-3">Menu Items</h3>
          <div class="space-y-3">
            <Card
              v-for="product in filteredProducts"
              :key="product.id"
              class="cursor-pointer"
              @click="showDetails(product)"
            >
              <CardContent class="p-4">
                <div class="flex items-center space-x-4">
                  <div class="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
                    <span class="text-xl">{{
                      product.category === 'beverages' ? '☕' : '🥐'
                    }}</span>
                  </div>
                  <div class="flex-1">
                    <h4 class="font-semibold">{{ product.name }}</h4>
                    <p class="text-sm text-gray-600">{{ product.description }}</p>
                    <div class="flex items-center justify-between mt-2">
                      <span class="font-bold text-green-600">{{
                        formatCurrency(product.price)
                      }}</span>
                      <div class="flex items-center space-x-2">
                        <Button
                          v-if="getQuantityInCart(product.id) > 0"
                          @click.stop="removeFromCart(product.id)"
                          class="w-8 h-8 p-0 bg-red-500 hover:bg-red-600"
                        >
                          <MinusIcon class="h-4 w-4" />
                        </Button>
                        <span
                          v-if="getQuantityInCart(product.id) > 0"
                          class="w-8 text-center font-medium"
                        >
                          {{ getQuantityInCart(product.id) }}
                        </span>
                        <Button @click.stop="addToCart(product)" class="w-8 h-8 p-0">
                          <PlusIcon class="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <!-- Cart Tab -->
      <div v-if="currentTab === 'cart'" class="p-4 space-y-4">
        <h2 class="text-xl font-bold">Your Order</h2>

        <div v-if="cart.length === 0" class="text-center py-8">
          <ShoppingCartIcon class="h-16 w-16 mx-auto text-gray-300 mb-4" />
          <p class="text-gray-500">Your cart is empty</p>
          <Button @click="changeTab('menu')" class="mt-4">Browse Menu</Button>
        </div>

        <div v-else class="space-y-4">
          <Card v-for="item in cart" :key="item.product.id">
            <CardContent class="p-4">
              <div class="flex items-center justify-between">
                <div>
                  <h4 class="font-semibold">{{ item.product.name }}</h4>
                  <p class="text-sm text-gray-600">{{ formatCurrency(item.product.price) }} each</p>
                </div>
                <div class="flex items-center space-x-3">
                  <Button
                    @click="removeFromCart(item.product.id)"
                    class="w-8 h-8 p-0 bg-red-500 hover:bg-red-600"
                  >
                    <MinusIcon class="h-4 w-4" />
                  </Button>
                  <span class="w-8 text-center font-medium">{{ item.quantity }}</span>
                  <Button @click="addToCart(item.product)" class="w-8 h-8 p-0">
                    <PlusIcon class="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div class="flex justify-between items-center mt-2">
                <span class="text-sm text-gray-500">Subtotal</span>
                <span class="font-medium">{{
                  formatCurrency(item.product.price * item.quantity)
                }}</span>
              </div>
            </CardContent>
          </Card>

          <!-- Order Summary -->
          <Card>
            <CardContent class="p-4">
              <div class="space-y-2">
                <div class="flex justify-between">
                  <span>Subtotal</span>
                  <span>{{ formatCurrency(cartTotal) }}</span>
                </div>
                <div class="flex justify-between">
                  <span>Tax</span>
                  <span>{{ formatCurrency(cartTotal * 0.08) }}</span>
                </div>
                <div class="border-t pt-2 flex justify-between font-bold">
                  <span>Total</span>
                  <span>{{ formatCurrency(cartTotal * 1.08) }}</span>
                </div>
              </div>
              <Button @click="placeOrder" class="w-full mt-4"> Place Order </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      <!-- Orders Tab -->
      <div v-if="currentTab === 'orders'" class="p-4 space-y-4">
        <h2 class="text-xl font-bold">Orders</h2>

        <!-- Current Order -->
        <div v-if="currentOrder">
          <h3 class="text-lg font-semibold mb-3">Current Order</h3>
          <Card>
            <CardContent class="p-4">
              <div class="flex items-center justify-between mb-3">
                <span class="font-semibold">Order #{{ currentOrder.id.slice(-4) }}</span>
                <span
                  class="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm font-medium"
                >
                  {{ currentOrder.status.charAt(0).toUpperCase() + currentOrder.status.slice(1) }}
                </span>
              </div>
              <div class="flex items-center space-x-2 text-sm text-gray-600 mb-3">
                <ClockIcon class="h-4 w-4" />
                <span>Estimated {{ currentOrder.estimatedTime }} minutes</span>
              </div>
              <div class="space-y-1">
                <p v-for="item in currentOrder.items" :key="item" class="text-sm">{{ item }}</p>
              </div>
              <div class="flex justify-between items-center mt-3 pt-3 border-t">
                <span class="font-medium">Total</span>
                <span class="font-bold">{{ formatCurrency(currentOrder.total) }}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        <!-- Order History -->
        <div>
          <h3 class="text-lg font-semibold mb-3">Recent Orders</h3>
          <div class="space-y-3">
            <Card v-for="order in recentOrders" :key="order.id">
              <CardContent class="p-4">
                <div class="flex items-center justify-between mb-2">
                  <span class="font-semibold">Order #{{ order.id.slice(-4) }}</span>
                  <span class="text-sm text-gray-500">{{ order.date.toLocaleDateString() }}</span>
                </div>
                <div class="space-y-1">
                  <p v-for="item in order.items" :key="item" class="text-sm">{{ item }}</p>
                </div>
                <div class="flex justify-between items-center mt-3 pt-3 border-t">
                  <span class="font-medium">{{ formatCurrency(order.total) }}</span>
                  <Button class="text-sm h-8">Reorder</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <!-- Profile Tab -->
      <div v-if="currentTab === 'profile'" class="p-4 space-y-4">
        <h2 class="text-xl font-bold">Profile</h2>

        <!-- Customer Info -->
        <Card>
          <CardContent class="p-4">
            <div class="flex items-center space-x-4 mb-4">
              <div class="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center">
                <UserIcon class="h-8 w-8 text-white" />
              </div>
              <div>
                <h3 class="font-semibold">
                  {{ currentCustomer.firstName }} {{ currentCustomer.lastName }}
                </h3>
                <p class="text-sm text-gray-600">{{ currentCustomer.email }}</p>
                <p class="text-sm" :class="getTierColor(currentCustomer.loyaltyCard.tier)">
                  {{ currentCustomer.loyaltyCard.tier.toUpperCase() }} Member
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <!-- Loyalty Program -->
        <Card>
          <CardHeader class="pb-3">
            <h3 class="text-lg font-semibold flex items-center">
              <GiftIcon class="h-5 w-5 mr-2" />
              Loyalty Program
            </h3>
          </CardHeader>
          <CardContent>
            <div class="space-y-4">
              <div class="flex justify-between items-center">
                <span>Current Points</span>
                <span class="font-bold text-lg">{{ currentCustomer.loyaltyCard.points }}</span>
              </div>
              <div class="flex justify-between items-center">
                <span>Total Spent</span>
                <span class="font-medium">{{
                  formatCurrency(currentCustomer.loyaltyCard.totalSpent)
                }}</span>
              </div>
              <div class="flex justify-between items-center">
                <span>Visits</span>
                <span class="font-medium">{{ currentCustomer.loyaltyCard.visitCount }}</span>
              </div>
              <div class="pt-3 border-t">
                <p class="text-sm text-gray-600 mb-2">Progress to next tier</p>
                <div class="w-full bg-gray-200 rounded-full h-2">
                  <div class="bg-blue-500 h-2 rounded-full" style="width: 75%"></div>
                </div>
                <p class="text-xs text-gray-500 mt-1">75% to Platinum</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <!-- Stats -->
        <Card>
          <CardHeader class="pb-3">
            <h3 class="text-lg font-semibold">Your Stats</h3>
          </CardHeader>
          <CardContent>
            <div class="grid grid-cols-2 gap-4">
              <div class="text-center">
                <p class="text-2xl font-bold text-blue-600">
                  {{ currentCustomer.loyaltyCard.visitCount }}
                </p>
                <p class="text-xs text-gray-600">Total Visits</p>
              </div>
              <div class="text-center">
                <p class="text-2xl font-bold text-green-600">
                  {{ formatCurrency(currentCustomer.loyaltyCard.totalSpent) }}
                </p>
                <p class="text-xs text-gray-600">Total Spent</p>
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
          @click="changeTab('menu')"
          :class="[
            'flex flex-col items-center justify-center space-y-1',
            currentTab === 'menu' ? 'text-blue-600 bg-blue-50' : 'text-gray-600',
          ]"
        >
          <MagnifyingGlassIcon class="h-5 w-5" />
          <span class="text-xs">Menu</span>
        </button>

        <button
          @click="changeTab('cart')"
          :class="[
            'flex flex-col items-center justify-center space-y-1 relative',
            currentTab === 'cart' ? 'text-blue-600 bg-blue-50' : 'text-gray-600',
          ]"
        >
          <ShoppingCartIcon class="h-5 w-5" />
          <span class="text-xs">Cart</span>
          <span
            v-if="cartItemCount > 0"
            class="absolute top-1 right-6 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center"
          >
            {{ cartItemCount }}
          </span>
        </button>

        <button
          @click="changeTab('orders')"
          :class="[
            'flex flex-col items-center justify-center space-y-1',
            currentTab === 'orders' ? 'text-blue-600 bg-blue-50' : 'text-gray-600',
          ]"
        >
          <ClockIcon class="h-5 w-5" />
          <span class="text-xs">Orders</span>
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

    <!-- Item Details Modal -->
    <div v-if="showItemDetails" class="fixed inset-0 bg-black bg-opacity-50 flex items-end z-50">
      <div class="bg-white rounded-t-lg p-6 w-full max-h-96">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-semibold">{{ selectedItem?.name }}</h3>
          <Button @click="showItemDetails = false" class="text-gray-500">✕</Button>
        </div>
        <div class="space-y-4">
          <div class="w-full h-32 bg-gray-200 rounded-lg flex items-center justify-center">
            <span class="text-4xl">{{ selectedItem?.category === 'beverages' ? '☕' : '🥐' }}</span>
          </div>
          <p class="text-gray-600">{{ selectedItem?.description }}</p>
          <div class="flex items-center justify-between">
            <span class="text-xl font-bold text-green-600">{{
              formatCurrency(selectedItem?.price || 0)
            }}</span>
            <Button
              @click="
                selectedItem && addToCart(selectedItem)
                showItemDetails = false
              "
            >
              Add to Cart
            </Button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
