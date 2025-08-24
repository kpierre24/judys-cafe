<script setup lang="ts">
import { ref, computed } from 'vue'
import { Card, CardHeader, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Dialog } from '@/components/ui/dialog'

interface PurchaseItem {
  id: string
  name: string
  quantity: number
  unitPrice: number
  total: number
}

interface Purchase {
  id: string
  purchaseNumber: string
  supplier: string
  orderDate: Date
  expectedDelivery: Date
  actualDelivery?: Date
  status: 'pending' | 'ordered' | 'received' | 'cancelled'
  items: PurchaseItem[]
  subtotal: number
  tax: number
  total: number
  notes?: string
  createdBy: string
}

interface Supplier {
  id: string
  name: string
  contact: string
  phone: string
  email: string
  category: string
}

// Mock data
const suppliers = ref<Supplier[]>([
  {
    id: '1',
    name: 'Colombian Coffee Co.',
    contact: 'Carlos Rodriguez',
    phone: '(555) 123-4567',
    email: 'carlos@colombiancoffee.com',
    category: 'Coffee',
  },
  {
    id: '2',
    name: 'Local Dairy Farm',
    contact: 'Mary Johnson',
    phone: '(555) 987-6543',
    email: 'mary@localdairy.com',
    category: 'Dairy',
  },
  {
    id: '3',
    name: 'French Bakery Supply',
    contact: 'Pierre Dubois',
    phone: '(555) 456-7890',
    email: 'pierre@frenchbakery.com',
    category: 'Pastry',
  },
])

const purchases = ref<Purchase[]>([
  {
    id: '1',
    purchaseNumber: 'PO-2024-001',
    supplier: 'Colombian Coffee Co.',
    orderDate: new Date('2024-08-20'),
    expectedDelivery: new Date('2024-08-25'),
    actualDelivery: new Date('2024-08-24'),
    status: 'received',
    items: [
      { id: '1', name: 'Arabica Coffee Beans', quantity: 50, unitPrice: 15.5, total: 775.0 },
      { id: '2', name: 'Colombian Roast', quantity: 25, unitPrice: 18.0, total: 450.0 },
    ],
    subtotal: 1225.0,
    tax: 98.0,
    total: 1323.0,
    notes: 'Premium quality beans for espresso',
    createdBy: 'Admin User',
  },
  {
    id: '2',
    purchaseNumber: 'PO-2024-002',
    supplier: 'Local Dairy Farm',
    orderDate: new Date('2024-08-22'),
    expectedDelivery: new Date('2024-08-24'),
    status: 'ordered',
    items: [
      { id: '3', name: 'Whole Milk', quantity: 100, unitPrice: 1.2, total: 120.0 },
      { id: '4', name: 'Heavy Cream', quantity: 20, unitPrice: 2.5, total: 50.0 },
    ],
    subtotal: 170.0,
    tax: 13.6,
    total: 183.6,
    createdBy: 'Branch Manager',
  },
])

const searchQuery = ref('')
const selectedStatus = ref('all')
const selectedSupplier = ref('all')
const showAddDialog = ref(false)
const showEditDialog = ref(false)
const showViewDialog = ref(false)
const selectedPurchase = ref<Purchase | null>(null)

const newPurchase = ref({
  supplier: '',
  expectedDelivery: '',
  notes: '',
  items: [] as { name: string; quantity: number; unitPrice: number }[],
})

const newItem = ref({
  name: '',
  quantity: 0,
  unitPrice: 0,
})

// Computed properties
const filteredPurchases = computed(() => {
  let filtered = purchases.value

  if (selectedStatus.value !== 'all') {
    filtered = filtered.filter((p) => p.status === selectedStatus.value)
  }

  if (selectedSupplier.value !== 'all') {
    filtered = filtered.filter((p) => p.supplier === selectedSupplier.value)
  }

  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(
      (p) =>
        p.purchaseNumber.toLowerCase().includes(query) ||
        p.supplier.toLowerCase().includes(query) ||
        p.notes?.toLowerCase().includes(query),
    )
  }

  return filtered.sort((a, b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime())
})

const totalPurchases = computed(() => purchases.value.length)
const totalValue = computed(() => purchases.value.reduce((sum, p) => sum + p.total, 0))
const pendingOrders = computed(
  () => purchases.value.filter((p) => p.status === 'pending' || p.status === 'ordered').length,
)

// Options
const statusOptions = [
  { value: 'all', label: 'All Status' },
  { value: 'pending', label: 'Pending' },
  { value: 'ordered', label: 'Ordered' },
  { value: 'received', label: 'Received' },
  { value: 'cancelled', label: 'Cancelled' },
]

const supplierOptions = computed(() => [
  { value: 'all', label: 'All Suppliers' },
  ...suppliers.value.map((s) => ({ value: s.name, label: s.name })),
])

// Functions
function openAddDialog() {
  resetForm()
  showAddDialog.value = true
}

function openEditDialog(purchase: Purchase) {
  selectedPurchase.value = purchase
  // Load purchase data into form
  showEditDialog.value = true
}

function openViewDialog(purchase: Purchase) {
  selectedPurchase.value = purchase
  showViewDialog.value = true
}

function resetForm() {
  newPurchase.value = {
    supplier: '',
    expectedDelivery: '',
    notes: '',
    items: [],
  }
  newItem.value = {
    name: '',
    quantity: 0,
    unitPrice: 0,
  }
}

function addItemToOrder() {
  if (newItem.value.name && newItem.value.quantity > 0 && newItem.value.unitPrice > 0) {
    newPurchase.value.items.push({
      name: newItem.value.name,
      quantity: newItem.value.quantity,
      unitPrice: newItem.value.unitPrice,
    })
    newItem.value = { name: '', quantity: 0, unitPrice: 0 }
  }
}

function removeItemFromOrder(index: number) {
  newPurchase.value.items.splice(index, 1)
}

function calculateSubtotal() {
  return newPurchase.value.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0)
}

function createPurchase() {
  const subtotal = calculateSubtotal()
  const tax = subtotal * 0.08
  const total = subtotal + tax

  const purchase: Purchase = {
    id: Date.now().toString(),
    purchaseNumber: `PO-2024-${(purchases.value.length + 1).toString().padStart(3, '0')}`,
    supplier: newPurchase.value.supplier,
    orderDate: new Date(),
    expectedDelivery: new Date(newPurchase.value.expectedDelivery),
    status: 'pending',
    items: newPurchase.value.items.map((item, index) => ({
      id: (index + 1).toString(),
      name: item.name,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      total: item.quantity * item.unitPrice,
    })),
    subtotal,
    tax,
    total,
    notes: newPurchase.value.notes,
    createdBy: 'Current User',
  }

  purchases.value.push(purchase)
  showAddDialog.value = false
}

function updatePurchaseStatus(purchase: Purchase, newStatus: Purchase['status']) {
  const index = purchases.value.findIndex((p) => p.id === purchase.id)
  if (index !== -1) {
    purchases.value[index].status = newStatus
    if (newStatus === 'received') {
      purchases.value[index].actualDelivery = new Date()
    }
  }
}

function getStatusColor(status: string) {
  const colors = {
    pending: 'bg-yellow-100 text-yellow-800',
    ordered: 'bg-blue-100 text-blue-800',
    received: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
  }
  return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800'
}

function getStatusIcon(status: string) {
  const icons = {
    pending: '🕰️',
    ordered: '📦',
    received: '✅',
    cancelled: '❌',
  }
  return icons[status as keyof typeof icons] || '❔'
}

function formatDate(date: Date) {
  return new Date(date).toLocaleDateString()
}
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex justify-between items-start">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Purchase Management</h1>
        <p class="text-gray-600">Manage supplier orders and inventory purchases</p>
      </div>
      <Button @click="openAddDialog" class="bg-blue-600 hover:bg-blue-700">
        + New Purchase Order
      </Button>
    </div>

    <!-- Summary Cards -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
      <Card>
        <CardContent class="p-6">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-gray-600">Total Orders</p>
              <p class="text-2xl font-bold text-blue-600">{{ totalPurchases }}</p>
            </div>
            <div class="text-3xl">📋</div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent class="p-6">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-gray-600">Total Value</p>
              <p class="text-2xl font-bold text-green-600">${{ totalValue.toFixed(2) }}</p>
            </div>
            <div class="text-3xl">💰</div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent class="p-6">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-gray-600">Pending Orders</p>
              <p class="text-2xl font-bold text-orange-600">{{ pendingOrders }}</p>
            </div>
            <div class="text-3xl">⏳</div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent class="p-6">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-gray-600">Suppliers</p>
              <p class="text-2xl font-bold text-purple-600">{{ suppliers.length }}</p>
            </div>
            <div class="text-3xl">🏢</div>
          </div>
        </CardContent>
      </Card>
    </div>

    <!-- Filters -->
    <Card>
      <CardContent class="p-6">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input v-model="searchQuery" placeholder="Search orders..." />
          <Select
            v-model="selectedStatus"
            :options="statusOptions"
            placeholder="Filter by status"
          />
          <Select
            v-model="selectedSupplier"
            :options="supplierOptions"
            placeholder="Filter by supplier"
          />
        </div>
      </CardContent>
    </Card>

    <!-- Purchase Orders Table -->
    <Card>
      <CardHeader>
        <h3 class="text-lg font-semibold">Purchase Orders</h3>
      </CardHeader>
      <CardContent>
        <div class="overflow-x-auto">
          <table class="w-full border-collapse">
            <thead>
              <tr class="border-b">
                <th class="text-left p-3 font-medium text-gray-600">Order #</th>
                <th class="text-left p-3 font-medium text-gray-600">Supplier</th>
                <th class="text-left p-3 font-medium text-gray-600">Order Date</th>
                <th class="text-left p-3 font-medium text-gray-600">Expected Delivery</th>
                <th class="text-left p-3 font-medium text-gray-600">Items</th>
                <th class="text-left p-3 font-medium text-gray-600">Total</th>
                <th class="text-left p-3 font-medium text-gray-600">Status</th>
                <th class="text-left p-3 font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="purchase in filteredPurchases"
                :key="purchase.id"
                class="border-b hover:bg-gray-50"
              >
                <td class="p-3">
                  <p class="font-mono font-medium">{{ purchase.purchaseNumber }}</p>
                  <p class="text-xs text-gray-600">{{ purchase.createdBy }}</p>
                </td>
                <td class="p-3">
                  <p class="font-medium">{{ purchase.supplier }}</p>
                </td>
                <td class="p-3">
                  <p class="text-sm">{{ formatDate(purchase.orderDate) }}</p>
                </td>
                <td class="p-3">
                  <p class="text-sm">{{ formatDate(purchase.expectedDelivery) }}</p>
                  <p v-if="purchase.actualDelivery" class="text-xs text-green-600">
                    Received: {{ formatDate(purchase.actualDelivery) }}
                  </p>
                </td>
                <td class="p-3">
                  <p class="font-medium">{{ purchase.items.length }} item(s)</p>
                  <p class="text-xs text-gray-600">
                    {{
                      purchase.items
                        .map((i) => i.name)
                        .join(', ')
                        .slice(0, 30)
                    }}...
                  </p>
                </td>
                <td class="p-3">
                  <p class="font-bold">${{ purchase.total.toFixed(2) }}</p>
                  <p class="text-xs text-gray-600">+${{ purchase.tax.toFixed(2) }} tax</p>
                </td>
                <td class="p-3">
                  <span
                    :class="[
                      'px-2 py-1 rounded-full text-xs font-medium flex items-center space-x-1 w-fit',
                      getStatusColor(purchase.status),
                    ]"
                  >
                    <span>{{ getStatusIcon(purchase.status) }}</span>
                    <span class="capitalize">{{ purchase.status }}</span>
                  </span>
                </td>
                <td class="p-3">
                  <div class="flex gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      @click="openViewDialog(purchase)"
                      title="View Details"
                    >
                      👁️
                    </Button>
                    <Button
                      v-if="purchase.status === 'pending'"
                      variant="outline"
                      size="sm"
                      @click="updatePurchaseStatus(purchase, 'ordered')"
                      title="Mark as Ordered"
                      class="text-blue-600"
                    >
                      📦
                    </Button>
                    <Button
                      v-if="purchase.status === 'ordered'"
                      variant="outline"
                      size="sm"
                      @click="updatePurchaseStatus(purchase, 'received')"
                      title="Mark as Received"
                      class="text-green-600"
                    >
                      ✅
                    </Button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>

          <div v-if="filteredPurchases.length === 0" class="text-center py-8 text-gray-500">
            <div class="text-4xl mb-4">🔍</div>
            <p>No purchase orders found</p>
          </div>
        </div>
      </CardContent>
    </Card>

    <!-- Add Purchase Order Dialog -->
    <Dialog v-model:open="showAddDialog" title="New Purchase Order">
      <form @submit.prevent="createPurchase" class="space-y-4">
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Supplier</label>
            <select
              v-model="newPurchase.supplier"
              required
              class="w-full h-10 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select supplier</option>
              <option v-for="supplier in suppliers" :key="supplier.id" :value="supplier.name">
                {{ supplier.name }}
              </option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Expected Delivery</label>
            <Input v-model="newPurchase.expectedDelivery" type="date" required />
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Notes</label>
          <Input v-model="newPurchase.notes" placeholder="Order notes (optional)" />
        </div>

        <!-- Items Section -->
        <div class="border-t pt-4">
          <h4 class="font-medium mb-3">Order Items</h4>

          <!-- Add Item Form -->
          <div class="grid grid-cols-12 gap-2 mb-3">
            <div class="col-span-5">
              <Input v-model="newItem.name" placeholder="Item name" />
            </div>
            <div class="col-span-2">
              <Input v-model="newItem.quantity" type="number" min="1" placeholder="Qty" />
            </div>
            <div class="col-span-3">
              <Input
                v-model="newItem.unitPrice"
                type="number"
                min="0"
                step="0.01"
                placeholder="Unit price"
              />
            </div>
            <div class="col-span-2">
              <Button type="button" @click="addItemToOrder" size="sm" class="w-full"> Add </Button>
            </div>
          </div>

          <!-- Items List -->
          <div v-if="newPurchase.items.length > 0" class="space-y-2">
            <div
              v-for="(item, index) in newPurchase.items"
              :key="index"
              class="flex items-center justify-between p-2 bg-gray-50 rounded"
            >
              <div class="flex-1">
                <span class="font-medium">{{ item.name }}</span>
                <span class="text-sm text-gray-600 ml-2"
                  >{{ item.quantity }} × ${{ item.unitPrice.toFixed(2) }}</span
                >
              </div>
              <div class="flex items-center space-x-2">
                <span class="font-bold">${{ (item.quantity * item.unitPrice).toFixed(2) }}</span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  @click="removeItemFromOrder(index)"
                  class="text-red-600"
                >
                  ✕
                </Button>
              </div>
            </div>

            <div class="text-right pt-2 border-t">
              <p class="font-bold">Total: ${{ calculateSubtotal().toFixed(2) }}</p>
              <p class="text-sm text-gray-600">
                Tax (8%): ${{ (calculateSubtotal() * 0.08).toFixed(2) }}
              </p>
              <p class="text-lg font-bold">
                Grand Total: ${{ (calculateSubtotal() * 1.08).toFixed(2) }}
              </p>
            </div>
          </div>
        </div>

        <div class="flex gap-3 pt-4">
          <Button
            type="submit"
            class="flex-1"
            :disabled="newPurchase.items.length === 0 || !newPurchase.supplier"
          >
            Create Purchase Order
          </Button>
          <Button type="button" variant="outline" @click="showAddDialog = false">Cancel</Button>
        </div>
      </form>
    </Dialog>

    <!-- View Purchase Order Dialog -->
    <Dialog v-model:open="showViewDialog" title="Purchase Order Details">
      <div v-if="selectedPurchase" class="space-y-4">
        <div class="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p class="font-medium">Order Number:</p>
            <p>{{ selectedPurchase.purchaseNumber }}</p>
          </div>
          <div>
            <p class="font-medium">Supplier:</p>
            <p>{{ selectedPurchase.supplier }}</p>
          </div>
          <div>
            <p class="font-medium">Order Date:</p>
            <p>{{ formatDate(selectedPurchase.orderDate) }}</p>
          </div>
          <div>
            <p class="font-medium">Expected Delivery:</p>
            <p>{{ formatDate(selectedPurchase.expectedDelivery) }}</p>
          </div>
          <div>
            <p class="font-medium">Status:</p>
            <span
              :class="[
                'px-2 py-1 rounded-full text-xs font-medium capitalize',
                getStatusColor(selectedPurchase.status),
              ]"
            >
              {{ selectedPurchase.status }}
            </span>
          </div>
          <div>
            <p class="font-medium">Created By:</p>
            <p>{{ selectedPurchase.createdBy }}</p>
          </div>
        </div>

        <div v-if="selectedPurchase.notes">
          <p class="font-medium text-sm">Notes:</p>
          <p class="text-sm text-gray-600">{{ selectedPurchase.notes }}</p>
        </div>

        <div>
          <h4 class="font-medium mb-2">Items:</h4>
          <div class="space-y-2">
            <div
              v-for="item in selectedPurchase.items"
              :key="item.id"
              class="flex justify-between items-center p-2 bg-gray-50 rounded"
            >
              <div>
                <span class="font-medium">{{ item.name }}</span>
                <span class="text-sm text-gray-600 ml-2"
                  >{{ item.quantity }} × ${{ item.unitPrice.toFixed(2) }}</span
                >
              </div>
              <span class="font-bold">${{ item.total.toFixed(2) }}</span>
            </div>
          </div>

          <div class="text-right pt-2 border-t mt-2">
            <p>Subtotal: ${{ selectedPurchase.subtotal.toFixed(2) }}</p>
            <p>Tax: ${{ selectedPurchase.tax.toFixed(2) }}</p>
            <p class="font-bold text-lg">Total: ${{ selectedPurchase.total.toFixed(2) }}</p>
          </div>
        </div>

        <div class="flex gap-3 pt-4">
          <Button @click="showViewDialog = false" class="flex-1">Close</Button>
        </div>
      </div>
    </Dialog>
  </div>
</template>
