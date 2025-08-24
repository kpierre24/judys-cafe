import { defineStore } from 'pinia'
import { ref, computed, reactive } from 'vue'
import { useBranchesStore } from './branches'

export interface HardwareDevice {
  id: string
  name: string
  type:
    | 'cash_drawer'
    | 'receipt_printer'
    | 'barcode_scanner'
    | 'card_reader'
    | 'kitchen_display'
    | 'menu_board'
  status: 'online' | 'offline' | 'error' | 'maintenance'
  model: string
  serialNumber: string
  lastMaintenance: Date
  nextMaintenance: Date
  errorMessage?: string
  batteryLevel?: number
  paperLevel?: number
  temperature?: number
}

export interface ScanResult {
  barcode: string
  productId?: string
  productName?: string
  price?: number
  timestamp: Date
}

export interface PaymentTransaction {
  id: string
  amount: number
  method: 'card' | 'cash' | 'contactless'
  status: 'pending' | 'approved' | 'declined' | 'cancelled'
  cardType?: 'visa' | 'mastercard' | 'amex' | 'discover'
  lastFourDigits?: string
  timestamp: Date
  approvalCode?: string
  errorMessage?: string
}

export interface ReceiptJob {
  id: string
  content: string
  copies: number
  status: 'queued' | 'printing' | 'completed' | 'failed'
  timestamp: Date
  paperType: 'receipt' | 'kitchen' | 'customer_copy'
}

export interface KitchenOrder {
  id: string
  orderNumber: string
  customerId?: string
  customerName?: string
  items: KitchenOrderItem[]
  status: 'new' | 'acknowledged' | 'preparing' | 'ready' | 'completed'
  priority: 'normal' | 'high' | 'urgent'
  orderType: 'dine_in' | 'takeout' | 'delivery'
  estimatedTime: number // minutes
  actualTime?: number
  startTime?: Date
  completedTime?: Date
  receivedAt: Date
  specialInstructions?: string
  station: 'grill' | 'cold_prep' | 'coffee' | 'dessert' | 'all'
  tableNumber?: string
}

export interface KitchenOrderItem {
  id: string
  productId: string
  name: string
  quantity: number
  modifications: string[]
  allergens: string[]
  cookingInstructions?: string
  station: 'grill' | 'cold_prep' | 'coffee' | 'dessert'
  estimatedTime: number
  status: 'pending' | 'preparing' | 'ready'
}

export interface MenuBoard {
  id: string
  name: string
  location: string
  status: 'online' | 'offline' | 'updating'
  lastUpdate: Date
  currentTemplate: string
  resolution: { width: number; height: number }
  brightness: number
  volume: number
}

export interface MenuBoardContent {
  id: string
  name: string
  template: 'classic' | 'modern' | 'promotional' | 'minimal'
  categories: MenuCategory[]
  displaySettings: {
    showPrices: boolean
    showDescriptions: boolean
    showImages: boolean
    showNutrition: boolean
    showAvailability: boolean
    animationsEnabled: boolean
    autoScrollEnabled: boolean
    scrollSpeed: number
  }
  promotions: MenuPromotion[]
  lastModified: Date
}

export interface MenuCategory {
  id: string
  name: string
  items: MenuBoardItem[]
  displayOrder: number
  isVisible: boolean
}

export interface MenuBoardItem {
  id: string
  productId: string
  name: string
  description?: string
  price: number
  originalPrice?: number
  isAvailable: boolean
  isPopular: boolean
  isNew: boolean
  dietary: string[]
  calories?: number
  prepTime?: number
  imageUrl?: string
}

export interface MenuPromotion {
  id: string
  title: string
  description: string
  type: 'discount' | 'bogo' | 'combo' | 'announcement'
  value?: number
  validUntil?: Date
  isActive: boolean
  priority: number
}

export interface IoTDevice {
  id: string
  name: string
  type: 'temperature' | 'humidity' | 'air_quality' | 'energy' | 'security' | 'equipment'
  location: string
  status: 'online' | 'offline' | 'warning' | 'critical'
  lastReading: Date
  currentValue: number
  unit: string
  minThreshold?: number
  maxThreshold?: number
  batteryLevel?: number
  signalStrength: number
  model: string
  firmware: string
}

export interface IoTAlert {
  id: string
  deviceId: string
  deviceName: string
  type: 'threshold_exceeded' | 'device_offline' | 'low_battery' | 'maintenance_due'
  severity: 'low' | 'medium' | 'high' | 'critical'
  message: string
  timestamp: Date
  acknowledged: boolean
  resolvedAt?: Date
}

export interface EnergyReading {
  timestamp: Date
  totalConsumption: number // kWh
  currentDemand: number // kW
  deviceBreakdown: Record<string, number>
  cost: number
}

export interface MaintenanceSchedule {
  id: string
  deviceId: string
  taskName: string
  type: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'annual'
  lastCompleted?: Date
  nextDue: Date
  isOverdue: boolean
  estimatedDuration: number // minutes
  priority: 'low' | 'medium' | 'high'
}

export const useHardwareStore = defineStore('hardware', () => {
  const branchesStore = useBranchesStore()

  // Hardware devices by branch
  const branchDevices = ref<Record<string, HardwareDevice[]>>({})

  // Current operations
  const scanHistory = ref<ScanResult[]>([])
  const paymentTransactions = ref<PaymentTransaction[]>([])
  const receiptQueue = ref<ReceiptJob[]>([])
  const cashDrawerOpen = ref(false)

  // Kitchen display system
  const kitchenOrders = ref<Record<string, KitchenOrder[]>>({})
  const kitchenDisplaySettings = ref({
    autoRefresh: true,
    refreshInterval: 30, // seconds
    soundAlerts: true,
    showTimer: true,
    maxOrdersPerScreen: 12,
    defaultEstimatedTime: 15,
  })

  // Digital menu boards
  const menuBoards = ref<Record<string, MenuBoard[]>>({})
  const menuBoardContent = ref<Record<string, MenuBoardContent>>({})
  const activePromotions = ref<MenuPromotion[]>([])

  // IoT monitoring system
  const iotDevices = ref<Record<string, IoTDevice[]>>({})
  const iotAlerts = ref<Record<string, IoTAlert[]>>({})
  const energyReadings = ref<Record<string, EnergyReading[]>>({})
  const maintenanceSchedules = ref<Record<string, MaintenanceSchedule[]>>({})

  // Device statuses
  const deviceStatuses = reactive<Record<string, Record<string, unknown>>>({
    cashDrawer: { isOpen: false, lastOpened: null, cashCount: 0 },
    receiptPrinter: { paperLevel: 85, status: 'ready', queueLength: 0 },
    barcodeScanner: { batteryLevel: 92, lastScan: null, scanCount: 0 },
    cardReader: { status: 'ready', lastTransaction: null, connectivity: 'strong' },
    kitchenDisplay: {
      connected: true,
      lastUpdate: new Date(),
      ordersDisplayed: 0,
      averageCompletionTime: 12.5,
      screensOnline: 2,
    },
    menuBoards: {
      connected: 3,
      updating: 0,
      lastContentUpdate: new Date(),
      totalScreens: 3,
      averageBrightness: 85,
    },
    iotSystem: {
      devicesOnline: 12,
      totalDevices: 15,
      activeAlerts: 3,
      criticalAlerts: 1,
      energyUsage: 45.6, // kWh today
      lastSystemCheck: new Date(),
    },
  })

  // Initialize IoT devices for branch
  const initializeBranchIoTDevices = (branchId: string) => {
    if (!iotDevices.value[branchId]) {
      iotDevices.value[branchId] = [
        {
          id: `temp-fridge-${branchId}`,
          name: 'Walk-in Refrigerator',
          type: 'temperature',
          location: 'Storage Area',
          status: 'online',
          lastReading: new Date(),
          currentValue: 38.2,
          unit: '°F',
          minThreshold: 35,
          maxThreshold: 40,
          signalStrength: 95,
          model: 'TempSense Pro',
          firmware: 'v2.1.3',
        },
        {
          id: `temp-espresso-${branchId}`,
          name: 'Espresso Machine',
          type: 'temperature',
          location: 'Coffee Station',
          status: 'online',
          lastReading: new Date(),
          currentValue: 201.5,
          unit: '°F',
          minThreshold: 195,
          maxThreshold: 205,
          signalStrength: 88,
          model: 'TempSense Pro',
          firmware: 'v2.1.3',
        },
        {
          id: `humidity-main-${branchId}`,
          name: 'Main Dining Area',
          type: 'humidity',
          location: 'Dining Area',
          status: 'online',
          lastReading: new Date(),
          currentValue: 45.8,
          unit: '%',
          minThreshold: 40,
          maxThreshold: 60,
          signalStrength: 92,
          model: 'HumidiTrack 3000',
          firmware: 'v1.8.2',
        },
        {
          id: `air-quality-${branchId}`,
          name: 'Air Quality Monitor',
          type: 'air_quality',
          location: 'Main Area',
          status: 'warning',
          lastReading: new Date(),
          currentValue: 785,
          unit: 'ppm CO2',
          maxThreshold: 800,
          signalStrength: 76,
          model: 'AirSense 500',
          firmware: 'v3.2.1',
        },
        {
          id: `energy-main-${branchId}`,
          name: 'Main Power Meter',
          type: 'energy',
          location: 'Electrical Room',
          status: 'online',
          lastReading: new Date(),
          currentValue: 12.4,
          unit: 'kW',
          signalStrength: 98,
          model: 'PowerTrack Elite',
          firmware: 'v4.1.0',
        },
        {
          id: `security-entrance-${branchId}`,
          name: 'Entrance Sensor',
          type: 'security',
          location: 'Main Entrance',
          status: 'online',
          lastReading: new Date(),
          currentValue: 1,
          unit: 'status',
          batteryLevel: 87,
          signalStrength: 91,
          model: 'SecureWatch Pro',
          firmware: 'v2.5.4',
        },
      ]
    }

    // Initialize alerts
    if (!iotAlerts.value[branchId]) {
      iotAlerts.value[branchId] = [
        {
          id: `alert-1-${branchId}`,
          deviceId: `air-quality-${branchId}`,
          deviceName: 'Air Quality Monitor',
          type: 'threshold_exceeded',
          severity: 'medium',
          message: 'CO2 levels approaching threshold (785 ppm)',
          timestamp: new Date(Date.now() - 15 * 60 * 1000),
          acknowledged: false,
        },
        {
          id: `alert-2-${branchId}`,
          deviceId: `security-entrance-${branchId}`,
          deviceName: 'Entrance Sensor',
          type: 'low_battery',
          severity: 'low',
          message: 'Battery level below 90% (87%)',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
          acknowledged: false,
        },
      ]
    }

    // Initialize energy readings
    if (!energyReadings.value[branchId]) {
      const readings: EnergyReading[] = []
      for (let i = 0; i < 24; i++) {
        readings.push({
          timestamp: new Date(Date.now() - (23 - i) * 60 * 60 * 1000),
          totalConsumption: Math.random() * 2 + 1.5,
          currentDemand: Math.random() * 5 + 8,
          deviceBreakdown: {
            HVAC: Math.random() * 2 + 3,
            Lighting: Math.random() * 1 + 1.5,
            Equipment: Math.random() * 3 + 2,
            Other: Math.random() * 1 + 0.5,
          },
          cost: (Math.random() * 2 + 1.5) * 0.12,
        })
      }
      energyReadings.value[branchId] = readings
    }

    // Initialize maintenance schedules
    if (!maintenanceSchedules.value[branchId]) {
      maintenanceSchedules.value[branchId] = [
        {
          id: `maint-1-${branchId}`,
          deviceId: `temp-espresso-${branchId}`,
          taskName: 'Espresso Machine Deep Clean',
          type: 'weekly',
          lastCompleted: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
          nextDue: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
          isOverdue: false,
          estimatedDuration: 45,
          priority: 'high',
        },
        {
          id: `maint-2-${branchId}`,
          deviceId: `temp-fridge-${branchId}`,
          taskName: 'Refrigerator Temperature Calibration',
          type: 'monthly',
          lastCompleted: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000),
          nextDue: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
          isOverdue: false,
          estimatedDuration: 30,
          priority: 'medium',
        },
        {
          id: `maint-3-${branchId}`,
          deviceId: `air-quality-${branchId}`,
          taskName: 'Air Quality Sensor Calibration',
          type: 'quarterly',
          lastCompleted: new Date(Date.now() - 95 * 24 * 60 * 60 * 1000),
          nextDue: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
          isOverdue: true,
          estimatedDuration: 20,
          priority: 'high',
        },
      ]
    }
  }

  // Initialize menu boards for branch
  const initializeBranchMenuBoards = (branchId: string) => {
    if (!menuBoards.value[branchId]) {
      menuBoards.value[branchId] = [
        {
          id: `board-main-${branchId}`,
          name: 'Main Counter Display',
          location: 'Counter Area',
          status: 'online',
          lastUpdate: new Date(),
          currentTemplate: 'modern',
          resolution: { width: 1920, height: 1080 },
          brightness: 85,
          volume: 60,
        },
        {
          id: `board-drive-${branchId}`,
          name: 'Drive Thru Display',
          location: 'Drive Thru',
          status: 'online',
          lastUpdate: new Date(),
          currentTemplate: 'classic',
          resolution: { width: 1920, height: 1080 },
          brightness: 90,
          volume: 70,
        },
        {
          id: `board-waiting-${branchId}`,
          name: 'Waiting Area Display',
          location: 'Seating Area',
          status: 'online',
          lastUpdate: new Date(),
          currentTemplate: 'promotional',
          resolution: { width: 1920, height: 1080 },
          brightness: 75,
          volume: 40,
        },
      ]
    }

    // Initialize content if not exists
    if (!menuBoardContent.value[branchId]) {
      menuBoardContent.value[branchId] = {
        id: `content-${branchId}`,
        name: 'Main Menu Content',
        template: 'modern',
        categories: [
          {
            id: 'beverages',
            name: 'Coffee & Beverages',
            displayOrder: 1,
            isVisible: true,
            items: [
              {
                id: 'item-1',
                productId: '1',
                name: 'Cappuccino',
                description: 'Rich espresso with steamed milk foam',
                price: 4.5,
                isAvailable: true,
                isPopular: true,
                isNew: false,
                dietary: ['vegetarian'],
                calories: 150,
                prepTime: 3,
              },
              {
                id: 'item-2',
                productId: '2',
                name: 'Americano',
                description: 'Bold espresso with hot water',
                price: 3.75,
                isAvailable: true,
                isPopular: false,
                isNew: false,
                dietary: ['vegan'],
                calories: 10,
                prepTime: 2,
              },
              {
                id: 'item-3',
                productId: '3',
                name: 'Latte',
                description: 'Smooth espresso with steamed milk',
                price: 4.25,
                originalPrice: 4.75,
                isAvailable: true,
                isPopular: true,
                isNew: true,
                dietary: ['vegetarian'],
                calories: 180,
                prepTime: 4,
              },
            ],
          },
          {
            id: 'food',
            name: 'Fresh Food',
            displayOrder: 2,
            isVisible: true,
            items: [
              {
                id: 'item-4',
                productId: '4',
                name: 'Butter Croissant',
                description: 'Flaky, buttery pastry baked fresh daily',
                price: 2.5,
                isAvailable: true,
                isPopular: false,
                isNew: false,
                dietary: ['vegetarian'],
                calories: 280,
                prepTime: 1,
              },
              {
                id: 'item-5',
                productId: '5',
                name: 'Blueberry Muffin',
                description: 'Moist muffin packed with fresh blueberries',
                price: 2.75,
                isAvailable: false,
                isPopular: true,
                isNew: false,
                dietary: ['vegetarian'],
                calories: 320,
                prepTime: 1,
              },
            ],
          },
        ],
        displaySettings: {
          showPrices: true,
          showDescriptions: true,
          showImages: false,
          showNutrition: true,
          showAvailability: true,
          animationsEnabled: true,
          autoScrollEnabled: false,
          scrollSpeed: 30,
        },
        promotions: [
          {
            id: 'promo-1',
            title: 'Happy Hour Special',
            description: '20% off all beverages 2-4 PM',
            type: 'discount',
            value: 20,
            validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            isActive: true,
            priority: 1,
          },
          {
            id: 'promo-2',
            title: 'New Seasonal Latte!',
            description: 'Try our limited-time Pumpkin Spice Latte',
            type: 'announcement',
            isActive: true,
            priority: 2,
          },
        ],
        lastModified: new Date(),
      }
    }
  }

  // Initialize kitchen orders for branch
  const initializeBranchKitchenOrders = (branchId: string) => {
    if (!kitchenOrders.value[branchId]) {
      kitchenOrders.value[branchId] = [
        {
          id: 'kitchen-order-1',
          orderNumber: 'ORD-001',
          customerName: 'John D.',
          items: [
            {
              id: 'item-1',
              productId: '1',
              name: 'Cappuccino',
              quantity: 2,
              modifications: ['Extra shot', 'Oat milk'],
              allergens: [],
              station: 'coffee',
              estimatedTime: 5,
              status: 'preparing',
            },
            {
              id: 'item-2',
              productId: '4',
              name: 'Croissant',
              quantity: 1,
              modifications: ['Heated'],
              allergens: ['Gluten'],
              station: 'cold_prep',
              estimatedTime: 2,
              status: 'ready',
            },
          ],
          status: 'preparing',
          priority: 'normal',
          orderType: 'dine_in',
          estimatedTime: 8,
          startTime: new Date(Date.now() - 5 * 60 * 1000),
          receivedAt: new Date(Date.now() - 8 * 60 * 1000),
          station: 'all',
          tableNumber: 'T12',
        },
        {
          id: 'kitchen-order-2',
          orderNumber: 'ORD-002',
          customerName: 'Sarah M.',
          items: [
            {
              id: 'item-3',
              productId: '3',
              name: 'Latte',
              quantity: 1,
              modifications: [],
              allergens: [],
              station: 'coffee',
              estimatedTime: 4,
              status: 'pending',
            },
          ],
          status: 'new',
          priority: 'high',
          orderType: 'takeout',
          estimatedTime: 6,
          receivedAt: new Date(Date.now() - 2 * 60 * 1000),
          station: 'coffee',
        },
      ]
    }
  }

  // Initialize devices for current branch
  const initializeBranchDevices = (branchId: string) => {
    if (!branchDevices.value[branchId]) {
      branchDevices.value[branchId] = [
        {
          id: `cash-drawer-${branchId}`,
          name: 'Main Cash Drawer',
          type: 'cash_drawer',
          status: 'online',
          model: 'APG Series 4000',
          serialNumber: 'CD4000-001',
          lastMaintenance: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          nextMaintenance: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
        },
        {
          id: `receipt-printer-${branchId}`,
          name: 'Receipt Printer #1',
          type: 'receipt_printer',
          status: 'online',
          model: 'Epson TM-T88VI',
          serialNumber: 'EP88-002',
          lastMaintenance: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
          nextMaintenance: new Date(Date.now() + 75 * 24 * 60 * 60 * 1000),
          paperLevel: 85,
        },
        {
          id: `kitchen-display-${branchId}`,
          name: 'Kitchen Display #1',
          type: 'kitchen_display',
          status: 'online',
          model: 'Samsung 32" Commercial Display',
          serialNumber: 'KD32-005',
          lastMaintenance: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
          nextMaintenance: new Date(Date.now() + 80 * 24 * 60 * 60 * 1000),
        },
        {
          id: `menu-board-1-${branchId}`,
          name: 'Menu Board - Main Counter',
          type: 'menu_board',
          status: 'online',
          model: 'LG 55" 4K Commercial Display',
          serialNumber: 'MB55-006',
          lastMaintenance: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
          nextMaintenance: new Date(Date.now() + 85 * 24 * 60 * 60 * 1000),
        },
        {
          id: `menu-board-2-${branchId}`,
          name: 'Menu Board - Drive Thru',
          type: 'menu_board',
          status: 'online',
          model: 'Samsung 43" Outdoor Display',
          serialNumber: 'MB43-007',
          lastMaintenance: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
          nextMaintenance: new Date(Date.now() + 82 * 24 * 60 * 60 * 1000),
        },
        {
          id: `barcode-scanner-${branchId}`,
          name: 'Handheld Scanner',
          type: 'barcode_scanner',
          status: 'online',
          model: 'Zebra DS2208',
          serialNumber: 'ZB2208-003',
          lastMaintenance: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000),
          nextMaintenance: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
          batteryLevel: 92,
        },
        {
          id: `card-reader-${branchId}`,
          name: 'Payment Terminal',
          type: 'card_reader',
          status: 'online',
          model: 'Square Terminal',
          serialNumber: 'SQ-TERM-004',
          lastMaintenance: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
          nextMaintenance: new Date(Date.now() + 70 * 24 * 60 * 60 * 1000),
          batteryLevel: 78,
        },
      ]
    }
  }

  // Computed properties
  const currentBranchDevices = computed(() => {
    const branchId = branchesStore.selectedBranchId
    if (!branchId) return []

    initializeBranchDevices(branchId)
    initializeBranchKitchenOrders(branchId)
    initializeBranchMenuBoards(branchId)
    initializeBranchIoTDevices(branchId)
    return branchDevices.value[branchId] || []
  })

  const onlineDevices = computed(() =>
    currentBranchDevices.value.filter((device) => device.status === 'online'),
  )

  const offlineDevices = computed(() =>
    currentBranchDevices.value.filter(
      (device) => device.status === 'offline' || device.status === 'error',
    ),
  )

  const recentScans = computed(() => scanHistory.value.slice(-10).reverse())

  const pendingReceipts = computed(() =>
    receiptQueue.value.filter((job) => job.status === 'queued' || job.status === 'printing'),
  )

  const currentBranchKitchenOrders = computed(() => {
    const branchId = branchesStore.selectedBranchId
    if (!branchId) return []
    return kitchenOrders.value[branchId] || []
  })

  const activeKitchenOrders = computed(() =>
    currentBranchKitchenOrders.value.filter((order) =>
      ['new', 'acknowledged', 'preparing'].includes(order.status),
    ),
  )

  const completedKitchenOrders = computed(() =>
    currentBranchKitchenOrders.value.filter((order) =>
      ['ready', 'completed'].includes(order.status),
    ),
  )

  const currentBranchMenuBoards = computed(() => {
    const branchId = branchesStore.selectedBranchId
    if (!branchId) return []
    return menuBoards.value[branchId] || []
  })

  const currentMenuContent = computed(() => {
    const branchId = branchesStore.selectedBranchId
    if (!branchId) return null
    return menuBoardContent.value[branchId] || null
  })

  const currentBranchIoTDevices = computed(() => {
    const branchId = branchesStore.selectedBranchId
    if (!branchId) return []
    return iotDevices.value[branchId] || []
  })

  const currentBranchIoTAlerts = computed(() => {
    const branchId = branchesStore.selectedBranchId
    if (!branchId) return []
    return iotAlerts.value[branchId] || []
  })

  const unacknowledgedAlerts = computed(() =>
    currentBranchIoTAlerts.value.filter((alert) => !alert.acknowledged),
  )

  const criticalAlerts = computed(() =>
    currentBranchIoTAlerts.value.filter(
      (alert) => alert.severity === 'critical' && !alert.acknowledged,
    ),
  )

  const currentEnergyReadings = computed(() => {
    const branchId = branchesStore.selectedBranchId
    if (!branchId) return []
    return energyReadings.value[branchId] || []
  })

  const currentMaintenanceSchedules = computed(() => {
    const branchId = branchesStore.selectedBranchId
    if (!branchId) return []
    return maintenanceSchedules.value[branchId] || []
  })

  const overdueMaintenance = computed(() =>
    currentMaintenanceSchedules.value.filter((schedule) => schedule.isOverdue),
  )

  // Cash Drawer Functions
  const openCashDrawer = () => {
    return new Promise<boolean>((resolve) => {
      // Simulate hardware delay
      setTimeout(() => {
        deviceStatuses.cashDrawer.isOpen = true
        deviceStatuses.cashDrawer.lastOpened = new Date()
        cashDrawerOpen.value = true
        resolve(true)
      }, 800)
    })
  }

  const closeCashDrawer = () => {
    deviceStatuses.cashDrawer.isOpen = false
    cashDrawerOpen.value = false
  }

  // Receipt Printer Functions
  const printReceipt = (
    content: string,
    copies: number = 1,
    paperType: 'receipt' | 'kitchen' | 'customer_copy' = 'receipt',
  ) => {
    const job: ReceiptJob = {
      id: `receipt-${Date.now()}`,
      content,
      copies,
      status: 'queued',
      timestamp: new Date(),
      paperType,
    }

    receiptQueue.value.push(job)

    // Simulate printing process
    setTimeout(() => {
      job.status = 'printing'
      deviceStatuses.receiptPrinter.queueLength = pendingReceipts.value.length
    }, 500)

    setTimeout(() => {
      job.status = 'completed'
      deviceStatuses.receiptPrinter.paperLevel = Math.max(
        10,
        deviceStatuses.receiptPrinter.paperLevel - 2,
      )
      deviceStatuses.receiptPrinter.queueLength = pendingReceipts.value.length
    }, 2000)

    return job.id
  }

  // Barcode Scanner Functions
  const simulateBarcodeScan = (barcode?: string) => {
    const mockBarcodes = [
      { barcode: '1234567890123', productId: '1', productName: 'Cappuccino', price: 4.5 },
      { barcode: '2345678901234', productId: '2', productName: 'Americano', price: 3.75 },
      { barcode: '3456789012345', productId: '3', productName: 'Latte', price: 4.25 },
      { barcode: '4567890123456', productId: '4', productName: 'Croissant', price: 2.5 },
      { barcode: '5678901234567', productId: '5', productName: 'Muffin', price: 2.75 },
    ]

    const selectedBarcode = barcode
      ? mockBarcodes.find((b) => b.barcode === barcode) || {
          barcode,
          productName: 'Unknown Product',
        }
      : mockBarcodes[Math.floor(Math.random() * mockBarcodes.length)]

    const scanResult: ScanResult = {
      ...selectedBarcode,
      timestamp: new Date(),
    }

    scanHistory.value.push(scanResult)
    deviceStatuses.barcodeScanner.lastScan = new Date()
    deviceStatuses.barcodeScanner.scanCount++

    return scanResult
  }

  // Card Reader Functions
  const processPayment = (amount: number, method: 'card' | 'contactless' = 'card') => {
    const transaction: PaymentTransaction = {
      id: `txn-${Date.now()}`,
      amount,
      method,
      status: 'pending',
      timestamp: new Date(),
    }

    if (method === 'card' || method === 'contactless') {
      // Simulate card types
      const cardTypes = ['visa', 'mastercard', 'amex', 'discover']
      transaction.cardType = cardTypes[Math.floor(Math.random() * cardTypes.length)] as string
      transaction.lastFourDigits = Math.floor(Math.random() * 9999)
        .toString()
        .padStart(4, '0')
    }

    paymentTransactions.value.push(transaction)

    return new Promise<PaymentTransaction>((resolve) => {
      // Simulate processing time
      setTimeout(() => {
        // 95% success rate for simulation
        const isSuccess = Math.random() > 0.05

        if (isSuccess) {
          transaction.status = 'approved'
          transaction.approvalCode = `AUTH-${Math.floor(Math.random() * 999999)
            .toString()
            .padStart(6, '0')}`
        } else {
          transaction.status = 'declined'
          transaction.errorMessage = 'Insufficient funds'
        }

        deviceStatuses.cardReader.lastTransaction = new Date()
        resolve(transaction)
      }, 2000)
    })
  }

  // Device Management Functions
  const updateDeviceStatus = (
    deviceId: string,
    status: HardwareDevice['status'],
    errorMessage?: string,
  ) => {
    const branchId = branchesStore.selectedBranchId
    if (!branchId) return

    const device = branchDevices.value[branchId]?.find((d) => d.id === deviceId)
    if (device) {
      device.status = status
      if (errorMessage) {
        device.errorMessage = errorMessage
      } else {
        delete device.errorMessage
      }
    }
  }

  const runDeviceDiagnostics = (deviceId: string) => {
    return new Promise<{ success: boolean; message: string; details: Record<string, unknown> }>(
      (resolve) => {
        setTimeout(() => {
          const device = currentBranchDevices.value.find((d) => d.id === deviceId)
          if (!device) {
            resolve({ success: false, message: 'Device not found', details: {} })
            return
          }

          const diagnostics = {
            success: true,
            message: 'All systems operational',
            details: {
              connectivity: 'Good',
              hardware: 'Functional',
              software: 'Up to date',
              lastPing: new Date().toISOString(),
              responseTime: `${Math.floor(Math.random() * 50 + 10)}ms`,
            },
          }

          // Simulate random issues occasionally
          if (Math.random() < 0.1) {
            diagnostics.success = false
            diagnostics.message = 'Warning: Low paper level detected'
            diagnostics.details.hardware = 'Attention needed'
          }

          resolve(diagnostics)
        }, 1500)
      },
    )
  }

  const calibrateDevice = (deviceId: string) => {
    return new Promise<boolean>((resolve) => {
      updateDeviceStatus(deviceId, 'maintenance')

      setTimeout(() => {
        updateDeviceStatus(deviceId, 'online')
        resolve(true)
      }, 3000)
    })
  }

  // Hardware simulation helpers
  const simulateHardwareEvent = (deviceType: string, eventType: string) => {
    switch (deviceType) {
      case 'receipt_printer':
        if (eventType === 'paper_low') {
          deviceStatuses.receiptPrinter.paperLevel = 15
        } else if (eventType === 'paper_out') {
          deviceStatuses.receiptPrinter.paperLevel = 0
          updateDeviceStatus(
            `receipt-printer-${branchesStore.selectedBranchId}`,
            'error',
            'Out of paper',
          )
        }
        break
      case 'barcode_scanner':
        if (eventType === 'battery_low') {
          deviceStatuses.barcodeScanner.batteryLevel = 20
        }
        break
      case 'card_reader':
        if (eventType === 'connectivity_issue') {
          deviceStatuses.cardReader.connectivity = 'poor'
          updateDeviceStatus(
            `card-reader-${branchesStore.selectedBranchId}`,
            'error',
            'Poor network connectivity',
          )
        }
        break
    }
  }

  // Kitchen Display Functions
  const addKitchenOrder = (order: Omit<KitchenOrder, 'id' | 'receivedAt'>) => {
    const branchId = branchesStore.selectedBranchId
    if (!branchId) return

    initializeBranchKitchenOrders(branchId)

    const kitchenOrder: KitchenOrder = {
      ...order,
      id: `kitchen-order-${Date.now()}`,
      receivedAt: new Date(),
    }

    kitchenOrders.value[branchId].push(kitchenOrder)
    deviceStatuses.kitchenDisplay.ordersDisplayed = activeKitchenOrders.value.length
    deviceStatuses.kitchenDisplay.lastUpdate = new Date()

    return kitchenOrder.id
  }

  const updateKitchenOrderStatus = (orderId: string, status: KitchenOrder['status']) => {
    const branchId = branchesStore.selectedBranchId
    if (!branchId) return

    const order = kitchenOrders.value[branchId]?.find((o) => o.id === orderId)
    if (order) {
      order.status = status

      if (status === 'acknowledged' && !order.startTime) {
        order.startTime = new Date()
      } else if (status === 'ready' || status === 'completed') {
        order.completedTime = new Date()
        if (order.startTime) {
          order.actualTime = Math.round(
            (order.completedTime.getTime() - order.startTime.getTime()) / 60000,
          )
        }
      }

      deviceStatuses.kitchenDisplay.lastUpdate = new Date()
    }
  }

  const updateKitchenOrderItemStatus = (
    orderId: string,
    itemId: string,
    status: KitchenOrderItem['status'],
  ) => {
    const branchId = branchesStore.selectedBranchId
    if (!branchId) return

    const order = kitchenOrders.value[branchId]?.find((o) => o.id === orderId)
    if (order) {
      const item = order.items.find((i) => i.id === itemId)
      if (item) {
        item.status = status

        // Check if all items are ready to mark order as ready
        const allItemsReady = order.items.every((i) => i.status === 'ready')
        if (allItemsReady && order.status !== 'ready') {
          updateKitchenOrderStatus(orderId, 'ready')
        }
      }
    }
  }

  const getOrdersByStation = (station: KitchenOrder['station']) => {
    if (station === 'all') return activeKitchenOrders.value
    return activeKitchenOrders.value.filter(
      (order) => order.station === station || order.items.some((item) => item.station === station),
    )
  }

  const updateKitchenDisplaySettings = (settings: Partial<typeof kitchenDisplaySettings.value>) => {
    Object.assign(kitchenDisplaySettings.value, settings)
  }

  const simulateNewKitchenOrder = () => {
    const mockOrders = [
      {
        orderNumber: `ORD-${String(Math.floor(Math.random() * 999) + 100)}`,
        customerName: ['Alex K.', 'Maria R.', 'David L.', 'Emma S.', 'Tom B.'][
          Math.floor(Math.random() * 5)
        ],
        items: [
          {
            id: `item-${Date.now()}`,
            productId: '1',
            name: 'Americano',
            quantity: 1,
            modifications: [],
            allergens: [],
            station: 'coffee' as const,
            estimatedTime: 4,
            status: 'pending' as const,
          },
        ],
        status: 'new' as const,
        priority: Math.random() > 0.8 ? ('high' as const) : ('normal' as const),
        orderType: ['dine_in', 'takeout', 'delivery'][Math.floor(Math.random() * 3)] as const,
        estimatedTime: Math.floor(Math.random() * 10) + 5,
        station: 'coffee' as const,
        tableNumber: Math.random() > 0.5 ? `T${Math.floor(Math.random() * 20) + 1}` : undefined,
      },
    ]

    return addKitchenOrder(mockOrders[0])
  }

  // Menu Board Functions
  const updateMenuBoardContent = (content: Partial<MenuBoardContent>) => {
    const branchId = branchesStore.selectedBranchId
    if (!branchId || !menuBoardContent.value[branchId]) return

    Object.assign(menuBoardContent.value[branchId], content, {
      lastModified: new Date(),
    })

    // Update all boards
    menuBoards.value[branchId]?.forEach((board) => {
      board.lastUpdate = new Date()
    })

    deviceStatuses.menuBoards.lastContentUpdate = new Date()
  }

  const updateMenuItemPrice = (itemId: string, newPrice: number) => {
    const branchId = branchesStore.selectedBranchId
    if (!branchId || !menuBoardContent.value[branchId]) return

    const content = menuBoardContent.value[branchId]
    for (const category of content.categories) {
      const item = category.items.find((i) => i.id === itemId)
      if (item) {
        item.price = newPrice
        updateMenuBoardContent({ lastModified: new Date() })
        break
      }
    }
  }

  const updateMenuItemAvailability = (itemId: string, isAvailable: boolean) => {
    const branchId = branchesStore.selectedBranchId
    if (!branchId || !menuBoardContent.value[branchId]) return

    const content = menuBoardContent.value[branchId]
    for (const category of content.categories) {
      const item = category.items.find((i) => i.id === itemId)
      if (item) {
        item.isAvailable = isAvailable
        updateMenuBoardContent({ lastModified: new Date() })
        break
      }
    }
  }

  const addPromotion = (promotion: Omit<MenuPromotion, 'id'>) => {
    const branchId = branchesStore.selectedBranchId
    if (!branchId || !menuBoardContent.value[branchId]) return

    const newPromotion: MenuPromotion = {
      ...promotion,
      id: `promo-${Date.now()}`,
    }

    menuBoardContent.value[branchId].promotions.push(newPromotion)
    updateMenuBoardContent({ lastModified: new Date() })

    return newPromotion.id
  }

  const removePromotion = (promotionId: string) => {
    const branchId = branchesStore.selectedBranchId
    if (!branchId || !menuBoardContent.value[branchId]) return

    const content = menuBoardContent.value[branchId]
    const index = content.promotions.findIndex((p) => p.id === promotionId)
    if (index !== -1) {
      content.promotions.splice(index, 1)
      updateMenuBoardContent({ lastModified: new Date() })
    }
  }

  const updateMenuBoardSettings = (boardId: string, settings: Partial<MenuBoard>) => {
    const branchId = branchesStore.selectedBranchId
    if (!branchId) return

    const board = menuBoards.value[branchId]?.find((b) => b.id === boardId)
    if (board) {
      Object.assign(board, settings, { lastUpdate: new Date() })
    }
  }

  const refreshMenuBoard = (boardId: string) => {
    const branchId = branchesStore.selectedBranchId
    if (!branchId) return

    const board = menuBoards.value[branchId]?.find((b) => b.id === boardId)
    if (board) {
      board.status = 'updating'
      setTimeout(() => {
        board.status = 'online'
        board.lastUpdate = new Date()
      }, 2000)
    }
  }

  // IoT Monitoring Functions
  const acknowledgeAlert = (alertId: string) => {
    const branchId = branchesStore.selectedBranchId
    if (!branchId) return

    const alert = iotAlerts.value[branchId]?.find((a) => a.id === alertId)
    if (alert) {
      alert.acknowledged = true
      deviceStatuses.iotSystem.activeAlerts = unacknowledgedAlerts.value.length
      deviceStatuses.iotSystem.criticalAlerts = criticalAlerts.value.length
    }
  }

  const resolveAlert = (alertId: string) => {
    const branchId = branchesStore.selectedBranchId
    if (!branchId) return

    const alert = iotAlerts.value[branchId]?.find((a) => a.id === alertId)
    if (alert) {
      alert.acknowledged = true
      alert.resolvedAt = new Date()
      deviceStatuses.iotSystem.activeAlerts = unacknowledgedAlerts.value.length
      deviceStatuses.iotSystem.criticalAlerts = criticalAlerts.value.length
    }
  }

  const updateDeviceReading = (deviceId: string, value: number) => {
    const branchId = branchesStore.selectedBranchId
    if (!branchId) return

    const device = iotDevices.value[branchId]?.find((d) => d.id === deviceId)
    if (device) {
      device.currentValue = value
      device.lastReading = new Date()

      // Check thresholds
      if (device.minThreshold && value < device.minThreshold) {
        createAlert(
          deviceId,
          'threshold_exceeded',
          'high',
          `${device.name} below minimum threshold`,
        )
      } else if (device.maxThreshold && value > device.maxThreshold) {
        createAlert(
          deviceId,
          'threshold_exceeded',
          'high',
          `${device.name} above maximum threshold`,
        )
      }
    }
  }

  const createAlert = (
    deviceId: string,
    type: IoTAlert['type'],
    severity: IoTAlert['severity'],
    message: string,
  ) => {
    const branchId = branchesStore.selectedBranchId
    if (!branchId) return

    const device = iotDevices.value[branchId]?.find((d) => d.id === deviceId)
    if (!device) return

    const alert: IoTAlert = {
      id: `alert-${Date.now()}`,
      deviceId,
      deviceName: device.name,
      type,
      severity,
      message,
      timestamp: new Date(),
      acknowledged: false,
    }

    if (!iotAlerts.value[branchId]) iotAlerts.value[branchId] = []
    iotAlerts.value[branchId].push(alert)

    deviceStatuses.iotSystem.activeAlerts = unacknowledgedAlerts.value.length
    deviceStatuses.iotSystem.criticalAlerts = criticalAlerts.value.length
  }

  const addEnergyReading = (reading: EnergyReading) => {
    const branchId = branchesStore.selectedBranchId
    if (!branchId) return

    if (!energyReadings.value[branchId]) energyReadings.value[branchId] = []
    energyReadings.value[branchId].push(reading)

    // Keep only last 48 hours of readings
    const cutoff = new Date(Date.now() - 48 * 60 * 60 * 1000)
    energyReadings.value[branchId] = energyReadings.value[branchId].filter(
      (r) => r.timestamp > cutoff,
    )

    deviceStatuses.iotSystem.energyUsage = energyReadings.value[branchId]
      .filter((r) => r.timestamp > new Date(Date.now() - 24 * 60 * 60 * 1000))
      .reduce((sum, r) => sum + r.totalConsumption, 0)
  }

  const completeMaintenance = (scheduleId: string) => {
    const branchId = branchesStore.selectedBranchId
    if (!branchId) return

    const schedule = maintenanceSchedules.value[branchId]?.find((s) => s.id === scheduleId)
    if (schedule) {
      schedule.lastCompleted = new Date()
      schedule.isOverdue = false

      // Calculate next due date
      const intervals = {
        daily: 1,
        weekly: 7,
        monthly: 30,
        quarterly: 90,
        annual: 365,
      }

      const daysToAdd = intervals[schedule.type]
      schedule.nextDue = new Date(Date.now() + daysToAdd * 24 * 60 * 60 * 1000)
    }
  }

  const simulateDeviceReadings = () => {
    const branchId = branchesStore.selectedBranchId
    if (!branchId || !iotDevices.value[branchId]) return

    iotDevices.value[branchId].forEach((device) => {
      let newValue = device.currentValue

      switch (device.type) {
        case 'temperature':
          newValue += (Math.random() - 0.5) * 2
          break
        case 'humidity':
          newValue += (Math.random() - 0.5) * 5
          break
        case 'air_quality':
          newValue += (Math.random() - 0.5) * 50
          break
        case 'energy':
          newValue = Math.random() * 5 + 8
          break
      }

      updateDeviceReading(device.id, newValue)
    })

    deviceStatuses.iotSystem.lastSystemCheck = new Date()
  }

  return {
    // State
    branchDevices,
    scanHistory,
    paymentTransactions,
    receiptQueue,
    cashDrawerOpen,
    deviceStatuses,
    kitchenOrders,
    kitchenDisplaySettings,
    menuBoards,
    menuBoardContent,
    activePromotions,
    iotDevices,
    iotAlerts,
    energyReadings,
    maintenanceSchedules,

    // Computed
    currentBranchDevices,
    onlineDevices,
    offlineDevices,
    recentScans,
    pendingReceipts,
    currentBranchKitchenOrders,
    activeKitchenOrders,
    completedKitchenOrders,
    currentBranchMenuBoards,
    currentMenuContent,
    currentBranchIoTDevices,
    currentBranchIoTAlerts,
    unacknowledgedAlerts,
    criticalAlerts,
    currentEnergyReadings,
    currentMaintenanceSchedules,
    overdueMaintenance,

    // Actions
    initializeBranchDevices,
    initializeBranchKitchenOrders,
    initializeBranchMenuBoards,
    initializeBranchIoTDevices,
    openCashDrawer,
    closeCashDrawer,
    printReceipt,
    simulateBarcodeScan,
    processPayment,
    updateDeviceStatus,
    runDeviceDiagnostics,
    calibrateDevice,
    simulateHardwareEvent,

    // Kitchen Display Actions
    addKitchenOrder,
    updateKitchenOrderStatus,
    updateKitchenOrderItemStatus,
    getOrdersByStation,
    updateKitchenDisplaySettings,
    simulateNewKitchenOrder,

    // Menu Board Actions
    updateMenuBoardContent,
    updateMenuItemPrice,
    updateMenuItemAvailability,
    addPromotion,
    removePromotion,
    updateMenuBoardSettings,
    refreshMenuBoard,

    // IoT Monitoring Actions
    acknowledgeAlert,
    resolveAlert,
    updateDeviceReading,
    createAlert,
    addEnergyReading,
    completeMaintenance,
    simulateDeviceReadings,
  }
})
