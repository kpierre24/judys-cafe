import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useAuthStore } from './auth'
import { useBranchesStore } from './branches'

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

export interface CartItem {
  product: Product
  quantity: number
  subtotal: number
  notes?: string
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
  >({})

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
      initializeBranchData(branchId)
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

  const categories = [
    { value: 'all', label: 'All Items' },
    { value: 'coffee', label: 'Coffee' },
    { value: 'pastry', label: 'Pastry' },
    { value: 'beverage', label: 'Beverages' },
    { value: 'food', label: 'Food' },
  ]

  // Functions
  function addToCart(product: Product, quantity = 1) {
    const branchData = getCurrentBranchData()
    const existingItem = branchData.cart.find((item) => item.product.id === product.id)

    if (existingItem) {
      existingItem.quantity += quantity
      existingItem.subtotal = existingItem.quantity * product.price
    } else {
      branchData.cart.push({
        product,
        quantity,
        subtotal: quantity * product.price,
      })
    }
  }

  function removeFromCart(productId: string) {
    const branchData = getCurrentBranchData()
    const index = branchData.cart.findIndex((item) => item.product.id === productId)
    if (index !== -1) {
      branchData.cart.splice(index, 1)
    }
  }

  function updateCartItemQuantity(productId: string, quantity: number) {
    if (quantity <= 0) {
      removeFromCart(productId)
      return
    }

    const branchData = getCurrentBranchData()
    const item = branchData.cart.find((item) => item.product.id === productId)
    if (item) {
      item.quantity = quantity
      item.subtotal = quantity * item.product.price
    }
  }

  function updateCurrentOrder(updates: Partial<typeof currentOrder.value>) {
    const branchData = getCurrentBranchData()
    Object.assign(branchData.currentOrder, updates)
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

    // Mark as completed immediately (in real app, this would be when order is fulfilled)
    setTimeout(() => {
      const completedTransaction = branchData.transactions.find((t) => t.id === transaction.id)
      if (completedTransaction) {
        completedTransaction.status = 'completed'
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

  // Initialize branch data when branch is selected
  function ensureBranchDataExists() {
    const branchId = branchesStore.selectedBranchId
    if (branchId && !branchData.value[branchId]) {
      initializeBranchData(branchId)
    }
  }

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

    // Actions
    addToCart,
    removeFromCart,
    updateCartItemQuantity,
    updateCurrentOrder,
    clearCart,
    processTransaction,
    getRecentTransactions,
    getBranchTransactions,
    ensureBranchDataExists,
    initializeBranchData,
  }
})
