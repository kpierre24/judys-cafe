<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <div>
        <h2 class="text-2xl font-bold text-gray-900">Cash Reconciliation</h2>
        <p class="text-gray-600 mt-1">Count physical cash and verify against sales records</p>
      </div>
    </div>

    <!-- Step 1: Opening Cash -->
    <div v-if="!reconciliationStarted" class="bg-white rounded-lg border border-gray-200 p-6">
      <h3 class="text-lg font-medium text-gray-900 mb-4">Step 1: Opening Cash Amount</h3>
      <p class="text-gray-600 mb-4">
        Enter the amount of cash in the drawer at the start of the day:
      </p>

      <div class="flex items-end space-x-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1"> Opening Cash Amount </label>
          <input
            v-model="openingCash"
            type="number"
            step="0.01"
            min="0"
            class="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="0.00"
          />
        </div>
        <Button @click="startReconciliation" :disabled="!openingCash || openingCash <= 0">
          Start Reconciliation
        </Button>
      </div>
    </div>

    <!-- Reconciliation Interface -->
    <div v-if="reconciliationStarted" class="space-y-6">
      <!-- Sales Summary -->
      <div class="bg-white rounded-lg border border-gray-200 p-6">
        <h3 class="text-lg font-medium text-gray-900 mb-4">Today's Sales Summary</h3>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div class="text-center p-4 bg-gray-50 rounded-lg">
            <div class="text-sm text-gray-600">Cash Sales</div>
            <div class="text-xl font-bold text-gray-900">
              ${{ endOfDayStore.todaysSalesSummary.cashSales.toFixed(2) }}
            </div>
          </div>
          <div class="text-center p-4 bg-gray-50 rounded-lg">
            <div class="text-sm text-gray-600">Card Sales</div>
            <div class="text-xl font-bold text-gray-900">
              ${{ endOfDayStore.todaysSalesSummary.cardSales.toFixed(2) }}
            </div>
          </div>
          <div class="text-center p-4 bg-gray-50 rounded-lg">
            <div class="text-sm text-gray-600">Mobile Sales</div>
            <div class="text-xl font-bold text-gray-900">
              ${{ endOfDayStore.todaysSalesSummary.mobileSales.toFixed(2) }}
            </div>
          </div>
          <div class="text-center p-4 bg-gray-50 rounded-lg">
            <div class="text-sm text-gray-600">Total Revenue</div>
            <div class="text-xl font-bold text-gray-900">
              ${{ endOfDayStore.todaysSalesSummary.totalRevenue.toFixed(2) }}
            </div>
          </div>
        </div>
      </div>

      <!-- Expected Cash Calculation -->
      <div class="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 class="text-lg font-medium text-gray-900 mb-4">Expected Cash Calculation</h3>
        <div class="space-y-2">
          <div class="flex justify-between">
            <span>Opening Cash:</span>
            <span class="font-medium"
              >${{ currentReconciliation?.openingCash?.toFixed(2) || '0.00' }}</span
            >
          </div>
          <div class="flex justify-between">
            <span>Cash Sales:</span>
            <span class="font-medium text-green-600"
              >+${{ currentReconciliation?.totalSales?.toFixed(2) || '0.00' }}</span
            >
          </div>
          <div class="flex justify-between">
            <span>Petty Cash In:</span>
            <span class="font-medium text-green-600"
              >+${{ currentReconciliation?.pettyCashIn?.toFixed(2) || '0.00' }}</span
            >
          </div>
          <div class="flex justify-between">
            <span>Petty Cash Out:</span>
            <span class="font-medium text-red-600"
              >-${{ currentReconciliation?.pettyCashOut?.toFixed(2) || '0.00' }}</span
            >
          </div>
          <hr class="my-2" />
          <div class="flex justify-between text-lg font-bold">
            <span>Expected Cash Total:</span>
            <span>${{ currentReconciliation?.expectedCash?.toFixed(2) || '0.00' }}</span>
          </div>
        </div>
      </div>

      <!-- Cash Count -->
      <div class="bg-white rounded-lg border border-gray-200 p-6">
        <h3 class="text-lg font-medium text-gray-900 mb-4">Physical Cash Count</h3>

        <!-- Bills -->
        <div class="mb-6">
          <h4 class="text-md font-medium text-gray-700 mb-3">Bills</h4>
          <div class="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div v-for="(denomination, key) in billDenominations" :key="key">
              <label class="block text-sm font-medium text-gray-700 mb-1">
                ${{ denomination }} Bills
              </label>
              <div class="flex items-center space-x-2">
                <input
                  v-model="cashCount.bills[key as keyof typeof cashCount.bills]"
                  @input="updateCashCount"
                  type="number"
                  min="0"
                  class="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="0"
                />
                <span class="text-sm text-gray-500">
                  = ${{
                    (cashCount.bills[key as keyof typeof cashCount.bills] * denomination).toFixed(2)
                  }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- Coins -->
        <div class="mb-6">
          <h4 class="text-md font-medium text-gray-700 mb-3">Coins</h4>
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div v-for="(denomination, key) in coinDenominations" :key="key">
              <label class="block text-sm font-medium text-gray-700 mb-1">
                {{ formatCoinLabel(key as string) }}
              </label>
              <div class="flex items-center space-x-2">
                <input
                  v-model="cashCount.coins[key as keyof typeof cashCount.coins]"
                  @input="updateCashCount"
                  type="number"
                  min="0"
                  class="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="0"
                />
                <span class="text-sm text-gray-500">
                  = ${{
                    (cashCount.coins[key as keyof typeof cashCount.coins] * denomination).toFixed(2)
                  }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- Cash Count Summary -->
        <div class="bg-gray-50 rounded-lg p-4">
          <div class="flex justify-between text-lg font-medium mb-2">
            <span>Total Cash Counted:</span>
            <span>${{ actualCashTotal.toFixed(2) }}</span>
          </div>
          <div class="flex justify-between text-lg font-medium mb-2">
            <span>Expected Cash:</span>
            <span>${{ currentReconciliation?.expectedCash?.toFixed(2) || '0.00' }}</span>
          </div>
          <hr class="my-2" />
          <div
            class="flex justify-between text-xl font-bold"
            :class="
              cashVariance === 0
                ? 'text-green-600'
                : Math.abs(cashVariance) <= 0.5
                  ? 'text-yellow-600'
                  : 'text-red-600'
            "
          >
            <span>Variance:</span>
            <span>
              {{ cashVariance > 0 ? '+' : '' }}${{ cashVariance.toFixed(2) }}
              {{ cashVariance > 0 ? ' (Over)' : cashVariance < 0 ? ' (Short)' : ' (Balanced)' }}
            </span>
          </div>
        </div>
      </div>

      <!-- Variance Alert -->
      <div
        v-if="Math.abs(cashVariance) > 0.5"
        class="bg-red-50 border border-red-200 rounded-lg p-4"
      >
        <div class="flex">
          <div class="flex-shrink-0">
            <ExclamationTriangleIcon class="h-5 w-5 text-red-400" />
          </div>
          <div class="ml-3">
            <h3 class="text-sm font-medium text-red-800">Significant Cash Variance Detected</h3>
            <div class="mt-2 text-sm text-red-700">
              <p>The cash variance exceeds $0.50. Please:</p>
              <ul class="list-disc list-inside mt-1 space-y-1">
                <li>Recount all cash denominations</li>
                <li>Verify all petty cash entries</li>
                <li>Check for any missed transactions</li>
                <li>Add notes explaining the variance below</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <!-- Notes -->
      <div class="bg-white rounded-lg border border-gray-200 p-6">
        <h3 class="text-lg font-medium text-gray-900 mb-4">Notes</h3>
        <textarea
          v-model="reconciliationNotes"
          rows="3"
          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="Add any notes about cash discrepancies, unusual transactions, or other observations..."
        ></textarea>
      </div>

      <!-- Complete Reconciliation -->
      <div class="flex justify-end">
        <Button @click="completeReconciliation" variant="default">
          Complete Cash Reconciliation
        </Button>
      </div>
    </div>

    <!-- Completed State -->
    <div v-if="reconciliationCompleted" class="bg-green-50 border border-green-200 rounded-lg p-6">
      <div class="flex items-center">
        <CheckCircleIcon class="w-6 h-6 text-green-600 mr-3" />
        <div>
          <h3 class="text-lg font-medium text-green-900">Cash Reconciliation Completed</h3>
          <p class="text-green-700 mt-1">
            Cash count has been completed with a variance of
            <span class="font-medium">
              {{
                completedReconciliation?.cashVariance
                  ? (completedReconciliation.cashVariance > 0 ? '+' : '') +
                    '$' +
                    completedReconciliation.cashVariance.toFixed(2)
                  : '$0.00'
              }}
            </span>
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive } from 'vue'
import { useEndOfDayStore } from '@/stores/endOfDay'
import type { CashReconciliation } from '@/stores/endOfDay'
import { CheckCircleIcon, ExclamationTriangleIcon } from '@heroicons/vue/24/outline'
import { Button } from '@/components/ui/button'

const emit = defineEmits<{
  complete: []
}>()

const endOfDayStore = useEndOfDayStore()

const openingCash = ref(100) // Default opening cash
const reconciliationStarted = ref(false)
const reconciliationCompleted = ref(false)
const reconciliationNotes = ref('')
const completedReconciliation = ref<CashReconciliation | null>(null)

const billDenominations = {
  hundred: 100,
  fifty: 50,
  twenty: 20,
  ten: 10,
  five: 5,
  one: 1,
}

const coinDenominations = {
  quarter: 0.25,
  dime: 0.1,
  nickel: 0.05,
  penny: 0.01,
}

const cashCount = reactive({
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
})

const currentReconciliation = computed(() => endOfDayStore.currentCashReconciliation)

const actualCashTotal = computed(() => {
  const billTotal = Object.entries(cashCount.bills).reduce((sum, [key, count]) => {
    return sum + count * billDenominations[key as keyof typeof billDenominations]
  }, 0)

  const coinTotal = Object.entries(cashCount.coins).reduce((sum, [key, count]) => {
    return sum + count * coinDenominations[key as keyof typeof coinDenominations]
  }, 0)

  return Math.round((billTotal + coinTotal) * 100) / 100
})

const cashVariance = computed(() => {
  const expected = currentReconciliation.value?.expectedCash || 0
  return Math.round((actualCashTotal.value - expected) * 100) / 100
})

function formatCoinLabel(key: string) {
  const labels: Record<string, string> = {
    quarter: '25¢ Coins',
    dime: '10¢ Coins',
    nickel: '5¢ Coins',
    penny: '1¢ Coins',
  }
  return labels[key] || key
}

function startReconciliation() {
  if (!openingCash.value || openingCash.value <= 0) {
    alert('Please enter a valid opening cash amount')
    return
  }

  endOfDayStore.initializeCashReconciliation(openingCash.value)
  reconciliationStarted.value = true
}

function updateCashCount() {
  // Convert string inputs to numbers
  Object.keys(cashCount.bills).forEach((key) => {
    cashCount.bills[key as keyof typeof cashCount.bills] =
      Number(cashCount.bills[key as keyof typeof cashCount.bills]) || 0
  })

  Object.keys(cashCount.coins).forEach((key) => {
    cashCount.coins[key as keyof typeof cashCount.coins] =
      Number(cashCount.coins[key as keyof typeof cashCount.coins]) || 0
  })

  endOfDayStore.updateCashCount(cashCount)
}

function completeReconciliation() {
  try {
    const result = endOfDayStore.completeCashReconciliation(reconciliationNotes.value || undefined)
    completedReconciliation.value = result
    reconciliationCompleted.value = true
    emit('complete')
  } catch (error) {
    alert('Error completing reconciliation: ' + (error as Error).message)
  }
}
</script>
