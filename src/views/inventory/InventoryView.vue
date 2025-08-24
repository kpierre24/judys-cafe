<script setup lang="ts">
import { ref, computed } from 'vue'
import { useInventoryStore } from '@/stores/inventory'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import {
  PlusIcon,
  MinusIcon,
  PencilIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  QrCodeIcon,
  CalendarIcon,
} from '@heroicons/vue/24/outline'
import type { InventoryItem } from '@/stores/inventory'

const inventoryStore = useInventoryStore()

const activeTab = ref('overview')
const showAddItemDialog = ref(false)
const showBarcodeScanner = ref(false)
const scannedBarcode = ref('')
const searchQuery = ref('')
const selectedCategory = ref('all')

// Forms
const newItem = ref<Partial<InventoryItem>>({
  name: '',
  category: 'ingredients',
  unit: 'kg',
  currentStock: 0,
  minimumStock: 0,
  maximumStock: 0,
  unitCost: 0,
  supplierId: '',
  barcode: '',
  location: '',
  autoReorderEnabled: true,
  reorderQuantity: 0,
  isActive: true,
})

// Computed
const filteredItems = computed(() => {
  let items = inventoryStore.inventoryItems

  if (selectedCategory.value !== 'all') {
    items = items.filter((item) => item.category === selectedCategory.value)
  }

  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    items = items.filter(
      (item) =>
        item.name.toLowerCase().includes(query) ||
        item.barcode?.toLowerCase().includes(query) ||
        item.location.toLowerCase().includes(query),
    )
  }

  return items
})

const categoryOptions = [
  { value: 'all', label: 'All Categories' },
  { value: 'ingredients', label: 'Ingredients' },
  { value: 'supplies', label: 'Supplies' },
  { value: 'equipment', label: 'Equipment' },
]

const alertsByType = computed(() => {
  const alerts = inventoryStore.stockAlerts
  return {
    critical: alerts.filter((a) => a.severity === 'critical' && !a.isRead),
    high: alerts.filter((a) => a.severity === 'high' && !a.isRead),
  }
})

// Functions
function addInventoryItem() {
  if (newItem.value.name && newItem.value.supplierId) {
    inventoryStore.addInventoryItem(newItem.value as Omit<InventoryItem, 'id' | 'lastRestocked'>)
    resetNewItem()
    showAddItemDialog.value = false
  }
}

function resetNewItem() {
  newItem.value = {
    name: '',
    category: 'ingredients',
    unit: 'kg',
    currentStock: 0,
    minimumStock: 0,
    maximumStock: 0,
    unitCost: 0,
    supplierId: '',
    barcode: '',
    location: '',
    autoReorderEnabled: true,
    reorderQuantity: 0,
    isActive: true,
  }
}

function simulateBarcodeScan() {
  if (scannedBarcode.value) {
    const item = inventoryStore.scanBarcode(scannedBarcode.value)
    if (item) {
      alert(`Found item: ${item.name} (Current stock: ${item.currentStock} ${item.unit})`)
    } else {
      alert('Item not found with this barcode')
    }
    scannedBarcode.value = ''
    showBarcodeScanner.value = false
  }
}

function getStockStatusColor(item: InventoryItem) {
  if (item.currentStock <= item.minimumStock * 0.5) return 'destructive'
  if (item.currentStock <= item.minimumStock) return 'warning'
  if (item.currentStock >= item.maximumStock * 0.9) return 'secondary'
  return 'default'
}

function getStockStatusText(item: InventoryItem) {
  if (item.currentStock <= item.minimumStock * 0.5) return 'Critical'
  if (item.currentStock <= item.minimumStock) return 'Low'
  if (item.currentStock >= item.maximumStock * 0.9) return 'High'
  return 'Normal'
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount)
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(date))
}

function markAlertAsRead(alertId: string) {
  inventoryStore.markAlertAsRead(alertId)
}

function getSupplierName(supplierId: string) {
  const supplier = inventoryStore.suppliers.find((s) => s.id === supplierId)
  return supplier?.name || 'Unknown Supplier'
}

function updateStock(itemId: string, quantity: number, operation: 'restock' | 'consume') {
  const success = inventoryStore.updateStock(itemId, quantity, operation)
  if (!success && operation === 'consume') {
    alert('Insufficient stock for this operation')
  }
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex justify-between items-center">
      <h1 class="text-3xl font-bold">Advanced Inventory Management</h1>
      <div class="flex space-x-2">
        <Button @click="showBarcodeScanner = true" variant="outline">
          <QrCodeIcon class="h-4 w-4 mr-2" />
          Scan Barcode
        </Button>
        <Button @click="showAddItemDialog = true">
          <PlusIcon class="h-4 w-4 mr-2" />
          Add Item
        </Button>
      </div>
    </div>

    <!-- Critical Alerts -->
    <div v-if="alertsByType.critical.length > 0" class="space-y-2">
      <Alert v-for="alert in alertsByType.critical" :key="alert.id" variant="destructive">
        <ExclamationTriangleIcon class="h-4 w-4" />
        <AlertTitle>{{ alert.type.replace('_', ' ').toUpperCase() }}</AlertTitle>
        <AlertDescription class="flex justify-between items-center">
          <span>{{ alert.message }}</span>
          <Button size="sm" variant="outline" @click="markAlertAsRead(alert.id)">
            Mark as Read
          </Button>
        </AlertDescription>
      </Alert>
    </div>

    <!-- Stats Overview -->
    <div class="grid grid-cols-1 md:grid-cols-5 gap-4">
      <Card>
        <CardHeader class="pb-2">
          <CardTitle class="text-sm font-medium">Total Items</CardTitle>
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-bold">{{ inventoryStore.inventoryItems.length }}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader class="pb-2">
          <CardTitle class="text-sm font-medium">Low Stock</CardTitle>
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-bold text-orange-600">
            {{ inventoryStore.lowStockItems.length }}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader class="pb-2">
          <CardTitle class="text-sm font-medium">Expired</CardTitle>
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-bold text-red-600">
            {{ inventoryStore.expiredItems.length }}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader class="pb-2">
          <CardTitle class="text-sm font-medium">Expiring Soon</CardTitle>
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-bold text-yellow-600">
            {{ inventoryStore.expiringSoonItems.length }}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader class="pb-2">
          <CardTitle class="text-sm font-medium">Unread Alerts</CardTitle>
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-bold text-blue-600">
            {{ inventoryStore.unreadAlerts.length }}
          </div>
        </CardContent>
      </Card>
    </div>

    <!-- Main Tabs -->
    <Tabs v-model="activeTab" class="w-full">
      <TabsList class="grid w-full grid-cols-4">
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="inventory">Inventory</TabsTrigger>
        <TabsTrigger value="suppliers">Suppliers</TabsTrigger>
        <TabsTrigger value="alerts">Alerts</TabsTrigger>
      </TabsList>

      <!-- Overview Tab -->
      <TabsContent value="overview" class="space-y-4">
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <!-- Low Stock Items -->
          <Card>
            <CardHeader>
              <CardTitle class="flex items-center">
                <ExclamationTriangleIcon class="h-5 w-5 mr-2 text-orange-500" />
                Low Stock Items
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div class="space-y-2">
                <div v-if="inventoryStore.lowStockItems.length === 0" class="text-gray-500 text-sm">
                  No low stock items
                </div>
                <div
                  v-for="item in inventoryStore.lowStockItems"
                  :key="item.id"
                  class="flex justify-between items-center p-2 bg-orange-50 rounded"
                >
                  <div>
                    <span class="font-medium">{{ item.name }}</span>
                    <div class="text-sm text-gray-600">
                      {{ item.currentStock }} {{ item.unit }} remaining
                    </div>
                  </div>
                  <Badge variant="destructive">{{ getStockStatusText(item) }}</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <!-- Expiring Items -->
          <Card>
            <CardHeader>
              <CardTitle class="flex items-center">
                <ClockIcon class="h-5 w-5 mr-2 text-yellow-500" />
                Expiring Soon
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div class="space-y-2">
                <div
                  v-if="inventoryStore.expiringSoonItems.length === 0"
                  class="text-gray-500 text-sm"
                >
                  No items expiring soon
                </div>
                <div
                  v-for="item in inventoryStore.expiringSoonItems"
                  :key="item.id"
                  class="flex justify-between items-center p-2 bg-yellow-50 rounded"
                >
                  <div>
                    <span class="font-medium">{{ item.name }}</span>
                    <div class="text-sm text-gray-600">
                      Expires: {{ formatDate(item.expiryDate!) }}
                    </div>
                  </div>
                  <Badge variant="warning">Expiring</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </TabsContent>

      <!-- Inventory Tab -->
      <TabsContent value="inventory" class="space-y-4">
        <!-- Filters -->
        <div class="flex space-x-4">
          <div class="flex-1">
            <Input
              v-model="searchQuery"
              placeholder="Search items by name, barcode, or location..."
              class="max-w-sm"
            />
          </div>
          <Select v-model="selectedCategory">
            <SelectTrigger class="w-48">
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem
                v-for="option in categoryOptions"
                :key="option.value"
                :value="option.value"
              >
                {{ option.label }}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <!-- Inventory Items -->
        <Card>
          <CardHeader>
            <CardTitle>Inventory Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div class="space-y-4">
              <div
                v-for="item in filteredItems"
                :key="item.id"
                class="flex items-center justify-between p-4 border rounded-lg"
              >
                <div class="flex-1">
                  <div class="flex items-center space-x-3">
                    <h3 class="font-semibold">{{ item.name }}</h3>
                    <Badge :variant="getStockStatusColor(item)">
                      {{ getStockStatusText(item) }}
                    </Badge>
                    <Badge variant="outline">{{ item.category }}</Badge>
                    <Badge v-if="item.autoReorderEnabled" variant="secondary">Auto-Reorder</Badge>
                  </div>
                  <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2 text-sm">
                    <div>
                      <span class="text-gray-500">Stock:</span>
                      <span class="font-medium ml-1">{{ item.currentStock }} {{ item.unit }}</span>
                    </div>
                    <div>
                      <span class="text-gray-500">Min/Max:</span>
                      <span class="font-medium ml-1"
                        >{{ item.minimumStock }}/{{ item.maximumStock }}</span
                      >
                    </div>
                    <div>
                      <span class="text-gray-500">Cost:</span>
                      <span class="font-medium ml-1">{{ formatCurrency(item.unitCost) }}</span>
                    </div>
                    <div>
                      <span class="text-gray-500">Location:</span>
                      <span class="font-medium ml-1">{{ item.location }}</span>
                    </div>
                  </div>
                  <div v-if="item.expiryDate" class="text-sm text-gray-600 mt-1">
                    <CalendarIcon class="h-4 w-4 inline mr-1" />
                    Expires: {{ formatDate(item.expiryDate) }} (Batch: {{ item.batchNumber }})
                  </div>
                  <div v-if="item.barcode" class="text-sm text-gray-600 mt-1">
                    <QrCodeIcon class="h-4 w-4 inline mr-1" />
                    Barcode: {{ item.barcode }}
                  </div>
                </div>

                <div class="flex items-center space-x-2">
                  <div class="flex flex-col space-y-1">
                    <Button
                      size="sm"
                      variant="outline"
                      @click="updateStock(item.id, 10, 'restock')"
                    >
                      <PlusIcon class="h-3 w-3 mr-1" />+10
                    </Button>
                    <Button size="sm" variant="outline" @click="updateStock(item.id, 5, 'consume')">
                      <MinusIcon class="h-3 w-3 mr-1" />-5
                    </Button>
                  </div>
                  <Button size="sm" variant="outline">
                    <PencilIcon class="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <!-- Suppliers Tab -->
      <TabsContent value="suppliers" class="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Supplier Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div class="space-y-4">
              <div
                v-for="supplier in inventoryStore.supplierPerformance"
                :key="supplier.id"
                class="flex items-center justify-between p-4 border rounded-lg"
              >
                <div class="flex-1">
                  <div class="flex items-center space-x-3">
                    <h3 class="font-semibold">{{ supplier.name }}</h3>
                    <Badge :variant="supplier.isActive ? 'default' : 'secondary'">
                      {{ supplier.isActive ? 'Active' : 'Inactive' }}
                    </Badge>
                    <div class="flex items-center space-x-1">
                      <span class="text-sm">⭐</span>
                      <span class="text-sm font-medium">{{ supplier.rating }}/5</span>
                    </div>
                  </div>
                  <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2 text-sm">
                    <div>
                      <span class="text-gray-500">Contact:</span>
                      <span class="font-medium ml-1">{{ supplier.contact }}</span>
                    </div>
                    <div>
                      <span class="text-gray-500">Lead Time:</span>
                      <span class="font-medium ml-1">{{ supplier.leadTimeDays }} days</span>
                    </div>
                    <div>
                      <span class="text-gray-500">On-Time:</span>
                      <span class="font-medium ml-1"
                        >{{ supplier.onTimePercentage.toFixed(1) }}%</span
                      >
                    </div>
                    <div>
                      <span class="text-gray-500">Total Orders:</span>
                      <span class="font-medium ml-1">{{ supplier.totalOrders }}</span>
                    </div>
                  </div>
                </div>
                <Button size="sm" variant="outline">
                  <PencilIcon class="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <!-- Alerts Tab -->
      <TabsContent value="alerts" class="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Stock Alerts</CardTitle>
          </CardHeader>
          <CardContent>
            <div class="space-y-4">
              <div
                v-if="inventoryStore.stockAlerts.length === 0"
                class="text-center text-gray-500 py-8"
              >
                No alerts found
              </div>
              <div
                v-for="alert in inventoryStore.stockAlerts"
                :key="alert.id"
                class="border rounded-lg p-4"
              >
                <div class="flex justify-between items-start">
                  <div class="flex-1">
                    <div class="flex items-center space-x-3">
                      <Badge
                        :variant="
                          alert.severity === 'critical'
                            ? 'destructive'
                            : alert.severity === 'high'
                              ? 'warning'
                              : 'default'
                        "
                      >
                        {{ alert.severity.toUpperCase() }}
                      </Badge>
                      <span class="font-medium">{{
                        alert.type.replace('_', ' ').toUpperCase()
                      }}</span>
                      <Badge v-if="!alert.isRead" variant="secondary">Unread</Badge>
                    </div>
                    <p class="mt-2">{{ alert.message }}</p>
                    <p class="text-sm text-gray-500 mt-1">{{ formatDate(alert.createdAt) }}</p>
                  </div>
                  <Button
                    v-if="!alert.isRead"
                    size="sm"
                    variant="outline"
                    @click="markAlertAsRead(alert.id)"
                  >
                    Mark as Read
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>

    <!-- Add Item Dialog -->
    <Dialog v-model:open="showAddItemDialog">
      <DialogContent class="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Add New Inventory Item</DialogTitle>
        </DialogHeader>
        <div class="grid gap-4 py-4">
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="text-sm font-medium">Name</label>
              <Input v-model="newItem.name" />
            </div>
            <div>
              <label class="text-sm font-medium">Category</label>
              <Select v-model="newItem.category">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ingredients">Ingredients</SelectItem>
                  <SelectItem value="supplies">Supplies</SelectItem>
                  <SelectItem value="equipment">Equipment</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div class="grid grid-cols-3 gap-4">
            <div>
              <label class="text-sm font-medium">Current Stock</label>
              <Input v-model.number="newItem.currentStock" type="number" />
            </div>
            <div>
              <label class="text-sm font-medium">Minimum Stock</label>
              <Input v-model.number="newItem.minimumStock" type="number" />
            </div>
            <div>
              <label class="text-sm font-medium">Maximum Stock</label>
              <Input v-model.number="newItem.maximumStock" type="number" />
            </div>
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="text-sm font-medium">Unit Cost</label>
              <Input v-model.number="newItem.unitCost" type="number" step="0.01" />
            </div>
            <div>
              <label class="text-sm font-medium">Supplier</label>
              <Select v-model="newItem.supplierId">
                <SelectTrigger>
                  <SelectValue placeholder="Select supplier" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem
                    v-for="supplier in inventoryStore.suppliers"
                    :key="supplier.id"
                    :value="supplier.id"
                  >
                    {{ supplier.name }}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        <div class="flex justify-end space-x-2">
          <Button variant="outline" @click="showAddItemDialog = false">Cancel</Button>
          <Button @click="addInventoryItem">Add Item</Button>
        </div>
      </DialogContent>
    </Dialog>

    <!-- Barcode Scanner Dialog -->
    <Dialog v-model:open="showBarcodeScanner">
      <DialogContent class="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Barcode Scanner</DialogTitle>
        </DialogHeader>
        <div class="space-y-4 py-4">
          <Input v-model="scannedBarcode" placeholder="Enter or scan barcode" />
          <Button @click="simulateBarcodeScan" class="w-full">Search Item</Button>
        </div>
      </DialogContent>
    </Dialog>
  </div>
</template>
