import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useAuthStore } from './auth'
import { useInventoryStore } from './inventory'
import { useSalesStore } from './sales'

export interface StockCheckItem {
  inventoryId: string
  name: string
  expectedCount: number
  actualCount: number
  difference: number
  unit: string
  costPrice: number
  totalVariance: number
  notes?: string
}

export interface PettyCashEntry {
  id: string
  date: Date
  description: string
  amount: number
  type: 'income' | 'expense'
  category: 'supplies' | 'maintenance' | 'utilities' | 'other'
  receiptNumber?: string
  notes?: string
  createdBy: string
}

export interface CashReconciliation {
  id: string
  date: Date
  openingCash: number
  totalSales: number
  pettyCashIn: number
  pettyCashOut: number
  expectedCash: number
  actualCashCount: number
  cashVariance: number
  cashBreakdown: {
    bills: {
      hundred: number
      fifty: number
      twenty: number
      ten: number
      five: number
      one: number
    }
    coins: {
      quarter: number
      dime: number
      nickel: number
      penny: number
    }
  }
  cardSales: number
  mobileSales: number
  notes?: string
  performedBy: string
  verifiedBy?: string
  status: 'pending' | 'verified' | 'discrepancy'
}

export interface EndOfDayReport {
  id: string
  date: Date
  stockCheck: {
    totalItems: number
    itemsWithVariance: number
    totalStockVariance: number
  }
  cashReconciliation: CashReconciliation
  pettyCashSummary: {
    totalIn: number
    totalOut: number
    netChange: number
  }
  salesSummary: {
    totalTransactions: number
    totalRevenue: number
    averageTransaction: number
  }
  status: 'in-progress' | 'completed' | 'requires-attention'
  completedBy: string
  completedAt?: Date
}

export const useEndOfDayStore = defineStore('endOfDay', () => {
  const authStore = useAuthStore()
  const inventoryStore = useInventoryStore()
  const salesStore = useSalesStore()

  // State
  const stockChecks = ref<StockCheckItem[]>([])
  const pettyCashEntries = ref<PettyCashEntry[]>([
    {
      id: '1',
      date: new Date('2024-08-23T10:30:00'),
      description: 'Bought cleaning supplies',
      amount: 25.5,
      type: 'expense',
      category: 'supplies',
      receiptNumber: 'REC-001',
      notes: 'Paper towels and sanitizer',
      createdBy: 'Admin User',
    },
    {
      id: '2',
      date: new Date('2024-08-23T14:15:00'),
      description: 'Cash donation tip jar',
      amount: 15.75,
      type: 'income',
      category: 'other',
      notes: 'Customer tip jar collection',
      createdBy: 'Cashier User',
    },
  ])

  const cashReconciliations = ref<CashReconciliation[]>([])
  const endOfDayReports = ref<EndOfDayReport[]>([])
  const currentStockCheck = ref<StockCheckItem[]>([])
  const isStockCheckInProgress = ref(false)
  const currentCashReconciliation = ref<Partial<CashReconciliation>>({})

  // Computed properties
  const todaysPettyCash = computed(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    return pettyCashEntries.value.filter((entry) => {
      const entryDate = new Date(entry.date)
      entryDate.setHours(0, 0, 0, 0)
      return entryDate.getTime() === today.getTime()
    })
  })

  const pettyCashSummary = computed(() => {
    const todaysEntries = todaysPettyCash.value
    const totalIn = todaysEntries
      .filter((entry) => entry.type === 'income')
      .reduce((sum, entry) => sum + entry.amount, 0)

    const totalOut = todaysEntries
      .filter((entry) => entry.type === 'expense')
      .reduce((sum, entry) => sum + entry.amount, 0)

    return {
      totalIn,
      totalOut,
      netChange: totalIn - totalOut,
      entries: todaysEntries,
    }
  })

  const todaysSalesSummary = computed(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const todaysTransactions = salesStore.transactions.filter((transaction) => {
      const transactionDate = new Date(transaction.timestamp)
      transactionDate.setHours(0, 0, 0, 0)
      return transactionDate.getTime() === today.getTime() && transaction.status === 'completed'
    })

    const totalRevenue = todaysTransactions.reduce((sum, t) => sum + t.total, 0)
    const cashSales = todaysTransactions
      .filter((t) => t.paymentMethod === 'cash')
      .reduce((sum, t) => sum + t.total, 0)
    const cardSales = todaysTransactions
      .filter((t) => t.paymentMethod === 'card')
      .reduce((sum, t) => sum + t.total, 0)
    const mobileSales = todaysTransactions
      .filter((t) => t.paymentMethod === 'mobile')
      .reduce((sum, t) => sum + t.total, 0)

    return {
      totalTransactions: todaysTransactions.length,
      totalRevenue,
      averageTransaction:
        todaysTransactions.length > 0 ? totalRevenue / todaysTransactions.length : 0,
      cashSales,
      cardSales,
      mobileSales,
    }
  })

  // Functions
  function initializeStockCheck() {
    if (isStockCheckInProgress.value) {
      return false // Already in progress
    }

    isStockCheckInProgress.value = true
    currentStockCheck.value = inventoryStore.items.map((item) => ({
      inventoryId: item.id,
      name: item.name,
      expectedCount: item.currentStock,
      actualCount: item.currentStock, // Default to expected, user will adjust
      difference: 0,
      unit: item.unit,
      costPrice: item.costPrice,
      totalVariance: 0,
      notes: '',
    }))

    return true
  }

  function updateStockCount(inventoryId: string, actualCount: number, notes?: string) {
    const item = currentStockCheck.value.find((item) => item.inventoryId === inventoryId)
    if (item) {
      item.actualCount = actualCount
      item.difference = actualCount - item.expectedCount
      item.totalVariance = item.difference * item.costPrice
      if (notes !== undefined) {
        item.notes = notes
      }
    }
  }

  function completeStockCheck(): boolean {
    if (!isStockCheckInProgress.value) {
      return false
    }

    // Apply stock adjustments to inventory
    currentStockCheck.value.forEach((stockItem) => {
      if (stockItem.difference !== 0) {
        // Update inventory with actual count
        inventoryStore.updateItem(stockItem.inventoryId, {
          currentStock: stockItem.actualCount,
        })
      }
    })

    // Save stock check record
    stockChecks.value.push(...currentStockCheck.value.map((item) => ({ ...item })))

    isStockCheckInProgress.value = false
    return true
  }

  function addPettyCashEntry(entry: Omit<PettyCashEntry, 'id' | 'createdBy' | 'date'>) {
    const newEntry: PettyCashEntry = {
      ...entry,
      id: Date.now().toString(),
      date: new Date(),
      createdBy: authStore.user?.name || 'Unknown User',
    }

    pettyCashEntries.value.push(newEntry)
    return newEntry
  }

  function updatePettyCashEntry(id: string, updates: Partial<PettyCashEntry>) {
    const index = pettyCashEntries.value.findIndex((entry) => entry.id === id)
    if (index !== -1) {
      pettyCashEntries.value[index] = { ...pettyCashEntries.value[index], ...updates }
    }
  }

  function deletePettyCashEntry(id: string) {
    const index = pettyCashEntries.value.findIndex((entry) => entry.id === id)
    if (index !== -1) {
      pettyCashEntries.value.splice(index, 1)
    }
  }

  function initializeCashReconciliation(openingCash: number) {
    const salesSummary = todaysSalesSummary.value
    const pettyCash = pettyCashSummary.value

    currentCashReconciliation.value = {
      date: new Date(),
      openingCash,
      totalSales: salesSummary.cashSales,
      pettyCashIn: pettyCash.totalIn,
      pettyCashOut: pettyCash.totalOut,
      expectedCash: openingCash + salesSummary.cashSales + pettyCash.totalIn - pettyCash.totalOut,
      actualCashCount: 0,
      cashVariance: 0,
      cashBreakdown: {
        bills: {
          hundred: 0,
          fifty: 0,
          twenty: 0,
          ten: 0,
          five: 0,
          one: 0,
        },
        coins: {
          quarter: 0,
          dime: 0,
          nickel: 0,
          penny: 0,
        },
      },
      cardSales: salesSummary.cardSales,
      mobileSales: salesSummary.mobileSales,
      performedBy: authStore.user?.name || 'Unknown User',
      status: 'pending',
    }
  }

  function updateCashCount(cashBreakdown: CashReconciliation['cashBreakdown']) {
    if (!currentCashReconciliation.value) return

    currentCashReconciliation.value.cashBreakdown = { ...cashBreakdown }

    // Calculate total cash count
    const { bills, coins } = cashBreakdown
    const totalCash =
      bills.hundred * 100 +
      bills.fifty * 50 +
      bills.twenty * 20 +
      bills.ten * 10 +
      bills.five * 5 +
      bills.one * 1 +
      coins.quarter * 0.25 +
      coins.dime * 0.1 +
      coins.nickel * 0.05 +
      coins.penny * 0.01

    currentCashReconciliation.value.actualCashCount = Math.round(totalCash * 100) / 100
    currentCashReconciliation.value.cashVariance =
      currentCashReconciliation.value.actualCashCount -
      (currentCashReconciliation.value.expectedCash || 0)
  }

  function completeCashReconciliation(notes?: string): CashReconciliation {
    if (!currentCashReconciliation.value.date) {
      throw new Error('Cash reconciliation not initialized')
    }

    const reconciliation: CashReconciliation = {
      id: Date.now().toString(),
      date: currentCashReconciliation.value.date,
      openingCash: currentCashReconciliation.value.openingCash || 0,
      totalSales: currentCashReconciliation.value.totalSales || 0,
      pettyCashIn: currentCashReconciliation.value.pettyCashIn || 0,
      pettyCashOut: currentCashReconciliation.value.pettyCashOut || 0,
      expectedCash: currentCashReconciliation.value.expectedCash || 0,
      actualCashCount: currentCashReconciliation.value.actualCashCount || 0,
      cashVariance: currentCashReconciliation.value.cashVariance || 0,
      cashBreakdown: currentCashReconciliation.value.cashBreakdown || {
        bills: { hundred: 0, fifty: 0, twenty: 0, ten: 0, five: 0, one: 0 },
        coins: { quarter: 0, dime: 0, nickel: 0, penny: 0 },
      },
      cardSales: currentCashReconciliation.value.cardSales || 0,
      mobileSales: currentCashReconciliation.value.mobileSales || 0,
      notes,
      performedBy: currentCashReconciliation.value.performedBy || 'Unknown User',
      status:
        Math.abs(currentCashReconciliation.value.cashVariance || 0) > 0.5
          ? 'discrepancy'
          : 'verified',
    }

    cashReconciliations.value.push(reconciliation)
    currentCashReconciliation.value = {}

    return reconciliation
  }

  function generateEndOfDayReport(): EndOfDayReport {
    const stockCheckItems =
      currentStockCheck.value.length > 0 ? currentStockCheck.value : stockChecks.value
    const latestReconciliation = cashReconciliations.value[cashReconciliations.value.length - 1]
    const salesSummary = todaysSalesSummary.value
    const pettyCash = pettyCashSummary.value

    if (!latestReconciliation) {
      throw new Error('Cash reconciliation must be completed before generating end-of-day report')
    }

    const report: EndOfDayReport = {
      id: Date.now().toString(),
      date: new Date(),
      stockCheck: {
        totalItems: stockCheckItems.length,
        itemsWithVariance: stockCheckItems.filter((item) => item.difference !== 0).length,
        totalStockVariance: stockCheckItems.reduce((sum, item) => sum + item.totalVariance, 0),
      },
      cashReconciliation: latestReconciliation,
      pettyCashSummary: {
        totalIn: pettyCash.totalIn,
        totalOut: pettyCash.totalOut,
        netChange: pettyCash.netChange,
      },
      salesSummary: {
        totalTransactions: salesSummary.totalTransactions,
        totalRevenue: salesSummary.totalRevenue,
        averageTransaction: salesSummary.averageTransaction,
      },
      status:
        stockCheckItems.some((item) => Math.abs(item.difference) > 0) ||
        Math.abs(latestReconciliation.cashVariance) > 0.5
          ? 'requires-attention'
          : 'completed',
      completedBy: authStore.user?.name || 'Unknown User',
      completedAt: new Date(),
    }

    endOfDayReports.value.push(report)

    // Reset for next day
    currentStockCheck.value = []
    isStockCheckInProgress.value = false

    return report
  }

  function getStockVarianceItems() {
    return currentStockCheck.value.filter((item) => item.difference !== 0)
  }

  function getTodaysEndOfDayReport() {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    return endOfDayReports.value.find((report) => {
      const reportDate = new Date(report.date)
      reportDate.setHours(0, 0, 0, 0)
      return reportDate.getTime() === today.getTime()
    })
  }

  const pettyCashCategories = [
    { value: 'supplies', label: 'Supplies' },
    { value: 'maintenance', label: 'Maintenance' },
    { value: 'utilities', label: 'Utilities' },
    { value: 'other', label: 'Other' },
  ]

  return {
    // State
    stockChecks,
    pettyCashEntries,
    cashReconciliations,
    endOfDayReports,
    currentStockCheck,
    isStockCheckInProgress,
    currentCashReconciliation,
    pettyCashCategories,

    // Computed
    todaysPettyCash,
    pettyCashSummary,
    todaysSalesSummary,

    // Actions
    initializeStockCheck,
    updateStockCount,
    completeStockCheck,
    addPettyCashEntry,
    updatePettyCashEntry,
    deletePettyCashEntry,
    initializeCashReconciliation,
    updateCashCount,
    completeCashReconciliation,
    generateEndOfDayReport,
    getStockVarianceItems,
    getTodaysEndOfDayReport,
  }
})
