<template>
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div class="bg-white rounded-lg shadow-xl w-full max-w-md mx-4 p-6">
      <div class="text-center mb-6">
        <h2 class="text-2xl font-bold text-gray-900 mb-2">Select Branch</h2>
        <p class="text-gray-600">
          {{
            isInitialSelection
              ? 'Choose which branch you want to work with:'
              : 'Switch to a different branch:'
          }}
        </p>
      </div>

      <div class="space-y-3 mb-6">
        <div
          v-for="branch in accessibleBranches"
          :key="branch.id"
          @click="selectBranch(branch.id)"
          :class="[
            'p-4 border rounded-lg cursor-pointer transition-all duration-200',
            selectedBranchId === branch.id
              ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
              : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50',
          ]"
        >
          <div class="flex items-center justify-between">
            <div>
              <h3 class="font-medium text-gray-900">{{ branch.name }}</h3>
              <p class="text-sm text-gray-600">{{ branch.address }}</p>
              <div class="flex items-center mt-2 space-x-4">
                <span class="text-xs text-gray-500"> Manager: {{ branch.manager }} </span>
                <span
                  :class="[
                    'px-2 py-1 rounded-full text-xs font-medium',
                    getStatusColor(branch.status),
                  ]"
                >
                  {{ branch.status.charAt(0).toUpperCase() + branch.status.slice(1) }}
                </span>
              </div>
            </div>
            <div class="flex-shrink-0">
              <div
                v-if="selectedBranchId === branch.id"
                class="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center"
              >
                <CheckIcon class="w-4 h-4 text-white" />
              </div>
              <div v-else class="w-6 h-6 border-2 border-gray-300 rounded-full"></div>
            </div>
          </div>
        </div>
      </div>

      <div class="flex space-x-3">
        <Button
          v-if="!isInitialSelection"
          variant="outline"
          class="flex-1"
          @click="$emit('cancel')"
        >
          Cancel
        </Button>
        <Button class="flex-1" @click="confirmSelection" :disabled="!selectedBranchId">
          {{ isInitialSelection ? 'Continue' : 'Switch Branch' }}
        </Button>
      </div>

      <!-- User Info -->
      <div class="mt-6 pt-4 border-t border-gray-200">
        <div class="flex items-center space-x-3">
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
      </div>

      <!-- Branch Access Info -->
      <div class="mt-4 p-3 bg-blue-50 rounded-lg">
        <p class="text-xs text-blue-800">
          <span class="font-medium">Access Level:</span>
          {{ getRoleDescription() }}
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useBranchesStore } from '@/stores/branches'
import { CheckIcon } from '@heroicons/vue/24/outline'
import { Button } from '@/components/ui/button'

interface Props {
  isInitialSelection?: boolean
}

const { isInitialSelection = true } = defineProps<Props>()

const emit = defineEmits<{
  confirm: [branchId: string]
  cancel: []
}>()

const authStore = useAuthStore()
const branchesStore = useBranchesStore()
const selectedBranchId = ref<string | null>(null)

const accessibleBranches = computed(() => authStore.userAccessibleBranches)

onMounted(() => {
  // Pre-select current branch if switching, or first available if initial selection
  if (branchesStore.selectedBranchId) {
    selectedBranchId.value = branchesStore.selectedBranchId
  } else if (accessibleBranches.value.length === 1) {
    selectedBranchId.value = accessibleBranches.value[0].id
  }
})

function selectBranch(branchId: string) {
  selectedBranchId.value = branchId
}

function confirmSelection() {
  if (selectedBranchId.value) {
    branchesStore.selectBranch(selectedBranchId.value)
    emit('confirm', selectedBranchId.value)
  }
}

function getStatusColor(status: string) {
  const colors = {
    active: 'bg-green-100 text-green-800',
    inactive: 'bg-red-100 text-red-800',
    maintenance: 'bg-yellow-100 text-yellow-800',
  }
  return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800'
}

function getRoleDescription() {
  if (authStore.isAdmin) {
    return 'Full access to all branches and administrative functions'
  } else if (authStore.isManager) {
    return 'Management access to assigned branches'
  } else {
    return 'Operational access to assigned branch'
  }
}
</script>
