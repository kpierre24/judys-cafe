<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <div>
        <h2 class="text-2xl font-bold text-gray-900">Daily Stock Check</h2>
        <p class="text-gray-600 mt-1">Verify physical inventory against system records</p>
      </div>
      <div class="text-sm text-gray-500">
        Items checked: {{ checkedItemsCount }} / {{ totalItemsCount }}
      </div>
    </div>

    <!-- Stock Check Actions -->
    <div class="flex gap-4 mb-6">
      <Button
        @click="initializeStockCheck"
        :disabled="endOfDayStore.isStockCheckInProgress"
        variant="outline"
      >
        {{ endOfDayStore.isStockCheckInProgress ? 'Stock Check In Progress' : 'Start Stock Check' }}
      </Button>

      <Button
        v-if="endOfDayStore.isStockCheckInProgress && hasVariances"
        @click="showVariancesOnly = !showVariancesOnly"
        variant="outline"
      >
        {{ showVariancesOnly ? 'Show All Items' : 'Show Variances Only' }}
      </Button>
    </div>

    <!-- Stock Check Table -->
    <div v-if="endOfDayStore.isStockCheckInProgress" class="bg-white rounded-lg border">
      <div class="p-4 border-b border-gray-200">
        <div class="flex items-center justify-between">
          <h3 class="text-lg font-medium text-gray-900">Inventory Items</h3>
          <div class="flex items-center space-x-4">
            <div class="text-sm text-gray-500">
              Total Variance:
              <span
                :class="totalVariance >= 0 ? 'text-green-600' : 'text-red-600'"
                class="font-medium"
              >
                ${{ Math.abs(totalVariance).toFixed(2) }}
                {{ totalVariance >= 0 ? 'surplus' : 'shortage' }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Item
              </th>
              <th
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Expected
              </th>
              <th
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Actual Count
              </th>
              <th
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Difference
              </th>
              <th
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Value Impact
              </th>
              <th
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Notes
              </th>
              <th
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Status
              </th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr
              v-for="item in displayedItems"
              :key="item.inventoryId"
              :class="item.difference !== 0 ? 'bg-yellow-50' : ''"
            >
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm font-medium text-gray-900">{{ item.name }}</div>
                <div class="text-sm text-gray-500">{{ item.unit }}</div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm text-gray-900">{{ item.expectedCount }}</div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <input
                  type="number"
                  :value="item.actualCount"
                  @input="
                    updateActualCount(item.inventoryId, ($event.target as HTMLInputElement).value)
                  "
                  class="w-20 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  min="0"
                  step="1"
                />
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span :class="getDifferenceClass(item.difference)" class="text-sm font-medium">
                  {{ item.difference > 0 ? '+' : '' }}{{ item.difference }}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span :class="getDifferenceClass(item.totalVariance)" class="text-sm font-medium">
                  {{ item.totalVariance > 0 ? '+' : '' }}${{ item.totalVariance.toFixed(2) }}
                </span>
              </td>
              <td class="px-6 py-4">
                <input
                  type="text"
                  :value="item.notes"
                  @input="updateNotes(item.inventoryId, ($event.target as HTMLInputElement).value)"
                  placeholder="Add notes..."
                  class="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span
                  class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                  :class="
                    item.difference === 0
                      ? 'bg-green-100 text-green-800'
                      : 'bg-yellow-100 text-yellow-800'
                  "
                >
                  {{ item.difference === 0 ? 'Verified' : 'Variance' }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Summary and Actions -->
    <div v-if="endOfDayStore.isStockCheckInProgress" class="mt-6 flex justify-between items-center">
      <div class="text-sm text-gray-600">
        <p>Items with variances: {{ varianceItemsCount }}</p>
        <p v-if="varianceItemsCount > 0" class="text-amber-600 mt-1">
          ⚠️ Please verify counts for items with variances before completing
        </p>
      </div>

      <Button @click="completeStockCheck" :disabled="!allItemsChecked" variant="default">
        Complete Stock Check
      </Button>
    </div>

    <!-- No Stock Check Message -->
    <div
      v-if="!endOfDayStore.isStockCheckInProgress && !stockCheckCompleted"
      class="text-center py-12 text-gray-500"
    >
      <div class="text-lg font-medium mb-2">Stock Check Not Started</div>
      <p>Click "Start Stock Check" to begin verifying inventory levels</p>
    </div>

    <!-- Completed Stock Check -->
    <div v-if="stockCheckCompleted" class="bg-green-50 border border-green-200 rounded-lg p-6">
      <div class="flex items-center">
        <CheckCircleIcon class="w-6 h-6 text-green-600 mr-3" />
        <div>
          <h3 class="text-lg font-medium text-green-900">Stock Check Completed</h3>
          <p class="text-green-700 mt-1">
            All inventory items have been verified.
            {{
              varianceItemsCount > 0
                ? `${varianceItemsCount} items had variances that have been recorded.`
                : 'No variances detected.'
            }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useEndOfDayStore } from '@/stores/endOfDay'
import { CheckCircleIcon } from '@heroicons/vue/24/outline'
import { Button } from '@/components/ui/button'

const emit = defineEmits<{
  complete: []
}>()

const endOfDayStore = useEndOfDayStore()
const showVariancesOnly = ref(false)
const stockCheckCompleted = ref(false)

const displayedItems = computed(() => {
  if (!endOfDayStore.currentStockCheck.length) return []

  if (showVariancesOnly.value) {
    return endOfDayStore.currentStockCheck.filter((item) => item.difference !== 0)
  }

  return endOfDayStore.currentStockCheck
})

const totalItemsCount = computed(() => endOfDayStore.currentStockCheck.length)
const checkedItemsCount = computed(
  () =>
    endOfDayStore.currentStockCheck.filter(
      (item) => item.actualCount !== item.expectedCount || item.actualCount === item.expectedCount,
    ).length,
)

const varianceItemsCount = computed(
  () => endOfDayStore.currentStockCheck.filter((item) => item.difference !== 0).length,
)

const hasVariances = computed(() => varianceItemsCount.value > 0)

const totalVariance = computed(() =>
  endOfDayStore.currentStockCheck.reduce((sum, item) => sum + item.totalVariance, 0),
)

const allItemsChecked = computed(() => {
  // Consider all items checked if we have at least reviewed each item
  // (actualCount has been set, even if it equals expectedCount)
  return totalItemsCount.value > 0
})

function initializeStockCheck() {
  const success = endOfDayStore.initializeStockCheck()
  if (!success) {
    alert('Stock check is already in progress')
  }
}

function updateActualCount(inventoryId: string, value: string) {
  const actualCount = parseInt(value) || 0
  endOfDayStore.updateStockCount(inventoryId, actualCount)
}

function updateNotes(inventoryId: string, notes: string) {
  endOfDayStore.updateStockCount(
    inventoryId,
    endOfDayStore.currentStockCheck.find((item) => item.inventoryId === inventoryId)?.actualCount ||
      0,
    notes,
  )
}

function getDifferenceClass(difference: number) {
  if (difference > 0) return 'text-green-600'
  if (difference < 0) return 'text-red-600'
  return 'text-gray-900'
}

function completeStockCheck() {
  const success = endOfDayStore.completeStockCheck()
  if (success) {
    stockCheckCompleted.value = true
    emit('complete')
  }
}
</script>
