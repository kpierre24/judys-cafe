<template>
  <div class="container mx-auto px-4 py-8">
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-3xl font-bold text-gray-900">End of Day Operations</h1>
      <div class="text-sm text-gray-500">
        {{ currentDate }}
      </div>
    </div>

    <!-- Progress Steps -->
    <div class="mb-8">
      <div class="flex items-center justify-between">
        <div v-for="(step, index) in steps" :key="step.id" class="flex items-center">
          <div class="flex items-center">
            <div
              :class="[
                'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium',
                getStepStatus(step.id) === 'completed'
                  ? 'bg-green-600 text-white'
                  : getStepStatus(step.id) === 'current'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-300 text-gray-600',
              ]"
            >
              <CheckIcon v-if="getStepStatus(step.id) === 'completed'" class="w-4 h-4" />
              <span v-else>{{ index + 1 }}</span>
            </div>
            <span
              :class="[
                'ml-2 text-sm font-medium',
                getStepStatus(step.id) === 'completed'
                  ? 'text-green-600'
                  : getStepStatus(step.id) === 'current'
                    ? 'text-blue-600'
                    : 'text-gray-500',
              ]"
            >
              {{ step.name }}
            </span>
          </div>
          <ChevronRightIcon v-if="index < steps.length - 1" class="w-5 h-5 text-gray-400 mx-4" />
        </div>
      </div>
    </div>

    <!-- Current Step Content -->
    <div class="space-y-6">
      <!-- Stock Check Step -->
      <div
        v-if="currentStep === 'stock-check'"
        class="bg-white rounded-lg border border-gray-200 p-6"
      >
        <StockCheckComponent @complete="completeStockCheck" />
      </div>

      <!-- Petty Cash Step -->
      <div
        v-if="currentStep === 'petty-cash'"
        class="bg-white rounded-lg border border-gray-200 p-6"
      >
        <PettyCashComponent @complete="completePettyCash" />
      </div>

      <!-- Cash Reconciliation Step -->
      <div
        v-if="currentStep === 'cash-reconciliation'"
        class="bg-white rounded-lg border border-gray-200 p-6"
      >
        <CashReconciliationComponent @complete="completeCashReconciliation" />
      </div>

      <!-- Final Report Step -->
      <div
        v-if="currentStep === 'final-report'"
        class="bg-white rounded-lg border border-gray-200 p-6"
      >
        <EndOfDayReportComponent :report="finalReport" />
      </div>
    </div>

    <!-- Navigation Buttons -->
    <div class="flex justify-between mt-8">
      <Button variant="outline" @click="previousStep" :disabled="currentStepIndex === 0">
        Previous
      </Button>

      <Button @click="nextStep" :disabled="!canProceedToNextStep">
        {{ currentStepIndex === steps.length - 1 ? 'Complete' : 'Next' }}
      </Button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useEndOfDayStore } from '@/stores/endOfDay'
import { CheckIcon, ChevronRightIcon } from '@heroicons/vue/24/outline'
import { Button } from '@/components/ui/button'
import StockCheckComponent from '@/components/endofday/StockCheckComponent.vue'
import PettyCashComponent from '@/components/endofday/PettyCashComponent.vue'
import CashReconciliationComponent from '@/components/endofday/CashReconciliationComponent.vue'
import EndOfDayReportComponent from '@/components/endofday/EndOfDayReportComponent.vue'
import type { EndOfDayReport } from '@/stores/endOfDay'

const endOfDayStore = useEndOfDayStore()

const steps = [
  { id: 'stock-check', name: 'Stock Check' },
  { id: 'petty-cash', name: 'Petty Cash' },
  { id: 'cash-reconciliation', name: 'Cash Reconciliation' },
  { id: 'final-report', name: 'Final Report' },
]

const currentStepIndex = ref(0)
const completedSteps = ref<string[]>([])
const finalReport = ref<EndOfDayReport | null>(null)

const currentStep = computed(() => steps[currentStepIndex.value]?.id)
const currentDate = computed(() =>
  new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }),
)

const canProceedToNextStep = computed(() => {
  const stepId = currentStep.value
  if (!stepId) return false

  if (stepId === 'stock-check') {
    return completedSteps.value.includes('stock-check')
  }
  if (stepId === 'petty-cash') {
    return completedSteps.value.includes('petty-cash')
  }
  if (stepId === 'cash-reconciliation') {
    return completedSteps.value.includes('cash-reconciliation')
  }
  if (stepId === 'final-report') {
    return finalReport.value !== null
  }

  return false
})

function getStepStatus(stepId: string) {
  if (completedSteps.value.includes(stepId)) {
    return 'completed'
  }
  if (stepId === currentStep.value) {
    return 'current'
  }
  return 'pending'
}

function completeStockCheck() {
  if (!completedSteps.value.includes('stock-check')) {
    completedSteps.value.push('stock-check')
  }
}

function completePettyCash() {
  if (!completedSteps.value.includes('petty-cash')) {
    completedSteps.value.push('petty-cash')
  }
}

function completeCashReconciliation() {
  if (!completedSteps.value.includes('cash-reconciliation')) {
    completedSteps.value.push('cash-reconciliation')
  }
}

function nextStep() {
  if (currentStepIndex.value === steps.length - 1) {
    // Generate final report
    if (!finalReport.value) {
      try {
        finalReport.value = endOfDayStore.generateEndOfDayReport()
      } catch (error) {
        console.error('Error generating end-of-day report:', error)
        return
      }
    }
    return
  }

  if (canProceedToNextStep.value && currentStepIndex.value < steps.length - 1) {
    currentStepIndex.value++
  }
}

function previousStep() {
  if (currentStepIndex.value > 0) {
    currentStepIndex.value--
  }
}

onMounted(() => {
  // Check if there's already an end-of-day report for today
  const todaysReport = endOfDayStore.getTodaysEndOfDayReport()
  if (todaysReport) {
    finalReport.value = todaysReport
    completedSteps.value = ['stock-check', 'petty-cash', 'cash-reconciliation']
    currentStepIndex.value = 3 // Final report step
  }
})
</script>
