<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useSalesStore, type Transaction } from '@/stores/sales'
import { useAuthStore } from '@/stores/auth'
import { Card, CardHeader, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Dialog } from '@/components/ui/dialog'

const salesStore = useSalesStore()
const authStore = useAuthStore()

// State
const searchQuery = ref('')
const selectedStatus = ref('all')
const selectedDateRange = ref('today')
const showReceiptDialog = ref(false)
const selectedReceipt = ref<Transaction | null>(null)

// Mock additional transactions for demonstration
const mockTransactions = ref<Transaction[]>([
  {
    id: '1',
    receiptNumber: 'JC240823001',
    items: [
      {
        product: {
          id: '1',
          name: 'Cappuccino',
          price: 4.5,
          category: 'coffee',
          inStock: true,
          preparationTime: 3,
        },
        quantity: 2,
        subtotal: 9.0,
      },
      {
        product: {
          id: '4',
          name: 'Croissant',
          price: 3.5,
          category: 'pastry',
          inStock: true,
          preparationTime: 1,
        },
        quantity: 1,
        subtotal: 3.5,
      },
    ],
    subtotal: 12.5,
    tax: 1.0,
    tip: 2.0,
    total: 15.5,
    paymentMethod: 'card',
    customerName: 'John Doe',
    customerPhone: '555-0123',
    orderType: 'takeout',
    status: 'completed',
    timestamp: new Date('2024-08-23T08:30:00'),
    cashierId: '1',
    cashierName: 'Admin User',
    branchId: 'branch-1',
  },
  {
    id: '2',
    receiptNumber: 'JC240823002',
    items: [
      {
        product: {
          id: '2',
          name: 'Americano',
          price: 3.5,
          category: 'coffee',
          inStock: true,
          preparationTime: 2,
        },
        quantity: 1,
        subtotal: 3.5,
      },
      {
        product: {
          id: '5',
          name: 'Blueberry Muffin',
          price: 4.25,
          category: 'pastry',
          inStock: true,
          preparationTime: 1,
        },
        quantity: 1,
        subtotal: 4.25,
      },
    ],
    subtotal: 7.75,
    tax: 0.62,
    tip: 0.0,
    total: 8.37,
    paymentMethod: 'cash',
    orderType: 'dine-in',
    status: 'completed',
    timestamp: new Date('2024-08-23T09:15:00'),
    cashierId: '2',
    cashierName: 'Branch Manager',
    branchId: 'branch-1',
  },
  {
    id: '3',
    receiptNumber: 'JC240823003',
    items: [
      {
        product: {
          id: '8',
          name: 'Club Sandwich',
          price: 8.5,
          category: 'food',
          inStock: true,
          preparationTime: 8,
        },
        quantity: 1,
        subtotal: 8.5,
      },
      {
        product: {
          id: '7',
          name: 'Orange Juice',
          price: 3.75,
          category: 'beverage',
          inStock: true,
          preparationTime: 1,
        },
        quantity: 1,
        subtotal: 3.75,
      },
    ],
    subtotal: 12.25,
    tax: 0.98,
    tip: 1.5,
    total: 14.73,
    paymentMethod: 'mobile',
    customerName: 'Jane Smith',
    customerPhone: '555-0456',
    orderType: 'delivery',
    status: 'completed',
    timestamp: new Date('2024-08-23T11:45:00'),
    cashierId: '3',
    cashierName: 'Cashier User',
    branchId: 'branch-1',
  },
])

// Computed properties
const allTransactions = computed(() => {
  return [...salesStore.transactions, ...mockTransactions.value].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
  )
})

const filteredTransactions = computed(() => {
  let filtered = allTransactions.value

  // Filter by status
  if (selectedStatus.value !== 'all') {
    filtered = filtered.filter((transaction) => transaction.status === selectedStatus.value)
  }

  // Filter by date range
  if (selectedDateRange.value !== 'all') {
    const now = new Date()
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const startOfWeek = new Date(startOfDay.getTime() - startOfDay.getDay() * 24 * 60 * 60 * 1000)
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

    filtered = filtered.filter((transaction) => {
      const transactionDate = new Date(transaction.timestamp)

      switch (selectedDateRange.value) {
        case 'today':
          return transactionDate >= startOfDay
        case 'week':
          return transactionDate >= startOfWeek
        case 'month':
          return transactionDate >= startOfMonth
        default:
          return true
      }
    })
  }

  // Filter by search query
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(
      (transaction) =>
        transaction.receiptNumber.toLowerCase().includes(query) ||
        transaction.customerName?.toLowerCase().includes(query) ||
        transaction.customerPhone?.includes(query) ||
        transaction.cashierName.toLowerCase().includes(query),
    )
  }

  return filtered
})

const totalReceipts = computed(() => filteredTransactions.value.length)
const totalRevenue = computed(() => {
  return filteredTransactions.value
    .filter((t) => t.status === 'completed')
    .reduce((sum, transaction) => sum + transaction.total, 0)
})

const averageOrderValue = computed(() => {
  const completedOrders = filteredTransactions.value.filter((t) => t.status === 'completed')
  return completedOrders.length > 0 ? totalRevenue.value / completedOrders.length : 0
})

// Options
const statusOptions = [
  { value: 'all', label: 'All Status' },
  { value: 'pending', label: 'Pending' },
  { value: 'preparing', label: 'Preparing' },
  { value: 'ready', label: 'Ready' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
]

const dateRangeOptions = [
  { value: 'today', label: 'Today' },
  { value: 'week', label: 'This Week' },
  { value: 'month', label: 'This Month' },
  { value: 'all', label: 'All Time' },
]

// Functions
function viewReceipt(transaction: Transaction) {
  selectedReceipt.value = transaction
  showReceiptDialog.value = true
}

function printReceipt(transaction: Transaction) {
  selectedReceipt.value = transaction
  // In a real app, this would send to a printer
  window.print()
}

function emailReceipt(transaction: Transaction) {
  // In a real app, this would send an email
  alert(`Receipt ${transaction.receiptNumber} would be emailed to customer`)
}

function getStatusColor(status: string) {
  const colors = {
    pending: 'bg-yellow-100 text-yellow-800',
    preparing: 'bg-blue-100 text-blue-800',
    ready: 'bg-green-100 text-green-800',
    completed: 'bg-gray-100 text-gray-800',
    cancelled: 'bg-red-100 text-red-800',
  }
  return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800'
}

function getPaymentMethodIcon(method: string) {
  const icons = {
    cash: '💵',
    card: '💳',
    mobile: '📱',
  }
  return icons[method as keyof typeof icons] || '💳'
}

function getOrderTypeIcon(type: string) {
  const icons = {
    'dine-in': '🍽️',
    takeout: '📦',
    delivery: '🚚',
  }
  return icons[type as keyof typeof icons] || '📦'
}

function formatDate(date: Date) {
  return new Date(date).toLocaleString()
}

function formatCurrency(amount: number) {
  return `$${amount.toFixed(2)}`
}

function refundTransaction(transaction: Transaction) {
  if (confirm(`Are you sure you want to refund receipt ${transaction.receiptNumber}?`)) {
    // In a real app, this would process the refund
    alert(`Refund processed for ${transaction.receiptNumber}`)
  }
}

onMounted(() => {
  // Initialize with mock data
})
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex justify-between items-start">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Receipts Management</h1>
        <p class="text-gray-600">View and manage transaction receipts</p>
      </div>
    </div>

    <!-- Summary Cards -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
      <Card>
        <CardContent class="p-6">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-gray-600">Total Receipts</p>
              <p class="text-2xl font-bold text-blue-600">{{ totalReceipts }}</p>
            </div>
            <div class="text-3xl">🧾</div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent class="p-6">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-gray-600">Total Revenue</p>
              <p class="text-2xl font-bold text-green-600">{{ formatCurrency(totalRevenue) }}</p>
            </div>
            <div class="text-3xl">💰</div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent class="p-6">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-gray-600">Average Order</p>
              <p class="text-2xl font-bold text-purple-600">
                {{ formatCurrency(averageOrderValue) }}
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
              <p class="text-sm font-medium text-gray-600">Completed</p>
              <p class="text-2xl font-bold text-emerald-600">
                {{ filteredTransactions.filter((t) => t.status === 'completed').length }}
              </p>
            </div>
            <div class="text-3xl">✅</div>
          </div>
        </CardContent>
      </Card>
    </div>

    <!-- Filters -->
    <Card>
      <CardContent class="p-6">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Input v-model="searchQuery" placeholder="Search receipts, customer name, phone..." />
          </div>
          <div>
            <Select
              v-model="selectedStatus"
              :options="statusOptions"
              placeholder="Filter by status"
            />
          </div>
          <div>
            <Select
              v-model="selectedDateRange"
              :options="dateRangeOptions"
              placeholder="Select date range"
            />
          </div>
        </div>
      </CardContent>
    </Card>

    <!-- Receipts Table -->
    <Card>
      <CardHeader>
        <h3 class="text-lg font-semibold">Transaction Receipts</h3>
      </CardHeader>
      <CardContent>
        <div class="overflow-x-auto">
          <table class="w-full border-collapse">
            <thead>
              <tr class="border-b">
                <th class="text-left p-3 font-medium text-gray-600">Receipt #</th>
                <th class="text-left p-3 font-medium text-gray-600">Customer</th>
                <th class="text-left p-3 font-medium text-gray-600">Date & Time</th>
                <th class="text-left p-3 font-medium text-gray-600">Items</th>
                <th class="text-left p-3 font-medium text-gray-600">Total</th>
                <th class="text-left p-3 font-medium text-gray-600">Payment</th>
                <th class="text-left p-3 font-medium text-gray-600">Status</th>
                <th class="text-left p-3 font-medium text-gray-600">Cashier</th>
                <th class="text-left p-3 font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="transaction in filteredTransactions"
                :key="transaction.id"
                class="border-b hover:bg-gray-50"
              >
                <td class="p-3">
                  <div>
                    <p class="font-mono font-medium text-sm">{{ transaction.receiptNumber }}</p>
                    <p class="text-xs text-gray-500 capitalize flex items-center">
                      {{ getOrderTypeIcon(transaction.orderType) }} {{ transaction.orderType }}
                    </p>
                  </div>
                </td>
                <td class="p-3">
                  <div>
                    <p class="font-medium text-sm">
                      {{ transaction.customerName || 'Walk-in Customer' }}
                    </p>
                    <p v-if="transaction.customerPhone" class="text-xs text-gray-600">
                      {{ transaction.customerPhone }}
                    </p>
                  </div>
                </td>
                <td class="p-3">
                  <div class="text-sm">
                    <p>{{ new Date(transaction.timestamp).toLocaleDateString() }}</p>
                    <p class="text-xs text-gray-600">
                      {{ new Date(transaction.timestamp).toLocaleTimeString() }}
                    </p>
                  </div>
                </td>
                <td class="p-3">
                  <div class="text-sm">
                    <p class="font-medium">{{ transaction.items.length }} item(s)</p>
                    <p class="text-xs text-gray-600">
                      {{
                        transaction.items
                          .map((i) => `${i.quantity}x ${i.product.name}`)
                          .join(', ')
                          .slice(0, 40)
                      }}...
                    </p>
                  </div>
                </td>
                <td class="p-3">
                  <div class="text-sm">
                    <p class="font-bold">{{ formatCurrency(transaction.total) }}</p>
                    <p class="text-xs text-gray-600">
                      Sub: {{ formatCurrency(transaction.subtotal) }}
                    </p>
                  </div>
                </td>
                <td class="p-3">
                  <div class="text-sm flex items-center">
                    <span class="mr-1">{{ getPaymentMethodIcon(transaction.paymentMethod) }}</span>
                    <span class="capitalize">{{ transaction.paymentMethod }}</span>
                  </div>
                </td>
                <td class="p-3">
                  <span
                    :class="[
                      'px-2 py-1 rounded-full text-xs font-medium capitalize',
                      getStatusColor(transaction.status),
                    ]"
                  >
                    {{ transaction.status }}
                  </span>
                </td>
                <td class="p-3">
                  <p class="text-sm">{{ transaction.cashierName }}</p>
                </td>
                <td class="p-3">
                  <div class="flex gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      @click="viewReceipt(transaction)"
                      title="View Receipt"
                    >
                      👁️
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      @click="printReceipt(transaction)"
                      title="Print Receipt"
                    >
                      🖨️
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      @click="emailReceipt(transaction)"
                      title="Email Receipt"
                    >
                      📧
                    </Button>
                    <Button
                      v-if="transaction.status === 'completed' && authStore.isAdmin"
                      variant="outline"
                      size="sm"
                      @click="refundTransaction(transaction)"
                      title="Refund"
                      class="text-red-600 hover:text-red-700"
                    >
                      💸
                    </Button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>

          <div v-if="filteredTransactions.length === 0" class="text-center py-8 text-gray-500">
            <div class="text-4xl mb-4">🔍</div>
            <p>No receipts found</p>
          </div>
        </div>
      </CardContent>
    </Card>

    <!-- Receipt Detail Dialog -->
    <Dialog v-model:open="showReceiptDialog" title="Receipt Details">
      <div v-if="selectedReceipt" class="space-y-4">
        <!-- Receipt Preview -->
        <div class="bg-white border-2 border-dashed border-gray-300 p-6 text-sm font-mono">
          <div class="text-center border-b pb-4 mb-4">
            <h2 class="text-xl font-bold">JUDY'S CAFE</h2>
            <p class="text-xs mt-1">123 Coffee Street, Bean City</p>
            <p class="text-xs">Phone: (555) 123-CAFE</p>
          </div>

          <div class="grid grid-cols-2 gap-4 text-xs mb-4">
            <div>
              <p><strong>Receipt:</strong> {{ selectedReceipt.receiptNumber }}</p>
              <p><strong>Date:</strong> {{ formatDate(selectedReceipt.timestamp) }}</p>
              <p><strong>Cashier:</strong> {{ selectedReceipt.cashierName }}</p>
            </div>
            <div>
              <p><strong>Customer:</strong> {{ selectedReceipt.customerName || 'Walk-in' }}</p>
              <p v-if="selectedReceipt.customerPhone">
                <strong>Phone:</strong> {{ selectedReceipt.customerPhone }}
              </p>
              <p><strong>Order Type:</strong> {{ selectedReceipt.orderType }}</p>
            </div>
          </div>

          <div class="border-t border-b py-3">
            <div
              v-for="item in selectedReceipt.items"
              :key="item.product.id"
              class="flex justify-between mb-1"
            >
              <span>{{ item.quantity }}x {{ item.product.name }}</span>
              <span>{{ formatCurrency(item.subtotal) }}</span>
            </div>
          </div>

          <div class="pt-3">
            <div class="flex justify-between">
              <span>Subtotal:</span>
              <span>{{ formatCurrency(selectedReceipt.subtotal) }}</span>
            </div>
            <div class="flex justify-between">
              <span>Tax:</span>
              <span>{{ formatCurrency(selectedReceipt.tax) }}</span>
            </div>
            <div v-if="selectedReceipt.tip > 0" class="flex justify-between">
              <span>Tip:</span>
              <span>{{ formatCurrency(selectedReceipt.tip) }}</span>
            </div>
            <div class="flex justify-between font-bold text-lg border-t pt-2 mt-2">
              <span>Total:</span>
              <span>{{ formatCurrency(selectedReceipt.total) }}</span>
            </div>
          </div>

          <div class="text-center border-t pt-4 mt-4 text-xs">
            <p>Payment Method: {{ selectedReceipt.paymentMethod.toUpperCase() }}</p>
            <p class="mt-2">Thank you for visiting Judy's Cafe!</p>
            <p>Have a great day!</p>
          </div>
        </div>

        <div class="flex gap-3">
          <Button @click="printReceipt(selectedReceipt)" variant="outline" class="flex-1">
            🖨️ Print
          </Button>
          <Button @click="emailReceipt(selectedReceipt)" variant="outline" class="flex-1">
            📧 Email
          </Button>
          <Button @click="showReceiptDialog = false" class="flex-1"> Close </Button>
        </div>
      </div>
    </Dialog>
  </div>
</template>
