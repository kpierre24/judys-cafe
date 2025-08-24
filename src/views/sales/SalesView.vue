<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useSalesStore, type Product, type Transaction, type CartItem } from '@/stores/sales'
import { Card, CardHeader, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Dialog } from '@/components/ui/dialog'

const salesStore = useSalesStore()

// Ensure branch data exists when component loads
onMounted(() => {
  salesStore.ensureBranchDataExists()
})

// Dialog states
const showCheckoutDialog = ref(false)
const showReceiptDialog = ref(false)
const lastTransaction = ref<Transaction | null>(null)

// Payment state
const paymentAmount = ref(0)
const changeAmount = computed(() => {
  if (salesStore.currentOrder.paymentMethod === 'cash') {
    return Math.max(0, paymentAmount.value - salesStore.cartTotal)
  }
  return 0
})

// Functions
function addProductToCart(product: Product) {
  salesStore.addToCart(product)
}

function incrementCartItem(productId: string) {
  const item: CartItem | undefined = salesStore.cart.find(
    (item: CartItem) => item.product.id === productId,
  )
  if (item) {
    salesStore.updateCartItemQuantity(productId, item.quantity + 1)
  }
}

function decrementCartItem(productId: string) {
  const item: CartItem | undefined = salesStore.cart.find(
    (item: CartItem) => item.product.id === productId,
  )
  if (item && item.quantity > 1) {
    salesStore.updateCartItemQuantity(productId, item.quantity - 1)
  } else {
    salesStore.removeFromCart(productId)
  }
}

function openCheckout() {
  if (salesStore.cart.length === 0) {
    alert('Cart is empty!')
    return
  }
  paymentAmount.value = salesStore.cartTotal
  showCheckoutDialog.value = true
}

function processPayment() {
  if (
    salesStore.currentOrder.paymentMethod === 'cash' &&
    paymentAmount.value < salesStore.cartTotal
  ) {
    alert('Insufficient payment amount')
    return
  }

  try {
    const transaction = salesStore.processTransaction()
    lastTransaction.value = transaction
    showCheckoutDialog.value = false
    showReceiptDialog.value = true
  } catch (error) {
    alert(error instanceof Error ? error.message : 'Transaction failed')
  }
}

function printReceipt() {
  // In a real app, this would integrate with a receipt printer
  window.print()
}

function newTransaction() {
  showReceiptDialog.value = false
  lastTransaction.value = null
}

function getCategoryIcon(category: string) {
  const icons = {
    coffee: '☕',
    pastry: '🥐',
    beverage: '🥤',
    food: '🍽️',
    all: '📋',
  }
  return icons[category as keyof typeof icons] || '📦'
}

function getOrderTypeIcon(type: string) {
  const icons = {
    'dine-in': '🍽️',
    takeout: '📦',
    delivery: '🚚',
  }
  return icons[type as keyof typeof icons] || '📦'
}
</script>

<template>
  <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
    <!-- Products Section -->
    <div class="lg:col-span-2 space-y-4">
      <!-- Header -->
      <div class="flex justify-between items-center">
        <h1 class="text-2xl font-bold text-gray-900">Point of Sale</h1>
        <div class="flex items-center space-x-4 text-sm text-gray-600">
          <span>Today's Sales: ${{ salesStore.todaysSales.toFixed(2) }}</span>
          <span>Orders: {{ salesStore.todaysOrders }}</span>
        </div>
      </div>

      <!-- Filters -->
      <Card>
        <CardContent class="p-4">
          <div class="flex flex-col sm:flex-row gap-4">
            <div class="flex-1">
              <Input
                v-model="salesStore.searchQuery"
                placeholder="Search products..."
                class="w-full"
              />
            </div>
            <div class="sm:w-48">
              <Select
                v-model="salesStore.selectedCategory"
                :options="salesStore.categories"
                placeholder="All Categories"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <!-- Products Grid -->
      <div class="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
        <Card
          v-for="product in salesStore.filteredProducts"
          :key="product.id"
          class="cursor-pointer hover:shadow-lg transition-shadow"
          @click="addProductToCart(product)"
        >
          <CardContent class="p-4">
            <div class="text-center">
              <div class="text-3xl mb-2">{{ getCategoryIcon(product.category) }}</div>
              <h3 class="font-semibold text-sm mb-1">{{ product.name }}</h3>
              <p class="text-xs text-gray-600 mb-2 h-8 overflow-hidden">
                {{ product.description }}
              </p>
              <div class="flex justify-between items-center">
                <span class="text-lg font-bold text-green-600"
                  >${{ product.price.toFixed(2) }}</span
                >
                <span class="text-xs text-gray-500">{{ product.preparationTime }}min</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div v-if="salesStore.filteredProducts.length === 0" class="text-center py-12 text-gray-500">
        <div class="text-4xl mb-4">🔍</div>
        <p>No products found</p>
      </div>
    </div>

    <!-- Cart Section -->
    <div class="space-y-4">
      <Card class="h-full">
        <CardHeader>
          <div class="flex justify-between items-center">
            <h3 class="text-lg font-semibold">Current Order</h3>
            <Button
              v-if="salesStore.cart.length > 0"
              variant="outline"
              size="sm"
              @click="salesStore.clearCart()"
            >
              Clear
            </Button>
          </div>
        </CardHeader>

        <CardContent class="p-0">
          <!-- Order Type Selection -->
          <div class="px-6 pb-4">
            <label class="block text-sm font-medium text-gray-700 mb-2">Order Type</label>
            <div class="grid grid-cols-3 gap-2">
              <Button
                v-for="type in [
                  { key: 'dine-in', label: 'Dine In' },
                  { key: 'takeout', label: 'Takeout' },
                  { key: 'delivery', label: 'Delivery' },
                ]"
                :key="type.key"
                :variant="salesStore.currentOrder.orderType === type.key ? 'default' : 'outline'"
                size="sm"
                class="text-xs"
                @click="salesStore.updateCurrentOrder({ orderType: type.key as any })"
              >
                {{ getOrderTypeIcon(type.key) }} {{ type.label }}
              </Button>
            </div>
          </div>

          <!-- Cart Items -->
          <div class="max-h-64 overflow-y-auto border-t border-b">
            <div v-if="salesStore.cart.length === 0" class="p-6 text-center text-gray-500">
              <div class="text-3xl mb-2">🛒</div>
              <p>Cart is empty</p>
              <p class="text-sm">Add items to get started</p>
            </div>

            <div v-else>
              <div
                v-for="item in salesStore.cart"
                :key="item.product.id"
                class="flex items-center justify-between p-4 border-b last:border-b-0"
              >
                <div class="flex-1 min-w-0">
                  <h4 class="font-medium text-sm truncate">{{ item.product.name }}</h4>
                  <p class="text-xs text-gray-600">${{ item.product.price.toFixed(2) }} each</p>
                </div>

                <div class="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    class="h-8 w-8 p-0"
                    @click="decrementCartItem(item.product.id)"
                  >
                    −
                  </Button>

                  <span class="w-8 text-center text-sm font-medium">{{ item.quantity }}</span>

                  <Button
                    variant="outline"
                    size="sm"
                    class="h-8 w-8 p-0"
                    @click="incrementCartItem(item.product.id)"
                  >
                    +
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    class="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                    @click="salesStore.removeFromCart(item.product.id)"
                  >
                    ✕
                  </Button>
                </div>

                <div class="ml-4 text-right min-w-[60px]">
                  <p class="font-semibold text-sm">${{ item.subtotal.toFixed(2) }}</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Order Total -->
          <div class="p-6">
            <div class="space-y-2">
              <div class="flex justify-between text-sm">
                <span>Subtotal:</span>
                <span>${{ salesStore.cartSubtotal.toFixed(2) }}</span>
              </div>

              <div class="flex justify-between text-sm">
                <span>Tax (8%):</span>
                <span>${{ salesStore.cartTax.toFixed(2) }}</span>
              </div>

              <div class="flex justify-between text-sm">
                <span>Tip:</span>
                <div class="flex items-center space-x-2">
                  <Input
                    :value="(salesStore.currentOrder.tip || 0).toString()"
                    @update:modelValue="
                      salesStore.updateCurrentOrder({ tip: parseFloat($event) || 0 })
                    "
                    type="number"
                    min="0"
                    step="0.01"
                    class="w-16 h-7 text-xs"
                    placeholder="0.00"
                  />
                </div>
              </div>

              <hr class="my-2" />

              <div class="flex justify-between font-bold text-lg">
                <span>Total:</span>
                <span>${{ salesStore.cartTotal.toFixed(2) }}</span>
              </div>
            </div>

            <!-- Customer Info -->
            <div class="mt-4 space-y-2">
              <Input
                :value="salesStore.currentOrder.customerName"
                @update:modelValue="salesStore.updateCurrentOrder({ customerName: $event })"
                placeholder="Customer name (optional)"
                class="text-sm"
              />
              <Input
                :value="salesStore.currentOrder.customerPhone"
                @update:modelValue="salesStore.updateCurrentOrder({ customerPhone: $event })"
                placeholder="Phone number (optional)"
                class="text-sm"
              />
            </div>

            <!-- Checkout Button -->
            <Button
              @click="openCheckout"
              :disabled="salesStore.cart.length === 0"
              class="w-full mt-4 bg-green-600 hover:bg-green-700"
            >
              Checkout - ${{ salesStore.cartTotal.toFixed(2) }}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  </div>

  <!-- Checkout Dialog -->
  <Dialog v-model:open="showCheckoutDialog" title="Checkout">
    <div class="space-y-4">
      <!-- Payment Method -->
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">Payment Method</label>
        <div class="grid grid-cols-3 gap-2">
          <Button
            v-for="method in [
              { key: 'cash', label: '💵 Cash' },
              { key: 'card', label: '💳 Card' },
              { key: 'mobile', label: '📱 Mobile' },
            ]"
            :key="method.key"
            :variant="salesStore.currentOrder.paymentMethod === method.key ? 'default' : 'outline'"
            size="sm"
            @click="salesStore.updateCurrentOrder({ paymentMethod: method.key as any })"
          >
            {{ method.label }}
          </Button>
        </div>
      </div>

      <!-- Cash Payment Details -->
      <div v-if="salesStore.currentOrder.paymentMethod === 'cash'" class="space-y-3">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Amount Received</label>
          <Input
            :value="paymentAmount.toString()"
            @update:modelValue="paymentAmount = parseFloat($event) || 0"
            type="number"
            min="0"
            step="0.01"
            :placeholder="salesStore.cartTotal.toFixed(2)"
          />
        </div>

        <div v-if="changeAmount > 0" class="p-3 bg-blue-50 rounded-lg">
          <p class="text-sm font-medium text-blue-800">
            Change Due: ${{ changeAmount.toFixed(2) }}
          </p>
        </div>

        <div
          v-if="paymentAmount > 0 && paymentAmount < salesStore.cartTotal"
          class="p-3 bg-red-50 rounded-lg"
        >
          <p class="text-sm font-medium text-red-800">Insufficient amount</p>
        </div>
      </div>

      <!-- Order Summary -->
      <div class="bg-gray-50 p-4 rounded-lg">
        <h4 class="font-medium mb-2">Order Summary</h4>
        <div class="text-sm space-y-1">
          <div class="flex justify-between">
            <span>Subtotal:</span>
            <span>${{ salesStore.cartSubtotal.toFixed(2) }}</span>
          </div>
          <div class="flex justify-between">
            <span>Tax:</span>
            <span>${{ salesStore.cartTax.toFixed(2) }}</span>
          </div>
          <div class="flex justify-between">
            <span>Tip:</span>
            <span>${{ (salesStore.currentOrder.tip || 0).toFixed(2) }}</span>
          </div>
          <hr class="my-2" />
          <div class="flex justify-between font-bold">
            <span>Total:</span>
            <span>${{ salesStore.cartTotal.toFixed(2) }}</span>
          </div>
        </div>
      </div>

      <div class="flex gap-3 pt-4">
        <Button @click="processPayment" class="flex-1 bg-green-600 hover:bg-green-700">
          Process Payment
        </Button>
        <Button variant="outline" @click="showCheckoutDialog = false">Cancel</Button>
      </div>
    </div>
  </Dialog>

  <!-- Receipt Dialog -->
  <Dialog v-model:open="showReceiptDialog" title="Transaction Complete">
    <div v-if="lastTransaction" class="space-y-4">
      <div class="text-center">
        <div class="text-4xl mb-2">✅</div>
        <h3 class="text-lg font-semibold text-green-600">Payment Successful!</h3>
        <p class="text-sm text-gray-600">Receipt #{{ lastTransaction.receiptNumber }}</p>
      </div>

      <!-- Receipt Preview -->
      <div class="bg-white border-2 border-dashed border-gray-300 p-4 text-sm font-mono">
        <div class="text-center border-b pb-2 mb-2">
          <h2 class="font-bold">JUDY'S CAFE</h2>
          <p class="text-xs">{{ new Date(lastTransaction.timestamp).toLocaleString() }}</p>
          <p class="text-xs">Receipt: {{ lastTransaction.receiptNumber }}</p>
          <p class="text-xs">Cashier: {{ lastTransaction.cashierName }}</p>
          <p class="text-xs capitalize">Order Type: {{ lastTransaction.orderType }}</p>
        </div>

        <div class="space-y-1">
          <div
            v-for="item in lastTransaction.items"
            :key="item.product.id"
            class="flex justify-between"
          >
            <span>{{ item.quantity }}x {{ item.product.name }}</span>
            <span>${{ item.subtotal.toFixed(2) }}</span>
          </div>
        </div>

        <div class="border-t pt-2 mt-2">
          <div class="flex justify-between">
            <span>Subtotal:</span>
            <span>${{ lastTransaction.subtotal.toFixed(2) }}</span>
          </div>
          <div class="flex justify-between">
            <span>Tax:</span>
            <span>${{ lastTransaction.tax.toFixed(2) }}</span>
          </div>
          <div v-if="lastTransaction.tip > 0" class="flex justify-between">
            <span>Tip:</span>
            <span>${{ lastTransaction.tip.toFixed(2) }}</span>
          </div>
          <div class="flex justify-between font-bold border-t pt-1">
            <span>Total:</span>
            <span>${{ lastTransaction.total.toFixed(2) }}</span>
          </div>
        </div>

        <div class="text-center border-t pt-2 mt-2 text-xs">
          <p>Thank you for visiting!</p>
          <p>Have a great day!</p>
        </div>
      </div>

      <div class="flex gap-3">
        <Button @click="printReceipt" variant="outline" class="flex-1"> 🖨️ Print Receipt </Button>
        <Button @click="newTransaction" class="flex-1"> New Transaction </Button>
      </div>
    </div>
  </Dialog>
</template>
