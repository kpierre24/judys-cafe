<script setup lang="ts">
import { ref, computed } from 'vue'
import { useInventoryStore } from '@/stores/inventory'
import { useSalesStore } from '@/stores/sales'
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
const salesStore = useSalesStore()

const activeTab = ref('overview')
const showAddItemDialog = ref(false)
const showBarcodeScanner = ref(false)
const scannedBarcode = ref('')
const searchQuery = ref('')
const selectedCategory = ref('all')

// Menu & Pricing management state
const menuSearchQuery = ref('')
const menuSelectedCategory = ref('all')
const showAddProductDialog = ref(false)
const editingProductId = ref<string | null>(null)
const editingPrice = ref<number | undefined>(undefined)
const showCSVImportDialog = ref(false)
const csvText = ref('')
const csvImportError = ref('')
const csvImportSuccess = ref('')

const newProduct = ref({
  name: '',
  category: 'coffee' as 'coffee' | 'pastry' | 'beverage' | 'food',
  price: 0,
  description: '',
  preparationTime: 3,
  inStock: true
})

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

// Menu Management computed & functions
const filteredMenuProducts = computed(() => {
  let list = salesStore.products || []
  if (menuSelectedCategory.value !== 'all') {
    list = list.filter(p => p.category === menuSelectedCategory.value)
  }
  if (menuSearchQuery.value) {
    const q = menuSearchQuery.value.toLowerCase()
    list = list.filter(p => p.name.toLowerCase().includes(q) || (p.description && p.description.toLowerCase().includes(q)))
  }
  return list
})

function startEditPrice(productId: string, currentPrice: number) {
  editingProductId.value = productId
  editingPrice.value = currentPrice
}

function savePrice(productId: string) {
  if (editingPrice.value !== undefined && editingPrice.value >= 0) {
    salesStore.updateProduct(productId, { price: editingPrice.value })
  }
  cancelEditPrice()
}

function cancelEditPrice() {
  editingProductId.value = null
  editingPrice.value = undefined
}

function toggleProductStock(productId: string, currentStock: boolean) {
  salesStore.updateProduct(productId, { inStock: !currentStock })
}

function deleteMenuProduct(productId: string) {
  if (confirm('Are you sure you want to delete this menu item?')) {
    salesStore.deleteProduct(productId)
  }
}

function handleAddProduct() {
  if (newProduct.value.name && newProduct.value.price >= 0) {
    salesStore.addProduct({
      name: newProduct.value.name,
      category: newProduct.value.category,
      price: newProduct.value.price,
      description: newProduct.value.description,
      preparationTime: newProduct.value.preparationTime,
      inStock: newProduct.value.inStock
    })
    showAddProductDialog.value = false
    resetNewProduct()
  }
}

function resetNewProduct() {
  newProduct.value = {
    name: '',
    category: 'coffee',
    price: 0,
    description: '',
    preparationTime: 3,
    inStock: true
  }
}

function loadSampleCSV() {
  csvText.value = `Name,Category,Price,Description,PreparationTime
Judy's Reserve Latte,coffee,4.99,Our signature triple shot velvet latte,4
Blueberry Glazed Tart,pastry,3.85,Warm buttery tart,2
Organic Matcha Shake,beverage,4.50,Matcha with almond milk,3
Smoked Salmon Bagel,food,8.25,Fresh bagel with cream cheese,6`
}

function handleCSVImport() {
  if (!csvText.value.trim()) {
    csvImportError.value = 'Please enter or paste CSV data.'
    return
  }

  const result = salesStore.importProductsFromCSV(csvText.value)
  if (result.success) {
    csvImportSuccess.value = `Successfully imported ${result.count} products!`
    csvImportError.value = ''
    csvText.value = ''
    setTimeout(() => {
      showCSVImportDialog.value = false
      csvImportSuccess.value = ''
    }, 2000)
  } else {
    csvImportError.value = result.message || 'Import failed. Please check CSV format.'
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
      <TabsList class="grid w-full grid-cols-5">
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="inventory">Inventory Items</TabsTrigger>
        <TabsTrigger value="menu">Menu & Pricing</TabsTrigger>
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

      <!-- Menu & Pricing Tab -->
      <TabsContent value="menu" class="space-y-4">
        <!-- Toolbar -->
        <div class="flex flex-col sm:flex-row justify-between gap-4 items-center bg-gray-50 p-4 rounded-lg border">
          <div class="flex flex-1 w-full sm:w-auto gap-3">
            <Input
              v-model="menuSearchQuery"
              placeholder="Search products by name or description..."
              class="max-w-md w-full bg-white"
            />
            <Select v-model="menuSelectedCategory">
              <SelectTrigger class="w-48 bg-white border border-gray-200">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="coffee">Coffee</SelectItem>
                <SelectItem value="pastry">Pastry</SelectItem>
                <SelectItem value="beverage">Beverages</SelectItem>
                <SelectItem value="food">Food</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div class="flex space-x-2 w-full sm:w-auto justify-end">
            <Button @click="showCSVImportDialog = true" variant="outline" class="cursor-pointer hover:bg-gray-100 flex items-center bg-white border-gray-200">
              <span class="mr-1">🧾</span> Bulk CSV Import
            </Button>
            <Button @click="showAddProductDialog = true" class="cursor-pointer flex items-center">
              <PlusIcon class="h-4 w-4 mr-1" /> Add Menu Item
            </Button>
          </div>
        </div>

        <!-- Menu Grid/Table -->
        <Card>
          <CardHeader class="pb-2">
            <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
              <CardTitle class="text-xl font-bold font-serif">Judy's Cafe Menu Items ({{ filteredMenuProducts.length }})</CardTitle>
              <span class="text-xs font-normal text-gray-500">Click a product price to edit it, or toggle stock availability instantly.</span>
            </div>
          </CardHeader>
          <CardContent>
            <div class="overflow-x-auto border rounded-lg">
              <table class="w-full text-left border-collapse">
                <thead>
                  <tr class="border-b text-xs font-semibold uppercase text-gray-500 bg-gray-50/75">
                    <th class="p-3">Product Name & Desc</th>
                    <th class="p-3">Category</th>
                    <th class="p-3 w-44">Price (USD)</th>
                    <th class="p-3 text-center">Prep Time</th>
                    <th class="p-3 text-center">Status</th>
                    <th class="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody class="divide-y text-sm">
                  <tr v-if="filteredMenuProducts.length === 0">
                    <td colspan="6" class="p-8 text-center text-gray-500">
                      No menu items found. Click "Add Menu Item" or "Bulk CSV Import" to add products!
                    </td>
                  </tr>
                  <tr v-for="product in filteredMenuProducts" :key="product.id" class="hover:bg-gray-50/50 transition-colors">
                    <!-- Product Details -->
                    <td class="p-3">
                      <div class="font-semibold text-gray-900">{{ product.name }}</div>
                      <div class="text-xs text-gray-500 mt-0.5 max-w-sm truncate" :title="product.description">
                        {{ product.description || 'No description available' }}
                      </div>
                    </td>
                    
                    <!-- Category Badge -->
                    <td class="p-3">
                      <Badge :class="[
                        'capitalize font-medium shadow-none text-xs border border-transparent',
                        product.category === 'coffee' ? 'bg-amber-100 text-amber-800' :
                        product.category === 'pastry' ? 'bg-pink-100 text-pink-800' :
                        product.category === 'beverage' ? 'bg-blue-100 text-blue-800' :
                        'bg-emerald-100 text-emerald-800'
                      ]">
                        {{ product.category }}
                      </Badge>
                    </td>

                    <!-- Pricing Inline Edit -->
                    <td class="p-3">
                      <div v-if="editingProductId === product.id" class="flex items-center space-x-1">
                        <span class="text-gray-500 font-semibold">$</span>
                        <Input
                          v-model.number="editingPrice"
                          type="number"
                          step="0.01"
                          min="0"
                          class="w-20 h-8 text-sm p-1 font-semibold border-blue-500 focus-visible:ring-1 focus-visible:ring-blue-500"
                          @keyup.enter="savePrice(product.id)"
                          @keyup.esc="cancelEditPrice"
                        />
                        <button class="h-7 w-7 text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 rounded border border-emerald-200 bg-white flex items-center justify-center cursor-pointer font-bold" @click="savePrice(product.id)" title="Save">
                          ✔
                        </button>
                        <button class="h-7 w-7 text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded border border-rose-200 bg-white flex items-center justify-center cursor-pointer font-bold" @click="cancelEditPrice" title="Cancel">
                          ✕
                        </button>
                      </div>
                      <div v-else class="flex items-center group cursor-pointer py-1 px-1.5 hover:bg-gray-100/70 rounded max-w-max transition-colors" @click="startEditPrice(product.id, product.price)" title="Click to edit price">
                        <span class="font-semibold text-gray-900 mr-1.5">{{ formatCurrency(product.price) }}</span>
                        <PencilIcon class="h-3 w-3 text-gray-400 group-hover:text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </td>

                    <!-- Preparation Time -->
                    <td class="p-3 text-center">
                      <span class="inline-flex items-center text-xs text-gray-600 bg-gray-100 px-2 py-0.5 rounded-full">
                        <ClockIcon class="h-3 w-3 mr-1 text-gray-400" />
                        {{ product.preparationTime }}m
                      </span>
                    </td>

                    <!-- Stock Availability status toggle -->
                    <td class="p-3 text-center">
                      <button
                        @click="toggleProductStock(product.id, product.inStock)"
                        :class="[
                          'px-2.5 py-1 text-xs font-semibold rounded-full border cursor-pointer transition-all shadow-sm flex items-center mx-auto',
                          product.inStock 
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100'
                            : 'bg-rose-50 border-rose-200 text-rose-700 hover:bg-rose-100'
                        ]"
                        :title="product.inStock ? 'Click to mark as OUT OF STOCK' : 'Click to mark as IN STOCK'"
                      >
                        <span :class="['h-1.5 w-1.5 rounded-full mr-1.5', product.inStock ? 'bg-emerald-500' : 'bg-rose-500']"></span>
                        {{ product.inStock ? 'In Stock' : 'Out of Stock' }}
                      </button>
                    </td>

                    <!-- Deletion action -->
                    <td class="p-3 text-right">
                      <button
                        @click="deleteMenuProduct(product.id)"
                        class="p-1 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-md cursor-pointer transition-colors inline-flex items-center justify-center border-none bg-transparent"
                        title="Delete product"
                      >
                        <span class="text-sm">🗑️</span>
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
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

    <!-- Add Product Dialog -->
    <Dialog v-model:open="showAddProductDialog">
      <DialogContent class="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle class="text-lg font-bold">Add New Menu Item</DialogTitle>
        </DialogHeader>
        <div class="grid gap-4 py-4">
          <div class="grid grid-cols-1 gap-2">
            <label class="text-sm font-semibold text-gray-700">Product Name *</label>
            <Input v-model="newProduct.name" placeholder="e.g. French Vanilla Coffee" />
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="text-sm font-semibold text-gray-700">Category *</label>
              <Select v-model="newProduct.category">
                <SelectTrigger class="w-full bg-white mt-1 border border-gray-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="coffee">Coffee</SelectItem>
                  <SelectItem value="pastry">Pastry</SelectItem>
                  <SelectItem value="beverage">Beverage</SelectItem>
                  <SelectItem value="food">Food</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label class="text-sm font-semibold text-gray-700">Price (USD) *</label>
              <Input v-model.number="newProduct.price" type="number" step="0.01" min="0" class="mt-1" />
            </div>
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="text-sm font-semibold text-gray-700">Prep Time (mins)</label>
              <Input v-model.number="newProduct.preparationTime" type="number" min="1" class="mt-1" />
            </div>
            <div class="flex items-center h-full pt-6 pl-1">
              <label class="inline-flex items-center cursor-pointer">
                <input v-model="newProduct.inStock" type="checkbox" class="rounded border-gray-300 text-blue-600 focus:ring-blue-500 h-4 w-4" />
                <span class="ml-2 text-sm text-gray-700 font-medium">Available in Stock</span>
              </label>
            </div>
          </div>
          <div class="grid grid-cols-1 gap-2">
            <label class="text-sm font-semibold text-gray-700">Description</label>
            <Input v-model="newProduct.description" placeholder="Short description of the item" />
          </div>
        </div>
        <div class="flex justify-end space-x-2 border-t pt-4">
          <Button variant="outline" @click="showAddProductDialog = false" class="cursor-pointer">Cancel</Button>
          <Button @click="handleAddProduct" class="cursor-pointer" :disabled="!newProduct.name || newProduct.price < 0">Add Item</Button>
        </div>
      </DialogContent>
    </Dialog>

    <!-- CSV Bulk Import Dialog -->
    <Dialog v-model:open="showCSVImportDialog">
      <DialogContent class="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle class="text-lg font-bold flex items-center justify-between">
            <span>Bulk CSV Item Import</span>
            <Button size="sm" variant="outline" class="text-xs h-7 cursor-pointer" @click="loadSampleCSV">
              📋 Load Sample Template
            </Button>
          </DialogTitle>
        </DialogHeader>
        <div class="space-y-4 py-2">
          <p class="text-xs text-gray-500">
            Copy and paste your item list below. Categories supported: <strong>coffee</strong>, <strong>pastry</strong>, <strong>beverage</strong>, <strong>food</strong>.
          </p>
          
          <Alert v-if="csvImportError" variant="destructive" class="py-2">
            <AlertDescription class="text-xs">{{ csvImportError }}</AlertDescription>
          </Alert>

          <Alert v-if="csvImportSuccess" class="bg-emerald-50 border-emerald-200 text-emerald-800 py-2">
            <AlertDescription class="text-xs font-semibold">{{ csvImportSuccess }}</AlertDescription>
          </Alert>

          <div>
            <label class="text-sm font-semibold text-gray-700 mb-1 block">CSV Data (Comma-Separated)</label>
            <textarea
              v-model="csvText"
              rows="8"
              class="w-full text-xs font-mono p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Name,Category,Price,Description,PreparationTime&#10;Matcha Latte,coffee,4.50,Rich organic matcha with steamed oat milk,4&#10;Croissant,pastry,3.50,Butter flaky pastry,1"
            ></textarea>
          </div>
          
          <div class="bg-gray-50 p-3 rounded-lg border border-dashed">
            <p class="text-[11px] font-semibold text-gray-600 uppercase mb-1">Expected CSV Headers:</p>
            <code class="text-[10px] block font-mono text-gray-700 bg-gray-200/50 p-1 rounded">Name,Category,Price,Description,PreparationTime</code>
          </div>
        </div>
        <div class="flex justify-end space-x-2 border-t pt-4">
          <Button variant="outline" @click="showCSVImportDialog = false; csvImportError = ''; csvImportSuccess = ''" class="cursor-pointer">Cancel</Button>
          <Button @click="handleCSVImport" class="cursor-pointer" :disabled="!csvText">Import Items</Button>
        </div>
      </DialogContent>
    </Dialog>
  </div>
</template>
