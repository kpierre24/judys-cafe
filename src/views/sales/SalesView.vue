<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useSalesStore, type Product, type Transaction, type CartItem } from '@/stores/sales'
import { Card, CardHeader, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import {
  PlusIcon,
  MinusIcon,
  PencilIcon,
  ClockIcon,
} from '@heroicons/vue/24/outline'

const salesStore = useSalesStore()

// Ensure branch data exists when component loads
onMounted(() => {
  salesStore.ensureBranchDataExists()
})

// UI & Dialog states
const showCheckoutDialog = ref(false)
const showReceiptDialog = ref(false)
const lastTransaction = ref<Transaction | null>(null)
const activeSidebarTab = ref<'cart' | 'recent'>('cart')

// Per-item notes editing state
const editingNotesItemId = ref<string | null>(null)
const editingNotesValue = ref('')

// Payment state
const paymentAmount = ref(0)
const changeAmount = computed(() => {
  if (salesStore.currentOrder.paymentMethod === 'cash') {
    return Math.max(0, paymentAmount.value - salesStore.cartTotal)
  }
  return 0
})

// Cash preset calculators for quick click
const cashPresets = computed(() => {
  const total = salesStore.cartTotal
  if (total <= 0) return []
  
  const next5 = Math.ceil(total / 5) * 5
  const next10 = Math.ceil(total / 10) * 10
  const next20 = Math.ceil(total / 20) * 20
  
  const presetsSet = new Set<number>()
  presetsSet.add(Math.ceil(total)) // Next exact dollar
  if (next5 > total) presetsSet.add(next5)
  if (next10 > total && next10 !== next5) presetsSet.add(next10)
  if (next20 > total && next20 !== next10 && next20 !== next5) presetsSet.add(next20)
  
  // Always include standard bills
  if (total < 10) presetsSet.add(10)
  if (total < 20) presetsSet.add(20)
  if (total < 50) presetsSet.add(50)
  if (total < 100 && total >= 35) presetsSet.add(100)
  
  return Array.from(presetsSet)
    .filter(val => val >= total)
    .sort((a, b) => a - b)
    .slice(0, 4)
})

// Recent Receipts List
const recentReceipts = computed(() => {
  return salesStore.getRecentTransactions(15)
})

// Customization Dialog State (Feature 5)
const showCustomizationDialog = ref(false)
const selectedProductForCustomization = ref<Product | null>(null)
const selectedModifiers = ref<Record<string, { optionName: string; priceDelta: number }>>({})

function openCustomization(product: Product, event?: Event) {
  if (event) event.stopPropagation()
  selectedProductForCustomization.value = product
  selectedModifiers.value = {}
  
  const categoryMods = salesStore.modifierPresets[product.category as keyof typeof salesStore.modifierPresets] || []
  categoryMods.forEach(group => {
    if (group.options.length > 0) {
      selectedModifiers.value[group.name] = {
        optionName: group.options[0].name,
        priceDelta: group.options[0].price,
      }
    }
  })
  
  showCustomizationDialog.value = true
}

function selectModifierOption(groupName: string, optionName: string, priceDelta: number) {
  selectedModifiers.value[groupName] = { optionName, priceDelta }
}

function addCustomizedItemToCart() {
  if (!selectedProductForCustomization.value) return
  
  const modsList = Object.entries(selectedModifiers.value).map(([groupName, opt]) => ({
    groupName,
    optionName: opt.optionName,
    priceDelta: opt.priceDelta,
  }))
  
  salesStore.addToCart(selectedProductForCustomization.value, 1, modsList)
  showCustomizationDialog.value = false
  selectedProductForCustomization.value = null
}

const customizationTotalPrice = computed(() => {
  if (!selectedProductForCustomization.value) return 0
  const base = selectedProductForCustomization.value.price
  const delta = Object.values(selectedModifiers.value).reduce((sum, mod) => sum + mod.priceDelta, 0)
  return base + delta
})

// Combo Builder Dialog State (Feature 4)
const showComboDialog = ref(false)
const selectedCombo = ref<any>(null)
const comboSelectedDrink = ref<Product | null>(null)
const comboSelectedFood = ref<Product | null>(null)

function openComboBuilder(combo: any) {
  selectedCombo.value = combo
  const drinks = salesStore.products.filter(p => p.category === combo.drinkCategory)
  const foods = salesStore.products.filter(p => p.category === combo.foodCategory)
  comboSelectedDrink.value = drinks[0] || null
  comboSelectedFood.value = foods[0] || null
  showComboDialog.value = true
}

function addSelectedComboToCart() {
  if (!selectedCombo.value || !comboSelectedDrink.value || !comboSelectedFood.value) return
  salesStore.addComboBundleToCart(comboSelectedDrink.value, comboSelectedFood.value, selectedCombo.value)
  showComboDialog.value = false
}

// Auto-Detect Cart Combo Opportunities (Feature 4)
const autoComboOpportunity = computed(() => {
  const cart = salesStore.cart
  if (cart.length < 2) return null

  const coffeeItem = cart.find(item => item.product.category === 'coffee' && !item.isCombo)
  const pastryItem = cart.find(item => item.product.category === 'pastry' && !item.isCombo)

  if (coffeeItem && pastryItem) {
    const origPrice = (coffeeItem.unitPrice || coffeeItem.product.price) + (pastryItem.unitPrice || pastryItem.product.price)
    const comboPrice = 7.50
    const savings = Math.max(0, origPrice - comboPrice)
    if (savings >= 0.5) {
      return {
        coffeeItem,
        pastryItem,
        comboPrice,
        savings,
        name: 'Morning Starter Bundle',
      }
    }
  }
  return null
})

function applyAutoComboDeal() {
  if (!autoComboOpportunity.value) return
  const { coffeeItem, pastryItem } = autoComboOpportunity.value
  
  salesStore.removeFromCart(coffeeItem.id || coffeeItem.product.id)
  salesStore.removeFromCart(pastryItem.id || pastryItem.product.id)

  salesStore.addComboBundleToCart(
    coffeeItem.product,
    pastryItem.product,
    salesStore.comboDeals[0]
  )
}

// AI Smart Upsell Suggestions (Feature 2)
const aiUpsellSuggestions = computed(() => {
  const cart = salesStore.cart
  if (cart.length === 0) return []

  const hasCoffee = cart.some(i => i.product.category === 'coffee')
  const hasPastry = cart.some(i => i.product.category === 'pastry')
  const hasFood = cart.some(i => i.product.category === 'food')

  const suggestions = []

  if (hasCoffee && !hasPastry) {
    const pastry = salesStore.products.find(p => p.category === 'pastry')
    if (pastry) {
      suggestions.push({
        id: pastry.id,
        product: pastry,
        reason: '84% of coffee lovers pair with Almond Croissant!',
        badge: 'Recommended Pairing',
      })
    }
  } else if (hasCoffee && !hasFood) {
    const food = salesStore.products.find(p => p.category === 'food')
    if (food) {
      suggestions.push({
        id: food.id,
        product: food,
        reason: 'Upgrade to Lunch: Add Artisan Sandwich',
        badge: 'Chef Choice',
      })
    }
  }

  return suggestions
})

// Functions
function addProductToCart(product: Product) {
  salesStore.addToCart(product)
}

function incrementCartItem(itemId: string) {
  const item = salesStore.cart.find((item: CartItem) => (item.id || item.product.id) === itemId)
  if (item) {
    salesStore.updateCartItemQuantity(itemId, item.quantity + 1)
  }
}

function decrementCartItem(itemId: string) {
  const item = salesStore.cart.find((item: CartItem) => (item.id || item.product.id) === itemId)
  if (item && item.quantity > 1) {
    salesStore.updateCartItemQuantity(itemId, item.quantity - 1)
  } else {
    salesStore.removeFromCart(itemId)
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
  window.print()
}

function newTransaction() {
  showReceiptDialog.value = false
  lastTransaction.value = null
}

function viewReceipt(transaction: Transaction) {
  lastTransaction.value = transaction
  showReceiptDialog.value = true
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

function selectTipPercent(percent: number) {
  const roundedTip = Math.round(salesStore.cartSubtotal * percent * 100) / 100
  salesStore.updateCurrentOrder({ tip: roundedTip })
}

function startEditingNotes(itemId: string, currentNotes = '') {
  editingNotesItemId.value = itemId
  editingNotesValue.value = currentNotes || ''
}

function saveItemNotes(itemId: string) {
  salesStore.updateCartItemNotes(itemId, editingNotesValue.value)
  editingNotesItemId.value = null
  editingNotesValue.value = ''
}

function cancelEditingNotes() {
  editingNotesItemId.value = null
  editingNotesValue.value = ''
}
</script>

<template>
  <div class="flex flex-col lg:grid lg:grid-cols-12 gap-6 h-full items-start">
    
    <!-- Products Panel (Left) -->
    <div class="lg:col-span-7 xl:col-span-8 flex flex-col space-y-4 w-full">
      
      <!-- Top Branding and Today's Stats Row -->
      <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
        <div>
          <h1 class="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
            Point of Sale
            <span class="text-[10px] font-bold bg-amber-100 text-amber-900 px-2 py-0.5 rounded-full uppercase tracking-wide">
              ☕ Barista Terminal
            </span>
          </h1>
          <p class="text-xs text-gray-500 mt-0.5">Judy's Cafe & Roastery workstation</p>
        </div>
        <div class="flex items-center space-x-3 text-xs bg-amber-50/75 border border-amber-100 px-3.5 py-2 rounded-lg font-medium text-amber-900 shadow-xs">
          <div class="flex items-center space-x-1">
            <span>📅 Today:</span>
            <span class="font-bold text-amber-950">${{ salesStore.todaysSales.toFixed(2) }}</span>
          </div>
          <span class="text-amber-200">|</span>
          <div class="flex items-center space-x-1">
            <span>🗳️ Orders:</span>
            <span class="font-bold text-amber-950">{{ salesStore.todaysOrders }}</span>
          </div>
        </div>
      </div>

      <!-- AI Demand Forecast Peak Alert Banner (Feature 2) -->
      <div class="bg-gradient-to-r from-purple-900 via-indigo-900 to-amber-900 text-white p-3.5 rounded-xl flex items-center justify-between shadow-xs">
        <div class="flex items-center space-x-3">
          <div class="p-2 bg-white/10 rounded-lg text-lg">🧠</div>
          <div>
            <h4 class="text-xs font-bold text-purple-200 uppercase tracking-wide">AI Demand Forecast Alert</h4>
            <p class="text-xs text-white/90 mt-0.5">
              Morning Coffee Rush projected <strong>8:00 AM – 10:30 AM</strong>. High velocity forecasted for Flat Whites & Croissants.
            </p>
          </div>
        </div>
        <Badge class="bg-amber-400 text-amber-950 font-bold text-[10px]">
          +35% Velocity Peak
        </Badge>
      </div>

      <!-- Compact Search & Category Tab Bar -->
      <div class="bg-white p-4 rounded-xl border border-gray-100 shadow-sm space-y-4">
        <!-- Search Input -->
        <div class="relative w-full">
          <span class="absolute inset-y-0 left-3 flex items-center text-gray-400">🔍</span>
          <Input
            v-model="salesStore.searchQuery"
            placeholder="Search coffee, tea, pastries, or sandwiches..."
            class="pl-9 pr-8 py-2 w-full bg-gray-50/50 border-gray-200 rounded-lg focus:bg-white focus:border-amber-500 transition-colors"
          />
          <button
            v-if="salesStore.searchQuery"
            @click="salesStore.searchQuery = ''"
            class="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-gray-600 cursor-pointer font-bold"
          >
            ✕
          </button>
        </div>

        <!-- Horizontal Scrollable Category Filter Pills -->
        <div class="flex items-center space-x-1.5 overflow-x-auto pb-1 scrollbar-thin">
          <button
            v-for="cat in salesStore.categories"
            :key="cat.value"
            @click="salesStore.selectedCategory = cat.value"
            :class="[
              'px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center shadow-xs border whitespace-nowrap cursor-pointer',
              salesStore.selectedCategory === cat.value
                ? 'bg-amber-700 text-white border-amber-700 font-extrabold'
                : 'bg-white text-gray-700 hover:bg-gray-50 border-gray-200'
            ]"
          >
            <span class="mr-1.5 text-sm">{{ getCategoryIcon(cat.value) }}</span>
            {{ cat.label }}
          </button>
        </div>
      </div>

      <!-- COMBOS & PROMOS SPECIAL VIEW (Feature 4) -->
      <div v-if="salesStore.selectedCategory === 'combos'" class="space-y-4">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card
            v-for="combo in salesStore.comboDeals"
            :key="combo.id"
            class="border-amber-200 bg-gradient-to-br from-amber-50/60 to-orange-50/30 hover:border-amber-400 transition-all shadow-xs relative overflow-hidden flex flex-col justify-between"
          >
            <div class="p-4 space-y-2">
              <div class="flex justify-between items-start">
                <Badge class="bg-amber-800 text-white font-bold text-[10px]">
                  {{ combo.badge }}
                </Badge>
                <span class="text-xs text-gray-500 line-through">
                  ${{ combo.estimatedValue.toFixed(2) }}
                </span>
              </div>
              <h3 class="font-bold text-gray-900 text-sm mt-1">{{ combo.name }}</h3>
              <p class="text-xs text-gray-600 leading-relaxed">{{ combo.tagline }}</p>
            </div>
            <div class="p-4 pt-0 border-t border-amber-100 flex justify-between items-center mt-3">
              <div>
                <span class="text-[10px] text-gray-500 block">Bundle Price</span>
                <span class="text-lg font-black text-amber-950">${{ combo.bundlePrice.toFixed(2) }}</span>
              </div>
              <Button
                @click="openComboBuilder(combo)"
                class="bg-amber-800 hover:bg-amber-900 text-white text-xs font-bold px-3 py-1.5 rounded-lg cursor-pointer"
              >
                Build Combo ✨
              </Button>
            </div>
          </Card>
        </div>
      </div>

      <!-- Unified Height Products Grid -->
      <div v-else class="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
        <Card
          v-for="product in salesStore.filteredProducts"
          :key="product.id"
          class="group cursor-pointer hover:shadow-md hover:border-amber-400 border-gray-200/80 transition-all flex flex-col justify-between select-none bg-white relative overflow-hidden"
          @click="addProductToCart(product)"
        >
          <!-- Category Indicator Top Line -->
          <div :class="[
            'h-1 w-full absolute top-0 left-0',
            product.category === 'coffee' ? 'bg-amber-600' :
            product.category === 'pastry' ? 'bg-pink-500' :
            product.category === 'beverage' ? 'bg-blue-500' :
            'bg-emerald-600'
          ]"></div>

          <CardContent class="p-4 pt-5 flex flex-col justify-between h-full space-y-2">
            <!-- Icon and Prep Time -->
            <div class="flex justify-between items-start">
              <span class="text-3xl p-1 bg-gray-50 rounded-lg inline-block group-hover:scale-110 transition-transform">
                {{ getCategoryIcon(product.category) }}
              </span>
              <div class="flex items-center gap-1">
                <button
                  @click="openCustomization(product, $event)"
                  class="text-[10px] bg-amber-50 text-amber-900 border border-amber-200 hover:bg-amber-100 px-2 py-0.5 rounded-full font-bold transition-all"
                  title="Customize options"
                >
                  ⚙️ Customize
                </button>
                <span class="inline-flex items-center text-[10px] text-gray-500 bg-gray-100/80 px-2 py-0.5 rounded-full font-medium">
                  <ClockIcon class="h-3 w-3 mr-0.5 text-gray-400" />
                  {{ product.preparationTime }}m
                </span>
              </div>
            </div>

            <!-- Title & Description (Strict Box sizing for alignment) -->
            <div>
              <h3 class="font-bold text-gray-900 text-xs sm:text-sm group-hover:text-amber-800 transition-colors line-clamp-1">
                {{ product.name }}
              </h3>
              <p class="text-[11px] text-gray-500 mt-1 line-clamp-2 leading-relaxed min-h-[32px]">
                {{ product.description || 'Delightful addition to your order' }}
              </p>
            </div>

            <!-- Price and Plus Indicator -->
            <div class="flex justify-between items-center pt-1.5 border-t border-gray-100">
              <span class="text-sm sm:text-base font-extrabold text-amber-900">
                ${{ product.price.toFixed(2) }}
              </span>
              <span class="p-1 rounded-full bg-amber-50 group-hover:bg-amber-600 group-hover:text-white text-amber-700 transition-all shadow-xs">
                <PlusIcon class="h-3.5 w-3.5" />
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      <!-- Empty State -->
      <div v-if="salesStore.filteredProducts.length === 0" class="bg-white rounded-2xl border border-dashed border-gray-200 text-center py-16 text-gray-500">
        <div class="text-5xl mb-4">🔮</div>
        <h3 class="text-sm font-bold text-gray-800 mb-1">No products found</h3>
        <p class="text-xs text-gray-400 max-w-md mx-auto">Try selecting another category or refining your search parameters.</p>
      </div>
    </div>

    <!-- POS Sidebar: Active Cart & Transactions Panel (Right) -->
    <div class="lg:col-span-5 xl:col-span-4 w-full sticky lg:top-6">
      <div class="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden flex flex-col h-[calc(100vh-140px)] min-h-[600px]">
        
        <!-- Tab Select Header (Cart vs. Recent Receipts) -->
        <div class="grid grid-cols-2 border-b bg-gray-50">
          <button
            @click="activeSidebarTab = 'cart'"
            :class="[
              'py-3.5 text-xs font-bold border-b-2 flex items-center justify-center space-x-1.5 cursor-pointer transition-colors',
              activeSidebarTab === 'cart'
                ? 'border-amber-700 bg-white text-amber-950 font-extrabold'
                : 'border-transparent text-gray-500 hover:text-gray-900 hover:bg-gray-100/50'
            ]"
          >
            <span>🛒 Current Order</span>
            <Badge v-if="salesStore.cart.length > 0" class="bg-amber-600 text-white font-semibold text-[10px] px-1.5 py-0">
              {{ salesStore.cart.reduce((sum, item) => sum + item.quantity, 0) }}
            </Badge>
          </button>
          <button
            @click="activeSidebarTab = 'recent'"
            :class="[
              'py-3.5 text-xs font-bold border-b-2 flex items-center justify-center space-x-1.5 cursor-pointer transition-colors',
              activeSidebarTab === 'recent'
                ? 'border-amber-700 bg-white text-amber-950 font-extrabold'
                : 'border-transparent text-gray-500 hover:text-gray-900 hover:bg-gray-100/50'
            ]"
          >
            <span>🧾 Recent Receipts</span>
          </button>
        </div>

        <!-- TAB 1: CURRENT ORDER ACTIVE CART -->
        <div v-if="activeSidebarTab === 'cart'" class="flex flex-col flex-1 min-h-0">
          
          <!-- Order Type selector -->
          <div class="p-4 border-b border-gray-100 bg-white">
            <div class="grid grid-cols-3 gap-1.5">
              <button
                v-for="type in [
                  { key: 'dine-in', label: 'Dine In' },
                  { key: 'takeout', label: 'Takeout' },
                  { key: 'delivery', label: 'Delivery' },
                ]"
                :key="type.key"
                @click="salesStore.updateCurrentOrder({ orderType: type.key as any })"
                :class="[
                  'py-2 px-1.5 rounded-lg text-xs font-bold border flex flex-col items-center justify-center transition-all cursor-pointer shadow-xs gap-1',
                  salesStore.currentOrder.orderType === type.key
                    ? 'bg-amber-900 text-white border-amber-950'
                    : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                ]"
              >
                <span class="text-sm">{{ getOrderTypeIcon(type.key) }}</span>
                <span>{{ type.label }}</span>
              </button>
            </div>
          </div>

          <!-- Auto-Detect Cart Combo Banner (Feature 4) -->
          <div
            v-if="autoComboOpportunity"
            class="m-3 p-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl shadow-xs flex items-center justify-between"
          >
            <div>
              <span class="text-[10px] uppercase font-bold tracking-wider bg-white/20 px-2 py-0.5 rounded text-white">
                💡 Combo Savings Deal
              </span>
              <p class="text-xs font-extrabold mt-1">
                Bundle Coffee & Pastry as {{ autoComboOpportunity.name }}!
              </p>
              <p class="text-[10px] text-white/90">
                Save ${{ autoComboOpportunity.savings.toFixed(2) }} (Bundle for $7.50)
              </p>
            </div>
            <button
              @click="applyAutoComboDeal"
              class="px-2.5 py-1.5 bg-white text-amber-900 font-extrabold text-xs rounded-lg shadow-xs hover:bg-amber-50 cursor-pointer border-none"
            >
              Apply Save ✨
            </button>
          </div>

          <!-- Scrollable Cart Items Container -->
          <div class="flex-1 overflow-y-auto divide-y divide-gray-100 bg-white min-h-0">
            <!-- Empty state -->
            <div v-if="salesStore.cart.length === 0" class="p-12 text-center text-gray-400">
              <div class="text-4xl mb-3">🛒</div>
              <h4 class="font-bold text-gray-700 text-sm">Active cart is empty</h4>
              <p class="text-xs text-gray-400 mt-1">Tap products on the left menu grid to add items to this ticket.</p>
            </div>

            <!-- Cart list -->
            <div
              v-for="item in salesStore.cart"
              :key="item.id || item.product.id"
              class="p-4 flex flex-col space-y-2 hover:bg-amber-50/20 transition-colors"
            >
              <div class="flex items-start justify-between">
                <!-- Product Details -->
                <div class="flex-1 pr-2">
                  <div class="flex items-center space-x-1.5 flex-wrap gap-1">
                    <span class="text-xs font-bold text-gray-900">{{ item.product.name }}</span>
                    <span class="text-[10px] text-gray-400 font-medium">
                      (${{ (item.unitPrice || item.product.price).toFixed(2) }} ea)
                    </span>
                    <Badge v-if="item.isCombo" class="bg-amber-100 text-amber-900 font-bold text-[9px] px-1.5 py-0">
                      Combo Deal
                    </Badge>
                  </div>

                  <!-- Modifiers Chips Display (Feature 5) -->
                  <div v-if="item.modifiers && item.modifiers.length > 0" class="flex flex-wrap gap-1 mt-1">
                    <span
                      v-for="(mod, idx) in item.modifiers"
                      :key="idx"
                      class="text-[9px] bg-amber-50 text-amber-900 font-semibold px-1.5 py-0.5 rounded border border-amber-200/60"
                    >
                      {{ mod.groupName }}: {{ mod.optionName }}
                      <span v-if="mod.priceDelta > 0" class="text-amber-800 font-bold">
                        (+${{ mod.priceDelta.toFixed(2) }})
                      </span>
                    </span>
                  </div>

                  <!-- Notes text display -->
                  <div v-if="item.notes" class="text-[10px] text-amber-800 font-semibold italic flex items-center mt-1">
                    📝 Note: "{{ item.notes }}"
                  </div>
                </div>

                <!-- Subtotal cost -->
                <span class="font-bold text-xs text-gray-900 min-w-[50px] text-right">
                  ${{ item.subtotal.toFixed(2) }}
                </span>
              </div>

              <!-- Controls Row: Increments, Notes button, Delete -->
              <div class="flex items-center justify-between pt-1">
                <div class="flex items-center space-x-2">
                  <!-- Plus / Minus controls -->
                  <div class="flex items-center border border-gray-200 rounded-lg overflow-hidden bg-white shadow-xs">
                    <button
                      @click="decrementCartItem(item.id || item.product.id)"
                      class="h-7 w-7 text-gray-500 hover:bg-gray-100 flex items-center justify-center font-bold text-xs cursor-pointer border-none"
                    >
                      −
                    </button>
                    <span class="w-8 text-center text-xs font-bold text-gray-800 bg-gray-50/50 py-1">
                      {{ item.quantity }}
                    </span>
                    <button
                      @click="incrementCartItem(item.id || item.product.id)"
                      class="h-7 w-7 text-gray-500 hover:bg-gray-100 flex items-center justify-center font-bold text-xs cursor-pointer border-none"
                    >
                      +
                    </button>
                  </div>

                  <!-- Quick instructions/notes toggle button -->
                  <button
                    @click="startEditingNotes(item.id || item.product.id, item.notes)"
                    class="text-[10px] text-amber-800 bg-amber-50 hover:bg-amber-100/80 px-2.5 py-1 rounded-md font-bold transition-all cursor-pointer flex items-center border border-amber-100/70"
                  >
                    ✏️ Note
                  </button>
                </div>

                <!-- Delete Item trash -->
                <button
                  @click="salesStore.removeFromCart(item.id || item.product.id)"
                  class="text-xs text-gray-400 hover:text-rose-600 p-1 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer border-none bg-transparent"
                  title="Remove item"
                >
                  🗑️
                </button>
              </div>

              <!-- Item-specific Notes Editor -->
              <div v-if="editingNotesItemId === (item.id || item.product.id)" class="mt-2 bg-amber-50/50 p-2 rounded-lg border border-amber-100 space-y-1.5">
                <span class="text-[10px] font-bold text-amber-900 block">Custom Prep Note:</span>
                <div class="flex gap-1.5">
                  <Input
                    v-model="editingNotesValue"
                    placeholder="e.g. Oat milk, Extra hot, Sweetener..."
                    class="h-7 text-xs bg-white border-amber-200 flex-1 py-1"
                    @keyup.enter="saveItemNotes(item.id || item.product.id)"
                    @keyup.esc="cancelEditingNotes"
                  />
                  <button
                    @click="saveItemNotes(item.id || item.product.id)"
                    class="h-7 px-2.5 bg-amber-700 hover:bg-amber-800 text-white font-bold text-[10px] rounded cursor-pointer transition-colors border-none"
                  >
                    Save
                  </button>
                  <button
                    @click="cancelEditingNotes"
                    class="h-7 px-2 bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold text-[10px] rounded cursor-pointer transition-colors border-none"
                  >
                    ✕
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- AI Smart Recommendations Upsell Box (Feature 2) -->
          <div v-if="aiUpsellSuggestions.length > 0" class="p-3 bg-purple-50/80 border-t border-purple-100 space-y-2">
            <div class="flex justify-between items-center">
              <span class="text-[10px] font-extrabold uppercase text-purple-900 tracking-wider flex items-center gap-1">
                🧠 AI Smart Pairing Upsell
              </span>
              <span class="text-[9px] bg-purple-200 text-purple-900 font-bold px-1.5 py-0.2 rounded">
                High Affinity
              </span>
            </div>
            <div
              v-for="sug in aiUpsellSuggestions"
              :key="sug.id"
              class="flex justify-between items-center bg-white p-2 rounded-lg border border-purple-100 shadow-2xs"
            >
              <div>
                <p class="text-xs font-bold text-gray-900">{{ sug.product.name }}</p>
                <p class="text-[10px] text-purple-700 font-medium">{{ sug.reason }}</p>
              </div>
              <button
                @click="addProductToCart(sug.product)"
                class="px-2.5 py-1 bg-purple-700 hover:bg-purple-800 text-white text-[10px] font-bold rounded cursor-pointer transition-all"
              >
                + Add ${{ sug.product.price.toFixed(2) }}
              </button>
            </div>
          </div>

          <!-- Checkout Summary & Pricing Panel -->
          <div class="border-t border-gray-100 bg-gray-50/75 p-4 space-y-3">
            
            <!-- Quick Tip Preset Row -->
            <div v-if="salesStore.cart.length > 0" class="space-y-1.5">
              <div class="flex justify-between items-center text-[11px] font-semibold text-gray-600">
                <span>Add Customer Tip:</span>
                <span v-if="salesStore.currentOrder.tip > 0" class="text-amber-800 font-bold">
                  Current: ${{ salesStore.currentOrder.tip.toFixed(2) }}
                </span>
              </div>
              <div class="grid grid-cols-5 gap-1">
                <button
                  v-for="preset in [
                    { label: '0%', value: 0 },
                    { label: '10%', value: 0.10 },
                    { label: '15%', value: 0.15 },
                    { label: '20%', value: 0.20 },
                  ]"
                  :key="preset.label"
                  @click="selectTipPercent(preset.value)"
                  type="button"
                  :class="[
                    'py-1 text-[10px] font-bold rounded border transition-colors cursor-pointer',
                    Math.abs((salesStore.currentOrder.tip || 0) - (salesStore.cartSubtotal * preset.value)) < 0.05
                      ? 'bg-amber-800 text-white border-amber-800 font-extrabold shadow-sm'
                      : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                  ]"
                >
                  {{ preset.label }}
                </button>
                <button
                  @click="salesStore.updateCurrentOrder({ tip: 0 })"
                  class="py-1 text-[10px] font-bold rounded border border-gray-200 text-gray-500 hover:text-rose-600 hover:bg-rose-50 bg-white cursor-pointer"
                  title="Clear Tip"
                >
                  Clear
                </button>
              </div>
            </div>

            <!-- Financials Breakdown -->
            <div class="space-y-1.5 text-xs">
              <div class="flex justify-between text-gray-600">
                <span>Subtotal:</span>
                <span class="font-semibold text-gray-900">${{ salesStore.cartSubtotal.toFixed(2) }}</span>
              </div>

              <div class="flex justify-between text-gray-600">
                <span>Tax (8%):</span>
                <span class="font-semibold text-gray-900">${{ salesStore.cartTax.toFixed(2) }}</span>
              </div>

              <div class="flex justify-between text-gray-600 items-center">
                <span>Tip Amount:</span>
                <div class="flex items-center space-x-1">
                  <span class="text-gray-400 font-semibold">$</span>
                  <Input
                    :value="(salesStore.currentOrder.tip || 0).toString()"
                    @update:modelValue="
                      salesStore.updateCurrentOrder({ tip: parseFloat($event as string) || 0 })
                    "
                    type="number"
                    min="0"
                    step="0.01"
                    class="w-16 h-6 text-xs text-right p-1 font-semibold border-gray-200"
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div class="border-t border-dashed border-gray-200 pt-2 flex justify-between items-baseline font-bold text-sm text-gray-900">
                <span class="text-xs uppercase tracking-wider text-gray-500">Order Total:</span>
                <span class="text-lg font-extrabold text-amber-900">${{ salesStore.cartTotal.toFixed(2) }}</span>
              </div>
            </div>

            <!-- Optional Customer Metadata Section -->
            <div v-if="salesStore.cart.length > 0" class="grid grid-cols-2 gap-2 mt-2 pt-1 border-t border-gray-100">
              <Input
                :value="salesStore.currentOrder.customerName"
                @update:modelValue="salesStore.updateCurrentOrder({ customerName: String($event) })"
                placeholder="Name (Optional)"
                class="text-[11px] h-8 bg-white"
              />
              <Input
                :value="salesStore.currentOrder.customerPhone"
                @update:modelValue="salesStore.updateCurrentOrder({ customerPhone: String($event) })"
                placeholder="Phone (Optional)"
                class="text-[11px] h-8 bg-white"
              />
            </div>

            <!-- Buttons Row (Clear & Checkout) -->
            <div class="flex gap-2.5 pt-2">
              <Button
                v-if="salesStore.cart.length > 0"
                variant="outline"
                @click="salesStore.clearCart()"
                class="bg-white border-gray-200 text-gray-600 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200 transition-colors text-xs font-semibold px-3 cursor-pointer"
                title="Discard entire order"
              >
                Clear Cart
              </Button>
              <Button
                @click="openCheckout"
                :disabled="salesStore.cart.length === 0"
                class="flex-1 bg-amber-700 hover:bg-amber-800 disabled:bg-gray-200 disabled:text-gray-400 font-extrabold tracking-wide shadow-md transition-all text-xs cursor-pointer py-4"
              >
                Checkout - ${{ salesStore.cartTotal.toFixed(2) }}
              </Button>
            </div>
          </div>
        </div>

        <!-- TAB 2: RECENT COMPLETED RECEIPTS LOOKUP -->
        <div v-else class="flex flex-col flex-1 min-h-0 bg-white">
          <div class="p-3 bg-gray-50 border-b border-gray-100 text-[10px] font-bold text-gray-500 uppercase tracking-wider text-center">
            Last 15 Completed Ticket Sales
          </div>
          
          <div class="flex-1 overflow-y-auto divide-y divide-gray-100 min-h-0">
            <!-- Empty state -->
            <div v-if="recentReceipts.length === 0" class="p-12 text-center text-gray-400">
              <div class="text-4xl mb-3">🧾</div>
              <h4 class="font-bold text-gray-700 text-sm">No recent receipts</h4>
              <p class="text-xs text-gray-400 mt-1">Complete a POS checkout transaction to generate receipts.</p>
            </div>

            <div
              v-for="tx in recentReceipts"
              :key="tx.id"
              class="p-4 flex items-center justify-between hover:bg-amber-50/20 transition-all cursor-pointer"
              @click="viewReceipt(tx)"
              title="Click to view details or reprint receipt"
            >
              <div class="space-y-1">
                <div class="flex items-center space-x-1.5">
                  <span class="text-xs font-bold text-gray-800">{{ tx.receiptNumber }}</span>
                  <Badge :class="[
                    'capitalize font-bold text-[9px] px-1.5 py-0.2 rounded-full border shadow-none',
                    tx.orderType === 'dine-in' ? 'bg-amber-50 text-amber-800 border-amber-200' :
                    tx.orderType === 'takeout' ? 'bg-pink-50 text-pink-800 border-pink-200' :
                    'bg-blue-50 text-blue-800 border-blue-200'
                  ]">
                    {{ tx.orderType }}
                  </Badge>
                </div>
                <div class="text-[10px] text-gray-500 flex items-center space-x-2">
                  <span>{{ new Date(tx.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) }}</span>
                  <span>•</span>
                  <span class="capitalize">{{ tx.paymentMethod }}</span>
                </div>
              </div>
              
              <div class="text-right">
                <div class="text-xs font-extrabold text-amber-950">${{ tx.total.toFixed(2) }}</div>
                <div class="text-[10px] text-amber-800 font-semibold underline mt-0.5">Reprint 🖨️</div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>

  </div>

  <!-- CHECKOUT DIALOG MODAL WITH QUICK CASH PRESETS -->
  <Dialog v-model:open="showCheckoutDialog" title="Checkout">
    <DialogContent class="sm:max-w-[460px]">
      <DialogHeader>
        <DialogTitle class="text-lg font-bold text-gray-950 flex items-center">
          <span class="mr-2">💳</span> Process Order Checkout
        </DialogTitle>
      </DialogHeader>

      <div class="space-y-4 py-3">
        <!-- Payment Method Toggle Block -->
        <div>
          <label class="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Select Payment Method</label>
          <div class="grid grid-cols-3 gap-2">
            <button
              v-for="method in [
                { key: 'cash', label: '💵 Cash' },
                { key: 'card', label: '💳 Card' },
                { key: 'mobile', label: '📱 Mobile' },
              ]"
              :key="method.key"
              type="button"
              @click="salesStore.updateCurrentOrder({ paymentMethod: method.key as any })"
              :class="[
                'py-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer flex flex-col items-center justify-center gap-1 shadow-xs',
                salesStore.currentOrder.paymentMethod === method.key
                  ? 'bg-amber-900 border-amber-950 text-white font-extrabold'
                  : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
              ]"
            >
              {{ method.label }}
            </button>
          </div>
        </div>

        <!-- Cash Payment Section with Quick Calc Presets -->
        <div v-if="salesStore.currentOrder.paymentMethod === 'cash'" class="space-y-3 bg-amber-50/30 p-3 rounded-xl border border-amber-100">
          <div class="flex justify-between items-center">
            <label class="block text-xs font-bold uppercase tracking-wider text-amber-900">Cash Amount Tendered</label>
            <span class="text-[11px] font-semibold text-amber-800">Choose custom bill presets below:</span>
          </div>

          <div class="relative">
            <span class="absolute inset-y-0 left-3 flex items-center text-gray-400 font-bold">$</span>
            <Input
              :value="paymentAmount.toString()"
              @update:modelValue="paymentAmount = parseFloat($event as string) || 0"
              type="number"
              min="0"
              step="0.01"
              class="pl-7 pr-4 py-2 font-bold text-base bg-white border-amber-200 rounded-lg text-gray-900 focus-visible:ring-amber-500"
              :placeholder="salesStore.cartTotal.toFixed(2)"
            />
          </div>

          <!-- Cash Preset Quick Selector -->
          <div class="space-y-1">
            <div class="flex flex-wrap gap-1.5">
              <button
                v-for="cash in cashPresets"
                :key="cash"
                type="button"
                @click="paymentAmount = cash"
                :class="[
                  'px-3 py-1.5 text-xs font-extrabold rounded-lg border transition-all cursor-pointer shadow-xs',
                  paymentAmount === cash
                    ? 'bg-amber-800 border-amber-900 text-white font-black'
                    : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                ]"
              >
                ${{ cash.toFixed(2) }}
              </button>
              <button
                type="button"
                @click="paymentAmount = salesStore.cartTotal"
                :class="[
                  'px-3 py-1.5 text-xs font-extrabold rounded-lg border transition-all cursor-pointer shadow-xs',
                  paymentAmount === salesStore.cartTotal
                    ? 'bg-amber-800 border-amber-900 text-white font-black'
                    : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                ]"
              >
                Exact ($${{ salesStore.cartTotal.toFixed(2) }})
              </button>
            </div>
          </div>

          <!-- Dynamic Change Calculator Results -->
          <div v-if="changeAmount > 0" class="p-3 bg-emerald-50 border border-emerald-100 rounded-lg flex justify-between items-center">
            <span class="text-xs font-bold text-emerald-800">💵 Change Due back to customer:</span>
            <span class="text-base font-extrabold text-emerald-950">${{ changeAmount.toFixed(2) }}</span>
          </div>

          <div
            v-if="paymentAmount > 0 && paymentAmount < salesStore.cartTotal"
            class="p-2.5 bg-rose-50 border border-rose-100 rounded-lg text-xs font-semibold text-rose-800"
          >
            ⚠️ Amount received is less than total price. Please request more cash or exact change.
          </div>
        </div>

        <!-- Ticket Summary Recipient -->
        <div class="bg-gray-50 p-4 rounded-xl border border-gray-100 text-xs space-y-2">
          <h4 class="font-bold text-gray-700 uppercase tracking-wider text-[10px] mb-1">Ticket Bill Breakdowns</h4>
          <div class="flex justify-between text-gray-600">
            <span>Subtotal:</span>
            <span class="font-semibold text-gray-900">${{ salesStore.cartSubtotal.toFixed(2) }}</span>
          </div>
          <div class="flex justify-between text-gray-600">
            <span>Sales Tax (8%):</span>
            <span class="font-semibold text-gray-900">${{ salesStore.cartTax.toFixed(2) }}</span>
          </div>
          <div v-if="salesStore.currentOrder.tip > 0" class="flex justify-between text-gray-600">
            <span>Add Tip:</span>
            <span class="font-semibold text-emerald-700">+${{ (salesStore.currentOrder.tip || 0).toFixed(2) }}</span>
          </div>
          <hr class="border-gray-200/60 my-1.5" />
          <div class="flex justify-between text-sm font-extrabold text-gray-900">
            <span>Grand Total:</span>
            <span class="text-base text-amber-900 font-extrabold">${{ salesStore.cartTotal.toFixed(2) }}</span>
          </div>
        </div>

        <!-- Checkout Buttons Footer -->
        <div class="flex gap-2.5 pt-2">
          <Button
            @click="processPayment"
            :disabled="salesStore.currentOrder.paymentMethod === 'cash' && paymentAmount < salesStore.cartTotal"
            class="flex-1 bg-amber-700 hover:bg-amber-800 disabled:bg-gray-200 text-xs font-bold py-3 cursor-pointer"
          >
            Complete Order & Print
          </Button>
          <Button variant="outline" @click="showCheckoutDialog = false" class="text-xs font-bold cursor-pointer">
            Cancel
          </Button>
        </div>
      </div>
    </DialogContent>
  </Dialog>

  <!-- RECEIPT PREVIEW DIALOG -->
  <Dialog v-model:open="showReceiptDialog" title="Transaction Complete">
    <DialogContent class="sm:max-w-[420px]">
      <div v-if="lastTransaction" class="space-y-4">
        <div class="text-center py-2">
          <div class="text-5xl mb-2">✨</div>
          <h3 class="text-lg font-bold text-amber-950">Transaction Successful!</h3>
          <p class="text-xs text-gray-500 mt-1">Receipt Ticket: #{{ lastTransaction.receiptNumber }}</p>
        </div>

        <!-- Aesthetic Vintage Boutique Receipt Preview -->
        <div class="bg-gray-50/50 border border-gray-200 p-5 rounded-xl text-xs font-mono text-gray-800 space-y-4 shadow-inner relative">
          <!-- Decorative teeth paper top line -->
          <div class="text-center space-y-1">
            <h2 class="font-black text-sm tracking-widest text-amber-950">JUDY'S CAFE</h2>
            <p class="text-[10px] text-gray-500">Premium Artisanal Coffee & Desserts</p>
            <p class="text-[10px] text-gray-500">Date: {{ new Date(lastTransaction.timestamp).toLocaleString() }}</p>
            <div class="border-b border-dashed border-gray-300 my-2"></div>
            <p class="text-[10px] font-bold text-gray-700 flex justify-between">
              <span>Receipt: {{ lastTransaction.receiptNumber }}</span>
              <span>Cashier ID: {{ lastTransaction.cashierName }}</span>
            </p>
            <p class="text-[10px] text-left text-gray-500 font-semibold capitalize">Order Type: {{ lastTransaction.orderType }}</p>
          </div>

          <!-- Items list -->
          <div class="space-y-1.5 text-[11px]">
            <div
              v-for="item in lastTransaction.items"
              :key="item.product.id"
              class="flex flex-col"
            >
              <div class="flex justify-between font-bold text-gray-900">
                <span>{{ item.quantity }}x {{ item.product.name }}</span>
                <span>${{ item.subtotal.toFixed(2) }}</span>
              </div>
              <span v-if="item.notes" class="text-[9px] text-amber-800 italic pl-3">
                * Note: "{{ item.notes }}"
              </span>
            </div>
          </div>

          <!-- Pricing breakdowns -->
          <div class="border-t border-dashed border-gray-300 pt-2.5 space-y-1">
            <div class="flex justify-between text-gray-600">
              <span>Subtotal:</span>
              <span>${{ lastTransaction.subtotal.toFixed(2) }}</span>
            </div>
            <div class="flex justify-between text-gray-600">
              <span>Tax (8%):</span>
              <span>${{ lastTransaction.tax.toFixed(2) }}</span>
            </div>
            <div v-if="lastTransaction.tip > 0" class="flex justify-between text-gray-600">
              <span>Service Tip:</span>
              <span>${{ lastTransaction.tip.toFixed(2) }}</span>
            </div>
            <div class="flex justify-between font-extrabold text-gray-950 border-t border-dashed border-gray-300 pt-1.5 text-sm">
              <span>Grand Total Paid:</span>
              <span>${{ lastTransaction.total.toFixed(2) }}</span>
            </div>
          </div>

          <!-- Footer brand message -->
          <div class="text-center pt-2 text-[10px] text-gray-400 border-t border-dashed border-gray-200">
            <p>Thank you for shopping at Judy's Cafe!</p>
            <p class="mt-0.5 tracking-wider">WWW.JUDYSCAFE.COM</p>
          </div>
        </div>

        <!-- Reprint or Proceed -->
        <div class="flex gap-2.5 pt-2">
          <Button @click="printReceipt" variant="outline" class="flex-1 text-xs font-bold cursor-pointer">
            🖨️ Print Receipt
          </Button>
          <Button @click="newTransaction" class="flex-1 bg-amber-800 hover:bg-amber-900 text-xs font-bold cursor-pointer">
            Next Transaction
          </Button>
        </div>
      </div>
    </DialogContent>
  </Dialog>

  <!-- CUSTOMIZATION DIALOG MODAL (Feature 5) -->
  <Dialog v-model:open="showCustomizationDialog" title="Customize Item">
    <DialogContent class="sm:max-w-[500px]">
      <DialogHeader>
        <DialogTitle v-if="selectedProductForCustomization" class="text-base font-bold text-gray-900 flex items-center gap-2">
          <span>⚙️ Customize</span> {{ selectedProductForCustomization.name }}
        </DialogTitle>
      </DialogHeader>

      <div v-if="selectedProductForCustomization" class="space-y-4 py-2">
        <div
          v-for="group in (salesStore.modifierPresets[selectedProductForCustomization.category as keyof typeof salesStore.modifierPresets] || [])"
          :key="group.name"
          class="space-y-1.5"
        >
          <label class="text-xs font-bold text-gray-700 block uppercase tracking-wider">{{ group.name }}</label>
          <div class="flex flex-wrap gap-1.5">
            <button
              v-for="opt in group.options"
              :key="opt.name"
              type="button"
              @click="selectModifierOption(group.name, opt.name, opt.price)"
              :class="[
                'px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all cursor-pointer shadow-2xs',
                selectedModifiers[group.name]?.optionName === opt.name
                  ? 'bg-amber-800 text-white border-amber-900 font-extrabold'
                  : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
              ]"
            >
              {{ opt.name }}
              <span v-if="opt.price > 0" class="text-[10px] font-bold opacity-80">
                (+${{ opt.price.toFixed(2) }})
              </span>
            </button>
          </div>
        </div>

        <!-- Custom Price Total & Action Button -->
        <div class="border-t border-gray-100 pt-4 flex justify-between items-center mt-4">
          <div>
            <span class="text-[10px] text-gray-500 block font-medium">Customized Price</span>
            <span class="text-xl font-black text-amber-950">${{ customizationTotalPrice.toFixed(2) }}</span>
          </div>
          <Button
            @click="addCustomizedItemToCart"
            class="bg-amber-800 hover:bg-amber-900 text-white font-bold text-xs py-2.5 px-5 cursor-pointer"
          >
            Add to Ticket (${{ customizationTotalPrice.toFixed(2) }})
          </Button>
        </div>
      </div>
    </DialogContent>
  </Dialog>

  <!-- COMBO BUILDER DIALOG MODAL (Feature 4) -->
  <Dialog v-model:open="showComboDialog" title="Build Combo Bundle">
    <DialogContent class="sm:max-w-[480px]">
      <DialogHeader>
        <DialogTitle v-if="selectedCombo" class="text-base font-bold text-gray-900 flex items-center gap-2">
          <span>✨</span> {{ selectedCombo.name }}
        </DialogTitle>
      </DialogHeader>

      <div v-if="selectedCombo" class="space-y-4 py-2">
        <p class="text-xs text-gray-500 leading-relaxed">{{ selectedCombo.tagline }}</p>

        <!-- Drink Choice -->
        <div class="space-y-1.5">
          <label class="text-xs font-bold text-gray-700 block uppercase tracking-wider">
            1. Choose Beverage / Coffee
          </label>
          <div class="grid grid-cols-2 gap-2 max-h-36 overflow-y-auto p-1 border rounded-lg">
            <button
              v-for="drink in salesStore.products.filter(p => p.category === selectedCombo.drinkCategory)"
              :key="drink.id"
              type="button"
              @click="comboSelectedDrink = drink"
              :class="[
                'p-2 text-xs font-semibold rounded-md border text-left cursor-pointer transition-all',
                comboSelectedDrink?.id === drink.id
                  ? 'bg-amber-800 text-white border-amber-900 font-extrabold'
                  : 'bg-white text-gray-800 border-gray-200 hover:bg-gray-50'
              ]"
            >
              {{ drink.name }}
            </button>
          </div>
        </div>

        <!-- Food Choice -->
        <div class="space-y-1.5">
          <label class="text-xs font-bold text-gray-700 block uppercase tracking-wider">
            2. Choose Bakery / Food Item
          </label>
          <div class="grid grid-cols-2 gap-2 max-h-36 overflow-y-auto p-1 border rounded-lg">
            <button
              v-for="food in salesStore.products.filter(p => p.category === selectedCombo.foodCategory)"
              :key="food.id"
              type="button"
              @click="comboSelectedFood = food"
              :class="[
                'p-2 text-xs font-semibold rounded-md border text-left cursor-pointer transition-all',
                comboSelectedFood?.id === food.id
                  ? 'bg-amber-800 text-white border-amber-900 font-extrabold'
                  : 'bg-white text-gray-800 border-gray-200 hover:bg-gray-50'
              ]"
            >
              {{ food.name }}
            </button>
          </div>
        </div>

        <div class="border-t border-gray-100 pt-3 flex justify-between items-center">
          <div>
            <span class="text-[10px] text-gray-500 block font-medium">Bundle Price</span>
            <span class="text-xl font-black text-amber-950">${{ selectedCombo.bundlePrice.toFixed(2) }}</span>
          </div>
          <Button
            @click="addSelectedComboToCart"
            :disabled="!comboSelectedDrink || !comboSelectedFood"
            class="bg-amber-800 hover:bg-amber-900 text-white font-bold text-xs py-2.5 px-5 cursor-pointer disabled:bg-gray-200"
          >
            Add Bundle to Cart
          </Button>
        </div>
      </div>
    </DialogContent>
  </Dialog>
</template>

<style scoped>
.scrollbar-thin::-webkit-scrollbar {
  height: 5px;
}
.scrollbar-thin::-webkit-scrollbar-track {
  background: transparent;
}
.scrollbar-thin::-webkit-scrollbar-thumb {
  background: #e2e8f0;
  border-radius: 9999px;
}
</style>
