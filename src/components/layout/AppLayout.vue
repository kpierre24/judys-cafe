<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useBranchesStore } from '@/stores/branches'
import { useSyncStore } from '@/stores/sync'
import { Button } from '@/components/ui/button'
import BranchSelector from '@/components/auth/BranchSelector.vue'
import CommandPalette from '@/components/common/CommandPalette.vue'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const branchesStore = useBranchesStore()
const syncStore = useSyncStore()
const showBranchSelector = ref(false)
const isCommandPaletteOpen = ref(false)

const coreNavigation = computed(() => {
  const items = [
    { name: 'Sales (POS)', path: '/sales', icon: '☕' },
    { name: 'Receipts', path: '/receipts', icon: '🧾' },
    { name: 'End of Day', path: '/end-of-day', icon: '🔒' },
  ]
  if (!authStore.isCashier) {
    items.unshift({ name: 'Operations Hub', path: '/', icon: '📊' })
  }
  return items
})

const managementNavigation = computed(() => {
  if (authStore.isCashier) return []

  const items = [
    { name: 'Inventory & Stock', path: '/inventory', icon: '📦' },
    { name: 'Purchases & POs', path: '/purchases', icon: '🛒' },
    { name: 'Staff & Shifts', path: '/employees', icon: '👥' },
    { name: 'CRM & Loyalty', path: '/crm', icon: '🎖️' },
    { name: 'Analytics', path: '/analytics', icon: '📈' },
    { name: 'Business Reports', path: '/reports', icon: '📋' },
  ]

  if (authStore.isAdmin || authStore.isManager) {
    items.push({ name: 'Store Locations', path: '/branches', icon: '🏪' })
  }

  return items
})

const operationalDevicesNavigation = computed(() => {
  const items = [
    { name: 'Kitchen Display (KDS)', path: '/hardware/kitchen-display', icon: '🍳' },
  ]
  if (!authStore.isCashier) {
    items.push({ name: 'Menu Board Cast', path: '/hardware/menu-boards', icon: '📺' })
  }
  return items
})

const hardwareNavigation = computed(() => [
  { name: 'POS Hardware Terminals', path: '/hardware/pos', icon: '🖥️' },
  { name: 'IoT Temp & Energy', path: '/hardware/iot-monitoring', icon: '❄️' },
])

const mobileNavigation = computed(() => [
  { name: 'Customer Mobile App', path: '/mobile/customer', icon: '📱' },
  { name: 'Staff Floor App', path: '/mobile/staff', icon: '🏃' },
  { name: 'Manager Portal', path: '/mobile/manager', icon: '👑' },
  { name: 'Delivery Live Route', path: '/mobile/delivery-tracking', icon: '🚴' },
])

const isDevLabOpen = ref(false)

function handleLogout() {
  authStore.logout()
  router.push('/login')
}

function isCurrentRoute(path: string) {
  return route.path === path
}

function openBranchSelector() {
  showBranchSelector.value = true
}

function handleBranchSwitch() {
  showBranchSelector.value = false
  if (route.path !== '/') {
    router.push('/')
  }
}

function handleGlobalKeydown(e: KeyboardEvent) {
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
    e.preventDefault()
    isCommandPaletteOpen.value = !isCommandPaletteOpen.value
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleGlobalKeydown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleGlobalKeydown)
})
</script>

<template>
  <div class="min-h-screen bg-stone-100 flex font-sans text-stone-900">
    <!-- Sidebar -->
    <div class="w-64 bg-stone-950 text-stone-300 border-r border-stone-800/80 flex flex-col shrink-0 selection:bg-amber-600">
      <div class="flex flex-col h-full">
        <!-- Logo/Header -->
        <div class="flex flex-col justify-center h-18 px-5 bg-stone-950 border-b border-stone-800">
          <div class="flex items-center space-x-2.5">
            <div class="w-8 h-8 rounded-lg bg-amber-600 flex items-center justify-center text-white text-base font-bold shadow-xs">
              ☕
            </div>
            <div>
              <h1 class="text-sm font-bold tracking-tight text-white flex items-center font-serif">
                Judy's Cafe
              </h1>
              <p class="text-[10px] text-amber-500/90 font-medium tracking-wider uppercase">Artisanal POS & Ops</p>
            </div>
          </div>
        </div>

        <!-- User & Active Station Info -->
        <div class="p-3.5 border-b border-stone-800 bg-stone-900/40">
          <div class="flex items-center space-x-2.5 mb-2.5">
            <div
              class="w-7 h-7 bg-amber-700/80 rounded-full flex items-center justify-center text-white text-xs font-bold border border-amber-500/30"
            >
              {{ authStore.user?.name.charAt(0) }}
            </div>
            <div class="min-w-0 flex-1">
              <p class="text-xs font-semibold text-white tracking-wide truncate">{{ authStore.user?.name }}</p>
              <p class="text-[10px] text-stone-400 font-medium uppercase tracking-wider capitalize">{{ authStore.user?.role }}</p>
            </div>
            <span class="inline-flex h-2 w-2 rounded-full bg-emerald-500" title="Active on shift"></span>
          </div>

          <!-- Branch Info -->
          <div v-if="branchesStore.selectedBranch" class="bg-stone-900 border border-stone-800 rounded-lg p-2">
            <div class="flex items-center justify-between">
              <div class="flex-1 min-w-0 mr-1.5">
                <p class="text-[9px] text-stone-400 font-bold uppercase tracking-wider">Active Location</p>
                <p class="text-xs font-medium text-amber-200 truncate">
                  {{ branchesStore.selectedBranch.name }}
                </p>
              </div>
              <button
                v-if="authStore.userAccessibleBranches.length > 1"
                @click="openBranchSelector"
                class="text-[10px] px-2 py-0.5 rounded bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700 font-medium transition-colors cursor-pointer"
              >
                Switch
              </button>
            </div>
          </div>

          <!-- No Branch Selected Warning -->
          <div
            v-else-if="authStore.userAccessibleBranches.length > 0"
            class="bg-amber-950/40 border border-amber-900/50 rounded-lg p-2"
          >
            <p class="text-xs text-amber-400 font-semibold">No active location</p>
            <Button
              variant="outline"
              size="sm"
              @click="openBranchSelector"
              class="text-[10px] px-2 py-1 h-6 mt-1.5 w-full bg-amber-500/10 border-amber-500/30 text-amber-300 hover:bg-amber-500/20"
            >
              Select Location
            </Button>
          </div>
        </div>

        <!-- Navigation -->
        <nav class="flex-1 px-3 py-3 space-y-3.5 overflow-y-auto max-h-[calc(100vh-14rem)]">
          <!-- Core Group -->
          <div>
            <p class="text-[9px] font-bold text-stone-400 uppercase tracking-wider px-2.5 mb-1.5">Store Operations</p>
            <div class="space-y-0.5">
              <router-link
                v-for="item in coreNavigation"
                :key="item.path"
                :to="item.path"
                :class="[
                  'flex items-center space-x-2.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors',
                  isCurrentRoute(item.path)
                    ? 'bg-amber-600 text-white font-semibold shadow-xs'
                    : 'text-stone-400 hover:bg-stone-900 hover:text-stone-100',
                ]"
              >
                <span class="text-sm">{{ item.icon }}</span>
                <span>{{ item.name }}</span>
              </router-link>
            </div>
          </div>

          <!-- Management Group -->
          <div v-if="managementNavigation.length > 0">
            <p class="text-[9px] font-bold text-stone-400 uppercase tracking-wider px-2.5 mb-1.5">Management</p>
            <div class="space-y-0.5">
              <router-link
                v-for="item in managementNavigation"
                :key="item.path"
                :to="item.path"
                :class="[
                  'flex items-center space-x-2.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors',
                  isCurrentRoute(item.path)
                    ? 'bg-amber-600 text-white font-semibold shadow-xs'
                    : 'text-stone-400 hover:bg-stone-900 hover:text-stone-100',
                ]"
              >
                <span class="text-sm">{{ item.icon }}</span>
                <span>{{ item.name }}</span>
              </router-link>
            </div>
          </div>

          <!-- Devices & Displays Group -->
          <div v-if="operationalDevicesNavigation.length > 0">
            <p class="text-[9px] font-bold text-stone-400 uppercase tracking-wider px-2.5 mb-1.5">Displays & Kitchen</p>
            <div class="space-y-0.5">
              <router-link
                v-for="item in operationalDevicesNavigation"
                :key="item.path"
                :to="item.path"
                :class="[
                  'flex items-center space-x-2.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors',
                  isCurrentRoute(item.path)
                    ? 'bg-amber-600 text-white font-semibold shadow-xs'
                    : 'text-stone-400 hover:bg-stone-900 hover:text-stone-100',
                ]"
              >
                <span class="text-sm">{{ item.icon }}</span>
                <span>{{ item.name }}</span>
              </router-link>
            </div>
          </div>

          <!-- Developer & Hardware Lab (Collapsible for Admin Only) -->
          <div v-if="authStore.isAdmin" class="pt-2 border-t border-stone-800/80">
            <button
              @click="isDevLabOpen = !isDevLabOpen"
              class="w-full flex items-center justify-between px-2.5 py-1.5 text-[10px] font-bold text-stone-400 uppercase tracking-wider hover:text-stone-300 transition-colors bg-transparent border-none cursor-pointer"
            >
              <span>🔬 Hardware & Mobile Lab</span>
              <span class="text-[8px] transition-transform duration-200" :class="{ 'transform rotate-180': isDevLabOpen }">
                ▼
              </span>
            </button>
            <div v-if="isDevLabOpen" class="mt-1 space-y-3 pl-1">
              <!-- Hardware & IoT Group -->
              <div>
                <p class="text-[9px] font-semibold text-stone-400 uppercase tracking-wider px-2 mb-1">Peripherals & IoT</p>
                <div class="space-y-0.5">
                  <router-link
                    v-for="item in hardwareNavigation"
                    :key="item.path"
                    :to="item.path"
                    :class="[
                      'flex items-center space-x-2.5 px-2 py-1.5 rounded-lg text-[11px] font-medium transition-colors',
                      isCurrentRoute(item.path)
                        ? 'bg-stone-800 text-amber-400 font-semibold'
                        : 'text-stone-400 hover:bg-stone-900 hover:text-stone-100',
                    ]"
                  >
                    <span class="text-xs">{{ item.icon }}</span>
                    <span>{{ item.name }}</span>
                  </router-link>
                </div>
              </div>

              <!-- Mobile Apps Group -->
              <div>
                <p class="text-[9px] font-semibold text-stone-400 uppercase tracking-wider px-2 mb-1">Mobile Simulators</p>
                <div class="space-y-0.5">
                  <router-link
                    v-for="item in mobileNavigation"
                    :key="item.path"
                    :to="item.path"
                    :class="[
                      'flex items-center space-x-2.5 px-2 py-1.5 rounded-lg text-[11px] font-medium transition-colors',
                      isCurrentRoute(item.path)
                        ? 'bg-stone-800 text-amber-400 font-semibold'
                        : 'text-stone-400 hover:bg-stone-900 hover:text-stone-100',
                    ]"
                  >
                    <span class="text-xs">{{ item.icon }}</span>
                    <span>{{ item.name }}</span>
                  </router-link>
                </div>
              </div>
            </div>
          </div>
        </nav>

        <!-- Logout -->
        <div class="p-3 border-t border-stone-800 bg-stone-950">
          <Button variant="outline" class="w-full text-xs text-stone-400 border-stone-800 hover:bg-stone-900 hover:text-white" @click="handleLogout">
            Sign Out
          </Button>
        </div>
      </div>
    </div>

    <!-- Main Content Area -->
    <div class="flex-1 flex flex-col overflow-hidden bg-stone-50">
      <!-- Header -->
      <header class="bg-white border-b border-stone-200 h-16 flex items-center justify-between px-6 shadow-2xs">
        <div class="flex items-center space-x-4">
          <div>
            <h2 class="text-base font-bold tracking-tight text-stone-900 font-serif">
              {{ route.meta.title || route.name }}
            </h2>
            <p v-if="branchesStore.selectedBranch" class="text-xs text-stone-500 font-medium">
              Station: <span class="text-stone-800 font-semibold">{{ branchesStore.selectedBranch.name }}</span>
            </p>
          </div>

          <!-- Quick Command Palette Search Trigger -->
          <button
            @click="isCommandPaletteOpen = true"
            class="hidden md:flex items-center space-x-2 px-3 py-1.5 rounded-full bg-stone-100 hover:bg-stone-200/80 text-stone-500 text-xs border border-stone-200 transition-colors cursor-pointer"
          >
            <span>🔍</span>
            <span>Search actions, items, customers...</span>
            <kbd class="ml-2 font-mono text-[10px] bg-white text-stone-600 px-1.5 py-0.5 rounded border border-stone-300">⌘K</kbd>
          </button>
        </div>

        <div class="flex items-center space-x-3">
          <!-- Quick POS Button -->
          <router-link
            v-if="route.path !== '/sales'"
            to="/sales"
            class="flex items-center space-x-1.5 bg-amber-600 hover:bg-amber-700 text-white px-3.5 py-1.5 rounded-full text-xs font-semibold shadow-xs transition-colors"
          >
            <span>☕</span>
            <span>Open Register</span>
          </router-link>

          <!-- Sync & Offline Status Widget -->
          <div class="flex items-center space-x-2 bg-stone-50 border border-stone-200 rounded-full px-3 py-1 text-xs shadow-2xs">
            <span class="flex h-2 w-2 relative">
              <span 
                :class="[
                  'animate-ping absolute inline-flex h-full w-full rounded-full opacity-75',
                  syncStore.isCurrentlyOnline ? (syncStore.pendingQueue.length > 0 ? 'bg-amber-400' : 'bg-emerald-400') : 'bg-rose-400'
                ]"
              ></span>
              <span 
                :class="[
                  'relative inline-flex rounded-full h-2 w-2',
                  syncStore.isCurrentlyOnline ? (syncStore.pendingQueue.length > 0 ? 'bg-amber-500' : 'bg-emerald-500') : 'bg-rose-500'
                ]"
              ></span>
            </span>
            <span class="text-[11px] font-semibold text-stone-700">
              {{ syncStore.isCurrentlyOnline ? (syncStore.pendingQueue.length > 0 ? `Syncing (${syncStore.pendingQueue.length})` : 'Cloud Synced') : 'Offline Mode' }}
            </span>
            <button 
              @click="syncStore.toggleSimulation()" 
              class="text-[10px] text-stone-500 hover:text-stone-800 font-medium border-l pl-2 border-stone-200 ml-1 bg-transparent border-none cursor-pointer"
              :title="syncStore.isOfflineSimulated ? 'Reconnect cloud link' : 'Simulate network interruption'"
            >
              {{ syncStore.isOfflineSimulated ? 'Reconnect' : 'Simulate Offline' }}
            </button>
          </div>

          <!-- Date Badge -->
          <div class="hidden lg:block text-xs font-medium text-stone-500 bg-stone-50 border border-stone-200 rounded-full px-3 py-1">
            {{ new Date().toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' }) }}
          </div>
        </div>
      </header>

      <!-- Page Content -->
      <main class="flex-1 overflow-x-hidden overflow-y-auto p-6">
        <router-view />
      </main>
    </div>

    <!-- Branch Selector Modal -->
    <BranchSelector
      v-if="showBranchSelector"
      :is-initial-selection="false"
      @confirm="handleBranchSwitch"
      @cancel="showBranchSelector = false"
    />

    <!-- Global Command Palette -->
    <CommandPalette
      :is-open="isCommandPaletteOpen"
      @close="isCommandPaletteOpen = false"
      @open-branch-selector="openBranchSelector"
    />
  </div>
</template>

