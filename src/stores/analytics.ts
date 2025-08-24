import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useBranchesStore } from './branches'
import { useSalesStore } from './sales'
import { useCRMStore } from './crm'
import { useEmployeeStore } from './employees'
import { useInventoryStore } from './inventory'

export interface SalesForecast {
  period: 'daily' | 'weekly' | 'monthly' | 'quarterly'
  date: Date
  predictedSales: number
  actualSales?: number
  confidence: number // 0-100%
  factors: {
    seasonality: number
    trends: number
    events: string[]
    weather?: string
  }
}

export interface ProfitAnalysis {
  period: 'daily' | 'weekly' | 'monthly'
  date: Date
  revenue: number
  costs: {
    cogs: number // Cost of Goods Sold
    labor: number
    rent: number
    utilities: number
    supplies: number
    other: number
  }
  grossProfit: number
  netProfit: number
  margins: {
    gross: number
    net: number
  }
  profitByProduct: ProductProfitability[]
}

export interface ProductProfitability {
  productId: string
  name: string
  unitsSold: number
  revenue: number
  cost: number
  profit: number
  margin: number
}

export interface CustomerSegment {
  name: string
  description: string
  customerCount: number
  criteria: {
    spendingRange?: { min: number; max: number }
    visitFrequency?: string
    loyaltyTier?: string[]
    recency?: number // days since last visit
  }
  metrics: {
    averageSpend: number
    lifetimeValue: number
    churnRate: number
    growthRate: number
  }
}

export interface BusinessKPI {
  name: string
  value: number
  target: number
  unit: string
  trend: 'up' | 'down' | 'stable'
  changePercent: number
  period: 'daily' | 'weekly' | 'monthly'
  category: 'sales' | 'operations' | 'customer' | 'financial'
}

export interface BranchComparison {
  branchId: string
  branchName: string
  metrics: {
    sales: number
    profit: number
    customers: number
    orders: number
    averageOrderValue: number
    employeeProductivity: number
    customerSatisfaction: number
  }
  rankings: {
    sales: number
    profit: number
    efficiency: number
    satisfaction: number
  }
}

export interface TrendAnalysis {
  metric: string
  period: 'daily' | 'weekly' | 'monthly'
  data: {
    date: Date
    value: number
  }[]
  trend: 'increasing' | 'decreasing' | 'stable' | 'volatile'
  seasonalPattern?: 'seasonal' | 'non-seasonal'
  growthRate: number
  forecast: number[]
}

export const useAnalyticsStore = defineStore('analytics', () => {
  const branchesStore = useBranchesStore()
  const salesStore = useSalesStore()
  const crmStore = useCRMStore()
  const employeeStore = useEmployeeStore()
  const inventoryStore = useInventoryStore()

  // Branch-specific analytics data
  const branchAnalytics = ref<
    Record<
      string,
      {
        forecasts: SalesForecast[]
        profitAnalysis: ProfitAnalysis[]
        customerSegments: CustomerSegment[]
        trendAnalysis: TrendAnalysis[]
      }
    >
  >({})

  // Helper functions
  function getCurrentBranchAnalytics() {
    const branchId = branchesStore.selectedBranchId
    if (!branchId) {
      throw new Error('No branch selected')
    }

    if (!branchAnalytics.value[branchId]) {
      initializeBranchAnalytics(branchId)
    }

    return branchAnalytics.value[branchId]
  }

  function initializeBranchAnalytics(branchId: string) {
    branchAnalytics.value[branchId] = {
      forecasts: generateSampleForecasts(),
      profitAnalysis: generateSampleProfitAnalysis(),
      customerSegments: generateCustomerSegments(),
      trendAnalysis: generateTrendAnalysis(),
    }
  }

  function generateSampleForecasts(): SalesForecast[] {
    const forecasts: SalesForecast[] = []
    const today = new Date()

    // Generate daily forecasts for next 30 days
    for (let i = 1; i <= 30; i++) {
      const date = new Date(today)
      date.setDate(date.getDate() + i)

      const baseAmount = 800 + Math.random() * 400 // Base $800-1200
      const dayOfWeek = date.getDay()
      const weekendMultiplier = dayOfWeek === 0 || dayOfWeek === 6 ? 1.3 : 1.0
      const seasonality = 1 + Math.sin((i / 30) * Math.PI) * 0.2 // Seasonal variation

      forecasts.push({
        period: 'daily',
        date,
        predictedSales: Math.round(baseAmount * weekendMultiplier * seasonality),
        confidence: 75 + Math.random() * 20, // 75-95% confidence
        factors: {
          seasonality: seasonality - 1,
          trends: 0.05, // 5% growth trend
          events: dayOfWeek === 0 ? ['Weekend Rush'] : [],
          weather: Math.random() > 0.8 ? 'Rain' : 'Clear',
        },
      })
    }

    return forecasts
  }

  function generateSampleProfitAnalysis(): ProfitAnalysis[] {
    const analysis: ProfitAnalysis[] = []
    const today = new Date()

    // Generate last 30 days profit analysis
    for (let i = 0; i < 30; i++) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)

      const revenue = 800 + Math.random() * 600
      const cogs = revenue * (0.25 + Math.random() * 0.1) // 25-35% COGS
      const labor = 200 + Math.random() * 100 // $200-300 daily labor
      const otherCosts = 150 + Math.random() * 50 // $150-200 other costs

      const totalCosts = cogs + labor + otherCosts
      const grossProfit = revenue - cogs
      const netProfit = revenue - totalCosts

      analysis.push({
        period: 'daily',
        date,
        revenue,
        costs: {
          cogs,
          labor,
          rent: 50, // Daily rent allocation
          utilities: 25,
          supplies: 30,
          other: otherCosts - 105,
        },
        grossProfit,
        netProfit,
        margins: {
          gross: (grossProfit / revenue) * 100,
          net: (netProfit / revenue) * 100,
        },
        profitByProduct: [
          {
            productId: '1',
            name: 'Cappuccino',
            unitsSold: Math.floor(Math.random() * 50 + 20),
            revenue: Math.random() * 200 + 100,
            cost: Math.random() * 80 + 40,
            profit: 0,
            margin: 0,
          },
        ],
      })

      // Calculate profit and margin for products
      analysis[analysis.length - 1].profitByProduct.forEach((product) => {
        product.profit = product.revenue - product.cost
        product.margin = (product.profit / product.revenue) * 100
      })
    }

    return analysis.reverse()
  }

  function generateCustomerSegments(): CustomerSegment[] {
    return [
      {
        name: 'VIP Customers',
        description: 'High-value customers with frequent visits',
        customerCount: 45,
        criteria: {
          spendingRange: { min: 500, max: 10000 },
          loyaltyTier: ['gold', 'platinum'],
        },
        metrics: {
          averageSpend: 850.5,
          lifetimeValue: 2100.75,
          churnRate: 5.2,
          growthRate: 12.3,
        },
      },
      {
        name: 'Regular Customers',
        description: 'Frequent visitors with moderate spending',
        customerCount: 127,
        criteria: {
          spendingRange: { min: 100, max: 500 },
          loyaltyTier: ['bronze', 'silver'],
        },
        metrics: {
          averageSpend: 245.3,
          lifetimeValue: 680.9,
          churnRate: 8.7,
          growthRate: 8.1,
        },
      },
      {
        name: 'Occasional Visitors',
        description: 'Infrequent customers with low spending',
        customerCount: 89,
        criteria: {
          spendingRange: { min: 0, max: 100 },
          recency: 30,
        },
        metrics: {
          averageSpend: 45.8,
          lifetimeValue: 120.5,
          churnRate: 25.4,
          growthRate: -2.1,
        },
      },
      {
        name: 'New Customers',
        description: 'Recently acquired customers',
        customerCount: 23,
        criteria: {
          recency: 7,
        },
        metrics: {
          averageSpend: 35.6,
          lifetimeValue: 35.6,
          churnRate: 0,
          growthRate: 45.2,
        },
      },
    ]
  }

  function generateTrendAnalysis(): TrendAnalysis[] {
    const trends: TrendAnalysis[] = []
    const today = new Date()

    // Sales trend
    const salesData = []
    for (let i = 29; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      salesData.push({
        date,
        value: 800 + Math.random() * 400 + i * 5, // Growing trend
      })
    }

    trends.push({
      metric: 'Daily Sales',
      period: 'daily',
      data: salesData,
      trend: 'increasing',
      seasonalPattern: 'seasonal',
      growthRate: 8.5,
      forecast: [1250, 1300, 1350, 1400, 1450], // Next 5 days
    })

    // Customer satisfaction trend
    const satisfactionData = []
    for (let i = 29; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      satisfactionData.push({
        date,
        value: 4.2 + Math.random() * 0.6, // 4.2-4.8 rating
      })
    }

    trends.push({
      metric: 'Customer Satisfaction',
      period: 'daily',
      data: satisfactionData,
      trend: 'stable',
      growthRate: 2.1,
      forecast: [4.6, 4.65, 4.7, 4.7, 4.75],
    })

    return trends
  }

  // Computed properties
  const kpis = computed((): BusinessKPI[] => {
    return [
      {
        name: 'Daily Revenue',
        value: salesStore.todaysSales,
        target: 1000,
        unit: 'USD',
        trend: 'up',
        changePercent: 12.5,
        period: 'daily',
        category: 'sales',
      },
      {
        name: 'Orders Today',
        value: salesStore.todaysOrders,
        target: 80,
        unit: 'orders',
        trend: 'up',
        changePercent: 8.3,
        period: 'daily',
        category: 'operations',
      },
      {
        name: 'Average Order Value',
        value: salesStore.todaysSales / Math.max(salesStore.todaysOrders, 1),
        target: 12.5,
        unit: 'USD',
        trend: 'up',
        changePercent: 4.2,
        period: 'daily',
        category: 'sales',
      },
      {
        name: 'Customer Satisfaction',
        value: 4.6,
        target: 4.5,
        unit: 'stars',
        trend: 'stable',
        changePercent: 0.8,
        period: 'daily',
        category: 'customer',
      },
      {
        name: 'Staff Productivity',
        value: 95.2,
        target: 90,
        unit: '%',
        trend: 'up',
        changePercent: 5.8,
        period: 'daily',
        category: 'operations',
      },
      {
        name: 'Gross Margin',
        value: 68.5,
        target: 65,
        unit: '%',
        trend: 'up',
        changePercent: 2.1,
        period: 'daily',
        category: 'financial',
      },
    ]
  })

  const branchComparisons = computed((): BranchComparison[] => {
    return branchesStore.branches.map((branch, index) => ({
      branchId: branch.id,
      branchName: branch.name,
      metrics: {
        sales: 800 + Math.random() * 600,
        profit: 200 + Math.random() * 300,
        customers: 45 + Math.random() * 35,
        orders: 60 + Math.random() * 40,
        averageOrderValue: 12 + Math.random() * 8,
        employeeProductivity: 85 + Math.random() * 15,
        customerSatisfaction: 4.2 + Math.random() * 0.6,
      },
      rankings: {
        sales: index + 1,
        profit: ((index + 2) % branchesStore.branches.length) + 1,
        efficiency: ((index + 1) % branchesStore.branches.length) + 1,
        satisfaction: index + 1,
      },
    }))
  })

  const realtimeDashboard = computed(() => {
    const now = new Date()
    return {
      currentTime: now,
      liveMetrics: {
        currentOrders: Math.floor(Math.random() * 12 + 3),
        ordersInQueue: Math.floor(Math.random() * 8 + 1),
        averageWaitTime: Math.floor(Math.random() * 8 + 5), // minutes
        staffOnDuty: employeeStore.currentlyWorking.length,
        lowStockAlerts: inventoryStore.criticalAlerts.length,
      },
      hourlyTrends: Array.from({ length: 24 }, (_, hour) => ({
        hour,
        sales: Math.random() * 100 + 20,
        orders: Math.floor(Math.random() * 15 + 2),
      })),
    }
  })

  const customerAnalytics = computed(() => {
    const analytics = crmStore.customerAnalytics

    return {
      ...analytics,
      acquisitionCost: 25.5, // Mock data
      conversionRate: 68.5,
      repeatCustomerRate: 45.8,
      averageOrderFrequency: 2.3, // orders per month
      seasonalTrends: {
        spring: 1.1,
        summer: 1.3,
        fall: 1.0,
        winter: 0.9,
      },
    }
  })

  // Actions
  function generateForecast(period: 'daily' | 'weekly' | 'monthly', days: number) {
    const forecasts: SalesForecast[] = []
    const baseAmount = salesStore.todaysSales || 800

    for (let i = 1; i <= days; i++) {
      const date = new Date()
      date.setDate(date.getDate() + i)

      const seasonality = 1 + Math.sin((i / 30) * Math.PI) * 0.15
      const growth = 1 + (0.02 * i) / 30 // 2% monthly growth
      const randomVariation = 0.9 + Math.random() * 0.2

      forecasts.push({
        period,
        date,
        predictedSales: Math.round(baseAmount * seasonality * growth * randomVariation),
        confidence: 70 + Math.random() * 25,
        factors: {
          seasonality: seasonality - 1,
          trends: 0.02,
          events: [],
          weather: Math.random() > 0.7 ? 'Variable' : 'Normal',
        },
      })
    }

    const analytics = getCurrentBranchAnalytics()
    analytics.forecasts = forecasts
  }

  function analyzeProfitability(startDate: Date, endDate: Date) {
    // This would typically analyze actual transaction data
    // For demo purposes, we'll generate sample analysis

    const analysis: ProfitAnalysis[] = []
    const currentDate = new Date(startDate)

    while (currentDate <= endDate) {
      const revenue = 800 + Math.random() * 400
      const cogs = revenue * 0.3 // 30% COGS
      const labor = 250 // Fixed daily labor cost
      const overhead = 100 // Fixed overhead

      analysis.push({
        period: 'daily',
        date: new Date(currentDate),
        revenue,
        costs: {
          cogs,
          labor,
          rent: 50,
          utilities: 25,
          supplies: 30,
          other: overhead - 105,
        },
        grossProfit: revenue - cogs,
        netProfit: revenue - cogs - labor - overhead,
        margins: {
          gross: ((revenue - cogs) / revenue) * 100,
          net: ((revenue - cogs - labor - overhead) / revenue) * 100,
        },
        profitByProduct: [], // Would be populated with actual product data
      })

      currentDate.setDate(currentDate.getDate() + 1)
    }

    const analytics = getCurrentBranchAnalytics()
    analytics.profitAnalysis = analysis
  }

  function comparePerformance(branchIds: string[]) {
    // Compare performance across branches for specific metrics
    return branchIds.map((branchId) => {
      const branch = branchesStore.branches.find((b) => b.id === branchId)
      return {
        branchId,
        branchName: branch?.name || 'Unknown',
        value: Math.random() * 1000 + 500, // Mock data
        ranking: Math.floor(Math.random() * branchIds.length) + 1,
      }
    })
  }

  return {
    // Computed
    kpis,
    branchComparisons,
    realtimeDashboard,
    customerAnalytics,

    // State
    branchAnalytics,

    // Actions
    generateForecast,
    analyzeProfitability,
    comparePerformance,
  }
})
