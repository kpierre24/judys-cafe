import { defineStore } from 'pinia'
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { isSupabaseConfigured } from '@/lib/supabase'
import { SupabaseService } from '@/lib/supabaseService'

export interface SyncAction {
  id: string
  table: 'branches' | 'products' | 'inventory_items' | 'transactions' | 'employees' | 'customers' | 'petty_cash'
  action: 'insert' | 'update' | 'delete'
  payload: any
  timestamp: number
  branchId?: string
}

export const useSyncStore = defineStore('sync', () => {
  // Network and simulation state
  const isOnline = ref<boolean>(navigator.onLine)
  const isOfflineSimulated = ref<boolean>(localStorage.getItem('sync_offline_simulated') === 'true')
  const isSyncing = ref<boolean>(false)
  const lastSyncedAt = ref<string | null>(localStorage.getItem('sync_last_synced_at'))

  // Load pending sync queue from localStorage
  const pendingQueue = ref<SyncAction[]>([])

  const loadQueue = () => {
    try {
      const stored = localStorage.getItem('sync_pending_queue')
      if (stored) {
        const queue: SyncAction[] = JSON.parse(stored)
        // Clean out items that have exceeded retries
        pendingQueue.value = queue.filter(item => {
          const retries = (item as any)._retryCount || 0
          return retries < 2
        })
        saveQueue()
      }
    } catch (e) {
      console.warn('Failed to parse sync queue', e)
    }
  }

  const saveQueue = () => {
    localStorage.setItem('sync_pending_queue', JSON.stringify(pendingQueue.value))
  }

  // Reactive network status
  const isCurrentlyOnline = computed(() => {
    return isOnline.value && !isOfflineSimulated.value
  })

  const hasPendingChanges = computed(() => {
    return pendingQueue.value.length > 0
  })

  // Network event handlers
  const updateOnlineStatus = () => {
    isOnline.value = navigator.onLine
    if (isCurrentlyOnline.value) {
      triggerSync()
    }
  }

  // Toggle simulated offline mode
  function toggleSimulation() {
    isOfflineSimulated.value = !isOfflineSimulated.value
    localStorage.setItem('sync_offline_simulated', String(isOfflineSimulated.value))
    if (isCurrentlyOnline.value) {
      triggerSync()
    }
  }

  // Queue a change for background synchronization
  function queueAction(table: SyncAction['table'], action: SyncAction['action'], payload: any, branchId?: string) {
    const newAction: SyncAction = {
      id: `sync-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      table,
      action,
      payload,
      timestamp: Date.now(),
      branchId
    }

    pendingQueue.value.push(newAction)
    saveQueue()

    // Try syncing immediately if online
    if (isCurrentlyOnline.value && isSupabaseConfigured) {
      triggerSync()
    }
  }

// Helper to map any string ID deterministically to a valid UUID
function toUUID(str: string): string {
  if (typeof str !== 'string') return str
  
  // If already a valid UUID, return it
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  if (uuidRegex.test(str)) {
    return str.toLowerCase()
  }

  // Predefined mappings for branches to match database seed
  if (str === 'branch-1') return '550e8400-e29b-41d4-a716-446655440001'
  if (str === 'branch-2') return '550e8400-e29b-41d4-a716-446655440002'
  if (str === 'branch-3') return '550e8400-e29b-41d4-a716-446655440003'

  // Deterministically generate a UUID from a string (e.g., prod-123)
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash = hash & hash // Convert to 32bit integer
  }
  
  // Create a pseudo-random hex sequence based on the string hash
  const hex = Math.abs(hash).toString(16).padEnd(8, '0') + 
              Math.abs(hash * 31).toString(16).padEnd(8, '0') + 
              Math.abs(hash * 17).toString(16).padEnd(8, '0') + 
              Math.abs(hash * 13).toString(16).padEnd(8, '0')
  
  const part1 = hex.substring(0, 8)
  const part2 = hex.substring(8, 12)
  const part3 = '4' + hex.substring(13, 16) // version 4
  const part4 = 'a' + hex.substring(17, 20) // variant 1
  const part5 = hex.substring(20, 32)
  
  return `${part1}-${part2}-${part3}-${part4}-${part5}`.toLowerCase()
}

// Helper to sanitize payload keys that require strict UUID format
function sanitizePayload(payload: any): any {
  if (!payload || typeof payload !== 'object') return payload

  if (Array.isArray(payload)) {
    return payload.map(item => sanitizePayload(item))
  }

  const result: any = { ...payload }
  
  // List of fields that MUST be UUIDs in the database schema
  const uuidKeys = [
    'id',
    'branch_id',
    'supplier_id',
    'product_id',
    'transaction_id',
    'inventory_item_id',
    'purchase_order_id'
  ]

  for (const key of Object.keys(result)) {
    if (uuidKeys.includes(key) && typeof result[key] === 'string') {
      result[key] = toUUID(result[key])
    } else if (key === 'transaction_date' && typeof result[key] === 'string') {
      // Ensure the transaction_date is stored as a clean DATE string (YYYY-MM-DD)
      result[key] = result[key].split('T')[0]
    } else if (typeof result[key] === 'object' && result[key] !== null) {
      result[key] = sanitizePayload(result[key])
    }
  }

  return result
}

  // Perform full synchronization
  async function triggerSync() {
    if (isSyncing.value || !isCurrentlyOnline.value || !isSupabaseConfigured) return

    isSyncing.value = true
    loadQueue()

    console.log(`Starting synchronization of ${pendingQueue.value.length} pending actions...`)

    const failedActions: SyncAction[] = []

    for (const item of pendingQueue.value) {
      try {
        const payload = sanitizePayload(item.payload)
        switch (item.table) {
          case 'branches':
            if (item.action === 'insert') {
              await SupabaseService.createBranch(payload)
            } else if (item.action === 'update') {
              await SupabaseService.updateBranch(payload.id, payload)
            }
            break
          case 'products':
            if (item.action === 'insert') {
              await SupabaseService.createProduct(payload)
            } else if (item.action === 'update') {
              await SupabaseService.updateProduct(payload.id, payload)
            } else if (item.action === 'delete') {
              await SupabaseService.deleteProduct(payload.id)
            }
            break
          case 'inventory_items':
            if (item.action === 'update') {
              await SupabaseService.updateInventoryItem(payload.id, payload)
            }
            break
          case 'transactions':
            if (item.action === 'insert') {
              if (!payload.id) {
                payload.id = toUUID(item.id)
              }
              await SupabaseService.createTransaction(payload)
            }
            break
          case 'employees':
            if (item.action === 'insert') {
              await SupabaseService.createEmployee(payload)
            } else if (item.action === 'update') {
              await SupabaseService.updateEmployee(payload.id, payload)
            }
            break
          case 'customers':
            if (item.action === 'insert') {
              await SupabaseService.createCustomer(payload)
            } else if (item.action === 'update') {
              await SupabaseService.updateCustomer(payload.id, payload)
            }
            break
          default:
            console.warn(`Sync not implemented for table ${item.table}`)
        }
      } catch (error: any) {
        console.warn(`Sync action ${item.id} on table ${item.table} encountered issue:`, error?.message || error)
        
        // Add a retry counter to the item if it doesn't exist
        item.payload = item.payload || {}
        const currentRetries = (item as any)._retryCount || 0
        
        // Ignore constraint errors, offline errors or after failed attempts
        if (
          currentRetries >= 1 ||
          error?.code === '23503' || // foreign key violation
          error?.code === '23505' || // unique violation
          error?.code === '42501' || // permission denied
          error?.message?.includes('foreign key') ||
          error?.message?.includes('duplicate key') ||
          error?.message?.includes('uuid') ||
          error?.message?.includes('violates') ||
          error?.message?.includes('FetchError') ||
          error?.message?.includes('Failed to fetch') ||
          !isSupabaseConfigured
        ) {
          console.warn(`Dropping un-syncable action ${item.id} from queue. Reason: Max retries exceeded or database constraint.`, error?.message || error?.code)
        } else {
          ;(item as any)._retryCount = currentRetries + 1
          failedActions.push(item) // Re-queue failed items for retry later
        }
      }
    }

    pendingQueue.value = failedActions
    saveQueue()

    if (failedActions.length === 0) {
      const nowString = new Date().toISOString()
      lastSyncedAt.value = nowString
      localStorage.setItem('sync_last_synced_at', nowString)
    }

    isSyncing.value = false
    console.log('Synchronization completed.')
  }

  // Setup event listeners
  function init() {
    loadQueue()
    window.addEventListener('online', updateOnlineStatus)
    window.addEventListener('offline', updateOnlineStatus)
    
    // Regular syncing interval (e.g., every 30 seconds if online)
    const interval = setInterval(() => {
      if (isCurrentlyOnline.value && hasPendingChanges.value) {
        triggerSync()
      }
    }, 30000)

    return () => {
      window.removeEventListener('online', updateOnlineStatus)
      window.removeEventListener('offline', updateOnlineStatus)
      clearInterval(interval)
    }
  }

  return {
    isOnline,
    isOfflineSimulated,
    isSyncing,
    lastSyncedAt,
    pendingQueue,
    isCurrentlyOnline,
    hasPendingChanges,
    supabaseConfigured: computed(() => isSupabaseConfigured),
    
    toggleSimulation,
    queueAction,
    triggerSync,
    init
  }
})
