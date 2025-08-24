import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useBranchesStore } from './branches'

export interface Customer {
  id: string
  customerId: string // Customer ID for loyalty program
  firstName: string
  lastName: string
  email: string
  phone: string
  dateOfBirth?: Date
  address?: {
    street: string
    city: string
    state: string
    zipCode: string
  }
  preferences: {
    favoriteProducts: string[]
    allergens: string[]
    dietaryRestrictions: string[]
    communicationPreference: 'email' | 'sms' | 'both' | 'none'
  }
  loyaltyCard: {
    number: string
    points: number
    tier: 'bronze' | 'silver' | 'gold' | 'platinum'
    joinDate: Date
    lastVisit: Date
    totalSpent: number
    visitCount: number
  }
  isActive: boolean
  createdAt: Date
  branchId: string
  notes?: string
}

export interface LoyaltyProgram {
  id: string
  name: string
  description: string
  pointsPerDollar: number
  tiers: LoyaltyTier[]
  rewards: LoyaltyReward[]
  isActive: boolean
  branchId: string
}

export interface LoyaltyTier {
  name: 'bronze' | 'silver' | 'gold' | 'platinum'
  minPoints: number
  benefits: string[]
  discountPercentage: number
  birthdayBonus: number
}

export interface LoyaltyReward {
  id: string
  name: string
  description: string
  pointsCost: number
  type: 'free_item' | 'discount' | 'upgrade' | 'special_offer'
  value: number // Dollar value or percentage
  productId?: string
  validUntil?: Date
  maxRedemptions?: number
  currentRedemptions: number
  isActive: boolean
}

export interface PromotionalCampaign {
  id: string
  name: string
  description: string
  type: 'birthday' | 'anniversary' | 'seasonal' | 'product_launch' | 'retention'
  startDate: Date
  endDate: Date
  targetAudience: {
    tiers?: string[]
    ageRange?: { min: number; max: number }
    spendingRange?: { min: number; max: number }
    lastVisitDays?: number
  }
  offer: {
    type: 'percentage_discount' | 'fixed_discount' | 'free_item' | 'bogo' | 'points_multiplier'
    value: number
    minPurchase?: number
    productIds?: string[]
  }
  channels: ('email' | 'sms' | 'in_app' | 'social_media')[]
  status: 'draft' | 'scheduled' | 'active' | 'paused' | 'completed'
  metrics: {
    sentCount: number
    openRate: number
    clickRate: number
    redemptionRate: number
    revenue: number
  }
  branchId: string
}

export interface CustomerFeedback {
  id: string
  customerId: string
  orderId?: string
  branchId: string
  rating: number // 1-5 stars
  type: 'service' | 'product' | 'ambiance' | 'overall'
  category: 'complaint' | 'compliment' | 'suggestion' | 'general'
  title: string
  message: string
  photos?: string[]
  response?: {
    message: string
    respondedBy: string
    respondedAt: Date
  }
  status: 'pending' | 'reviewing' | 'responded' | 'resolved' | 'closed'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  tags: string[]
  createdAt: Date
  resolvedAt?: Date
}

export interface MobileOrder {
  id: string
  customerId: string
  branchId: string
  items: {
    productId: string
    quantity: number
    customizations: string[]
    price: number
  }[]
  subtotal: number
  tax: number
  tip: number
  loyaltyPointsUsed: number
  loyaltyDiscount: number
  total: number
  orderType: 'pickup' | 'delivery'
  scheduledTime?: Date
  specialInstructions?: string
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'picked_up' | 'delivered' | 'cancelled'
  paymentMethod: 'card' | 'apple_pay' | 'google_pay' | 'loyalty_points'
  estimatedTime: number // minutes
  actualTime?: number
  createdAt: Date
  confirmedAt?: Date
  completedAt?: Date
}

export interface CustomerAnalytics {
  totalCustomers: number
  newCustomersThisMonth: number
  averageSpendPerCustomer: number
  customerRetentionRate: number
  loyaltyProgramParticipation: number
  topSpenders: Customer[]
  frequentVisitors: Customer[]
  customerLifetimeValue: number
  churnRate: number
}

export const useCRMStore = defineStore('crm', () => {
  const branchesStore = useBranchesStore()

  // Branch-specific data
  const branchData = ref<
    Record<
      string,
      {
        customers: Customer[]
        loyaltyProgram: LoyaltyProgram
        campaigns: PromotionalCampaign[]
        feedback: CustomerFeedback[]
        mobileOrders: MobileOrder[]
      }
    >
  >({})

  // Helper functions
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

  function initializeBranchData(branchId: string) {
    branchData.value[branchId] = {
      customers: getDefaultCustomers(branchId),
      loyaltyProgram: getDefaultLoyaltyProgram(branchId),
      campaigns: getDefaultCampaigns(branchId),
      feedback: getDefaultFeedback(branchId),
      mobileOrders: [],
    }
  }

  function getDefaultCustomers(branchId: string): Customer[] {
    return [
      {
        id: 'cust-1',
        customerId: 'JC10001',
        firstName: 'John',
        lastName: 'Smith',
        email: 'john.smith@email.com',
        phone: '+1-555-1001',
        dateOfBirth: new Date('1985-03-15'),
        address: {
          street: '123 Main St',
          city: 'Coffee City',
          state: 'CA',
          zipCode: '90210',
        },
        preferences: {
          favoriteProducts: ['1', '3'], // Cappuccino, Latte
          allergens: ['nuts'],
          dietaryRestrictions: [],
          communicationPreference: 'email',
        },
        loyaltyCard: {
          number: 'LC10001',
          points: 1250,
          tier: 'gold',
          joinDate: new Date('2023-01-10'),
          lastVisit: new Date(),
          totalSpent: 890.5,
          visitCount: 47,
        },
        isActive: true,
        createdAt: new Date('2023-01-10'),
        branchId,
        notes: 'VIP customer, prefers oat milk',
      },
      {
        id: 'cust-2',
        customerId: 'JC10002',
        firstName: 'Sarah',
        lastName: 'Johnson',
        email: 'sarah.johnson@email.com',
        phone: '+1-555-1002',
        dateOfBirth: new Date('1990-07-22'),
        preferences: {
          favoriteProducts: ['2', '4'], // Americano, Croissant
          allergens: [],
          dietaryRestrictions: ['vegan'],
          communicationPreference: 'both',
        },
        loyaltyCard: {
          number: 'LC10002',
          points: 780,
          tier: 'silver',
          joinDate: new Date('2023-02-14'),
          lastVisit: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
          totalSpent: 456.75,
          visitCount: 28,
        },
        isActive: true,
        createdAt: new Date('2023-02-14'),
        branchId,
      },
      {
        id: 'cust-3',
        customerId: 'JC10003',
        firstName: 'Mike',
        lastName: 'Chen',
        email: 'mike.chen@email.com',
        phone: '+1-555-1003',
        dateOfBirth: new Date('1988-12-03'),
        preferences: {
          favoriteProducts: ['6'], // Espresso
          allergens: ['dairy'],
          dietaryRestrictions: ['lactose-free'],
          communicationPreference: 'sms',
        },
        loyaltyCard: {
          number: 'LC10003',
          points: 2100,
          tier: 'platinum',
          joinDate: new Date('2022-11-20'),
          lastVisit: new Date(Date.now() - 24 * 60 * 60 * 1000),
          totalSpent: 1340.25,
          visitCount: 89,
        },
        isActive: true,
        createdAt: new Date('2022-11-20'),
        branchId,
        notes: 'Lactose intolerant, always orders almond milk',
      },
    ]
  }

  function getDefaultLoyaltyProgram(branchId: string): LoyaltyProgram {
    return {
      id: 'loyalty-1',
      name: "Judy's Rewards",
      description: 'Earn points with every purchase and unlock exclusive rewards!',
      pointsPerDollar: 10,
      tiers: [
        {
          name: 'bronze',
          minPoints: 0,
          benefits: ['Earn 1x points', 'Birthday drink'],
          discountPercentage: 0,
          birthdayBonus: 50,
        },
        {
          name: 'silver',
          minPoints: 500,
          benefits: ['Earn 1.25x points', 'Birthday drink', 'Free refills'],
          discountPercentage: 5,
          birthdayBonus: 100,
        },
        {
          name: 'gold',
          minPoints: 1000,
          benefits: ['Earn 1.5x points', 'Birthday drink', 'Free refills', 'Skip the line'],
          discountPercentage: 10,
          birthdayBonus: 150,
        },
        {
          name: 'platinum',
          minPoints: 2000,
          benefits: [
            'Earn 2x points',
            'Birthday drink',
            'Free refills',
            'Skip the line',
            'Personal barista',
          ],
          discountPercentage: 15,
          birthdayBonus: 200,
        },
      ],
      rewards: [
        {
          id: 'reward-1',
          name: 'Free Coffee',
          description: 'Any small coffee drink',
          pointsCost: 150,
          type: 'free_item',
          value: 4.5,
          currentRedemptions: 0,
          isActive: true,
        },
        {
          id: 'reward-2',
          name: 'Free Pastry',
          description: 'Any pastry item',
          pointsCost: 100,
          type: 'free_item',
          value: 3.5,
          currentRedemptions: 0,
          isActive: true,
        },
        {
          id: 'reward-3',
          name: '20% Off Order',
          description: '20% discount on your entire order',
          pointsCost: 200,
          type: 'discount',
          value: 20,
          currentRedemptions: 0,
          isActive: true,
        },
      ],
      isActive: true,
      branchId,
    }
  }

  function getDefaultCampaigns(branchId: string): PromotionalCampaign[] {
    const today = new Date()
    const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)
    const nextMonth = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000)

    return [
      {
        id: 'campaign-1',
        name: 'Birthday Celebration',
        description: 'Special birthday offers for our loyal customers',
        type: 'birthday',
        startDate: today,
        endDate: nextMonth,
        targetAudience: {},
        offer: {
          type: 'free_item',
          value: 1,
          productIds: ['1', '2', '3'],
        },
        channels: ['email', 'sms'],
        status: 'active',
        metrics: {
          sentCount: 45,
          openRate: 68.5,
          clickRate: 34.2,
          redemptionRate: 22.1,
          revenue: 156.8,
        },
        branchId,
      },
      {
        id: 'campaign-2',
        name: 'Happy Hour Special',
        description: '25% off all beverages between 2-4 PM',
        type: 'seasonal',
        startDate: today,
        endDate: nextWeek,
        targetAudience: {
          tiers: ['silver', 'gold', 'platinum'],
        },
        offer: {
          type: 'percentage_discount',
          value: 25,
          minPurchase: 5.0,
        },
        channels: ['email', 'in_app'],
        status: 'active',
        metrics: {
          sentCount: 128,
          openRate: 72.3,
          clickRate: 45.6,
          redemptionRate: 18.4,
          revenue: 342.5,
        },
        branchId,
      },
    ]
  }

  function getDefaultFeedback(branchId: string): CustomerFeedback[] {
    return [
      {
        id: 'feedback-1',
        customerId: 'cust-1',
        branchId,
        rating: 5,
        type: 'overall',
        category: 'compliment',
        title: 'Excellent Service!',
        message:
          'The barista was very friendly and my cappuccino was perfect. Love the new loyalty program!',
        status: 'responded',
        priority: 'low',
        tags: ['service', 'loyalty'],
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        response: {
          message:
            "Thank you so much for your kind words! We're thrilled you enjoyed your experience.",
          respondedBy: 'Manager Sarah',
          respondedAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
        },
      },
      {
        id: 'feedback-2',
        customerId: 'cust-2',
        branchId,
        rating: 3,
        type: 'product',
        category: 'suggestion',
        title: 'More Vegan Options Please',
        message:
          'I love coming here but would appreciate more vegan pastry options. The almond croissant is great though!',
        status: 'reviewing',
        priority: 'medium',
        tags: ['vegan', 'menu'],
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      },
      {
        id: 'feedback-3',
        customerId: 'cust-3',
        branchId,
        rating: 4,
        type: 'service',
        category: 'complaint',
        title: 'Long Wait Time',
        message:
          'Had to wait 15 minutes for my order during lunch rush. Staff was friendly but seemed understaffed.',
        status: 'pending',
        priority: 'high',
        tags: ['wait_time', 'staffing'],
        createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
      },
    ]
  }

  // Computed properties
  const customers = computed(() => {
    try {
      return getCurrentBranchData().customers
    } catch {
      return []
    }
  })

  const loyaltyProgram = computed(() => {
    try {
      return getCurrentBranchData().loyaltyProgram
    } catch {
      return null
    }
  })

  const campaigns = computed(() => {
    try {
      return getCurrentBranchData().campaigns
    } catch {
      return []
    }
  })

  const feedback = computed(() => {
    try {
      return getCurrentBranchData().feedback
    } catch {
      return []
    }
  })

  const mobileOrders = computed(() => {
    try {
      return getCurrentBranchData().mobileOrders
    } catch {
      return []
    }
  })

  const activeCustomers = computed(() => {
    return customers.value.filter((customer) => customer.isActive)
  })

  const topCustomers = computed(() => {
    return customers.value
      .sort((a, b) => b.loyaltyCard.totalSpent - a.loyaltyCard.totalSpent)
      .slice(0, 10)
  })

  const pendingFeedback = computed(() => {
    return feedback.value.filter((fb) => fb.status === 'pending')
  })

  const customerAnalytics = computed((): CustomerAnalytics => {
    const totalCustomers = customers.value.length
    const thisMonth = new Date()
    thisMonth.setDate(1)

    const newCustomersThisMonth = customers.value.filter(
      (customer) => customer.createdAt >= thisMonth,
    ).length

    const averageSpendPerCustomer =
      customers.value.reduce((sum, customer) => sum + customer.loyaltyCard.totalSpent, 0) /
      totalCustomers

    const loyaltyParticipation =
      (customers.value.filter((customer) => customer.loyaltyCard.points > 0).length /
        totalCustomers) *
      100

    const customerLifetimeValue = averageSpendPerCustomer * 2.5 // Estimated

    return {
      totalCustomers,
      newCustomersThisMonth,
      averageSpendPerCustomer,
      customerRetentionRate: 85.5, // Mock data
      loyaltyProgramParticipation: loyaltyParticipation,
      topSpenders: topCustomers.value.slice(0, 5),
      frequentVisitors: customers.value
        .sort((a, b) => b.loyaltyCard.visitCount - a.loyaltyCard.visitCount)
        .slice(0, 5),
      customerLifetimeValue,
      churnRate: 8.2, // Mock data
    }
  })

  // Actions
  function addCustomer(
    customer: Omit<Customer, 'id' | 'customerId' | 'loyaltyCard' | 'createdAt' | 'branchId'>,
  ) {
    const data = getCurrentBranchData()
    const customerCount = data.customers.length + 1

    const newCustomer: Customer = {
      ...customer,
      id: `cust-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      customerId: `JC${(10000 + customerCount).toString()}`,
      loyaltyCard: {
        number: `LC${(10000 + customerCount).toString()}`,
        points: 0,
        tier: 'bronze',
        joinDate: new Date(),
        lastVisit: new Date(),
        totalSpent: 0,
        visitCount: 0,
      },
      createdAt: new Date(),
      branchId: branchesStore.selectedBranchId!,
    }

    data.customers.push(newCustomer)
  }

  function updateCustomer(customerId: string, updates: Partial<Customer>) {
    const data = getCurrentBranchData()
    const customerIndex = data.customers.findIndex((customer) => customer.id === customerId)
    if (customerIndex !== -1) {
      data.customers[customerIndex] = { ...data.customers[customerIndex], ...updates }
    }
  }

  function addLoyaltyPoints(customerId: string, points: number) {
    const data = getCurrentBranchData()
    const customer = data.customers.find((customer) => customer.id === customerId)
    if (customer) {
      customer.loyaltyCard.points += points
      customer.loyaltyCard.lastVisit = new Date()
      customer.loyaltyCard.visitCount++

      // Update tier based on points
      const tiers = data.loyaltyProgram.tiers.sort((a, b) => b.minPoints - a.minPoints)
      for (const tier of tiers) {
        if (customer.loyaltyCard.points >= tier.minPoints) {
          customer.loyaltyCard.tier = tier.name
          break
        }
      }
    }
  }

  function redeemReward(customerId: string, rewardId: string) {
    const data = getCurrentBranchData()
    const customer = data.customers.find((customer) => customer.id === customerId)
    const reward = data.loyaltyProgram.rewards.find((reward) => reward.id === rewardId)

    if (customer && reward && customer.loyaltyCard.points >= reward.pointsCost) {
      customer.loyaltyCard.points -= reward.pointsCost
      reward.currentRedemptions++
      return true
    }
    return false
  }

  function submitFeedback(
    feedback: Omit<CustomerFeedback, 'id' | 'createdAt' | 'branchId' | 'status'>,
  ) {
    const data = getCurrentBranchData()
    const newFeedback: CustomerFeedback = {
      ...feedback,
      id: `feedback-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      status: 'pending',
      createdAt: new Date(),
      branchId: branchesStore.selectedBranchId!,
    }
    data.feedback.push(newFeedback)
  }

  function respondToFeedback(feedbackId: string, response: string, respondedBy: string) {
    const data = getCurrentBranchData()
    const feedbackIndex = data.feedback.findIndex((fb) => fb.id === feedbackId)
    if (feedbackIndex !== -1) {
      data.feedback[feedbackIndex].response = {
        message: response,
        respondedBy,
        respondedAt: new Date(),
      }
      data.feedback[feedbackIndex].status = 'responded'
    }
  }

  function createCampaign(campaign: Omit<PromotionalCampaign, 'id' | 'branchId' | 'metrics'>) {
    const data = getCurrentBranchData()
    const newCampaign: PromotionalCampaign = {
      ...campaign,
      id: `campaign-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      branchId: branchesStore.selectedBranchId!,
      metrics: {
        sentCount: 0,
        openRate: 0,
        clickRate: 0,
        redemptionRate: 0,
        revenue: 0,
      },
    }
    data.campaigns.push(newCampaign)
  }

  function placeMobileOrder(order: Omit<MobileOrder, 'id' | 'createdAt' | 'status'>) {
    const data = getCurrentBranchData()
    const newOrder: MobileOrder = {
      ...order,
      id: `order-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      status: 'pending',
      createdAt: new Date(),
    }
    data.mobileOrders.push(newOrder)

    // Add loyalty points to customer
    const pointsEarned = Math.floor(order.total * (data.loyaltyProgram.pointsPerDollar || 10))
    addLoyaltyPoints(order.customerId, pointsEarned)
  }

  return {
    // State
    customers,
    loyaltyProgram,
    campaigns,
    feedback,
    mobileOrders,

    // Computed
    activeCustomers,
    topCustomers,
    pendingFeedback,
    customerAnalytics,

    // Actions
    addCustomer,
    updateCustomer,
    addLoyaltyPoints,
    redeemReward,
    submitFeedback,
    respondToFeedback,
    createCampaign,
    placeMobileOrder,
  }
})
