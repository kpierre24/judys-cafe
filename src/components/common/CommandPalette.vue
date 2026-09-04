<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useSalesStore, type Product } from '@/stores/sales'
import { useCrmStore } from '@/stores/crm'
import { useBranchesStore } from '@/stores/branches'
import { useSyncStore } from '@/stores/sync'

const props = defineProps<{
  isOpen: boolean
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'open-branch-selector'): void
}>()

const router = useRouter()
const salesStore = useSalesStore()
const crmStore = useCrmStore()
const branchesStore = useBranchesStore()
const syncStore = useSyncStore()

const searchQuery = ref('')
const searchInput = ref<HTMLInputElement | null>(null)
const selectedIndex = ref(0)

const navigationItems = [
  { id: 'nav-pos', name: 'Sales Register (POS)', category: 'Navigation', icon: '💰', path: '/sales', shortcut: 'G S' },
  { id: 'nav-kds', name: 'Kitchen Display System (KDS)', category: 'Navigation', icon: '🍳', path: '/hardware/kitchen-display', shortcut: 'G K' },
  { id: 'nav-dashboard', name: 'Operations Dashboard', category: 'Navigation', icon: '📊', path: '/', shortcut: 'G D' },
  { id: 'nav-inventory', name: 'Inventory & Stock Reorder', category: 'Navigation', icon: '📦', path: '/inventory', shortcut: 'G I' },
  { id: 'nav-eod', name: 'End of Day Close & Audit', category: 'Navigation', icon: '🔒', path: '/end-of-day', shortcut: 'G E' },
  { id: 'nav-crm', name: 'CRM & Loyalty Rewards', category: 'Navigation', icon: '👤', path: '/crm', shortcut: 'G C' },
  { id: 'nav-receipts', name: 'Receipts & Transaction History', category: 'Navigation', icon: '🧾', path: '/receipts', shortcut: 'G R' },
  { id: 'nav-reports', name: 'Business Reports & P&L', category: 'Navigation', icon: '📋', path: '/reports', shortcut: 'G P' },
  { id: 'nav-employees', name: 'Employee Shifts & Scheduling', category: 'Navigation', icon: '👥', path: '/employees', shortcut: 'G M' },
  { id: 'nav-menuboards', name: 'Digital Menu Boards & TV Cast', category: 'Navigation', icon: '📺', path: '/hardware/menu-boards', shortcut: 'G B' },
  { id: 'nav-iot', name: 'IoT Refrigeration & Energy Monitor', category: 'Navigation', icon: '❄️', path: '/hardware/iot-monitoring', shortcut: 'G T' },
]

const matchedProducts = computed(() => {
  if (!searchQuery.value.trim()) return []
  const query = searchQuery.value.toLowerCase()
  return salesStore.products
    .filter((p) => p.name.toLowerCase().includes(query) || p.category.toLowerCase().includes(query))
    .slice(0, 5)
    .map((p) => ({
      id: `prod-${p.id}`,
      name: `${p.name} ($${p.price.toFixed(2)})`,
      category: `Menu Product • ${p.category.toUpperCase()}`,
      icon: p.category === 'coffee' ? '☕' : p.category === 'pastry' ? '🥐' : '🥤',
      action: () => {
        salesStore.addToCart(p, 1)
        router.push('/sales')
        emit('close')
      },
      badge: 'Add to Cart',
    }))
})

const matchedCustomers = computed(() => {
  if (!searchQuery.value.trim()) return []
  const query = searchQuery.value.toLowerCase()
  return crmStore.customers
    .filter((c) => `${c.firstName} ${c.lastName}`.toLowerCase().includes(query) || c.email.toLowerCase().includes(query))
    .slice(0, 4)
    .map((c) => ({
      id: `cust-${c.id}`,
      name: `${c.firstName} ${c.lastName} (${c.loyaltyCard?.points || 0} pts - ${(c.loyaltyCard?.tier || 'bronze').toUpperCase()})`,
      category: 'Customer Profile',
      icon: '🎖️',
      action: () => {
        router.push('/crm')
        emit('close')
      },
      badge: `${c.loyaltyCard.tier}`,
    }))
})

const quickActions = [
  {
    id: 'act-branch',
    name: 'Switch Store Station / Branch',
    category: 'Actions',
    icon: '🏪',
    action: () => {
      emit('close')
      emit('open-branch-selector')
    },
    badge: branchesStore.selectedBranch?.name || 'Active',
  },
  {
    id: 'act-offline',
    name: 'Toggle Offline / Network Simulation',
    category: 'Actions',
    icon: '📡',
    action: () => {
      syncStore.toggleSimulation()
      emit('close')
    },
    badge: syncStore.isCurrentlyOnline ? 'Online' : 'Offline',
  },
  {
    id: 'act-drawer',
    name: 'Kick Cash Drawer (Hardware Pulse)',
    category: 'Actions',
    icon: '💵',
    action: () => {
      alert("Cash Drawer solenoid pulse triggered on station POS-01")
      emit('close')
    },
    badge: 'Hardware',
  },
]

const allItems = computed(() => {
  const query = searchQuery.value.toLowerCase().trim()
  if (!query) {
    return [
      ...quickActions,
      ...navigationItems.slice(0, 6).map((item) => ({
        ...item,
        action: () => {
          router.push(item.path)
          emit('close')
        },
        badge: item.shortcut,
      })),
    ]
  }

  const filteredNav = navigationItems
    .filter((n) => n.name.toLowerCase().includes(query))
    .map((item) => ({
      ...item,
      action: () => {
        router.push(item.path)
        emit('close')
      },
      badge: item.shortcut,
    }))

  const filteredActions = quickActions.filter((a) => a.name.toLowerCase().includes(query))

  return [...matchedProducts.value, ...matchedCustomers.value, ...filteredNav, ...filteredActions]
})

function handleKeydown(e: KeyboardEvent) {
  if (!props.isOpen) return

  if (e.key === 'Escape') {
    emit('close')
    return
  }

  if (e.key === 'ArrowDown') {
    e.preventDefault()
    if (allItems.value.length > 0) {
      selectedIndex.value = (selectedIndex.value + 1) % allItems.value.length
    }
  } else if (e.key === 'ArrowUp') {
    e.preventDefault()
    if (allItems.value.length > 0) {
      selectedIndex.value = (selectedIndex.value - 1 + allItems.value.length) % allItems.value.length
    }
  } else if (e.key === 'Enter') {
    e.preventDefault()
    const selected = allItems.value[selectedIndex.value]
    if (selected && selected.action) {
      selected.action()
    }
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeydown)
  if (props.isOpen) {
    nextTick(() => searchInput.value?.focus())
  }
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
})
</script>

<template>
  <div v-if="isOpen" class="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in">
    <div
      class="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-stone-200 overflow-hidden flex flex-col transform transition-all animate-in zoom-in-95"
      @click.stop
    >
      <!-- Search Bar -->
      <div class="flex items-center px-4 py-3.5 border-b border-stone-200 bg-stone-50/50">
        <span class="text-stone-400 text-lg mr-3">🔍</span>
        <input
          ref="searchInput"
          v-model="searchQuery"
          type="text"
          placeholder="Search menu items, customers, views, or commands... (e.g. Latte, Jane, Kitchen)"
          class="flex-1 bg-transparent text-sm text-stone-900 placeholder:text-stone-400 focus:outline-hidden"
          @keydown="selectedIndex = 0"
        />
        <span class="text-[10px] font-mono bg-stone-200 text-stone-600 px-1.5 py-0.5 rounded border border-stone-300">
          ESC
        </span>
      </div>

      <!-- Results List -->
      <div class="max-h-96 overflow-y-auto p-2 space-y-1 divide-y-0">
        <div v-if="allItems.length === 0" class="text-center py-10 text-stone-500">
          <p class="text-2xl mb-1">☕</p>
          <p class="text-sm font-medium text-stone-700">No matching results found</p>
          <p class="text-xs text-stone-400">Try searching for coffee types, staff names, or views like "Inventory"</p>
        </div>

        <button
          v-for="(item, index) in allItems"
          :key="item.id"
          type="button"
          @click="item.action()"
          @mouseenter="selectedIndex = index"
          :class="[
            'w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left transition-colors cursor-pointer border-none text-stone-900',
            selectedIndex === index ? 'bg-amber-100/70 text-amber-950 font-medium' : 'hover:bg-stone-100 text-stone-700'
          ]"
        >
          <div class="flex items-center space-x-3 min-w-0">
            <span class="text-lg shrink-0">{{ item.icon }}</span>
            <div class="min-w-0">
              <p class="text-xs font-semibold text-stone-900 truncate">{{ item.name }}</p>
              <p class="text-[10px] text-stone-500 truncate">{{ item.category }}</p>
            </div>
          </div>
          <div class="flex items-center space-x-2 shrink-0 ml-2">
            <span
              v-if="item.badge"
              :class="[
                'text-[10px] px-2 py-0.5 rounded-full font-medium',
                selectedIndex === index ? 'bg-amber-200 text-amber-900' : 'bg-stone-100 text-stone-600 border border-stone-200'
              ]"
            >
              {{ item.badge }}
            </span>
            <span class="text-xs text-stone-400">↵</span>
          </div>
        </button>
      </div>

      <!-- Footer Help Hints -->
      <div class="px-4 py-2.5 bg-stone-100/70 border-t border-stone-200 flex items-center justify-between text-[11px] text-stone-500">
        <div class="flex items-center space-x-4">
          <span><kbd class="px-1.5 py-0.5 bg-white rounded border border-stone-300 font-mono text-[10px]">↑</kbd> <kbd class="px-1.5 py-0.5 bg-white rounded border border-stone-300 font-mono text-[10px]">↓</kbd> Navigate</span>
          <span><kbd class="px-1.5 py-0.5 bg-white rounded border border-stone-300 font-mono text-[10px]">↵</kbd> Select</span>
        </div>
        <span class="font-medium text-stone-600">Judy's Cafe Command Engine</span>
      </div>
    </div>
  </div>
</template>
