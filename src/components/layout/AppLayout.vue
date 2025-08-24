<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useBranchesStore } from '@/stores/branches'
import { Button } from '@/components/ui/button'
import BranchSelector from '@/components/auth/BranchSelector.vue'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const branchesStore = useBranchesStore()
const showBranchSelector = ref(false)

const navigation = computed(() => {
  const baseItems = [
    { name: 'Dashboard', path: '/', icon: '📊' },
    { name: 'Sales (POS)', path: '/sales', icon: '💰' },
    { name: 'Inventory', path: '/inventory', icon: '📦' },
    { name: 'Employees', path: '/employees', icon: '👥' },
    { name: 'CRM', path: '/crm', icon: '👤' },
    { name: 'Analytics', path: '/analytics', icon: '📈' },
    { name: 'Purchases', path: '/purchases', icon: '🛒' },
    { name: 'Receipts', path: '/receipts', icon: '🧾' },
    { name: 'Reports', path: '/reports', icon: '📋' },
    { name: 'End of Day', path: '/end-of-day', icon: '🔒' },
  ]

  // Only show branches management for admin and manager
  if (authStore.isAdmin || authStore.isManager) {
    baseItems.push({ name: 'Branches', path: '/branches', icon: '🏪' })
  }

  return baseItems
})

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
  // Optionally refresh current page data or redirect to dashboard
  if (route.path !== '/') {
    router.push('/')
  }
}
</script>

<template>
  <div class="min-h-screen bg-gray-100 flex">
    <!-- Sidebar -->
    <div class="w-64 bg-white shadow-lg">
      <div class="flex flex-col h-full">
        <!-- Logo/Header -->
        <div class="flex items-center justify-center h-16 px-4 bg-blue-600 text-white">
          <h1 class="text-xl font-bold">Judy's Cafe</h1>
        </div>

        <!-- User Info -->
        <div class="p-4 border-b">
          <div class="flex items-center space-x-3 mb-3">
            <div
              class="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-bold"
            >
              {{ authStore.user?.name.charAt(0) }}
            </div>
            <div>
              <p class="text-sm font-medium text-gray-900">{{ authStore.user?.name }}</p>
              <p class="text-xs text-gray-500 capitalize">{{ authStore.user?.role }}</p>
            </div>
          </div>

          <!-- Branch Info -->
          <div v-if="branchesStore.selectedBranch" class="bg-gray-50 rounded-lg p-3">
            <div class="flex items-center justify-between">
              <div class="flex-1">
                <p class="text-xs text-gray-600 font-medium">Current Branch</p>
                <p class="text-sm font-semibold text-gray-900 truncate">
                  {{ branchesStore.selectedBranch.name }}
                </p>
              </div>
              <Button
                v-if="authStore.userAccessibleBranches.length > 1"
                variant="outline"
                size="sm"
                @click="openBranchSelector"
                class="text-xs px-2 py-1 h-auto"
              >
                Switch
              </Button>
            </div>
          </div>

          <!-- No Branch Selected Warning -->
          <div
            v-else-if="authStore.userAccessibleBranches.length > 0"
            class="bg-yellow-50 border border-yellow-200 rounded-lg p-3"
          >
            <p class="text-xs text-yellow-800 font-medium">No branch selected</p>
            <Button
              variant="outline"
              size="sm"
              @click="openBranchSelector"
              class="text-xs px-2 py-1 h-auto mt-2 w-full"
            >
              Select Branch
            </Button>
          </div>
        </div>

        <!-- Navigation -->
        <nav class="flex-1 px-4 py-4 space-y-2">
          <router-link
            v-for="item in navigation"
            :key="item.path"
            :to="item.path"
            :class="[
              'flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
              isCurrentRoute(item.path)
                ? 'bg-blue-100 text-blue-700'
                : 'text-gray-700 hover:bg-gray-100',
            ]"
          >
            <span class="text-lg">{{ item.icon }}</span>
            <span>{{ item.name }}</span>
          </router-link>
        </nav>

        <!-- Logout -->
        <div class="p-4 border-t">
          <Button variant="outline" class="w-full" @click="handleLogout"> Logout </Button>
        </div>
      </div>
    </div>

    <!-- Main Content -->
    <div class="flex-1 flex flex-col overflow-hidden">
      <!-- Header -->
      <header class="bg-white shadow-sm border-b h-16 flex items-center justify-between px-6">
        <div>
          <h2 class="text-lg font-semibold text-gray-900">
            {{ route.meta.title || route.name }}
          </h2>
          <p v-if="branchesStore.selectedBranch" class="text-xs text-gray-500">
            {{ branchesStore.selectedBranch.name }}
          </p>
        </div>
        <div class="text-sm text-gray-500">
          {{ new Date().toLocaleDateString() }}
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
  </div>
</template>
