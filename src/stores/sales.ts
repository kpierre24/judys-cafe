import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import { useAuthStore } from './auth'
import { useBranchesStore } from './branches'
import { useSyncStore } from './sync'

export interface Product {
  id: string
  name: string
  category: 'coffee' | 'pastry' | 'beverage' | 'food'
  price: number
  image?: string
  description?: string
  inStock: boolean
  preparationTime: number // in minutes
}

export interface SelectedModifier {
  groupName: string
  optionName: string
  priceDelta: number
}

export interface ComboDeal {
  id: string
  name: string
  tagline: string
  drinkCategory: 'coffee' | 'beverage'
  foodCategory: 'pastry' | 'food'
  bundlePrice: number
  estimatedValue: number
  badge: string
}

export interface CartItem {
  id?: string
  product: Product
  quantity: number
  unitPrice?: number
  subtotal: number
  notes?: string
  modifiers?: SelectedModifier[]
  isCombo?: boolean
  comboName?: string
}

export interface Transaction {
  id: string
  items: CartItem[]
  subtotal: number
  tax: number
  tip: number
  total: number
  paymentMethod: 'cash' | 'card' | 'mobile'
  customerName?: string
  customerPhone?: string
  orderType: 'dine-in' | 'takeout' | 'delivery'
  status: 'pending' | 'preparing' | 'ready' | 'completed' | 'cancelled'
  timestamp: Date
  cashierId: string
  cashierName: string
  branchId?: string
  receiptNumber: string
}

export const useSalesStore = defineStore('sales', () => {
  const authStore = useAuthStore()
  const branchesStore = useBranchesStore()

  // Load initial branchData from storage
  const loadBranchData = () => {
    const saved = localStorage.getItem('judys_sales_branch_data')
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        // Convert timestamp strings back to Date objects
        for (const branchId in parsed) {
          if (parsed[branchId].transactions) {
            parsed[branchId].transactions = parsed[branchId].transactions.map((t: any) => ({
              ...t,
              timestamp: new Date(t.timestamp)
            }))
          }
        }
        return parsed
      } catch (e) {
        console.error('Failed to parse sales branch data', e)
      }
    }
    return {}
  }

  // Branch-specific data structure
  const branchData = ref<
    Record<
      string,
      {
        products: Product[]
        transactions: Transaction[]
        cart: CartItem[]
        currentOrder: {
          customerName: string
          customerPhone: string
          orderType: 'dine-in' | 'takeout' | 'delivery'
          paymentMethod: 'cash' | 'card' | 'mobile'
          notes: string
          tip: number
        }
      }
    >
  >(loadBranchData())

  function saveToStorage() {
    localStorage.setItem('judys_sales_branch_data', JSON.stringify(branchData.value))
  }

  // Filters
  const selectedCategory = ref<string>('all')
  const searchQuery = ref('')

  // Helper function to get current branch data
  function getCurrentBranchData() {
    const branchId = branchesStore.selectedBranchId
    if (!branchId) {
      throw new Error('No branch selected')
    }

    if (!branchData.value[branchId]) {
      return {
        products: [],
        transactions: [],
        cart: [],
        currentOrder: {
          customerName: '',
          customerPhone: '',
          orderType: 'takeout' as const,
          paymentMethod: 'cash' as const,
          notes: '',
          tip: 0,
        },
      }
    }

    return branchData.value[branchId]
  }

  // Initialize data for a branch
  function initializeBranchData(branchId: string) {
    branchData.value[branchId] = {
      products: getDefaultProducts(),
      transactions: [],
      cart: [],
      currentOrder: {
        customerName: '',
        customerPhone: '',
        orderType: 'takeout',
        paymentMethod: 'cash',
        notes: '',
        tip: 0,
      },
    }
    saveToStorage()
  }

  // Default products (same for all branches initially)
  function getDefaultProducts(): Product[] {
    return [
      {
        id: '1',
        name: 'Cappuccino',
        category: 'coffee',
        price: 4.5,
        description: 'Espresso with steamed milk and foam',
        inStock: true,
        preparationTime: 3,
      },
      {
        id: '2',
        name: 'Americano',
        category: 'coffee',
        price: 3.5,
        description: 'Espresso with hot water',
        inStock: true,
        preparationTime: 2,
      },
      {
        id: '3',
        name: 'Latte',
        category: 'coffee',
        price: 4.75,
        description: 'Espresso with steamed milk',
        inStock: true,
        preparationTime: 4,
      },
      {
        id: '4',
        name: 'Croissant',
        category: 'pastry',
        price: 3.5,
        description: 'Freshly baked buttery croissant',
        inStock: true,
        preparationTime: 1,
      },
      {
        id: '5',
        name: 'Blueberry Muffin',
        category: 'pastry',
        price: 4.25,
        description: 'Homemade muffin with fresh blueberries',
        inStock: true,
        preparationTime: 1,
      },
      {
        id: '6',
        name: 'Espresso',
        category: 'coffee',
        price: 2.5,
        description: 'Strong concentrated coffee',
        inStock: true,
        preparationTime: 1,
      },
      {
        id: '7',
        name: 'Orange Juice',
        category: 'beverage',
        price: 3.75,
        description: 'Fresh squeezed orange juice',
        inStock: true,
        preparationTime: 1,
      },
      {
        id: '8',
        name: 'Club Sandwich',
        category: 'food',
        price: 8.5,
        description: 'Triple-layer sandwich with turkey, bacon, and vegetables',
        inStock: true,
        preparationTime: 8,
      },
      {
        id: '9',
        name: 'Flat White',
        category: 'coffee',
        price: 4.25,
        description: 'Velvety microfoam poured over a double shot of organic espresso',
        inStock: true,
        preparationTime: 3,
      },
      {
        id: '10',
        name: 'Matcha Latte',
        category: 'coffee',
        price: 4.95,
        description: 'Stone-ground green tea whisked with velvety steamed milk',
        inStock: true,
        preparationTime: 3,
      },
      {
        id: '11',
        name: 'Chai Tea Latte',
        category: 'beverage',
        price: 4.75,
        description: 'Aromatic spiced black tea infusion with warm steamed milk',
        inStock: true,
        preparationTime: 2,
      },
      {
        id: '12',
        name: 'Cold Brew Coffee',
        category: 'coffee',
        price: 4.0,
        description: 'Slow-steeped for 18 hours in cold water for a super smooth finish',
        inStock: true,
        preparationTime: 1,
      },
      {
        id: '13',
        name: 'Almond Croissant',
        category: 'pastry',
        price: 4.25,
        description: 'Flaky pastry filled with rich sweet frangipane almond cream',
        inStock: true,
        preparationTime: 1,
      },
      {
        id: '14',
        name: 'Cinnamon Roll',
        category: 'pastry',
        price: 4.5,
        description: 'Warm brioche roll swirled with cinnamon and finished with cream cheese glaze',
        inStock: true,
        preparationTime: 2,
      },
      {
        id: '15',
        name: 'Pain au Chocolat',
        category: 'pastry',
        price: 3.95,
        description: 'Classic buttery French pastry filled with semi-sweet dark chocolate',
        inStock: true,
        preparationTime: 1,
      },
      {
        id: '16',
        name: 'French Macarons',
        category: 'pastry',
        price: 8.5,
        description: 'Six delicate almond-meringue cookies in chocolate, raspberry & vanilla',
        inStock: true,
        preparationTime: 1,
      },
      {
        id: '17',
        name: 'Raspberry Scone',
        category: 'pastry',
        price: 3.75,
        description: 'Golden, crumbly scone studded with fresh raspberries and lemon glaze',
        inStock: true,
        preparationTime: 1,
      },
      {
        id: '18',
        name: 'Matcha Crepe Cake',
        category: 'pastry',
        price: 6.5,
        description: 'Over twenty delicate crepe layers with matcha cream',
        inStock: true,
        preparationTime: 1,
      },
    ]
  }

  // Computed properties for current branch
  const products = computed(() => {
    try {
      return getCurrentBranchData().products
    } catch {
      return []
    }
  })

  const cart = computed(() => {
    try {
      return getCurrentBranchData().cart
    } catch {
      return []
    }
  })

  const transactions = computed(() => {
    try {
      return getCurrentBranchData().transactions
    } catch {
      return []
    }
  })

  const currentOrder = computed(() => {
    try {
      return getCurrentBranchData().currentOrder
    } catch {
      return {
        customerName: '',
        customerPhone: '',
        orderType: 'takeout' as const,
        paymentMethod: 'cash' as const,
        notes: '',
        tip: 0,
      }
    }
  })

  const filteredProducts = computed(() => {
    let filtered = products.value

    if (selectedCategory.value !== 'all') {
      filtered = filtered.filter((product) => product.category === selectedCategory.value)
    }

    if (searchQuery.value) {
      const query = searchQuery.value.toLowerCase()
      filtered = filtered.filter(
        (product) =>
          product.name.toLowerCase().includes(query) ||
          product.description?.toLowerCase().includes(query),
      )
    }

    return filtered.filter((product) => product.inStock)
  })

  const cartSubtotal = computed(() => {
    return cart.value.reduce((sum, item) => sum + item.subtotal, 0)
  })

  const cartTax = computed(() => {
    return cartSubtotal.value * 0.08 // 8% tax rate
  })

  const cartTotal = computed(() => {
    return cartSubtotal.value + cartTax.value + (currentOrder.value.tip || 0)
  })

  const todaysSales = computed(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const currentBranchId = branchesStore.selectedBranchId

    return transactions.value
      .filter((transaction) => {
        const transactionDate = new Date(transaction.timestamp)
        transactionDate.setHours(0, 0, 0, 0)
        return (
          transactionDate.getTime() === today.getTime() &&
          transaction.status === 'completed' &&
          transaction.branchId === currentBranchId
        )
      })
      .reduce((sum, transaction) => sum + transaction.total, 0)
  })

  const todaysOrders = computed(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const currentBranchId = branchesStore.selectedBranchId

    return transactions.value.filter((transaction) => {
      const transactionDate = new Date(transaction.timestamp)
      transactionDate.setHours(0, 0, 0, 0)
      return (
        transactionDate.getTime() === today.getTime() && transaction.branchId === currentBranchId
      )
    }).length
  })

  const comboDeals: ComboDeal[] = [
    {
      id: 'combo-morning',
      name: '🥐 Morning Starter Bundle',
      tagline: 'Any Coffee + Any Fresh Bakery Pastry',
      drinkCategory: 'coffee',
      foodCategory: 'pastry',
      bundlePrice: 7.5,
      estimatedValue: 9.25,
      badge: 'Save $1.75',
    },
    {
      id: 'combo-tea',
      name: '🍰 Artisan High Tea Special',
      tagline: 'Specialty Latte / Tea + Gourmet Crepe / Macarons',
      drinkCategory: 'coffee',
      foodCategory: 'pastry',
      bundlePrice: 10.5,
      estimatedValue: 13.0,
      badge: 'Save $2.50',
    },
    {
      id: 'combo-lunch',
      name: '🥪 Cafe Express Lunch Box',
      tagline: 'Club Sandwich + Cold Brew / Iced Beverage',
      drinkCategory: 'beverage',
      foodCategory: 'food',
      bundlePrice: 11.5,
      estimatedValue: 13.75,
      badge: 'Save $2.25',
    },
  ]

  const modifierPresets = {
    coffee: [
      {
        name: 'Milk Choice',
        options: [
          { name: 'Whole Milk', price: 0 },
          { name: 'Oat Milk', price: 0.75 },
          { name: 'Almond Milk', price: 0.75 },
          { name: 'Soy Milk', price: 0.5 },
          { name: 'Skim Milk', price: 0 },
        ],
      },
      {
        name: 'Espresso Shot',
        options: [
          { name: 'Standard Double', price: 0 },
          { name: 'Extra Shot', price: 1.0 },
          { name: 'Decaf Blend', price: 0 },
        ],
      },
      {
        name: 'Flavor Syrup',
        options: [
          { name: 'None', price: 0 },
          { name: 'Vanilla Syrup', price: 0.5 },
          { name: 'Caramel Drizzle', price: 0.5 },
          { name: 'Hazelnut', price: 0.5 },
          { name: 'Lavender Honey', price: 0.75 },
        ],
      },
      {
        name: 'Temperature & Ice',
        options: [
          { name: 'Hot', price: 0 },
          { name: 'Extra Hot', price: 0 },
          { name: 'Iced', price: 0 },
          { name: 'Light Ice', price: 0 },
        ],
      },
      {
        name: 'Sweetness',
        options: [
          { name: '100% Standard', price: 0 },
          { name: '50% Less Sweet', price: 0 },
          { name: 'Unsweetened', price: 0 },
        ],
      },
    ],
    beverage: [
      {
        name: 'Milk / Base',
        options: [
          { name: 'Standard Milk', price: 0 },
          { name: 'Oat Milk', price: 0.75 },
          { name: 'Almond Milk', price: 0.75 },
        ],
      },
      {
        name: 'Temperature',
        options: [
          { name: 'Hot', price: 0 },
          { name: 'Iced', price: 0 },
          { name: 'Light Ice', price: 0 },
        ],
      },
    ],
    pastry: [
      {
        name: 'Service Option',
        options: [
          { name: 'Fresh Room Temp', price: 0 },
          { name: 'Warm / Toasted', price: 0 },
          { name: 'Add Whipped Butter & Jam', price: 0.5 },
        ],
      },
    ],
    food: [
      {
        name: 'Preparation',
        options: [
          { name: 'Press & Toast Hot', price: 0 },
          { name: 'Serve Fresh Cold', price: 0 },
          { name: 'Extra Garlic Aioli Side', price: 0.75 },
        ],
      },
    ],
  }

  const categories = [
    { value: 'all', label: 'All Items' },
    { value: 'coffee', label: 'Coffee' },
    { value: 'pastry', label: 'Pastry' },
    { value: 'beverage', label: 'Beverages' },
    { value: 'food', label: 'Food' },
    { value: 'combos', label: 'Combos & Promos 🏷️' },
  ]

  // Functions
  function addToCart(product: Product, quantity = 1, modifiers: SelectedModifier[] = []) {
    const branchData = getCurrentBranchData()
    const modifiersDelta = modifiers.reduce((acc, mod) => acc + mod.priceDelta, 0)
    const unitPrice = product.price + modifiersDelta
    const itemKey = `${product.id}_${modifiers.map(m => `${m.groupName}:${m.optionName}`).join('|')}`

    const existingItem = branchData.cart.find((item) => (item.id || item.product.id) === itemKey)

    if (existingItem) {
      existingItem.quantity += quantity
      existingItem.subtotal = existingItem.quantity * (existingItem.unitPrice || product.price)
    } else {
      branchData.cart.push({
        id: itemKey,
        product,
        quantity,
        unitPrice,
        subtotal: quantity * unitPrice,
        modifiers: modifiers.length > 0 ? modifiers : undefined,
      })
    }
    saveToStorage()
  }

  function addComboBundleToCart(drink: Product, food: Product, combo: ComboDeal) {
    const branchData = getCurrentBranchData()
    const comboKey = `combo_${combo.id}_${Date.now()}`
    
    branchData.cart.push({
      id: comboKey,
      product: {
        id: `bundle_${combo.id}`,
        name: `${combo.name} (${drink.name} + ${food.name})`,
        category: 'food',
        price: combo.bundlePrice,
        description: combo.tagline,
        inStock: true,
        preparationTime: Math.max(drink.preparationTime, food.preparationTime),
      },
      quantity: 1,
      unitPrice: combo.bundlePrice,
      subtotal: combo.bundlePrice,
      isCombo: true,
      comboName: combo.name,
      notes: `Includes: ${drink.name} & ${food.name}`,
    })
    saveToStorage()
  }

  function removeFromCart(itemId: string) {
    const branchData = getCurrentBranchData()
    const index = branchData.cart.findIndex((item) => (item.id || item.product.id) === itemId)
    if (index !== -1) {
      branchData.cart.splice(index, 1)
      saveToStorage()
    }
  }

  function updateCartItemQuantity(itemId: string, quantity: number) {
    if (quantity <= 0) {
      removeFromCart(itemId)
      return
    }

    const branchData = getCurrentBranchData()
    const item = branchData.cart.find((item) => (item.id || item.product.id) === itemId)
    if (item) {
      item.quantity = quantity
      item.subtotal = quantity * (item.unitPrice || item.product.price)
      saveToStorage()
    }
  }

  function updateCartItemNotes(productId: string, notes: string) {
    const branchData = getCurrentBranchData()
    const item = branchData.cart.find((item) => item.product.id === productId)
    if (item) {
      item.notes = notes
      saveToStorage()
    }
  }

  function updateCurrentOrder(updates: Partial<typeof currentOrder.value>) {
    const branchData = getCurrentBranchData()
    Object.assign(branchData.currentOrder, updates)
    saveToStorage()
  }

  function clearCart() {
    const branchData = getCurrentBranchData()
    branchData.cart = []
    branchData.currentOrder = {
      customerName: '',
      customerPhone: '',
      orderType: 'takeout',
      paymentMethod: 'cash',
      notes: '',
      tip: 0,
    }
    saveToStorage()
  }

  function generateReceiptNumber(): string {
    const date = new Date()
    const year = date.getFullYear().toString().slice(-2)
    const month = (date.getMonth() + 1).toString().padStart(2, '0')
    const day = date.getDate().toString().padStart(2, '0')
    const timestamp = Date.now().toString().slice(-6)

    return `JC${year}${month}${day}${timestamp}`
  }

  function processTransaction(): Transaction {
    const branchData = getCurrentBranchData()

    if (branchData.cart.length === 0) {
      throw new Error('Cart is empty')
    }

    if (!authStore.user) {
      throw new Error('No user authenticated')
    }

    if (!branchesStore.selectedBranchId) {
      throw new Error('No branch selected')
    }

    const transaction: Transaction = {
      id: Date.now().toString(),
      items: [...branchData.cart],
      subtotal: cartSubtotal.value,
      tax: cartTax.value,
      tip: branchData.currentOrder.tip || 0,
      total: cartTotal.value,
      paymentMethod: branchData.currentOrder.paymentMethod,
      customerName: branchData.currentOrder.customerName,
      customerPhone: branchData.currentOrder.customerPhone,
      orderType: branchData.currentOrder.orderType,
      status: 'pending',
      timestamp: new Date(),
      cashierId: authStore.user.id,
      cashierName: authStore.user.name,
      branchId: branchesStore.selectedBranchId,
      receiptNumber: generateReceiptNumber(),
    }

    branchData.transactions.push(transaction)
    clearCart()
    saveToStorage()

    // Sync with Supabase
    const syncStore = useSyncStore()
    syncStore.queueAction('transactions', 'insert', {
      id: transaction.id,
      receipt_number: transaction.receiptNumber,
      customer_name: transaction.customerName || null,
      customer_phone: transaction.customerPhone || null,
      subtotal: transaction.subtotal,
      tax: transaction.tax,
      tip: transaction.tip,
      total: transaction.total,
      payment_method: transaction.paymentMethod,
      order_type: transaction.orderType,
      cashier_name: transaction.cashierName,
      branch_id: transaction.branchId || branchesStore.selectedBranchId,
      status: 'completed',
      transaction_date: transaction.timestamp.toISOString()
    })

    // Mark as completed immediately (in real app, this would be when order is fulfilled)
    setTimeout(() => {
      const completedTransaction = branchData.transactions.find((t) => t.id === transaction.id)
      if (completedTransaction) {
        completedTransaction.status = 'completed'
        saveToStorage()
      }
    }, 1000)

    return transaction
  }

  function getRecentTransactions(limit = 10) {
    return transactions.value
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit)
  }

  // Get transactions for a specific branch
  function getBranchTransactions(branchId: string) {
    return branchData.value[branchId]?.transactions || []
  }

  // Add Product action
  function addProduct(product: Omit<Product, 'id'>) {
    const branchId = branchesStore.selectedBranchId
    if (!branchId) throw new Error('No branch selected')

    const branchDataRef = getCurrentBranchData()
    const newProduct: Product = {
      ...product,
      id: `prod-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    }

    branchDataRef.products.push(newProduct)
    saveToStorage()

    // Sync with Supabase
    const syncStore = useSyncStore()
    syncStore.queueAction('products', 'insert', {
      id: newProduct.id,
      name: newProduct.name,
      category: newProduct.category,
      price: newProduct.price,
      description: newProduct.description,
      is_available: newProduct.inStock,
      branch_id: branchId
    })

    return newProduct
  }

  // Update Product action
  function updateProduct(productId: string, updates: Partial<Product>) {
    const branchId = branchesStore.selectedBranchId
    if (!branchId) throw new Error('No branch selected')

    const branchDataRef = getCurrentBranchData()
    const productIndex = branchDataRef.products.findIndex((p) => p.id === productId)
    if (productIndex !== -1) {
      branchDataRef.products[productIndex] = { ...branchDataRef.products[productIndex], ...updates }
      saveToStorage()

      const updated = branchDataRef.products[productIndex]
      // Sync with Supabase
      const syncStore = useSyncStore()
      syncStore.queueAction('products', 'update', {
        id: updated.id,
        name: updated.name,
        category: updated.category,
        price: updated.price,
        description: updated.description,
        is_available: updated.inStock,
        branch_id: branchId
      })
      return true
    }
    return false
  }

  // Delete Product action
  function deleteProduct(productId: string) {
    const branchId = branchesStore.selectedBranchId
    if (!branchId) throw new Error('No branch selected')

    const branchDataRef = getCurrentBranchData()
    const productIndex = branchDataRef.products.findIndex((p) => p.id === productId)
    if (productIndex !== -1) {
      const removed = branchDataRef.products[productIndex]
      branchDataRef.products.splice(productIndex, 1)
      saveToStorage()

      // Sync with Supabase
      const syncStore = useSyncStore()
      syncStore.queueAction('products', 'delete', {
        id: removed.id
      })
      return true
    }
    return false
  }

  // Import products from CSV
  function importProductsFromCSV(csvText: string) {
    const branchId = branchesStore.selectedBranchId
    if (!branchId) throw new Error('No branch selected')

    const lines = csvText.split('\n').map(line => line.trim()).filter(Boolean)
    if (lines.length <= 1) return { success: false, message: 'No items found in CSV' }

    // Parse header
    const headers = lines[0].toLowerCase().split(',').map(h => h.trim().replace(/^["']|["']$/g, ''))
    
    const nameIndex = headers.indexOf('name') !== -1 ? headers.indexOf('name') : 0
    const categoryIndex = headers.indexOf('category') !== -1 ? headers.indexOf('category') : 1
    const priceIndex = headers.indexOf('price') !== -1 ? headers.indexOf('price') : 2
    const descIndex = headers.indexOf('description') !== -1 ? headers.indexOf('description') : 3
    const prepIndex = headers.indexOf('preparationtime') !== -1 ? headers.indexOf('preparationtime') : (headers.indexOf('preptime') !== -1 ? headers.indexOf('preptime') : 4)

    const branchDataRef = getCurrentBranchData()
    const syncStore = useSyncStore()
    let importedCount = 0

    // Loop through data lines (skip header)
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i]
      // Simple parse considering quotes
      const matches = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || line.split(',')
      const parts = matches.map(p => p.trim().replace(/^["']|["']$/g, ''))

      if (parts.length < 3) continue // Name, Category, Price are mandatory

      const name = parts[nameIndex] || ''
      if (!name) continue

      let category: 'coffee' | 'pastry' | 'beverage' | 'food' = 'coffee'
      const rawCategory = (parts[categoryIndex] || '').toLowerCase()
      if (rawCategory.includes('pastry') || rawCategory.includes('pastries') || rawCategory.includes('bake')) {
        category = 'pastry'
      } else if (rawCategory.includes('bev') || rawCategory.includes('drink') || rawCategory.includes('juice')) {
        category = 'beverage'
      } else if (rawCategory.includes('food') || rawCategory.includes('sandwich') || rawCategory.includes('meal')) {
        category = 'food'
      } else {
        category = 'coffee'
      }

      const price = parseFloat(parts[priceIndex]) || 0
      const description = parts[descIndex] || ''
      const preparationTime = parseInt(parts[prepIndex]) || 3

      const newProduct: Product = {
        id: `prod-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
        name,
        category,
        price,
        description,
        inStock: true,
        preparationTime
      }

      branchDataRef.products.push(newProduct)
      importedCount++

      // Sync with Supabase
      syncStore.queueAction('products', 'insert', {
        id: newProduct.id,
        name: newProduct.name,
        category: newProduct.category,
        price: newProduct.price,
        description: newProduct.description,
        is_available: newProduct.inStock,
        branch_id: branchId
      })
    }

    saveToStorage()
    return { success: true, count: importedCount }
  }

  // Initialize branch data when branch is selected
  function ensureBranchDataExists() {
    const branchId = branchesStore.selectedBranchId
    if (branchId && !branchData.value[branchId]) {
      initializeBranchData(branchId)
    }
  }

  // Watch for branch selection changes to proactively initialize branch data
  watch(
    () => branchesStore.selectedBranchId,
    (newBranchId) => {
      if (newBranchId && !branchData.value[newBranchId]) {
        initializeBranchData(newBranchId)
      }
    },
    { immediate: true }
  )

  return {
    // State
    selectedCategory,
    searchQuery,

    // Computed
    products,
    cart,
    transactions,
    currentOrder,
    filteredProducts,
    cartSubtotal,
    cartTax,
    cartTotal,
    todaysSales,
    todaysOrders,
    categories,
    comboDeals,
    modifierPresets,

    // Actions
    addToCart,
    addComboBundleToCart,
    removeFromCart,
    updateCartItemQuantity,
    updateCartItemNotes,
    updateCurrentOrder,
    clearCart,
    processTransaction,
    getRecentTransactions,
    getBranchTransactions,
    ensureBranchDataExists,
    initializeBranchData,
    addProduct,
    updateProduct,
    deleteProduct,
    importProductsFromCSV,
  }
})
